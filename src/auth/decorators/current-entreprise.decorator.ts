import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentEntreprise = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): number => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.entreprise_id;
  },
);
