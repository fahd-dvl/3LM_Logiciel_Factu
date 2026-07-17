import { StatutFacture } from 'generated/prisma/browser';
import { BadRequestException } from '@nestjs/common';

const TRANSITIONS_AUTORISEES: Record<StatutFacture, StatutFacture[]> = {
  BROUILLON: ['ENVOYEE', 'ANNULEE'],
  ENVOYEE: ['PARTIELLEMENT_PAYEE', 'PAYEE', 'EN_RETARD', 'ANNULEE'],
  PARTIELLEMENT_PAYEE: ['PAYEE', 'EN_RETARD', 'ANNULEE'],
  EN_RETARD: ['PARTIELLEMENT_PAYEE', 'PAYEE', 'ANNULEE'],
  PAYEE: [],
  ANNULEE: [],
};

export function verifierTransitionFacture(
  statutActuel: StatutFacture,
  nouveauStatut: StatutFacture,
): void {
  const autorises = TRANSITIONS_AUTORISEES[statutActuel];

  if (!autorises.includes(nouveauStatut)) {
    throw new BadRequestException(
      `Transition de statut invalide : ${statutActuel} → ${nouveauStatut}`,
    );
  }
}

export function estModifiableFacture(statut: StatutFacture): boolean {
  return statut === 'BROUILLON';
}

export function estSupprimableFacture(statut: StatutFacture): boolean {
  return statut === 'BROUILLON';
}
