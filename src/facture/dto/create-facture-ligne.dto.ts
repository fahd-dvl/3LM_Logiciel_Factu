import {
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { TypeLigne } from 'generated/prisma/enums';
import { IsEnum } from 'class-validator';
import { IsNumber } from 'class-validator';

export class CreateFactureLigneDto {
  @IsOptional()
  @IsInt()
  produit_id?: number;

  @IsEnum(TypeLigne)
  type_ligne: TypeLigne;

  @IsString()
  @MaxLength(255)
  description: string;

  @IsPositive()
  quantite: number;

  @IsNumber({ maxDecimalPlaces: 4 })
  prix_unitaire_ht: number;

  @Min(0)
  taux_tva: number;

  constructor(
    produit_id: number,
    type_ligne: TypeLigne,
    description: string,
    quantite: number,
    prix_unitaire_ht: number,
    taux_tva: number,
  ) {
    this.produit_id = produit_id;
    this.type_ligne = this.type_ligne;
    this.description = description;
    this.quantite = quantite;
    this.prix_unitaire_ht = prix_unitaire_ht;
    this.taux_tva = taux_tva;
  }
}
