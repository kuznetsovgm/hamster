import { Request as Req } from 'express';
import { UserRole } from 'src/bot/user/user.interface';

export type JWTRole = UserRole;

export interface JWTUser {
  id: string;
  exp: number;
  role: JWTRole;
  firstName: string;
}
export interface Request extends Req {
  user?: JWTUser;
}

export interface LoginToken {
  loginToken: string;
  botUsername: string;
}

export interface AuthSuccess {
  id: string;
  access_token: string;
}
