// src/auth/dto/refresh-token.dto.ts
import { IsString } from 'class-validator';

export class RefreshTokenDto {
  @IsString()
  refresh_token: string;

  constructor(refresh_token) {
    this.refresh_token = refresh_token;
  }
}
