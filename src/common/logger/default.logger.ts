import { ConsoleLogger, Injectable } from '@nestjs/common';

@Injectable()
export class DefaultLogger extends ConsoleLogger {
  // 콘솔 로거 상속 받음
  warn(message: unknown, ...rest: unknown[]): void {
    console.log('----WARN LOG----');
    super.warn(message, ...rest);
  }

  error(message: unknown, ...rest: unknown[]): void {
    console.log('----WARN LOG----');
    super.error(message, ...rest);
  }
}
