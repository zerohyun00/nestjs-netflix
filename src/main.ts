import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['verbose'], // 해당 레벨 로거의 우선순위가 높은것들(본인 포함)이 로깅됨
  });
  const config = new DocumentBuilder()
    .setTitle('테스트')
    .setDescription('코팩 네스트강의')
    .setVersion('1.0')
    .addBasicAuth()
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('doc', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // 스웨거 새로고침해도 authorization 그대로 유지
      // jwt.io에서 exp값 1올려서 bearer토큰에 박아놓으면 그대로 쭉 사용가능 매번 인증할 필요없음
    },
  });
  // app.enableVersioning({
  //   type: VersioningType.MEDIA_TYPE,
  //   key: 'v=',
  //   // type: VersioningType.HEADER, // 헤더에 버전넣어서 요청 보내면 됨
  //   // header: 'version',
  //   // type: VersioningType.URI,
  //   // defaultVersion: '1', // default버전 설정 가능
  // });
  // app.setGlobalPrefix('v1'); // uri 전역에 prefix 적용, v1 붙여야함
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER)); // winston 불러오기
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 정의하지 않은 값들은 전부 전달이 안되게 함, dto 에 존재하는값과 존재하지않는 값 구분이 가능
      forbidNonWhitelisted: true, // whitelist에서 걸리면 에러까지 return
      transformOptions: {
        enableImplicitConversion: true, // 클래스에 적혀있는 타입스크립트의 타입을 기반으로 입력값을 변경(알아서 바꿔줌 )
      },
    }),
  );
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
