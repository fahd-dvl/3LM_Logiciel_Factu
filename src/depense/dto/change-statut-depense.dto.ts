import { IsEnum } from 'class-validator';
import { StatutDepense } from 'generated/prisma/client';

export class ChangeStatutDepenseDto {
  @IsEnum(StatutDepense)
  statut: StatutDepense;
}
