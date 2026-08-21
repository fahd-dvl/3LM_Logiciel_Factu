// pages/Clients.tsx
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Filter,
  X,
  FileDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Grid,
  List,
  Users,
  Building2,
  FilterX,
} from "lucide-react";
import { clientsApi, paysApi, type Client, type Pays } from "../lib/api";

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [paysList, setPaysList] = useState<Pays[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [companyFilter, setCompanyFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  useEffect(() => {
    loadClients();
    loadPays();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const data = await clientsApi.getAll();
      setClients(data);
    } catch (error) {
      console.error("Failed to load clients:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadPays = async () => {
    try {
      const data = await paysApi.getAll();
      setPaysList(data);
    } catch (error) {
      console.error("Failed to load pays:", error);
    }
  };

  const filteredClients = clients
    .filter((client) => {
      const matchesSearch =
        client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.raison_sociale &&
          client.raison_sociale
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) ||
        (client.email &&
          client.email.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCompany =
        companyFilter === "all" || client.raison_sociale === companyFilter;
      return matchesSearch && matchesCompany;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "name":
          comparison = a.nom.localeCompare(b.nom);
          break;
        case "company":
          comparison = (a.raison_sociale || "").localeCompare(
            b.raison_sociale || "",
          );
          break;
        case "email":
          comparison = (a.email || "").localeCompare(b.email || "");
          break;
        default:
          comparison = 0;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

  const companies = [
    ...new Set(clients.map((c) => c.raison_sociale).filter(Boolean)),
  ];

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortOrder === "asc" ? (
      <ArrowUp className="h-4 w-4" />
    ) : (
      <ArrowDown className="h-4 w-4" />
    );
  };

  const exportToCSV = () => {
    const headers = [
      "Nom",
      "Entreprise",
      "Email",
      "Téléphone",
      "Adresse",
      "Ville",
    ];
    const csvContent = [
      headers.join(","),
      ...filteredClients.map((client) =>
        [
          client.nom,
          client.raison_sociale || "",
          client.email || "",
          client.telephone || "",
          client.adresse || "",
          client.ville || "",
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `clients_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const clearFilters = () => {
    setSearchTerm("");
    setCompanyFilter("all");
  };

  const handleDelete = async (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce client ?")) {
      try {
        await clientsApi.delete(id);
        setClients(clients.filter((c) => c.id !== id));
      } catch (error) {
        console.error("Failed to delete client:", error);
        setClients(clients.filter((c) => c.id !== id));
      }
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setShowForm(true);
  };

  const handleSave = async (
    clientData: Omit<Client, "id" | "date_creation">,
  ) => {
    console.log("🟢 Données envoyées:", JSON.stringify(clientData, null, 2));

    try {
      if (editingClient) {
        const updated = await clientsApi.update(editingClient.id, clientData);
        setClients(
          clients.map((c) => (c.id === editingClient.id ? updated : c)),
        );
      } else {
        const created = await clientsApi.create(clientData);
        setClients([...clients, created]);
      }
      setShowForm(false);
      setEditingClient(null);
    } catch (error: any) {
      console.error("Failed to save client:", error);
      console.log("🔴 Response data:", error.response?.data);
      console.log("🔴 Status:", error.response?.status);

      const errorMessage = error.response?.data?.message;
      if (Array.isArray(errorMessage)) {
        alert("Erreur: " + errorMessage.join(", "));
      } else if (errorMessage) {
        alert("Erreur: " + errorMessage);
      } else {
        alert("Erreur lors de la sauvegarde du client");
      }

      if (editingClient) {
        setClients(
          clients.map((c) =>
            c.id === editingClient.id
              ? {
                  ...clientData,
                  id: editingClient.id,
                  date_creation: editingClient.date_creation,
                }
              : c,
          ),
        );
      } else {
        setClients([
          ...clients,
          {
            ...clientData,
            id: Date.now(),
            date_creation: new Date().toISOString(),
          },
        ]);
      }
      setShowForm(false);
      setEditingClient(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Clients
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gérez vos clients
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setEditingClient(null);
              setShowForm(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouveau client
          </Button>
          <Button variant="outline" onClick={exportToCSV}>
            <FileDown className="h-4 w-4 mr-2" />
            Exporter CSV
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}
            title={viewMode === "list" ? "Vue grille" : "Vue liste"}
          >
            {viewMode === "list" ? (
              <Grid className="h-4 w-4" />
            ) : (
              <List className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Total clients */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Total clients
            </CardTitle>
            <Users className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {clients.length}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Tous les clients
            </p>
          </CardContent>
        </Card>

        {/* Entreprises */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Entreprises
            </CardTitle>
            <Building2 className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {companies.length}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Entreprises distinctes
            </p>
          </CardContent>
        </Card>

        {/* ✅ Résultats (anciennement "Nouveaux") */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Résultats
            </CardTitle>
            <FilterX className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {filteredClients.length}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {searchTerm || companyFilter !== "all"
                ? `Filtrés${searchTerm ? ` : "${searchTerm}"` : ""}`
                : "Tous les clients"}
            </p>
          </CardContent>
        </Card>
      </div>

      {(searchTerm || companyFilter !== "all") && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Filtres actifs
          </span>
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Effacer tout
          </Button>
        </div>
      )}

      {showForm && (
        <ClientForm
          client={editingClient}
          paysList={paysList}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingClient(null);
          }}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Liste des clients</CardTitle>
          <CardDescription>
            {filteredClients.length} client
            {filteredClients.length !== 1 ? "s" : ""}
            {searchTerm && ` - Recherche : "${searchTerm}"`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtres avancés
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("name")}
                  className={
                    sortBy === "name" ? "bg-gray-100 dark:bg-gray-800" : ""
                  }
                >
                  Nom {getSortIcon("name")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("company")}
                  className={
                    sortBy === "company" ? "bg-gray-100 dark:bg-gray-800" : ""
                  }
                >
                  Entreprise {getSortIcon("company")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("email")}
                  className={
                    sortBy === "email" ? "bg-gray-100 dark:bg-gray-800" : ""
                  }
                >
                  Email {getSortIcon("email")}
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <Input
                  placeholder="Rechercher un client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
              >
                <option value="all">Toutes les entreprises</option>
                {companies.map((company) => (
                  <option key={company} value={company}>
                    {company}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Chargement...
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Aucun client trouvé
            </div>
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3"
                  : "space-y-4"
              }
            >
              {filteredClients.map((client) => (
                <div
                  key={client.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                        {client.nom}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {client.type === "entreprise"
                          ? client.raison_sociale
                          : ""}
                      </p>
                      <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {client.email}
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {client.telephone}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {client.adresse}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(client)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(client.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// CLIENT FORM - SIRET ET MATRICULE FISCAL VISIBLES POUR TOUS
// ============================================

function ClientForm({
  client,
  paysList,
  onSave,
  onCancel,
}: {
  client: Client | null;
  paysList: Pays[];
  onSave: (data: Omit<Client, "id" | "date_creation">) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<
    Omit<Client, "id" | "date_creation">
  >({
    nom: client?.nom || "",
    prenom: client?.prenom || "",
    email: client?.email || "",
    telephone: client?.telephone || "",
    adresse: client?.adresse || "",
    code_postal: client?.code_postal || "",
    ville: client?.ville || "",
    type: client?.type || "particulier",
    siret: client?.siret || "",
    matricule_fiscal: client?.matricule_fiscal || "",
    raison_sociale: client?.raison_sociale || "",
    note: client?.note || "",
    pays_id: client?.pays_id || 1,
    adresse_legale: client?.adresse_legale || "",
  });

  const isEntreprise = formData.type === "entreprise";

  const sanitizeForApi = (
    data: Omit<Client, "id" | "date_creation">,
  ): Omit<Client, "id" | "date_creation"> => {
    const optionalStringFields: (keyof typeof data)[] = [
      "prenom",
      "email",
      "telephone",
      "adresse",
      "code_postal",
      "ville",
      "siret",
      "matricule_fiscal",
      "raison_sociale",
      "note",
      "adresse_legale",
    ];

    const cleaned: any = { ...data };
    for (const field of optionalStringFields) {
      if (cleaned[field] === "") {
        cleaned[field] = undefined;
      }
    }
    return cleaned;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sanitizedData = sanitizeForApi(formData);
    console.log(
      "🟢 Données nettoyées envoyées:",
      JSON.stringify(sanitizedData, null, 2),
    );
    onSave(sanitizedData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {client ? "Modifier le client" : "Nouveau client"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Nom */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {isEntreprise ? "Nom commercial" : "Nom"}{" "}
                <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.nom}
                onChange={(e) =>
                  setFormData({ ...formData, nom: e.target.value })
                }
                required
              />
            </div>

            {/* Prénom - UNIQUEMENT pour Particulier */}
            {!isEntreprise && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Prénom
                </label>
                <Input
                  value={formData.prenom || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, prenom: e.target.value })
                  }
                />
              </div>
            )}

            {/* Type */}
            <div
              className={`space-y-2 ${!isEntreprise ? "md:col-span-1" : ""}`}
            >
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Type <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.type}
                onChange={(e) => {
                  const newType = e.target.value as
                    | "particulier"
                    | "entreprise";
                  setFormData({
                    ...formData,
                    type: newType,
                    raison_sociale:
                      newType === "particulier" ? "" : formData.raison_sociale,
                  });
                }}
              >
                <option value="particulier">Particulier</option>
                <option value="entreprise">Entreprise</option>
              </Select>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Email
              </label>
              <Input
                type="email"
                value={formData.email || ""}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>

            {/* Téléphone */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Téléphone
              </label>
              <Input
                value={formData.telephone || ""}
                onChange={(e) =>
                  setFormData({ ...formData, telephone: e.target.value })
                }
                placeholder="+33612345678"
              />
              <p className="text-xs text-gray-400">
                Format international requis (ex: +33612345678)
              </p>
            </div>

            {/* Adresse */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Adresse
              </label>
              <Input
                value={formData.adresse || ""}
                onChange={(e) =>
                  setFormData({ ...formData, adresse: e.target.value })
                }
              />
            </div>

            {/* Adresse légale */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Adresse légale
              </label>
              <Input
                value={formData.adresse_legale || ""}
                onChange={(e) =>
                  setFormData({ ...formData, adresse_legale: e.target.value })
                }
              />
            </div>

            {/* Code postal */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Code postal
              </label>
              <Input
                value={formData.code_postal || ""}
                onChange={(e) =>
                  setFormData({ ...formData, code_postal: e.target.value })
                }
              />
            </div>

            {/* Ville */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Ville
              </label>
              <Input
                value={formData.ville || ""}
                onChange={(e) =>
                  setFormData({ ...formData, ville: e.target.value })
                }
              />
            </div>

            {/* Pays */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Pays <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.pays_id}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    pays_id: parseInt(e.target.value),
                  })
                }
              >
                {paysList.map((pays) => (
                  <option key={pays.id} value={pays.id}>
                    {pays.nom}
                  </option>
                ))}
              </Select>
            </div>

            {/* Raison sociale - UNIQUEMENT pour Entreprise */}
            {isEntreprise && (
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Raison sociale
                </label>
                <Input
                  value={formData.raison_sociale || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      raison_sociale: e.target.value,
                    })
                  }
                />
              </div>
            )}

            {/* SIRET - TOUJOURS visible */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                SIRET
              </label>
              <Input
                value={formData.siret || ""}
                onChange={(e) =>
                  setFormData({ ...formData, siret: e.target.value })
                }
                maxLength={14}
              />
              <p className="text-xs text-gray-400">
                Exactement 14 caractères si renseigné
              </p>
            </div>

            {/* Matricule fiscal - TOUJOURS visible */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Matricule fiscal
              </label>
              <Input
                value={formData.matricule_fiscal || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    matricule_fiscal: e.target.value,
                  })
                }
              />
            </div>

            {/* Note */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Note
              </label>
              <Input
                value={formData.note || ""}
                onChange={(e) =>
                  setFormData({ ...formData, note: e.target.value })
                }
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
            <Button type="submit">{client ? "Modifier" : "Créer"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
