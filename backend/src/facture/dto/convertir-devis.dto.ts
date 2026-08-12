import { IsInt, IsOptional, Min } from 'class-validator';

export class ConvertirDevisDto {
  /**
   * Nombre de jours entre l'émission de la facture et l'échéance de paiement.
   * Par défaut 30 jours si non fourni.
   */
  @IsOptional()
  @IsInt()
  @Min(0)
  delai_paiement_jours?: number;

  constructor(delai_paiement_jours?: number) {
    this.delai_paiement_jours = delai_paiement_jours;
  }
}
