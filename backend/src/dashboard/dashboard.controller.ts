import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DashboardService } from './dashboard.service';
import { CurrentEntreprise } from '../auth/decorators/current-entreprise.decorator';
import { EntrepriseActiveGuard } from '../auth/guards/entreprise-active.guard';

@Controller('dashboard')
@UseGuards(AuthGuard('jwt'), EntrepriseActiveGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  async getStats(@CurrentEntreprise() entrepriseId: number) {
    return this.dashboardService.getStats(entrepriseId);
  }

  @Get('top-clients')
  async getTopClients(@CurrentEntreprise() entrepriseId: number) {
    return this.dashboardService.getTopClients(entrepriseId);
  }

  @Get('recent-invoices')
  async getRecentInvoices(@CurrentEntreprise() entrepriseId: number) {
    return this.dashboardService.getRecentInvoices(entrepriseId);
  }
}
