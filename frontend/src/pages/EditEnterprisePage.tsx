// pages/EditEnterprisePage.tsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  Loader2,
  AlertCircle,
  CheckCircle,
  Save,
  ArrowLeft,
} from "lucide-react";
import { entreprisesApi, paysApi } from "../lib/api";

interface Entreprise {
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

interface Pays {
  id: number;
  nom: string;
  code_iso: string;
  devise: string;
}

const STRUCTURE_TYPES = [
  { value: "artisan", label: "Artisan" },
  { value: "entreprise", label: "Entreprise" },
  { value: "association", label: "Association" },
  { value: "micro_entrepreneur", label: "Micro-entrepreneur" },
];

// ✅ Mapping des types pour l'affichage
const STRUCTURE_LABELS: Record<string, string> = {
  artisan: "Artisan",
  entreprise: "Entreprise",
  association: "Association",
  micro_entrepreneur: "Micro-entrepreneur",
};

export default function EditEnterprisePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [paysList, setPaysList] = useState<Pays[]>([]);

  const [formData, setFormData] = useState({
    nom_entreprise: "",
    type_structure: "entreprise",
    adresse: "",
    code_postal: "",
    ville: "",
    pays_id: 1,
    representant_legal: "",
  });

  const [readonlyData, setReadonlyData] = useState({
    siret: "",
    matricule_fiscal: "",
    type_structure: "", // ✅ Ajouté
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const pays = await paysApi.getAll();
      setPaysList(pays);

      const entreprise = await entreprisesApi.getById(parseInt(id!));

      setFormData({
        nom_entreprise: entreprise.nom_entreprise || "",
        type_structure: entreprise.type_structure || "entreprise",
        adresse: entreprise.adresse || "",
        code_postal: entreprise.code_postal || "",
        ville: entreprise.ville || "",
        pays_id: entreprise.pays_id || 1,
        representant_legal: entreprise.representant_legal || "",
      });

      setReadonlyData({
        siret: entreprise.siret || "Non renseigné",
        matricule_fiscal: entreprise.matricule_fiscal || "Non renseigné",
        type_structure: entreprise.type_structure || "Non renseigné", // ✅ Ajouté
      });
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);

    try {
      await entreprisesApi.update(parseInt(id!), {
        nom_entreprise: formData.nom_entreprise.trim() || undefined,
        // ❌ type_structure NON envoyé (non modifiable)
        adresse: formData.adresse.trim(),
        code_postal: formData.code_postal.trim() || undefined,
        ville: formData.ville.trim(),
        pays_id: formData.pays_id,
        representant_legal: formData.representant_legal.trim() || undefined,
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        navigate("/choose-enterprise");
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData({ ...formData, [field]: value });
    if (error) setError(null);
    if (success) setSuccess(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Modifier l'entreprise
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Gérez les informations de votre entreprise
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>
      </div>

      <Card className="border-gray-200 dark:border-gray-700">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-gray-900 dark:text-gray-100">
                Informations de l'entreprise
              </CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400">
                {formData.nom_entreprise || "Entreprise sans nom"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* ✅ Informations non modifiables */}
          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg mb-4 space-y-1">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Informations non modifiables
            </p>
            <p className="text-sm">
              <strong>SIRET :</strong> {readonlyData.siret}
            </p>
            <p className="text-sm">
              <strong>Matricule fiscal :</strong>{" "}
              {readonlyData.matricule_fiscal}
            </p>
            <p className="text-sm">
              <strong>Type de structure :</strong>{" "}
              {STRUCTURE_LABELS[readonlyData.type_structure] ||
                readonlyData.type_structure}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ✅ Nom de l'entreprise - MODIFIABLE */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Nom de l'entreprise
              </label>
              <Input
                type="text"
                value={formData.nom_entreprise}
                onChange={(e) => handleChange("nom_entreprise", e.target.value)}
                className="bg-white dark:bg-gray-800"
              />
            </div>

            {/* ✅ Adresse - MODIFIABLE */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Adresse
              </label>
              <Input
                type="text"
                value={formData.adresse}
                onChange={(e) => handleChange("adresse", e.target.value)}
                className="bg-white dark:bg-gray-800"
              />
            </div>

            {/* ✅ Code postal et Ville - MODIFIABLES */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Code postal
                </label>
                <Input
                  type="text"
                  value={formData.code_postal}
                  onChange={(e) => handleChange("code_postal", e.target.value)}
                  className="bg-white dark:bg-gray-800"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Ville
                </label>
                <Input
                  type="text"
                  value={formData.ville}
                  onChange={(e) => handleChange("ville", e.target.value)}
                  className="bg-white dark:bg-gray-800"
                />
              </div>
            </div>

            {/* ✅ Pays - MODIFIABLE */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Pays
              </label>
              <select
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-100"
                value={formData.pays_id}
                onChange={(e) =>
                  handleChange("pays_id", parseInt(e.target.value))
                }
              >
                {paysList.map((pays) => (
                  <option key={pays.id} value={pays.id}>
                    {pays.nom}
                  </option>
                ))}
              </select>
            </div>

            {/* ✅ Représentant légal - MODIFIABLE */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Représentant légal
              </label>
              <Input
                type="text"
                value={formData.representant_legal}
                onChange={(e) =>
                  handleChange("representant_legal", e.target.value)
                }
                className="bg-white dark:bg-gray-800"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <p className="text-sm text-green-600 dark:text-green-400">
                  ✅ Entreprise modifiée avec succès !
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={saving || success}
                className="flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Enregistrer
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                disabled={saving}
              >
                Annuler
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
