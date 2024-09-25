import { Context } from 'telegraf';
import {
  InlineKeyboardButton,
  KeyboardButton,
  ResponseParameters,
  Update,
} from 'telegraf/typings/core/types/typegram';
import { I18nService, TranslateOptions } from 'nestjs-i18n';
import {
  SceneContextScene,
  SceneSession,
  SceneSessionData,
  WizardContext,
  WizardContextWizard,
  WizardSession,
  WizardSessionData,
} from 'telegraf/typings/scenes';
import { Telegram } from 'telegraf/typings/core/types/typegram';
import { User } from 'src/entities/typeorm/user.entity';

export interface ErrorPayload {
  error_code: number;
  description: string;
  parameters?: ResponseParameters;
}
export interface TelegramResponseSuccess<T> {
  ok: true;
  result: T;
}
export interface TelegramResponseError extends ErrorPayload {
  ok: false;
}
export type TelegramResponse<T> =
  | TelegramResponseSuccess<T>
  | TelegramResponseError;

export interface ISceneStateBase {
  prev?: string;
}
export interface IWizardStateBase {
  prev?: string;
}
export interface ISceneSessionData<
  State extends ISceneStateBase = ISceneStateBase,
> extends Omit<SceneSessionData, 'state'> {
  state: State;
}
export interface IWizzardSessionData<
  State extends IWizardStateBase = IWizardStateBase,
> extends Omit<WizardSessionData, 'state'> {
  state: State;
}

export type IContext<U extends Update = Update> = Ctx<U>;
export class Ctx<U extends Update = Update> extends Context<U> {
  user: User;
  // session: ISceneSessionData | IWizzardSessionData;
  i18n: I18nService;
  t: (key: string, options?: TranslateOptions) => string;
}
export interface ISessionContext<
  S extends SceneSession<ISceneSessionData>,
  U extends Update = Update,
> extends Ctx<U> {
  session?: S;
}

export type ISceneContext<
  T extends ISceneStateBase = ISceneStateBase,
  U extends Update = Update,
> = {
  session: SceneSession<ISceneSessionData<T>>;
  scene: SceneContextScene<
    // @ts-ignore
    ISessionContext<SceneSession<ISceneSessionData<T>>, U>,
    ISceneSessionData<T>
  >;
} & Ctx<U>;

export type IWizardContext<
  T extends IWizardStateBase = IWizardStateBase,
  U extends Update = Update,
> = {
  session: WizardSession<IWizzardSessionData<T>>;
  scene: SceneContextScene<
    WizardContext<IWizzardSessionData<T>>,
    IWizzardSessionData<T>
  >;
  wizard: WizardContextWizard<WizardContext<IWizzardSessionData<T>>>;
} & Ctx<U>;

export interface IInlineButtonsSet {
  [key: string]: (
    ...args: any
  ) => InlineKeyboardButton | Promise<InlineKeyboardButton>;
}
export interface IInlineButtonsStore {
  [key: string]: IInlineButtonsSet;
}
export interface KeyboardButtonSet {
  [key: string]: (...args: any) => KeyboardButton | Promise<KeyboardButton>;
}
export interface IKeyboardButtonsStore {
  [key: string]:
    | KeyboardButtonSet
    | IKeyboardButtonsStore
    | ((...args: any) => KeyboardButton | Promise<KeyboardButton>);
}

export type Action = string;
export interface ICallbackData {
  action: Action;
  data?: any;
}

export enum BotCommand {
  START = 'start',
}
export interface IBotCommandDescription {
  shortDescription: string;
  fullDescription: string;
}
export type BotCommandDescriptionList = {
  [key in BotCommand]: IBotCommandDescription;
};

export enum BotScene {
  MAIN = 'main',
}
export enum GroupScene {
  MAIN = 'g__main',
}
