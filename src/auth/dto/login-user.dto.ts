import { IsString } from 'class-validator';

export class LoginTokenDto {
  @IsString()
  loginToken: string;
}
