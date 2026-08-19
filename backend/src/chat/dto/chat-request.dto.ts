import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChatRequestDto {
  @ApiProperty({ description: "Message de l'utilisateur" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  message: string;
}
