import { SocksProxyAgent } from 'socks-proxy-agent';
import { Hamster } from 'src/entities/typeorm/hamster.entity';

export interface HamsterSettings {
  autoUpgrade: boolean;
  autoTap: boolean;
  // dailyCombo: boolean;
  dailyCipher: boolean;
  dailyRewards: boolean;
  miniGame: boolean;
  tilesMiniGame: boolean;
  minimumBalanceCoins: number;
  ridingExtrimePromo: boolean;
}

export interface PromoApp {
  appName: string;
  appToken: string;
  registerEventDelay: number;
  loginClientDelay: number;
}
export interface PromoApps {
  [promoId: string]: PromoApp;
}

export interface SyncResult {
  interludeUser: ClickerUser;
}

export interface ClickerUser {
  id: string;
  totalDiamonds: number;
  balanceDiamonds: number;
  level: number;
  availableTaps: number;
  lastSyncUpdate: number;
  exchangeId: string;
  boosts: Boosts;
  upgrades?: Upgrades;
  tasks: Tasks;
  airdropTasks: AirdropTasks;
  referralsCount: number;
  maxTaps: number;
  earnPerTap: number;
  earnPassivePerSec: number;
  earnPassivePerHour: number;
  lastPassiveEarn: number;
  tapsRecoverPerSec: number;
  referral: Referral;
  claimedUpgradeComboAt: string;
  claimedCipherAt: string;
  balanceTickets: number;
  promos: SyncPromo[];
}

export interface Boosts {
  BoostEarnPerTap: BoostEarnPerTap;
  BoostMaxTaps: BoostMaxTaps;
  BoostFullAvailableTaps: BoostFullAvailableTaps;
}
export interface BoostEarnPerTap {
  id: string;
  level: number;
  lastUpgradeAt: number;
}

export interface BoostMaxTaps {
  id: string;
  level: number;
  lastUpgradeAt: number;
}

export interface BoostFullAvailableTaps {
  id: string;
  level: number;
  lastUpgradeAt: number;
}

export interface Upgrade {
  id: string;
  level: number;
  lastUpgradeAt: number;
  snapshotReferralsCount?: number;
}

export interface Upgrades {
  [key: string]: Upgrade;
}

export interface Task {
  id: string;
  isCompleted?: boolean;
  completedAt?: string;
}

export interface StreakDaysTask extends Task {
  days: number;
}

export interface Tasks {
  streak_days: StreakDaysTask;
  [key: string]: Task;
}

export interface DailyKeysMiniGame {
  startDate: string;
  levelConfig?: string;
  youtubeUrl: string;
  bonusKeys: number;
  isClaimed: boolean;
  totalSecondsToNextAttempt: number;
  remainSecondsToGuess: number;
  remainSeconds: number;
  remainSecondsToNextAttempt: number;
  maxPoints: number;
  remainPoints: number;
}

export interface AirdropTasks {
  airdrop_connect_ton_wallet: AirdropConnectTonWallet;
  subscribe_telegram_channel: SubscribeTelegramChannel2;
}

export interface TasksList {
  tasks: Task[];
}

export interface CheckTask {
  taskId: Task['id'];
}
export interface CheckTaskRes {
  task: Task;
  interludeUser: ClickerUser;
}
export interface StartKeysMiniGameRes {
  dailyKeysMiniGame: DailyKeysMiniGame;
  interludeUser: ClickerUser;
}

export interface AirdropConnectTonWallet {
  id: string;
  walletAddress: string;
  completedAt: string;
}

export interface SubscribeTelegramChannel2 {
  id: string;
  completedAt: string;
}

export interface Referral {
  friend: Friend;
}

export interface Friend {
  firstName: string;
  id: number;
  isBot: boolean;
  isPremium: boolean;
  languageCode: string;
  lastName: string;
  username: string;
  welcomeBonusCoins: number;
}

export interface UpgradesForBuy {
  upgradesForBuy: UpgradeForBuy[];
  sections: Section[];
  dailyCombo: DailyCombo;
}

export interface UpgradeForBuy {
  id: string;
  name: string;
  price: number;
  profitPerHour: number;
  condition?: Condition;
  section: string;
  level: number;
  currentProfitPerHour: number;
  profitPerHourDelta: number;
  isAvailable: boolean;
  isExpired: boolean;
  cooldownSeconds?: number;
  totalCooldownSeconds?: number;
  expiresAt?: string;
  maxLevel?: number;
  welcomeCoins?: number;
}

export type ConditionType =
  | 'ByUpgrade'
  | 'ReferralCount'
  | 'MoreReferralsCount'
  | 'SubscribeTelegramChannel'
  | 'LinkWithoutCheck'
  | 'LinksToUpgradeLevel';

export interface ConditionBuyUpgrade {
  _type: 'ByUpgrade';
  upgradeId: string;
  level: number;
}
export interface ConditionReferralCount {
  _type: 'ReferralCount';
  referralCount: number;
}
export interface ConditionMoreReferralsCount {
  _type: 'MoreReferralsCount';
  moreReferralsCount: number;
}
export interface ConditionSubscribeTelegramChannel {
  _type: 'SubscribeTelegramChannel';
  link: string;
}
export interface ConditionLinkWithoutCheck {
  _type: 'LinkWithoutCheck';
  channelId: number;
  link: string;
}
export interface ConditionLinksToUpgradeLevel {
  _type: 'LinksToUpgradeLevel';
  links?: string[];
  subscribeLink: string;
}
export type Condition =
  | ConditionBuyUpgrade
  | ConditionReferralCount
  | ConditionMoreReferralsCount
  | ConditionSubscribeTelegramChannel
  | ConditionLinkWithoutCheck
  | ConditionLinksToUpgradeLevel;

export interface Section {
  section: string;
  isAvailable: boolean;
}

export interface DailyCombo {
  upgradeIds: string[];
  bonusCoins: number;
  isClaimed: boolean;
  remainSeconds: number;
}

export interface BuyUpgradeResult {
  interludeUser: ClickerUser;
  upgradesForBuy: UpgradeForBuy[];
  dailyCombo: DailyCombo;
}

export interface InitParams {
  tgWebAppData: string;
  tgWebAppPlatform: string;
  tgWebAppThemeParams: string;
  tgWebAppVersion: string;
}

export interface AuthResult {
  authToken: string;
  status: 'Ok';
}

export interface BuyTap {
  count: number;
  availableTaps: number;
  timestamp: number;
}
export interface BuyBoost {
  boostId: 'BoostFullAvailableTaps';
  timestamp: number;
}

export interface BuyUpgradeData {
  upgradeId: UpgradeForBuy['id'];
}

export type MiniGames = 'Candles' | 'Tiles';
export interface StartDailyKeysMiniGame {
  miniGameId: MiniGames;
}
export interface ClaimDailyKeysMiniGame {
  miniGameId: MiniGames;
  cipher: string;
}
export type DailyKeysMiniGameList = {
  [name in MiniGames]: DailyKeysMiniGame;
};
export interface Config {
  clickerConfig: ClickerConfig;
  dailyCipher: DailyCipher;
  dailyKeysMiniGames: DailyKeysMiniGameList;
  feature: string[];
}

export interface ClickerConfig {
  guidLink: GuidLink;
  maxPassiveDtSeconds: number;
  userLevels_balanceCoins: UserLevelsBalanceCoin[];
  boosts: Boost[];
  tasks: Task[];
  airdropTasks: AirdropTask[];
  levelUp: LevelUp;
  referral: Referral;
  exchanges: Exchange[];
  airdrops: any[];
  depositsUpdateCooldownSeconds: number;
  skins: Skin[];
  promos: Promos;
}

export interface Skin {
  id: string;
  name: string;
  price: number;
  pictureLink: PictureLink;
  condition: Condition;
}

export interface PictureLink {
  defaultUrl: string;
  compressedUrl: string;
}

export interface Promos {
  loginAttemptTimeoutSec: number;
  loginSameIpLimitSec: number;
  loginSameIpLimitCount: number;
  loginSessionTimeoutSec: number;
  registerEventTimeoutSec: number;
  apps: App[];
}

export interface PromoState {
  promoId: string;
  receiveKeysToday: number;
  receiveKeysRefreshSec: number;
}

export interface GetPromosRes {
  promos: Promo[];
  states: PromoState[];
}

export interface App {
  token: string;
  blocked: boolean;
  promos: Promo[];
}

export interface SyncPromo {
  promoId: string;
  receiveKeysTotal: number;
  receiveKeysToday: number;
  receiveKeysLastTime: string;
}

export interface Promo {
  promoId: string;
  prefix: string;
  eventsCount: number;
  codesPerDay: number;
  keysPerDay: number;
  keysPerCode: number;
  blocked: boolean;
  image: Image;
  modalImage: ModalImage;
  title: Title;
  description: Description;
  icon: Icon;
  appUrl: string;
  onboard: Onboard[];
}

export interface Image {
  defaultUrl: string;
  compressedUrl: string;
}

export interface ModalImage {
  defaultUrl: string;
  compressedUrl: string;
}

export interface Title {
  en: string;
  de: string;
  es: string;
  fr: string;
  hi: string;
  id: string;
  pt: string;
  ru: string;
  th: string;
  tl: string;
  tr: string;
  uz: string;
  vi: string;
}

export interface Description {
  en: string;
  de: string;
  es: string;
  fr: string;
  hi: string;
  id: string;
  pt: string;
  ru: string;
  th: string;
  tl: string;
  tr: string;
  uz: string;
  vi: string;
}

export interface Icon {
  defaultUrl: string;
  compressedUrl: string;
}

export interface Onboard {
  image: Image2;
  title: Title2;
  description: Description2;
}

export interface Image2 {
  defaultUrl: string;
  compressedUrl: string;
}

export interface Title2 {
  en: string;
  de: string;
  es: string;
  fr: string;
  hi: string;
  id: string;
  pt: string;
  ru: string;
  th: string;
  tl: string;
  tr: string;
  uz: string;
  vi: string;
}

export interface Description2 {
  en: string;
  de: string;
  es: string;
  fr: string;
  hi: string;
  id: string;
  pt: string;
  ru: string;
  th: string;
  tl: string;
  tr: string;
  uz: string;
  vi: string;
}

export interface ApplyPromoData {
  promoCode: string;
}

export interface GuidLink {
  ru: string;
  en: string;
  latam: string;
  uz: string;
  vn: string;
  br: string;
}

export interface UserLevelsBalanceCoin {
  level: number;
  coinsToLeveUp?: number;
}

export interface Boost {
  id: string;
  price: number;
  earnPerTap: number;
  maxTaps: number;
  level: number;
  maxTapsDelta: number;
  earnPerTapDelta: number;
  cooldownSeconds?: number;
  maxLevel?: number;
}
export interface BoostsForBuyRes {
  boostsForBuy: Boost[];
}

export interface Task {
  id: string;
  rewardCoins: number;
  periodicity: string;
  link?: string;
  channelId?: number;
  rewardsByDays?: RewardsByDay[];
}

export interface RewardsByDay {
  days: number;
  rewardCoins: number;
}

export interface AirdropTask {
  id: string;
  rewardTickets: number;
  periodicity: string;
}

export interface LevelUp {
  maxTaps: number;
  earnPerTap: number;
}

export interface Referral {
  base: Base;
  premium: Premium;
}

export interface Base {
  welcome: number;
  levelUp: LevelUp2;
}

export interface LevelUp2 {
  '1': number;
  '2': number;
  '3': number;
  '4': number;
  '5': number;
  '6': number;
  '7': number;
  '8': number;
  '9': number;
  '10': number;
}

export interface Premium {
  welcome: number;
  levelUp: LevelUp3;
}

export interface LevelUp3 {
  '1': number;
  '2': number;
  '3': number;
  '4': number;
  '5': number;
  '6': number;
  '7': number;
  '8': number;
  '9': number;
  '10': number;
}

export interface Exchange {
  id: string;
  name: string;
  players: number;
  bonus: number;
}

export interface SelectExchange {
  exchangeId: Exchange['id'];
}

export interface DailyCipher {
  cipher: string;
  bonusCoins: number;
  isClaimed: boolean;
  remainSeconds: number;
}

export interface Proxy {
  host: string;
  port: number;
  username: string;
  password: string;
}

export interface HamsterWithProxy extends Hamster {
  proxyAgent: SocksProxyAgent;
}

export interface AuthAction {
  method: 'auth';
}
export interface SyncAction {
  method: 'sync';
}
export interface ConfigAction {
  method: 'config';
}
export interface GetPromosAction {
  method: 'get-promos';
}
export interface UpgradesForBuyAction {
  method: 'upgrades-for-buy';
}
export interface ListTasksAction {
  method: 'list-tasks';
}
export interface BoostsForBuyAction {
  method: 'boosts-for-buy';
}
export interface StartKeysMiniGame {
  method: 'start-keys-minigame';
  data: StartDailyKeysMiniGame;
}
export interface ClaimDailyKeysMiniGameAction {
  method: 'claim-daily-keys-minigame';
  data: ClaimDailyKeysMiniGame;
}
export interface CheckTaskAction {
  method: 'check-task';
  data: CheckTask;
}
export interface SelectExchangeAction {
  method: 'select-exchange';
  data: SelectExchange;
}
export interface TapAction {
  method: 'tap';
  data: Omit<BuyTap, 'timestamp'>;
}
export interface BuyBoostAction {
  method: 'buy-boost';
  data: Omit<BuyBoost, 'timestamp'>;
}
export interface ClaimDailyCipherAction {
  method: 'claim-daily-cipher';
  data: Pick<DailyCipher, 'cipher'>;
}
export interface BuyUpgradeAction {
  method: 'buy-upgrade';
  data: BuyUpgradeData;
}
export interface UpdateSettingsAction {
  method: 'update-settings';
  data: HamsterSettings;
}
export interface ApplyPromoAction {
  method: 'apply-promo';
  data: ApplyPromoData;
}
export type CacheAction =
  | AuthAction
  | SyncAction
  | ConfigAction
  | UpgradesForBuyAction
  | TapAction
  | UpdateSettingsAction
  | BuyUpgradeAction
  | ClaimDailyCipherAction
  | ListTasksAction
  | CheckTaskAction
  | SelectExchangeAction
  | BoostsForBuyAction
  | BuyBoostAction
  | StartKeysMiniGame
  | ClaimDailyKeysMiniGameAction
  | ApplyPromoAction
  | GetPromosAction;

export type Action = CacheAction & {
  timestamp: number;
};

export interface MiniGameConfig {
  levelConfig: string;
  startDate: string;
}

export interface PromoLoginClient {
  [promoId: string]: string;
}
