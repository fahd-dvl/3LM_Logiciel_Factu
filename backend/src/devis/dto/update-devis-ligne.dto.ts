import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { TypeLigne } from 'generated/prisma/browser';

export class CreateDevisLigneDto {
  @IsOptional()
  @IsInt()
  produit_id?: number;

  @IsString()
  @MaxLength(2000)
  description: string;

  @IsPositive()
  quantite: number;

  @IsNumber({ maxDecimalPlaces: 4 })
  prix_unitaire_ht: number;

  @Min(0)
  taux_tva: number;

  @IsOptional()
  @IsEnum(TypeLigne)
  type_ligne?: TypeLigne;
}
