import {
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateFactureLigneDto {
  @IsOptional()
  @IsInt()
  produit_id?: number;

  @IsString()
  @MaxLength(255)
  description: string;

  @IsPositive()
  quantite: number;

  @Min(0)
  prix_unitaire_ht: number;

  @Min(0)
  taux_tva: number;

  constructor(
    produit_id: number,
    description: string,
    quantite: number,
    prix_unitaire_ht: number,
    taux_tva: number,
  ) {
    this.produit_id = produit_id;
    this.description = description;
    this.quantite = quantite;
    this.prix_unitaire_ht = prix_unitaire_ht;
    this.taux_tva = taux_tva;
  }
}
