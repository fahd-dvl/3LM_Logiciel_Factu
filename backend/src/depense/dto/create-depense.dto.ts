import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { MethodePaiement } from 'generated/prisma/client';

export class CreateDepenseDto {
  @IsInt()
  fournisseur_id: number;

  @IsOptional()
  @IsInt()
  categorie_id?: number;

  @IsString()
  @MaxLength(2000)
  description: string;

  @IsDateString()
  date_depense: string;

  @IsOptional()
  @IsDateString()
  date_echeance?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference_facture?: string;

  @IsNumber({ maxDecimalPlaces: 4 })
  @IsPositive()
  montant_ht: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  taux_tva: number;

  @IsOptional()
  tva_recuperable?: boolean;

  @IsOptional()
  @IsEnum(MethodePaiement)
  mode_paiement?: MethodePaiement;

  @IsOptional()
  @IsString()
  justificatif_url?: string;
}
