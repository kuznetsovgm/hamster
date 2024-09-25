import { ISceneStateBase } from 'src/bot/bot.interface';

export enum AdminScenes {
  ADMIN = 'admin_admin',
}

export interface AdminSceneInitialState extends ISceneStateBase {
  prev?: AdminScenes | string;
}
