import { SocksProxyAgent } from 'socks-proxy-agent';

export interface LoginClientData {
  appToken: string;
  clientId: string;
  clientOrigin: string;
}
export interface LoginClientRes {
  clientToken: string;
}

export interface RegisterEventData {
  promoId: string;
  eventId: string;
  eventOrigin: 'undefined';
  eventType?: string;
}
export interface RegisterEventRes {
  hasCode: boolean;
}

export interface CreateCodeData {
  promoId: string;
}
export interface CreateCodeRes {
  promoCode: string;
  clientToken: string;
  clientId: string;
}

export interface PromoConfig {
  proxyAgent: SocksProxyAgent;
  appToken: string;
  promoId: string;
  clientId?: string;
  appName: string;
  registerEventDelay?: number;
  loginClientDelay?: number;
}
