// dto/create-client.dto.ts
import {
  IsString,
  IsEmail,
  IsOptional,
  IsInt,
  IsEnum,
  Length,
  IsPhoneNumber,
} from 'class-validator';
import { TypeClient } from 'generated/prisma/browser';
import { ApiProperty } from '@nestjs/swagger';

export class CreateClientDto {
  @ApiProperty({ enum: TypeClient, description: 'Type de client' })
  @IsEnum(TypeClient)
  type: TypeClient;

  @ApiProperty({ description: 'Nom du client' })
  @IsString()
  @Length(2, 100)
  nom: string;

  @ApiProperty({ description: 'Prénom du client', required: false })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  prenom?: string;

  @ApiProperty({ description: 'Email du client', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: 'Téléphone du client', required: false })
  @IsOptional()
  @IsPhoneNumber()
  telephone?: string;

  @ApiProperty({ description: 'Adresse du client', required: false })
  @IsOptional()
  @IsString()
  adresse?: string;

  @ApiProperty({ description: 'Code postal', required: false })
  @IsOptional()
  @IsString()
  @Length(2, 10)
  code_postal?: string;

  @ApiProperty({ description: 'Ville', required: false })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  ville?: string;

  @ApiProperty({ description: 'ID du pays' })
  @IsInt()
  pays_id: number;

  @ApiProperty({ description: 'SIRET (pour les entreprises)', required: false })
  @IsOptional()
  @IsString()
  @Length(14, 14)
  siret?: string;

  @ApiProperty({ description: 'Matricule fiscal', required: false })
  @IsOptional()
  @IsString()
  @Length(2, 20)
  matricule_fiscal?: string;

  @ApiProperty({ description: 'Adresse légale', required: false })
  @IsOptional()
  @IsString()
  adresse_legale?: string;

  @ApiProperty({ description: 'Raison sociale', required: false })
  @IsOptional()
  @IsString()
  @Length(2, 200)
  raison_sociale?: string;

  @ApiProperty({ description: 'Note', required: false })
  @IsOptional()
  @IsString()
  note?: string;
  constructor(nom, pays_id, type) {
    this.nom = nom;
    this.pays_id = pays_id;
    this.type = type;
  }
}
