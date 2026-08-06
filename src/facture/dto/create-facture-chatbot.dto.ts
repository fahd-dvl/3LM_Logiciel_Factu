import {
  IsArray,
  IsDateString,
  IsString,
  IsNumber,
  IsPositive,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { TypeLigne } from 'generated/prisma/enums';
import { IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

class ElementFactureChatbotDto {
  @IsEnum(TypeLigne)
  type_ligne: TypeLigne;

  @IsString()
  description: string;

  @IsPositive()
  quantite: number;

  // Pas de @IsPositive() ici : une ligne REMISE doit pouvoir être négative.
  // La cohérence signe/type_ligne est validée dans FactureService.creerViaChatbot().
  @IsNumber({ maxDecimalPlaces: 4 })
  prix_unitaire_ht: number;
}

export class CreateFactureChatbotDto {
  @IsString()
  client: string; // nom du client (recherché ou créé automatiquement)

  @IsString()
  numero_tva: string; // sert de clé de recherche pour retrouver un client existant

  @IsString()
  adresse_client: string;

  @IsDateString()
  date_facture: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ElementFactureChatbotDto)
  elements: ElementFactureChatbotDto[];
}
