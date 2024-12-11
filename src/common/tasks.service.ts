import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { readdir, unlink } from 'fs/promises'; // readdir : 해당 디렉토리에 있는 모든 파일들을 가져올 수 있음 , unlink : 파일 삭제
import { join, parse } from 'path';
import { Movie } from 'src/movie/entity/movie.entity';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { DefaultLogger } from './logger/default.logger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

@Injectable()
export class TasksService {
  // private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
    private readonly schedulerRegistry: SchedulerRegistry,
    // private readonly logger: DefaultLogger,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  // @Cron('*/5 * * * * *')
  logEverySecond() {
    // 이 순서가 nestjs에서 제공하는 중요도(우선 순위) 순서 , verbose에 가까울 수록 안보여도 되고, fatal에 가까울수록 보여야함
    this.logger.fatal('FATAL 레벨 로그', null, TasksService.name); // 지금 당장해결 해야 할 때
    this.logger.error('ERROR 레벨 로그', null, TasksService.name); // 실제 에러가 났을 때
    this.logger.warn('WARN 레벨 로그', TasksService.name); // 일어나면 안되는 일 인데 프로그램을 실행하는 데는 문제가 없을 때
    this.logger.log('LOG 레벨 로그', TasksService.name); // 정보성 로그 작성할 때 === Infolevel
    this.logger.debug('DEBUG 레벨 로그', TasksService.name); // 개발환경에서 중요한 로깅할 때
    this.logger.verbose('VERBOSE 레벨 로그', TasksService.name); // 별로 안중요한 내용들 로깅
  }

  // @Cron('* * * * * *')
  async eraseOrphanFiles() {
    const files = await readdir(join(process.cwd(), 'public', 'temp'));

    const deleteFilesTargets = files.filter((file) => {
      // true 반환하면 filter됨 , false면 포함이 안된다
      const filename = parse(file).name; // 확장자를 제외한 이름이 들어옴

      const split = filename.split('_');
      if (split.length !== 2) {
        return true;
      }
      try {
        const date = +new Date(parseInt(split[split.length - 1])); // ms기준으로 불러오게 됨
        const aDayInMileSec = 24 * 60 * 60 * 1000; // 하루가 몇 ms인지 계산

        const now = +new Date();
        return now - date > aDayInMileSec;
      } catch (e) {
        return true;
      }
    });

    await Promise.all(
      // 얘는 Promise.all로 동시에 삭제처리 모두다 끝나면 반환
      deleteFilesTargets.map((x) => {
        unlink(join(process.cwd(), 'public', 'temp', x));
      }),
    );

    // for (let i = 0; i < deleteFilesTargets.length; i++) {
    //   // 얘는 하나하나 기다리면서 파일을 삭제처리
    //   const fileName = deleteFilesTargets[i];

    //   await unlink(join(process.cwd(), 'public', 'temp', fileName));
    // }
  }

  // @Cron('0 * * * * *')
  async calculateMovieLikeCounts() {
    console.log('run');
    await this.movieRepository.query(`UPDATE movie m
    SET "likeCount" = ( 
    SELECT count(*) FROM movie_user_like mul 
    WHERE m.id = mul."movieId" AND mul."isLike" = true)`);

    await this.movieRepository.query(`
    UPDATE movie m
    SET "dislikeCount" = ( 
    SELECT count(*) FROM movie_user_like mul 
    WHERE m.id = mul."movieId" AND mul."isLike" = false)`);
  }

  // @Cron('* * * * * *', {
  //   name: 'printer',
  // })
  // printer() {
  //   console.log('print every seconds');
  // }

  // @Cron('*/5 * * * * *')
  stopper() {
    console.log('---stopper run---');

    const job = this.schedulerRegistry.getCronJob('printer');

    // console.log('# Last Date');
    // console.log(job.lastDate());
    // console.log('# Next Date');
    // console.log(job.nextDate());
    console.log('# Next Dates');
    console.log(job.nextDates(5)); // 다음으로 실행할 5개의 작업들

    if (job.running) {
      // 실행중이면 true, 아니면 false
      job.stop();
    } else {
      job.start();
    }
  }
}
