export interface JwtPayload {
  sub: number;
  email: string;
  role: string;
  entreprise_id: number | null;
}
