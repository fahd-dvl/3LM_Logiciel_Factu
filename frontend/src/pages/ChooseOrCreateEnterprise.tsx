// pages/ChooseOrCreateEnterprise.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Building2,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  LogOut,
} from "lucide-react";
import { entreprisesApi, paysApi } from "../lib/api";

// ✅ Interface Entreprise
interface Entreprise {
  id: number;
  utilisateur_id: number;
  type_structure:
    | "artisan"
    | "entreprise"
    | "association"
    | "micro_entrepreneur";
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

interface Pays {
  id: number;
  nom: string;
  code_iso: string;
  devise: string;
}

// ✅ Types de structure
const STRUCTURE_TYPES = [
  { value: "artisan" as const, label: "Artisan" },
  { value: "entreprise" as const, label: "Entreprise" },
  { value: "association" as const, label: "Association" },
  { value: "micro_entrepreneur" as const, label: "Micro-entrepreneur" },
];

export default function ChooseOrCreateEnterprise() {
  const { user, selectEnterprise, logout } = useAuth();
  const navigate = useNavigate();

  // États
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [paysList, setPaysList] = useState<Pays[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // États du formulaire
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState(false);

  // Formulaire
  const [formData, setFormData] = useState({
    type_structure: "entreprise" as
      | "artisan"
      | "entreprise"
      | "association"
      | "micro_entrepreneur",
    nom_entreprise: "",
    matricule_fiscal: "",
    siret: "",
    adresse: "",
    code_postal: "",
    ville: "",
    pays_id: 1,
    representant_legal: "",
  });

  // Charger les données
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Charger les pays
      const pays = await paysApi.getAll();
      setPaysList(pays);

      // Charger les entreprises de l'utilisateur
      const entreprises = await entreprisesApi.getMesEntreprises();
      setEntreprises(entreprises);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Erreur lors du chargement des données",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Sélectionner une entreprise (seul point d'entrée vers /dashboard)
  const handleSelectEnterprise = async (entrepriseId: number) => {
    try {
      await selectEnterprise(entrepriseId);
      navigate("/profile");
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur lors de la sélection");
    }
  };

  // ✅ Créer une entreprise — reste sur la page, ne sélectionne pas automatiquement
  const handleCreateEnterprise = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateSuccess(false);

    // Validations
    if (!formData.matricule_fiscal.trim()) {
      setCreateError("Le matricule fiscal est obligatoire");
      return;
    }
    if (formData.matricule_fiscal.length > 20) {
      setCreateError("Le matricule fiscal ne peut pas dépasser 20 caractères");
      return;
    }
    if (formData.siret && formData.siret.length !== 14) {
      setCreateError("Le SIRET doit contenir exactement 14 caractères");
      return;
    }
    if (!formData.adresse.trim()) {
      setCreateError("L'adresse est obligatoire");
      return;
    }
    if (!formData.ville.trim()) {
      setCreateError("La ville est obligatoire");
      return;
    }

    setIsCreating(true);

    try {
      const newEntreprise = await entreprisesApi.create({
        type_structure: formData.type_structure,
        nom_entreprise: formData.nom_entreprise.trim() || undefined,
        matricule_fiscal: formData.matricule_fiscal.trim(),
        siret: formData.siret.trim() || undefined,
        adresse: formData.adresse.trim(),
        code_postal: formData.code_postal.trim() || undefined,
        ville: formData.ville.trim(),
        pays_id: formData.pays_id,
        representant_legal: formData.representant_legal.trim() || undefined,
        logo_url: undefined,
      });

      setCreateSuccess(true);

      // Ajouter à la liste affichée immédiatement
      setEntreprises((prev) => [...prev, newEntreprise]);

      // ✅ On referme juste le formulaire et on reset — pas de sélection
      // automatique, pas de navigation. L'utilisateur reste sur la page
      // et peut créer une autre entreprise ou cliquer une carte pour y aller.
      setTimeout(() => {
        setShowCreateForm(false);
        setCreateSuccess(false);
        setFormData({
          type_structure: "entreprise",
          nom_entreprise: "",
          matricule_fiscal: "",
          siret: "",
          adresse: "",
          code_postal: "",
          ville: "",
          pays_id: 1,
          representant_legal: "",
        });
      }, 1500);
    } catch (err: any) {
      setCreateError(
        err.response?.data?.message || "Erreur lors de la création",
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleFormChange = (field: string, value: string | number) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Chargement
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-500 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl border-gray-200 dark:border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <div>
                <CardTitle className="text-2xl text-gray-900 dark:text-gray-100">
                  Choisir une entreprise
                </CardTitle>
                <CardDescription className="text-gray-500 dark:text-gray-400">
                  {entreprises.length > 0
                    ? "Sélectionnez l'entreprise sous laquelle vous souhaitez travailler"
                    : "Vous n'avez pas encore d'entreprise. Créez-en une !"}
                </CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Erreur */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Liste des entreprises */}
          {entreprises.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Vos entreprises :
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                {entreprises.map((entreprise) => (
                  <div
                    key={entreprise.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-colors cursor-pointer"
                    onClick={() => handleSelectEnterprise(entreprise.id)}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {entreprise.nom_entreprise ||
                          entreprise.matricule_fiscal}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {entreprise.siret || "SIRET non renseigné"}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {entreprise.ville}
                      </span>
                    </div>
                    <Button variant="ghost" size="sm">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bouton Créer */}
          {!showCreateForm && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowCreateForm(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Créer une nouvelle entreprise
            </Button>
          )}

          {/* Formulaire de création */}
          {showCreateForm && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  Créer une entreprise
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateForm(false)}
                  disabled={isCreating}
                >
                  ✕
                </Button>
              </div>

              <form onSubmit={handleCreateEnterprise} className="space-y-4">
                {/* Type de structure */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Type de structure <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {STRUCTURE_TYPES.map((type) => {
                      const isSelected = formData.type_structure === type.value;
                      return (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() =>
                            handleFormChange("type_structure", type.value)
                          }
                          className={`p-3 rounded-lg border-2 text-center transition-all ${
                            isSelected
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500/20"
                              : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500"
                          }`}
                          disabled={isCreating}
                        >
                          <span
                            className={`text-sm font-medium ${
                              isSelected
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {type.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {/* Nom de l'entreprise */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Nom de l'entreprise
                    </label>
                    <Input
                      value={formData.nom_entreprise}
                      onChange={(e) =>
                        handleFormChange("nom_entreprise", e.target.value)
                      }
                      className="bg-white dark:bg-gray-800"
                    />
                  </div>

                  {/* Matricule fiscal */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Matricule fiscal <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={formData.matricule_fiscal}
                      onChange={(e) =>
                        handleFormChange("matricule_fiscal", e.target.value)
                      }
                      required
                      maxLength={20}
                      className="bg-white dark:bg-gray-800"
                    />
                    <p className="text-xs text-gray-400">
                      Maximum 20 caractères
                    </p>
                  </div>

                  {/* SIRET */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      SIRET
                    </label>
                    <Input
                      value={formData.siret}
                      onChange={(e) =>
                        handleFormChange("siret", e.target.value)
                      }
                      maxLength={14}
                      className="bg-white dark:bg-gray-800"
                    />
                    <p className="text-xs text-gray-400">
                      Exactement 14 caractères
                    </p>
                  </div>

                  {/* Représentant légal */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Représentant légal
                    </label>
                    <Input
                      value={formData.representant_legal}
                      onChange={(e) =>
                        handleFormChange("representant_legal", e.target.value)
                      }
                      className="bg-white dark:bg-gray-800"
                    />
                  </div>

                  {/* Adresse */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Adresse <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={formData.adresse}
                      onChange={(e) =>
                        handleFormChange("adresse", e.target.value)
                      }
                      required
                      className="bg-white dark:bg-gray-800"
                    />
                  </div>

                  {/* Code postal */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Code postal
                    </label>
                    <Input
                      value={formData.code_postal}
                      onChange={(e) =>
                        handleFormChange("code_postal", e.target.value)
                      }
                      className="bg-white dark:bg-gray-800"
                    />
                  </div>

                  {/* Ville */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Ville <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={formData.ville}
                      onChange={(e) =>
                        handleFormChange("ville", e.target.value)
                      }
                      required
                      className="bg-white dark:bg-gray-800"
                    />
                  </div>

                  {/* Pays */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Pays
                    </label>
                    <select
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-100"
                      value={formData.pays_id}
                      onChange={(e) =>
                        handleFormChange("pays_id", parseInt(e.target.value))
                      }
                    >
                      {paysList.map((pays) => (
                        <option key={pays.id} value={pays.id}>
                          {pays.nom}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Erreur de création */}
                {createError && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {createError}
                    </p>
                  </div>
                )}

                {/* Succès de création */}
                {createSuccess && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <p className="text-sm text-green-600 dark:text-green-400">
                      ✅ Entreprise créée avec succès !
                    </p>
                  </div>
                )}

                {/* Boutons */}
                <div className="flex gap-3">
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={isCreating || createSuccess}
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Création...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Créer l'entreprise
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                    disabled={isCreating}
                  >
                    Annuler
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Message si aucune entreprise */}
          {entreprises.length === 0 && !showCreateForm && (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                Vous n'avez pas encore d'entreprise.
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Créez votre première entreprise pour commencer.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
