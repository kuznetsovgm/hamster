import { ISceneStateBase } from 'src/bot/bot.interface';

export enum MandatorySubscribeScene {
  ADMIN = 'subscribe_admin',
  CREATE = 'subscribe_create_sponsor',
  EDIT = 'subscribe_edit_sponsor',
  SUBSCRIBE = 'subscribe_subscribe',
  EDIT_LINK = 'subscribe_edit_link',
  EDIT_LANGS = 'subscribe_edit_langs',
}

export interface MandatorySubscribeSceneInitialState extends ISceneStateBase {
  prev: MandatorySubscribeScene | string;
}

export type MandatorySubscribeActions = 'check_subscribe';
export interface CallbackDataMandatorySubscribe {
  action: MandatorySubscribeActions;
}
