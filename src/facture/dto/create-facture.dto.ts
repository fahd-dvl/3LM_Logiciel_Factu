import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { CreateFactureLigneDto } from './create-facture-ligne.dto';

export class CreateFactureDto {
  @IsInt()
  entreprise_id: number;

  @IsInt()
  client_id: number;

  @IsInt()
  pays_id: number;

  @IsDateString()
  date_echeance: string;

  @IsString()
  @MaxLength(10)
  devise: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateFactureLigneDto)
  lignes: CreateFactureLigneDto[];

  constructor(
    entreprise_id: number,
    client_id: number,
    pays_id: number,
    date_echeance: string,
    devise: string,
    lignes: CreateFactureLigneDto[],
  ) {
    this.entreprise_id = entreprise_id;
    this.client_id = client_id;
    this.pays_id = pays_id;
    this.date_echeance = date_echeance;
    this.devise = devise;
    this.lignes = lignes;
  }
}
