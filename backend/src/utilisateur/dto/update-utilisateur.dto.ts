import { IsOptional, IsString, IsPhoneNumber } from 'class-validator';

export class UpdateUtilisateurDto {
  @IsOptional()
  @IsString()
  prenom?: string;

  @IsOptional()
  @IsString()
  nom?: string;

  @IsOptional()
  @IsString()
  telephone?: string;
}
