import { User } from 'src/entities/typeorm/user.entity';
import { SceneSession } from 'telegraf/typings/scenes';

export class UpdateUserDto {
  id: User['id'];
  first_name?: string;
  last_name?: string;
  username?: string;
  lang?: string;
  started?: boolean;
  session?: SceneSession;
}
