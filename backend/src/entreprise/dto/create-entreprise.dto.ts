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
  type_structure: TypeStructure; // ✅ Obligatoire

  @IsString()
  @MaxLength(200)
  nom_entreprise: string; // ✅ Obligatoire (supprimé @IsOptional)

  @IsString()
  @MaxLength(20)
  matricule_fiscal: string; // ✅ Obligatoire

  @IsOptional() // ✅ Seul champ optionnel
  @IsString()
  @MaxLength(14)
  siret?: string; // ✅ Optionnel

  @IsString()
  adresse: string; // ✅ Obligatoire

  @IsString()
  @MaxLength(20)
  code_postal: string; // ✅ Obligatoire (supprimé @IsOptional)

  @IsString()
  @MaxLength(150)
  ville: string; // ✅ Obligatoire

  @IsInt()
  pays_id: number; // ✅ Obligatoire

  @IsString()
  @MaxLength(200)
  representant_legal: string; // ✅ Obligatoire (supprimé @IsOptional)
}
