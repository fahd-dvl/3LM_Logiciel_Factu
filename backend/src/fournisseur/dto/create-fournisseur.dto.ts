import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateFournisseurDto {
  @IsString()
  @MaxLength(200)
  nom: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  telephone?: string;

  @IsOptional()
  @IsString()
  adresse?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  matricule_fiscal?: string;

  @IsOptional()
  @IsString()
  @MaxLength(14)
  siret?: string;

  @IsInt()
  pays_id: number;

  @IsOptional()
  @IsString()
  note?: string;
}
