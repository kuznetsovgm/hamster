import { HamsterSettings, PromoApps } from './hamster.interface';

export const DEFAULT_HAMSTER_SETTINGS: HamsterSettings = {
  autoUpgrade: false,
  autoTap: true,
  // dailyCombo: true,
  dailyCipher: true,
  dailyRewards: true,
  minimumBalanceCoins: 0,
  ridingExtrimePromo: true,
  miniGame: true,
  tilesMiniGame: true,
};

export const REFUEL_TAPS_BOOST_ID = 'BoostFullAvailableTaps';

export const MINI_GAME_SECRET_1 = 'R1cHard_AnA1';
export const MINI_GAME_SECRET_2 = 'G1ve_Me_y0u7_Pa55w0rD';

export const PROMO_APPS: PromoApps = {
  '2aaf5aee-2cbc-47ec-8a3f-0962cc14bc71': {
    appToken: '2aaf5aee-2cbc-47ec-8a3f-0962cc14bc71',
    appName: 'Polysphere',
    registerEventDelay: 15000,
    loginClientDelay: 25000,
  },
  // '43e35910-c168-4634-ad4f-52fd764a843f': {
  //   appToken: 'd28721be-fd2d-4b45-869e-9f253b554e50',
  //   appName: 'Riding Extrime 3D',
  //   callApiDelay: 30000,
  // },
  'b4170868-cef0-424f-8eb9-be0622e8e8e3': {
    appToken: 'd1690a07-3780-4068-810f-9b5bbf2931b2',
    appName: 'Chain Cube',
    registerEventDelay: 35000,
    loginClientDelay: 35000,
  },
  // 'fe693b26-b342-4159-8808-15e3ff7f8767': {
  //   appToken: '74ee0b5b-775e-4bee-974f-63e7f4d5bacb',
  //   appName: 'My Clone Army',
  //   callApiDelay: 125000,
  // },
  'c4480ac7-e178-4973-8061-9ed5b2e17954': {
    appToken: '82647f43-3f87-402d-88dd-09a90025313f',
    appName: 'Train Miner',
    registerEventDelay: 125000,
    loginClientDelay: 125000,
  },
  'dc128d28-c45b-411c-98ff-ac7726fbaea4': {
    appToken: '8d1cc2ad-e097-4b86-90ef-7a27e19fb833',
    appName: 'Merge Away',
    registerEventDelay: 25000,
    loginClientDelay: 25000,
  },
  '61308365-9d16-4040-8bb0-2f4a4c69074c': {
    appToken: '61308365-9d16-4040-8bb0-2f4a4c69074c',
    appName: 'Twerk Race',
    registerEventDelay: 25000,
    loginClientDelay: 25000,
  },
  'ef319a80-949a-492e-8ee0-424fb5fc20a6': {
    appToken: 'ef319a80-949a-492e-8ee0-424fb5fc20a6',
    appName: 'Mow and Trim',
    registerEventDelay: 25000,
    loginClientDelay: 25000,
  },
  // '8814a785-97fb-4177-9193-ca4180ff9da8': {
  //   appToken: '8814a785-97fb-4177-9193-ca4180ff9da8',
  //   appName: 'Mud Racing',
  //   callApiDelay: 25000,
  // },
  // 'bc0971b8-04df-4e72-8a3e-ec4dc663cd11': {
  //   appToken: 'bc0971b8-04df-4e72-8a3e-ec4dc663cd11',
  //   appName: 'Cafe Dash',
  //   callApiDelay: 25000,
  // },
  'b2436c89-e0aa-4aed-8046-9b0515e1c46b': {
    appToken: 'b2436c89-e0aa-4aed-8046-9b0515e1c46b',
    appName: 'Zoopolis',
    registerEventDelay: 25000,
    loginClientDelay: 25000,
  },
  // 'c7821fa7-6632-482c-9635-2bd5798585f9': {
  //   appToken: 'b6de60a0-e030-48bb-a551-548372493523',
  //   appName: 'Gangs Wars',
  //   callApiDelay: 50000,
  // },
  '112887b0-a8af-4eb2-ac63-d82df78283d9': {
    appToken: '112887b0-a8af-4eb2-ac63-d82df78283d9',
    appName: 'Fluff Crusade',
    registerEventDelay: 25000,
    loginClientDelay: 120000,
  },
  'e68b39d2-4880-4a31-b3aa-0393e7df10c7': {
    appToken: 'e68b39d2-4880-4a31-b3aa-0393e7df10c7',
    appName: 'Tile Trio',
    registerEventDelay: 25000,
    loginClientDelay: 25000,
  },
  '04ebd6de-69b7-43d1-9c4b-04a6ca3305af': {
    appToken: '04ebd6de-69b7-43d1-9c4b-04a6ca3305af',
    appName: 'Stone Age',
    registerEventDelay: 25000,
    loginClientDelay: 25000,
  },
  'bc72d3b9-8e91-4884-9c33-f72482f0db37': {
    appToken: 'bc72d3b9-8e91-4884-9c33-f72482f0db37',
    appName: 'Bouncemasters',
    registerEventDelay: 65000,
    loginClientDelay: 65000,
  },
  '4bf4966c-4d22-439b-8ff2-dc5ebca1a600': {
    appToken: '4bf4966c-4d22-439b-8ff2-dc5ebca1a600',
    appName: 'Hide Ball',
    registerEventDelay: 25000,
    loginClientDelay: 25000,
  },
  '4bdc17da-2601-449b-948e-f8c7bd376553': {
    appToken: '4bdc17da-2601-449b-948e-f8c7bd376553',
    appName: 'Count Masters',
    registerEventDelay: 25000,
    loginClientDelay: 25000,
  },
  'd2378baf-d617-417a-9d99-d685824335f0': {
    appToken: 'd2378baf-d617-417a-9d99-d685824335f0',
    appName: 'Pin Out Master',
    registerEventDelay: 25000,
    loginClientDelay: 25000,
  },
  'eb518c4b-e448-4065-9d33-06f3039f0fcb': {
    appToken: 'eb518c4b-e448-4065-9d33-06f3039f0fcb',
    appName: 'Infected Frontier',
    registerEventDelay: 25000,
    loginClientDelay: 25000,
  },
  'daab8f83-8ea2-4ad0-8dd5-d33363129640': {
    appToken: 'daab8f83-8ea2-4ad0-8dd5-d33363129640',
    appName: 'Among Water',
    registerEventDelay: 25000,
    loginClientDelay: 25000,
  },
  'd02fc404-8985-4305-87d8-32bd4e66bb16': {
    appToken: 'd02fc404-8985-4305-87d8-32bd4e66bb16',
    appName: 'Factory World',
    registerEventDelay: 25000,
    loginClientDelay: 25000,
  },
};
