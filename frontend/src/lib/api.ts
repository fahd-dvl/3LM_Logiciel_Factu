// lib/api.ts
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let refreshSubscribers: Array<() => void> = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/") &&
      !originalRequest.url?.includes("/api/chat")
    ) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshSubscribers.push(() => resolve(api(originalRequest)));
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await api.post("/auth/refresh");
        isRefreshing = false;
        refreshSubscribers.forEach((cb) => cb());
        refreshSubscribers = [];
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        refreshSubscribers = [];
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

// ============================================
// INTERFACES
// ============================================

export interface Client {
  id: number;
  nom: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  code_postal?: string;
  ville?: string;
  type: "particulier" | "entreprise";
  siret?: string;
  matricule_fiscal?: string;
  raison_sociale?: string;
  note?: string;
  date_creation: string;
  pays_id: number;
  adresse_legale?: string;
}

export interface Product {
  id: number;
  nom: string;
  description?: string;
  prix_unitaire_ht: number;
  unite: string;
  taux_tva_id: number; // ✅ CHANGÉ
  type: "PRODUIT" | "SERVICE";
  actif: boolean;
  categorie_id?: number;
}

export interface Invoice {
  id: number;
  numero: string;
  client_id: number;
  client?: Client;
  statut:
    | "BROUILLON"
    | "ENVOYEE"
    | "PARTIELLEMENT_PAYEE"
    | "PAYEE"
    | "EN_RETARD"
    | "ANNULEE";
  date_emission: string;
  date_echeance: string;
  total_ht: number;
  total_tva: number;
  total_ttc: number;
  devise: string;
  mode_paiement?: "CB" | "CHEQUE" | "VIREMENT" | "ESPECES";
  est_acompte: boolean;
  lines?: InvoiceLine[];
}

export interface InvoiceLine {
  id: number;
  facture_id: number;
  produit_id?: number;
  description: string;
  quantite: number;
  prix_unitaire_ht: number;
  taux_tva: number;
  montant_ht: number;
  montant_tva: number;
  montant_ttc: number;
  type_ligne: "PRODUIT" | "SERVICE" | "REMISE";
}

export interface QuoteLine {
  id: number;
  devis_id: number;
  produit_id?: number;
  description: string;
  quantite: number;
  prix_unitaire_ht: number;
  taux_tva: number;
  montant_ht: number;
  montant_tva: number;
  montant_ttc: number;
  type_ligne: "PRODUIT" | "SERVICE" | "REMISE";
}

export interface Quote {
  id: number;
  numero: string;
  client_id: number;
  client?: Client;
  statut: "BROUILLON" | "ENVOYE" | "ACCEPTE" | "REFUSE" | "EXPIRE" | "CONVERTI";
  date_creation: string;
  date_validite: string;
  pays_id: number;
  total_ht: number;
  total_tva: number;
  total_ttc: number;
  devise: string;
  // Le backend (DevisService.findOne) inclut la relation Prisma sous le nom
  // `devis_ligne`, pas `lines`. On garde ce nom pour matcher la vraie forme
  // de la réponse API.
  devis_ligne?: QuoteLine[];
}

export interface Pays {
  id: number;
  nom: string;
  code_iso: string;
  devise: string;
}

export interface Entreprise {
  id: number;
  utilisateur_id: number;
  type_structure: string;
  nom_entreprise?: string;
  matricule_fiscal: string;
  siret?: string;
  adresse: string;
  code_postal?: string;
  ville: string;
  pays_id: number;
  representant_legal?: string;
  logo_url?: string;
}

export interface Categorie {
  id: number;
  nom: string;
  description?: string;
  parent_id?: number | null;
}

export interface TauxTva {
  id: number;
  pays_id: number;
  taux: number;
  libelle: string;
  date_debut: string;
  date_fin?: string | null;
}

// ============================================
// PAYLOADS DEVIS (forme exacte attendue par CreateDevisDto / UpdateDevisDto)
// ============================================

export interface DevisLignePayload {
  description: string;
  quantite: number;
  prix_unitaire_ht: number;
  taux_tva: number;
  type_ligne: "PRODUIT" | "SERVICE" | "REMISE";
  produit_id?: number;
}

export interface CreateDevisPayload {
  client_id: number;
  pays_id: number;
  date_validite: string;
  devise: string;
  lignes: DevisLignePayload[];
}

export type UpdateDevisPayload = Partial<CreateDevisPayload>;

// ============================================
// CLIENTS API
// ============================================

export const clientsApi = {
  getAll: async () => {
    const response = await api.get<Client[]>("/client");
    return response.data;
  },
  getById: async (id: number) => {
    const response = await api.get<Client>(`/client/${id}`);
    return response.data;
  },
  create: async (client: Omit<Client, "id" | "date_creation">) => {
    const response = await api.post<Client>("/client", client);
    return response.data;
  },
  update: async (id: number, client: Omit<Client, "id" | "date_creation">) => {
    const response = await api.put<Client>(`/client/${id}`, client);
    return response.data;
  },
  delete: async (id: number) => {
    await api.delete(`/client/${id}`);
  },
};

// ============================================
// PRODUCTS API
// ============================================

export const productsApi = {
  getAll: async () => {
    const response = await api.get<Product[]>("/produit-service");
    return response.data;
  },
  getById: async (id: number) => {
    const response = await api.get<Product>(`/produit-service/${id}`);
    return response.data;
  },
  create: async (product: Omit<Product, "id">) => {
    const response = await api.post<Product>("/produit-service", product);
    return response.data;
  },
  update: async (id: number, product: Omit<Product, "id">) => {
    const response = await api.put<Product>(`/produit-service/${id}`, product);
    return response.data;
  },
  delete: async (id: number) => {
    await api.delete(`/produit-service/${id}`);
  },
};

// ============================================
// INVOICES API
// ============================================

export const invoicesApi = {
  getAll: async () => {
    const response = await api.get<Invoice[]>("/factures");
    return response.data;
  },
  getById: async (id: number) => {
    const response = await api.get<Invoice>(`/factures/${id}`);
    return response.data;
  },
  create: async (invoice: Omit<Invoice, "id">) => {
    const response = await api.post<Invoice>("/factures", invoice);
    return response.data;
  },
  update: async (id: number, invoice: Omit<Invoice, "id">) => {
    const response = await api.put<Invoice>(`/factures/${id}`, invoice);
    return response.data;
  },
  delete: async (id: number) => {
    await api.delete(`/factures/${id}`);
  },
  changeStatus: async (id: number, statut: Invoice["statut"]) => {
    const response = await api.patch<Invoice>(`/factures/${id}/statut`, {
      statut,
    });
    return response.data;
  },
};

// ============================================
// QUOTES API
// ============================================

export const quotesApi = {
  getAll: async () => {
    const response = await api.get<Quote[]>("/devis");
    return response.data;
  },
  getById: async (id: number) => {
    const response = await api.get<Quote>(`/devis/${id}`);
    return response.data;
  },
  create: async (quote: CreateDevisPayload) => {
    const response = await api.post<Quote>("/devis", quote);
    return response.data;
  },
  update: async (id: number, quote: UpdateDevisPayload) => {
    const response = await api.put<Quote>(`/devis/${id}`, quote);
    return response.data;
  },
  delete: async (id: number) => {
    await api.delete(`/devis/${id}`);
  },
  changeStatus: async (id: number, statut: Quote["statut"]) => {
    const response = await api.patch<Quote>(`/devis/${id}/statut`, { statut });
    return response.data;
  },
  convertToInvoice: async (devisId: number, delaiPaiementJours?: number) => {
    const response = await api.post<Invoice>(
      `/factures/depuis-devis/${devisId}`,
      { delai_paiement_jours: delaiPaiementJours },
    );
    return response.data;
  },
};

// ============================================
// CHAT API
// ============================================

export const chatApi = {
  sendMessage: async (message: string) => {
    const response = await api.post<{ response: string }>("/api/chat", {
      message,
    });
    return response.data;
  },
};

// ============================================
// DASHBOARD API
// ============================================

export const dashboardApi = {
  getStats: async () => {
    const response = await api.get("/dashboard/stats");
    return response.data;
  },
  getTopClients: async () => {
    const response = await api.get("/dashboard/top-clients");
    return response.data;
  },
  getRecentInvoices: async () => {
    const response = await api.get("/dashboard/recent-invoices");
    return response.data;
  },
};

// ============================================
// VAT RULES API
// ============================================

export const vatApi = {
  getCountryRules: async (country: string) => {
    const response = await api.get(`/regles-pays/${country}`);
    return response.data;
  },
};

// ============================================
// PAYS API
// ============================================

export const paysApi = {
  getAll: async () => {
    const response = await api.get<Pays[]>("/pays");
    return response.data;
  },
  getById: async (id: number) => {
    const response = await api.get<Pays>(`/pays/${id}`);
    return response.data;
  },
};

// ============================================
// ENTREPRISE API
// ============================================

export const entreprisesApi = {
  create: async (data: {
    type_structure: string;
    nom_entreprise?: string;
    matricule_fiscal: string;
    siret?: string;
    adresse: string;
    code_postal?: string;
    ville: string;
    pays_id: number;
    representant_legal?: string;
    logo_url?: string;
  }) => {
    const response = await api.post("/entreprises", data);
    return response.data;
  },
  getMesEntreprises: async () => {
    const response = await api.get("/entreprises/mes-entreprises");
    return response.data;
  },
  getById: async (id: number) => {
    const response = await api.get(`/entreprises/${id}`);
    return response.data;
  },
  update: async (
    id: number,
    data: {
      type_structure?: string;
      nom_entreprise?: string;
      matricule_fiscal?: string;
      siret?: string;
      adresse?: string;
      code_postal?: string;
      ville?: string;
      pays_id?: number;
      representant_legal?: string;
      logo_url?: string;
    },
  ) => {
    const response = await api.put(`/entreprises/${id}`, data);
    return response.data;
  },
};

// ============================================
// CATEGORIES API
// ============================================

export const categoriesApi = {
  getAll: async () => {
    const response = await api.get<Categorie[]>("/categories");
    return response.data;
  },
  getRoot: async () => {
    const response = await api.get<Categorie[]>("/categories/root");
    return response.data;
  },
  getChildren: async (id: number) => {
    const response = await api.get<Categorie[]>(`/categories/${id}/children`);
    return response.data;
  },
  getById: async (id: number) => {
    const response = await api.get<Categorie>(`/categories/${id}`);
    return response.data;
  },
  create: async (data: {
    nom: string;
    description?: string;
    parent_id?: number;
  }) => {
    const response = await api.post<Categorie>("/categories", data);
    return response.data;
  },
  update: async (
    id: number,
    data: { nom?: string; description?: string; parent_id?: number },
  ) => {
    const response = await api.put<Categorie>(`/categories/${id}`, data);
    return response.data;
  },
  delete: async (id: number) => {
    await api.delete(`/categories/${id}`);
  },
};

// ============================================
// TAUX TVA API
// ============================================

export const tauxTvaApi = {
  getAll: async () => {
    const response = await api.get<TauxTva[]>("/taux-tva");
    return response.data;
  },
  getByPays: async (paysId: number) => {
    const response = await api.get<TauxTva[]>(`/taux-tva/pays/${paysId}`);
    return response.data;
  },
  getByEntreprise: async () => {
    const response = await api.get<TauxTva[]>("/taux-tva/entreprise");
    return response.data;
  },
  getById: async (id: number) => {
    const response = await api.get<TauxTva>(`/taux-tva/${id}`);
    return response.data;
  },
  getDefaultByPays: async (paysId: number) => {
    const response = await api.get<TauxTva>(`/taux-tva/pays/${paysId}/default`);
    return response.data;
  },
};

// ============================================
// AUTH API
// ============================================

export const authApi = {
  register: async (data: {
    email: string;
    password: string;
    prenom?: string;
    nom?: string;
    telephone?: string;
  }) => {
    const response = await api.post("/auth/register", data);
    return response.data;
  },
  login: async (email: string, password: string) => {
    const response = await api.post("/auth/login", { email, password });
    return response.data;
  },
  selectEnterprise: async (entrepriseId: number) => {
    const response = await api.post("/auth/choisir-entreprise", {
      entreprise_id: entrepriseId,
    });
    return response.data;
  },
  logout: async () => {
    const response = await api.post("/auth/logout");
    return response.data;
  },
  refresh: async () => {
    const response = await api.post("/auth/refresh");
    return response.data;
  },
  me: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },
  updateProfile: async (data: {
    prenom?: string;
    nom?: string;
    telephone?: string;
  }) => {
    const response = await api.put("/auth/profil", data);
    return response.data;
  },
};

export default api;
