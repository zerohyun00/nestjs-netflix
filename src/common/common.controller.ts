import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('common')
@ApiBearerAuth()
export class CommonController {
  @Post('video')
  @UseInterceptors(
    FileInterceptor('video', {
      limits: {
        fileSize: 2000000,
      },
      fileFilter(req, file, callback) {
        console.log(file);

        if (file.mimetype !== 'image/png') {
          return callback(
            new BadRequestException('png 타입만 업로드 가능이염'),
            false,
          );
        }

        return callback(null, true); // null자리에 에러가 있으면 에러를 던짐, 두번째인자에는 false면 파일을 받지 않는다.
      },
    }),
  )
  createVideo(@UploadedFile() movie: Express.Multer.File) {
    return {
      fileName: movie.filename,
    };
  }
}
