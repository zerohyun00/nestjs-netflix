import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { NextFunction, Request, Response } from 'express';
import { envVariableKeys } from 'src/common/const/env.const';

@Injectable()
export class BearerTokenMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}
  async use(req: Request, res: Response, next: NextFunction) {
    // Bearer $token

    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      next();
      return;
    }

    const token = this.validateBearerToken(authHeader);
    const blockedToken = await this.cacheManager.get(`BLOCK_TOKEN_${token}`);

    if (blockedToken) {
      throw new UnauthorizedException('차단된 토큰입니다!');
    }

    const tokenKey = `TOKEN_${token}`;

    const cachedPayload = await this.cacheManager.get(tokenKey);

    if (cachedPayload) {
      console.log('------cache 실행-------');
      req.user = cachedPayload;

      return next();
    }

    const decodedPayload = this.jwtService.decode(token);

    if (decodedPayload.type !== 'refresh' && decodedPayload.type !== 'access') {
      throw new UnauthorizedException('잘못된 토큰입니다');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>(
          decodedPayload.type === 'refresh'
            ? envVariableKeys.refreshTokenSecret
            : envVariableKeys.accessTokenSecret,
        ),
      });

      // payload['exp'] -> epoch time seconds
      const expiryDate = +new Date(payload['exp'] * 1000); // 초단위를 ms단위로 변경
      const now = +Date.now();

      const differenceInSeconds = (expiryDate - now) / 1000; // 1000으로 나눠서 초로 계산

      await this.cacheManager.set(
        tokenKey,
        payload,
        Math.max((differenceInSeconds - 30) * 1000, 1), // 토큰 만료기간 설정 (보안적으로 중요)
      );

      req.user = payload;
      next();
    } catch (e) {
      if (e.name === 'TokenExpiredError') {
        throw new UnauthorizedException('토큰이 만료됐습니다.');
      }
      next();
    }
  }

  validateBearerToken(rawToken: string) {
    const basicSplit = rawToken.split(' ');

    if (basicSplit.length !== 2) {
      throw new BadRequestException('토큰 포맷이 잘못되었습니다');
    }

    const [bearer, token] = basicSplit;

    if (bearer.toLocaleLowerCase() !== 'bearer') {
      throw new BadRequestException('토큰 포맷이 잘못되었습니다');
    }
    return token;
  }
}
