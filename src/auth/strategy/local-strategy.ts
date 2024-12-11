import { Injectable } from '@nestjs/common';
import { AuthGuard, PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

export class LocalAuthGuard extends AuthGuard('zerohyun') {}

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'zerohyun') {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'email', // 필드 값을 바꿀 수 있음
    });
  }
  /**
   * LocalStrategy
   *
   * validate: username, password 를 넣어줘야함
   *
   * return -> Request();
   */
  async validate(email: string, password: string) {
    const user = await this.authService.authenticate(email, password);

    return user;
  }
}
