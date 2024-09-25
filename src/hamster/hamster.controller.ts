import {
  Body,
  Controller,
  Get,
  UseGuards,
  Request,
  Patch,
  ParseIntPipe,
  Query,
  ParseBoolPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { HamsterService } from './hamster.service';
import { AuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UpdateHamsterDto } from './dto/updateHamster.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/bot/user/user.interface';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@Controller('hamster')
@UseGuards(AuthGuard, RolesGuard)
export class HamsterController {
  constructor(private readonly hamsterService: HamsterService) {}

  @Get()
  @Roles(UserRole.USER, UserRole.ADMIN)
  async getHamster(@Request() req) {
    return await this.hamsterService.getHamster(req.user.id);
  }
  @Get('log')
  @Roles(UserRole.USER, UserRole.ADMIN)
  async getHamsterLog(
    @Request() req,
    @Query('all', new DefaultValuePipe(false), new ParseBoolPipe())
    all: boolean,
    @Query('take', new DefaultValuePipe(100), new ParseIntPipe()) take: number,
    @Query('skip', new DefaultValuePipe(0), new ParseIntPipe()) skip: number,
  ) {
    return await this.hamsterService.getHamsterLog(
      req.user.id,
      take,
      skip,
      all,
    );
  }
  @Patch()
  @Roles(UserRole.USER, UserRole.ADMIN)
  async updateHamster(
    @Request() req,
    @Body() { isActive, ...settings }: UpdateHamsterDto,
  ) {
    return await this.hamsterService.updateHamster(req.user.id, {
      settings,
      isActive,
    });
  }
}
