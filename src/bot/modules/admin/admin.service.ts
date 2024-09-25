import { Injectable } from '@nestjs/common';
import { IContext } from 'src/bot/bot.interface';
import { UserService } from 'src/bot/user/user.service';

@Injectable()
export class AdminService {
  constructor(private readonly userService: UserService) {}

  async exportUsersFile(ctx: IContext): Promise<Buffer> {
    const users = await this.userService.usersList();
    const usersId = users.reduce(
      (prev, cur, i) => (prev += i === 0 ? `${cur.id}` : `\n${cur.id}`),
      '',
    );

    return Buffer.from(usersId);
  }
}
