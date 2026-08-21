import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Veuillez entrer un email valide' })
  email: string;

  @IsString()
  @MinLength(8, {
    message: 'Le mot de passe doit contenir au moins 8 caractères',
  })
  password: string;

  @IsString()
  nom?: string;

  @IsString()
  prenom?: string;

  @IsString()
  telephone?: string;
}
