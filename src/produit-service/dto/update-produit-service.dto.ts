import { PartialType } from '@nestjs/mapped-types';
import { CreateProduitServiceDto } from './create-produit-service.dto';

export class UpdateProduitServiceDto extends PartialType(
  CreateProduitServiceDto,
) {}
