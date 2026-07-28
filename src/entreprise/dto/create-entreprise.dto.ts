import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { TypeStructure } from 'generated/prisma/browser';

export class CreateEntrepriseDto {
  @IsEnum(TypeStructure)
  type_structure: TypeStructure;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  nom_entreprise?: string;

  @IsString()
  @MaxLength(20)
  matricule_fiscal: string;

  @IsOptional()
  @IsString()
  @MaxLength(14)
  siret?: string;

  @IsString()
  adresse: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  code_postal?: string;

  @IsString()
  @MaxLength(150)
  ville: string;

  @IsInt()
  pays_id: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  representant_legal?: string;

  @IsOptional()
  @IsString()
  logo_url?: string;
}
