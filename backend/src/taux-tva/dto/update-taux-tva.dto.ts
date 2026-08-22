// src/taux-tva/dto/update-taux-tva.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateTauxTvaDto } from './create-taux-tva.dto';

export class UpdateTauxTvaDto extends PartialType(CreateTauxTvaDto) {}
