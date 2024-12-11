import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  ForbiddenException,
} from '@nestjs/common';

@Catch(ForbiddenException)
export class ForbiddenExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp(); // host는 context의 부모라서 excution context의 기능을 전부사용가능
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status = exception.getStatus();

    console.log(`[UnauthorizedException] ${request.method} ${request.path}`);

    response.status(status).json({
      statusCode: status, // 스테이터스코드
      timestamp: new Date().toISOString(), // 언제 오류가 났는지
      path: request.url, // 어디에서 오류가 났는지
      message: '권한이 없습니다!!', // 영어오류를 한국어로 바꾸는데 유용하다.
    });
  }
}
