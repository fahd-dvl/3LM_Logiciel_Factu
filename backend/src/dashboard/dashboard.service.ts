import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';
import { TopClientDto } from './dto/top-client.dto';
import { RecentInvoiceDto } from './dto/recent-invoice.dto';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(entrepriseId: number): Promise<DashboardStatsDto> {
    const paidInvoices = await this.prisma.facture.aggregate({
      where: {
        entreprise_id: entrepriseId,
        statut: 'PAYEE',
      },
      _sum: {
        total_ttc: true,
      },
    });

    const unpaidInvoices = await this.prisma.facture.count({
      where: {
        entreprise_id: entrepriseId,
        statut: {
          in: ['ENVOYEE', 'PARTIELLEMENT_PAYEE'],
        },
      },
    });

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const activeClients = await this.prisma.client.count({
      where: {
        entreprise_id: entrepriseId,
        facture: {
          some: {
            date_emission: {
              gte: threeMonthsAgo,
            },
          },
        },
      },
    });

    const totalInvoices = await this.prisma.facture.count({
      where: {
        entreprise_id: entrepriseId,
      },
    });

    const paidInvoicesCount = await this.prisma.facture.count({
      where: {
        entreprise_id: entrepriseId,
        statut: 'PAYEE',
      },
    });

    const paymentRate =
      totalInvoices > 0
        ? Math.round((paidInvoicesCount / totalInvoices) * 100)
        : 0;

    return {
      revenue: paidInvoices._sum.total_ttc?.toNumber() ?? 0,
      unpaidInvoices,
      activeClients,
      paymentRate,
    };
  }

  async getTopClients(entrepriseId: number): Promise<TopClientDto[]> {
    const topClientsRaw = await this.prisma.facture.groupBy({
      by: ['client_id'],
      where: {
        entreprise_id: entrepriseId,
        statut: 'PAYEE',
      },
      _sum: {
        total_ttc: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _sum: {
          total_ttc: 'desc',
        },
      },
      take: 5,
    });

    if (topClientsRaw.length === 0) {
      return [];
    }

    const clientIds = topClientsRaw.map((item) => item.client_id);
    const clients = await this.prisma.client.findMany({
      where: {
        id: {
          in: clientIds,
        },
      },
      select: {
        id: true,
        nom: true,
      },
    });

    const clientMap = new Map(clients.map((client) => [client.id, client.nom]));

    return topClientsRaw.map((item) => ({
      nom: clientMap.get(item.client_id) || 'Client inconnu',
      montant: item._sum.total_ttc?.toNumber() ?? 0,
      nombre_factures: item._count.id,
    }));
  }

  async getRecentInvoices(entrepriseId: number): Promise<RecentInvoiceDto[]> {
    const invoices = await this.prisma.facture.findMany({
      where: {
        entreprise_id: entrepriseId,
      },
      include: {
        client: {
          select: {
            nom: true,
          },
        },
      },
      orderBy: {
        date_emission: 'desc',
      },
      take: 5,
    });

    if (invoices.length === 0) {
      return [];
    }

    return invoices.map((invoice) => ({
      numero: invoice.numero,
      client: invoice.client.nom,
      montant: invoice.total_ttc.toNumber(),
      statut: invoice.statut,
      date_emission: invoice.date_emission,
    }));
  }
}
