import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  ClassSerializerInterceptor,
  ParseIntPipe,
  NotFoundException,
  ParseFloatPipe,
  ParseBoolPipe,
  ParseArrayPipe,
  ParseUUIDPipe,
  ParseEnumPipe,
  DefaultValuePipe,
  UsePipes,
  Request,
  UseGuards,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
  Version,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { MovieService } from './movie.service';
import { CreateMovieDto } from './dto/create-movie-dto';
import { UpdateMovieDto } from './dto/update-movie-dto';
import { MovieTitleValidationPipe } from './pipe/movie-title-validation.pipe';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { Public } from 'src/auth/decorator/public.decorator';
import { RBAC } from 'src/auth/decorator/rbac.decorator';
import { Role } from 'src/user/entities/user.entity';
import { GetMoviesDto } from './dto/get-movies.dto';
import { CacheInterceptor } from 'src/common/interceptor/cache.interceptor';
import { TransactionInterceptor } from 'src/common/interceptor/transaction.interceptor';
import {
  CacheKey,
  CacheTTL,
  CacheInterceptor as CI,
} from '@nestjs/cache-manager';
import {
  FileFieldsInterceptor,
  FileInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import { MovieFilePipe } from './pipe/movie-file.pipe';
import { UserId } from 'src/user/decorator/user-id.decorator';
import { QueryRunner } from 'src/common/decorator/query-runner.decorator';
import { QueryRunner as QR } from 'typeorm';
import { Throttle } from 'src/common/decorator/throttle.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';

// @Controller({
//   // path: 'movie',
//   // version: VERSION_NEUTRAL, // VERSION_NEUTRAL은 모든 버전을 흡수? 해버림 모듈에서 먼저불러오는 순서중요
// })
@Controller('movie')
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor) // class-transformer를 movie controller에 적용을 하기 위한 코드
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @Get()
  @Public()
  @Throttle({
    count: 5,
    unit: 'minute',
  })
  getMovies(@Query() dto: GetMoviesDto, @UserId() userId?: number) {
    return this.movieService.findAll(dto, userId);
  }

  // /movie/recent >> 밑에 :id에 걸릴수 있기 때문에 recent라우트를 위에 위치 시킴
  @Get('recent')
  @UseInterceptors(CI) // CacheInterCeptor 적용시키면 자동으로 url 전체에 캐싱적용
  @CacheKey('getMoviesRecent') // url변경
  @CacheTTL(1000) // ttl 오버라이드
  getMoviesRecent() {
    return this.movieService.findRecent();
  }

  @Get(':id')
  @Public()
  getMovie(@Param('id', ParseIntPipe) id: number) {
    return this.movieService.findOne(id);
  }

  @Post()
  @RBAC(Role.admin)
  @UseInterceptors(TransactionInterceptor)
  postMovie(
    @Body() body: CreateMovieDto,
    @QueryRunner() queryRunner: QR,
    @UserId()
    userId: number,
  ) {
    return this.movieService.create(body, userId, queryRunner);
  }

  @Patch(':id')
  @RBAC(Role.admin)
  patchMovie(
    @Param('id', ParseIntPipe) id: string,
    @Body() body: UpdateMovieDto,
  ) {
    return this.movieService.update(+id, body);
  }

  @Delete(':id')
  @RBAC(Role.admin)
  deleteMovie(@Param('id', ParseIntPipe) id: string) {
    return this.movieService.remove(+id);
  }

  /**
   * [좋아요] [싫어요] 버튼 2개 있다고 가정
   *
   * 아무것도 누르지 않은 상태
   * Like & DisLike 모두 버튼 꺼져있음
   *
   * Like 버튼을 누르면
   * Like 버튼 불 켜짐
   *
   * Like 버튼 다시 누르면
   * Like 버튼 불 꺼짐
   *
   * DisLike 버튼 누르면
   * DisLike 버튼 불 켜짐
   *
   * DisLike 버튼 다시 누르면
   * DisLike 버튼 불 꺼짐
   *
   * Like 버튼을 누르면
   * Like 버튼 불 켜짐
   *
   * Like 버튼 불 켜진 상태에서 DisLike 버튼 누르면
   * Like 버튼 불 꺼지고 DisLike 버튼 불 켜짐
   *
   */

  @Post(':id/like')
  createMovieLike(
    @Param('id', ParseIntPipe) movieId: number,
    @UserId() userId: number,
  ) {
    return this.movieService.toggleMovieLike(movieId, userId, true);
  }

  @Post(':id/dislike')
  createMovieDisLike(
    @Param('id', ParseIntPipe) movieId: number,
    @UserId() userId: number,
  ) {
    return this.movieService.toggleMovieLike(movieId, userId, false);
  }
}
