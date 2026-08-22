// src/categorie/dto/create-categorie.dto.ts
import { IsString, IsOptional, IsInt, MaxLength } from 'class-validator';

export class CreateCategorieDto {
  @IsString()
  @MaxLength(100)
  nom: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  parent_id?: number;
}
