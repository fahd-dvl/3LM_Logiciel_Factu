import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsEnum,
} from 'class-validator';

export class RegisterDto {
  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  nom: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  prenom?: string;

  constructor(email, password, nom, prenom) {
    this.email = email;
    this.password = password;
    this.nom = nom;
    this.prenom;
  }
}
