// src/taux-tva/dto/create-taux-tva.dto.ts
import {
  IsInt,
  IsDecimal,
  IsString,
  IsDateString,
  IsOptional,
} from 'class-validator';

export class CreateTauxTvaDto {
  @IsInt()
  pays_id: number;

  @IsDecimal()
  taux: number;

  @IsString()
  libelle: string;

  @IsDateString()
  date_debut: string;

  @IsOptional()
  @IsDateString()
  date_fin?: string;
}
