import { PartialType } from '@nestjs/mapped-types';
import { CreateDevisDto } from './create-devis.dto';

// Modification autorisée uniquement si le devis est en statut BROUILLON
// (vérifié dans le service, pas dans le DTO)
export class UpdateDevisDto extends PartialType(CreateDevisDto) {}
