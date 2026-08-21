import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Select } from "../components/ui/select";
import {
  DollarSign,
  FileText,
  Users,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  FileDown,
  RefreshCw,
} from "lucide-react";
import { formatCurrency, formatDate } from "../lib/utils";
import { dashboardApi } from "../lib/api";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function Dashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState([
    {
      title: "Chiffre d'affaires",
      value: formatCurrency(45231.89),
      change: "+20.1%",
      icon: DollarSign,
      description: "Ce mois",
    },
    {
      title: "Factures impayées",
      value: "12",
      change: "+2",
      icon: FileText,
      description: "Factures en attente",
    },
    {
      title: "Clients actifs",
      value: "57",
      change: "+5",
      icon: Users,
      description: "Nouveaux ce mois",
    },
    {
      title: "Taux de paiement",
      value: "89%",
      change: "+3.2%",
      icon: TrendingUp,
      description: "vs mois dernier",
    },
  ]);

  const updateStatsDescriptions = () => {
    setStats((prev) =>
      prev.map((stat) => ({
        ...stat,
        description:
          stat.title === "Chiffre d'affaires"
            ? getPeriodLabel()
            : stat.title === "Clients actifs"
              ? "Nouveaux " + getPeriodLabel().toLowerCase()
              : stat.title === "Taux de paiement"
                ? "vs " + getPeriodLabel().toLowerCase() + " dernier"
                : stat.description,
      })),
    );
  };

  useEffect(() => {
    updateStatsDescriptions();
  }, [selectedPeriod]);

  const [topClients, setTopClients] = useState<any[]>([]);

  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);

  const [revenueData, setRevenueData] = useState([
    { month: "Jan", revenue: 12000 },
    { month: "Fév", revenue: 15000 },
    { month: "Mar", revenue: 18000 },
    { month: "Avr", revenue: 22000 },
    { month: "Mai", revenue: 25000 },
    { month: "Juin", revenue: 28000 },
  ]);

  const [invoiceStatusData, setInvoiceStatusData] = useState([
    { name: "Payées", value: 45, color: "#22c55e" },
    { name: "En attente", value: 12, color: "#eab308" },
    { name: "Annulées", value: 3, color: "#ef4444" },
  ]);

  const [clientGrowthData, setClientGrowthData] = useState([
    { month: "Jan", newClients: 5 },
    { month: "Fév", newClients: 8 },
    { month: "Mar", newClients: 12 },
    { month: "Avr", newClients: 7 },
    { month: "Mai", newClients: 15 },
    { month: "Juin", newClients: 10 },
  ]);

  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod]);

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case "week":
        return "Cette semaine";
      case "month":
        return "Ce mois";
      case "quarter":
        return "Ce trimestre";
      case "year":
        return "Cette année";
      default:
        return "Cette période";
    }
  };

  const refreshData = async () => {
    setLoading(true);
    await loadDashboardData();
    setLoading(false);
  };

  const exportDashboardData = () => {
    const exportData = {
      stats: stats,
      topClients: topClients,
      recentInvoices: recentInvoices,
      revenueData: revenueData,
      invoiceStatusData: invoiceStatusData,
      clientGrowthData: clientGrowthData,
      exportDate: new Date().toISOString(),
      period: selectedPeriod,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `dashboard_export_${new Date().toISOString().split("T")[0]}.json`;
    link.click();
  };

  const loadDashboardData = async () => {
    try {
      const [statsData, clientsData, invoicesData] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getTopClients(),
        dashboardApi.getRecentInvoices(),
      ]);
      // Update stats with API data
      if (statsData) {
        setStats([
          {
            title: "Chiffre d'affaires",
            value: formatCurrency(statsData.revenue || 45231.89),
            change: "+20.1%",
            icon: DollarSign,
            description: "Ce mois",
          },
          {
            title: "Factures impayées",
            value: statsData.unpaidInvoices?.toString() || "12",
            change: "+2",
            icon: FileText,
            description: "Factures en attente",
          },
          {
            title: "Clients actifs",
            value: statsData.activeClients?.toString() || "57",
            change: "+5",
            icon: Users,
            description: "Nouveaux ce mois",
          },
          {
            title: "Taux de paiement",
            value: `${statsData.paymentRate || 89}%`,
            change: "+3.2%",
            icon: TrendingUp,
            description: "vs mois dernier",
          },
        ]);
      }
      if (clientsData && clientsData.length > 0) {
        setTopClients(
          clientsData.map((c: any) => ({
            name: c.nom || c.name,
            amount: formatCurrency(c.montant || c.amount),
            invoices: c.nombre_factures || c.invoices,
          })),
        );
      }
      if (invoicesData && invoicesData.length > 0) {
        setRecentInvoices(
          invoicesData.map((i: any) => ({
            id: i.numero || i.number || i.id,
            client: i.client,
            amount: formatCurrency(i.montant || i.amount),
            status: i.statut || i.status,
            date: i.date_emission || i.date,
          })),
        );
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Tableau de bord
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Vue d'ensemble de votre activité
          </p>
        </div>
        <div className="flex gap-2">
          <Select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="quarter">Ce trimestre</option>
            <option value="year">Cette année</option>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Actualiser
          </Button>
          <Button variant="outline" size="sm" onClick={exportDashboardData}>
            <FileDown className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const isPositive = stat.change.startsWith("+");
          return (
            <Card
              key={stat.title}
              className="hover:shadow-lg transition-shadow border-gray-200 dark:border-gray-700"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stat.value}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  {isPositive ? (
                    <ArrowUpRight className="h-3 w-3 text-green-600 dark:text-green-400" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-600 dark:text-red-400" />
                  )}
                  <span
                    className={
                      isPositive
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }
                  >
                    {stat.change}
                  </span>{" "}
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-gray-100">
              Évolution du chiffre d'affaires
            </CardTitle>
            <CardDescription className="text-gray-500 dark:text-gray-400">
              Revenus mensuels sur les 6 derniers mois
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={
                    document.documentElement.classList.contains("dark")
                      ? "#374151"
                      : "#e5e7eb"
                  }
                />
                <XAxis
                  dataKey="month"
                  stroke={
                    document.documentElement.classList.contains("dark")
                      ? "#9ca3af"
                      : "#6b7280"
                  }
                />
                <YAxis
                  stroke={
                    document.documentElement.classList.contains("dark")
                      ? "#9ca3af"
                      : "#6b7280"
                  }
                />
                <Tooltip
                  formatter={(value) => formatCurrency(value as number)}
                  contentStyle={{
                    backgroundColor:
                      document.documentElement.classList.contains("dark")
                        ? "#1f2937"
                        : "#ffffff",
                    border: "1px solid #e5e7eb",
                  }}
                  itemStyle={{
                    color: document.documentElement.classList.contains("dark")
                      ? "#f3f4f6"
                      : "#1f2937",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-gray-100">
              Statut des factures
            </CardTitle>
            <CardDescription className="text-gray-500 dark:text-gray-400">
              Répartition par statut
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={invoiceStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {invoiceStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor:
                      document.documentElement.classList.contains("dark")
                        ? "#1f2937"
                        : "#ffffff",
                    border: "1px solid #e5e7eb",
                  }}
                  itemStyle={{
                    color: document.documentElement.classList.contains("dark")
                      ? "#f3f4f6"
                      : "#1f2937",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-gray-100">
              Croissance des clients
            </CardTitle>
            <CardDescription className="text-gray-500 dark:text-gray-400">
              Nouveaux clients par mois
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={clientGrowthData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={
                    document.documentElement.classList.contains("dark")
                      ? "#374151"
                      : "#e5e7eb"
                  }
                />
                <XAxis
                  dataKey="month"
                  stroke={
                    document.documentElement.classList.contains("dark")
                      ? "#9ca3af"
                      : "#6b7280"
                  }
                />
                <YAxis
                  stroke={
                    document.documentElement.classList.contains("dark")
                      ? "#9ca3af"
                      : "#6b7280"
                  }
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor:
                      document.documentElement.classList.contains("dark")
                        ? "#1f2937"
                        : "#ffffff",
                    border: "1px solid #e5e7eb",
                  }}
                  itemStyle={{
                    color: document.documentElement.classList.contains("dark")
                      ? "#f3f4f6"
                      : "#1f2937",
                  }}
                />
                <Legend />
                <Bar dataKey="newClients" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-gray-100">
              Top Clients
            </CardTitle>
            <CardDescription className="text-gray-500 dark:text-gray-400">
              Vos meilleurs clients ce mois
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topClients.map((client, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center font-semibold text-blue-600 dark:text-blue-400">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {client.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {client.invoices} facture
                        {client.invoices !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <p className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                    {client.amount}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Factures récentes</CardTitle>
            <CardDescription>Dernières factures émises</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {typeof invoice.client === "object"
                          ? invoice.client.nom
                          : invoice.client}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {invoice.id} • {formatDate(invoice.date)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {invoice.amount}
                    </p>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        invoice.status === "Payée"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                          : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                      }`}
                    >
                      {invoice.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
