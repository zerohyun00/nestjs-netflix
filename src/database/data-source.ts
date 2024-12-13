import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

dotenv.config();

export default new DataSource({
  type: process.env.DB_TYPE as 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  synchronize: false,
  logging: false,
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/database/migrations/*.js'],
  ...(process.env.ENV === 'prod' && {
    ssl: {
      rejectUnauthorized: false, // SSL 인증서를 검증하지 않도록 설정해 두었는데, 이는 로컬 개발 환경이나 테스트 환경에서 자주 사용
    },
  }),
});
