import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

@Catch(QueryFailedError)
export class QueryFailedExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp(); // host는 context의 부모라서 excution context의 기능을 전부사용가능
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status = 400; // 클라이언트에서 뭔가 잘못된 값을 넣었기 때문에 임의로 400에러 지정

    let message = '데이터베이스 에러 발생이용!';

    if (exception.message.includes('duplicate key')) {
      message = '중복 키 에러!';
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(), // 언제 오류가 났는지
      path: request.url, // 어디에서 오류가 났는지
      message, // 영어오류를 한국어로 바꾸는데 유용하다.
    });
  }
}
