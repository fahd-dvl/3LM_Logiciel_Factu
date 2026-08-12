import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsString()
  nom?: string;

  @IsOptional()
  @IsString()
  prenom?: string;

  constructor(email: string, password: string, nom: string, prenom: string) {
    this.email = email;
    this.password = password;
    this.nom = nom;
    this.prenom = prenom;
  }
}
