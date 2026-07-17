import { StatutDevis } from 'generated/prisma/browser';
import { BadRequestException } from '@nestjs/common';

const TRANSITIONS_AUTORISEES: Record<StatutDevis, StatutDevis[]> = {
  BROUILLON: ['ENVOYE', 'EXPIRE'],
  ENVOYE: ['ACCEPTE', 'REFUSE', 'EXPIRE'],
  ACCEPTE: ['CONVERTI'],
  REFUSE: [],
  EXPIRE: [],
  CONVERTI: [],
};

export function verifierTransition(
  statutActuel: StatutDevis,
  nouveauStatut: StatutDevis,
): void {
  const autorises = TRANSITIONS_AUTORISEES[statutActuel];

  if (!autorises.includes(nouveauStatut)) {
    throw new BadRequestException(
      `Transition de statut invalide : ${statutActuel} → ${nouveauStatut}`,
    );
  }
}

export function estModifiable(statut: StatutDevis): boolean {
  return statut === 'BROUILLON';
}
