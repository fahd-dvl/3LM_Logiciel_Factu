// pages/ProfilePage.tsx
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
  UserCircle,
  Loader2,
  AlertCircle,
  CheckCircle,
  Mail,
  Phone,
  User,
  Save,
  ArrowLeft,
} from "lucide-react";

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    prenom: "",
    nom: "",
    telephone: "",
    email: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        prenom: user.prenom || "",
        nom: user.nom || "",
        telephone: user.telephone || "",
        email: user.email || "",
      });
      setLoading(false);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);

    // ✅ Aucun formatage - envoi tel quel
    const dataToSend = {
      prenom: formData.prenom.trim() || undefined,
      nom: formData.nom.trim() || undefined,
      telephone: formData.telephone.trim() || undefined,
    };

    console.log("🟢 Données envoyées:", dataToSend);

    try {
      await updateProfile(dataToSend);

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      console.log("🔴 Erreur:", err.response?.data);
      setError(err.response?.data?.message || "Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: string) => {
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
            Modifier mon profil
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Gérez vos informations personnelles
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
              <UserCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-gray-900 dark:text-gray-100">
                Informations personnelles
              </CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400">
                {user?.email}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email (non modifiable) */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                Email
              </label>
              <Input
                type="email"
                value={formData.email}
                disabled
                className="bg-gray-100 dark:bg-gray-800/50 cursor-not-allowed"
              />
              <p className="text-xs text-gray-400">
                L'email ne peut pas être modifié
              </p>
            </div>

            {/* Prénom */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                Prénom
              </label>
              <Input
                type="text"
                value={formData.prenom}
                onChange={(e) => handleChange("prenom", e.target.value)}
                className="bg-white dark:bg-gray-800"
              />
            </div>

            {/* Nom */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                Nom
              </label>
              <Input
                type="text"
                value={formData.nom}
                onChange={(e) => handleChange("nom", e.target.value)}
                className="bg-white dark:bg-gray-800"
              />
            </div>

            {/* Téléphone - Sans formatage */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                Téléphone
              </label>
              <Input
                type="text"
                placeholder="0612345678"
                value={formData.telephone}
                onChange={(e) => handleChange("telephone", e.target.value)}
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
                  ✅ Profil mis à jour avec succès !
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

      <Card className="border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/10">
        <CardContent className="p-4">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            💡 <strong>Note :</strong> L'email ne peut pas être modifié car il
            est utilisé pour la connexion.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
