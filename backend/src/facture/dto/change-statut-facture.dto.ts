import { IsEnum } from 'class-validator';
import { StatutFacture } from 'generated/prisma/browser';

export class ChangeStatutFactureDto {
  @IsEnum(StatutFacture)
  statut: StatutFacture;

  constructor(statut: StatutFacture) {
    this.statut = statut;
  }
}
