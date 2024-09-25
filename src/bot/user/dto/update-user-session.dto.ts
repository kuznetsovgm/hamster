import { User } from 'src/entities/typeorm/user.entity';
import { SceneSession } from 'telegraf/typings/scenes';

export class UpdateSessionDto {
  id: User['id'];
  session: SceneSession;
}
