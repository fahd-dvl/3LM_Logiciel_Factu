import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class EntrepriseActiveGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.entreprise_id) {
      throw new ForbiddenException(
        "Aucune entreprise sélectionnée. Choisissez d'abord une société via /auth/choisir-entreprise",
      );
    }

    return true;
  }
}
