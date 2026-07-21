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
import { CreateDevisLigneDto } from './create-devis-ligne.dto';

export class CreateDevisDto {
  @IsInt()
  entreprise_id: number;

  @IsInt()
  client_id: number;

  @IsInt()
  pays_id: number;

  @IsDateString()
  date_validite: string;

  @IsString()
  @MaxLength(10)
  devise: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateDevisLigneDto)
  lignes: CreateDevisLigneDto[];
}
