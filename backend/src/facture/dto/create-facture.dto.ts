import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsString,
  MaxLength,
  ValidateNested,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { CreateFactureLigneDto } from './create-facture-ligne.dto';
import { MethodePaiement } from 'generated/prisma/enums';

export class CreateFactureDto {
  @IsInt()
  client_id: number;

  @IsInt()
  pays_id: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  adresse?: string;

  @IsDateString()
  date_echeance: string;

  @IsString()
  @MaxLength(10)
  devise: string;

  @IsOptional()
  @IsEnum(MethodePaiement)
  mode_paiement?: MethodePaiement;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateFactureLigneDto)
  lignes: CreateFactureLigneDto[];

  constructor(
    client_id: number,
    adresse: string,
    pays_id: number,
    date_echeance: string,
    devise: string,
    mode_paiement: MethodePaiement,
    lignes: CreateFactureLigneDto[],
  ) {
    this.client_id = client_id;
    this.adresse = adresse;
    this.pays_id = pays_id;
    this.date_echeance = date_echeance;
    this.devise = devise;
    this.mode_paiement = mode_paiement;
    this.lignes = lignes;
  }
}
