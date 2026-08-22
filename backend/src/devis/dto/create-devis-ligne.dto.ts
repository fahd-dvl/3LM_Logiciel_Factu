import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export type TypeLigneDevis = 'PRODUIT' | 'SERVICE';

export class CreateDevisLigneDto {
  @IsOptional()
  @IsInt()
  produit_id?: number;

  @IsString()
  @MaxLength(2000)
  description: string;

  @IsPositive()
  quantite: number;

  @IsPositive()
  @IsNumber({ maxDecimalPlaces: 4 })
  prix_unitaire_ht: number;

  @Min(0)
  taux_tva: number;

  // Un devis n'accepte que PRODUIT ou SERVICE : pas de REMISE côté devis
  // (la REMISE reste réservée aux factures via CalculService, partagé
  // avec FactureService).
  @IsOptional()
  @IsIn(['PRODUIT', 'SERVICE'])
  type_ligne?: TypeLigneDevis;
}
