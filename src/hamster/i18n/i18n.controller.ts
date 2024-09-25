import {
  Controller,
  UseGuards,
  Get,
  Res,
  StreamableFile,
  Param,
} from '@nestjs/common';
import { createReadStream } from 'fs';
import type { Response } from 'express';
import { join } from 'path';

@Controller('i18n')
@UseGuards()
export class I18nController {
  constructor() {}

  @Get(':lng/:ns')
  getFile(
    @Res({ passthrough: true }) res: Response,
    @Param('lng') lng: string,
    @Param('ns') ns: string,
  ): StreamableFile {
    const file = createReadStream(
      join(process.cwd(), `i18n/${lng}/translation.json`),
    );
    res.set({
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${lng}-${ns}.json"`,
    });
    return new StreamableFile(file);
  }
}
