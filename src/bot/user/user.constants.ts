import { SceneSession } from 'telegraf/typings/scenes';

export const EMPTY_SESSION: SceneSession = {
  __scenes: { current: 'main', state: {} },
};

export const REFERRAL_PAYLOAD_STARTS_WITH = 'friend_';
export const NEED_NEW_REFERRALS_TO_GET_PROMO_CODE_FIRST_TIME = 2;
export const NEED_NEW_REFERRALS_TO_GET_PROMO_CODE = 1;
