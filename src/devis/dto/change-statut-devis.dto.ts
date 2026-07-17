import { IsEnum } from 'class-validator';
import { StatutDevis } from 'generated/prisma/browser';

export class ChangeStatutDevisDto {
  @IsEnum(StatutDevis)
  statut: StatutDevis;

  constructor(statut: StatutDevis) {
    this.statut = statut;
  }
}
