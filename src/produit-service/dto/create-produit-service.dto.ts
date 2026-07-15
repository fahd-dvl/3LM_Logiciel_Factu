import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsPositive,
  IsInt,
  Min,
  MaxLength,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TypeProduitService } from 'generated/prisma/browser';

export class CreateProduitServiceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nom: string;

  @IsOptional()
  @IsString()
  description?: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  prix_unitaire_ht: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  unite?: string;

  @IsEnum(TypeProduitService)
  @IsNotEmpty()
  type: TypeProduitService;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  taux_tva_id: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categorie_id?: number;

  @IsOptional()
  @IsBoolean()
  actif?: boolean;

  constructor(
    nom,
    description,
    prix_unitaire_ht,
    unite,
    type,
    taux_tva_id,
    categorie_id,
    actif,
  ) {
    this.nom = nom;
    this.description = description;
    this.prix_unitaire_ht = prix_unitaire_ht;
    this.unite = unite;
    this.type = type;
    this.taux_tva_id = taux_tva_id;
    this.categorie_id = categorie_id;
    this.actif = actif;
  }
}
