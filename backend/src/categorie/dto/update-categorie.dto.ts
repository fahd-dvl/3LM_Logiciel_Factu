// src/categorie/dto/update-categorie.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateCategorieDto } from './create-categorie.dto';

export class UpdateCategorieDto extends PartialType(CreateCategorieDto) {}
