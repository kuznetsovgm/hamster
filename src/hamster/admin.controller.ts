import { Body, Controller, Post, UseGuards, Request } from '@nestjs/common';
import { HamsterService } from './hamster.service';
import { CreateHamsterDto } from './dto/createHamster.dto';
import { AuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/bot/user/user.interface';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@Controller('admin')
@UseGuards(AuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly hamsterService: HamsterService) {}

  @Post('hamster')
  @Roles(UserRole.ADMIN)
  async createHamsterAdmin(@Body() body: CreateHamsterDto, @Request() req) {
    return await this.hamsterService.createHamster(
      body.src,
      req.user.id,
      false,
    );
  }
}
