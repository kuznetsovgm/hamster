import { BotCommand, BotCommandDescriptionList } from './bot.interface';

export const LINK_SEPARATOR = '\n';
export const SITE_LOGIN_PAYLOAD_STARTS = 'login_';

export const COMMANDS_DESCRIPTION: BotCommandDescriptionList = {
  [BotCommand.START]: {
    shortDescription: `Перезапустить бота`,
    fullDescription: `/${BotCommand.START}\n<i>Перезапустить бота</i>`,
  },
} as const;
