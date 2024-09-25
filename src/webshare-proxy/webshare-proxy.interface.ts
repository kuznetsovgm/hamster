export interface WebshareProxyList {
  count: number;
  next: any;
  previous: any;
  results: WebshareProxy[];
}

export interface WebshareProxy {
  id: string;
  username: string;
  password: string;
  proxy_address: string;
  port: number;
  valid: boolean;
  last_verification: string;
  country_code: string;
  city_name: string;
  asn_name: string;
  asn_number: number;
  high_country_confidence: boolean;
  created_at: string;
}

export interface Proxy {
  host: string;
  port: number;
  username: string;
  password: string;
}
