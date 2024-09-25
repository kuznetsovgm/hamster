import { User } from 'src/entities/typeorm/user.entity';
import { SceneSession } from 'telegraf/typings/scenes';

export class CreateUserDto {
  id: User['id'];
  last_message_id?: number;
  first_name?: string;
  started?: boolean;
  lang?: string;
  last_name?: string;
  username?: string;
  session?: SceneSession;
  start_deep_link?: string;
}
