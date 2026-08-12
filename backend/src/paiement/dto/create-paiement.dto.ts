import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import { MethodePaiement } from 'generated/prisma/browser';

export class CreatePaiementDto {
  @IsInt()
  facture_id: number;

  @IsNumber()
  @IsPositive()
  montant: number;

  @IsEnum(MethodePaiement)
  methode: MethodePaiement;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference?: string;

  constructor(
    facture_id: number,
    montant: number,
    methode: MethodePaiement,
    reference?: string,
  ) {
    this.facture_id = facture_id;
    this.montant = montant;
    this.methode = methode;
    this.reference = reference;
  }
}
