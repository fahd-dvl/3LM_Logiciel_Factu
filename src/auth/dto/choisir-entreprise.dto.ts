import { IsInt } from 'class-validator';

export class ChoisirEntrepriseDto {
  @IsInt()
  entreprise_id: number;
}
