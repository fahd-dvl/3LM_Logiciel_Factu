import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Plus, Trash2, Save, ArrowLeft } from "lucide-react";
import { formatCurrency } from "../lib/utils";
import {
  quotesApi,
  clientsApi,
  paysApi,
  Client,
  DevisLignePayload,
} from "../lib/api";

// Un devis n'accepte que PRODUIT ou SERVICE (REMISE réservée aux factures)
type TypeLigneDevis = "PRODUIT" | "SERVICE";

// Local interface for form lines
interface FormQuoteLine {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  tva: number;
  typeLigne: TypeLigneDevis;
}

const nouvelleLigneVide = (): FormQuoteLine => ({
  id: crypto.randomUUID(),
  description: "",
  quantity: 1,
  unitPrice: 0,
  tva: 20,
  typeLigne: "PRODUIT",
});

// Arrondi "ligne par ligne" pour matcher le comportement du CalculService backend
const arrondir2 = (n: number) => Math.round(n * 100) / 100;

export default function QuoteForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    client: "",
    date: new Date().toISOString().split("T")[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    notes: "",
  });

  const [lines, setLines] = useState<FormQuoteLine[]>([nouvelleLigneVide()]);

  const [clients, setClients] = useState<Client[]>([]);

  // Pays/devise dérivés du client sélectionné, jamais figés en dur
  const [paysId, setPaysId] = useState<number | null>(null);
  const [devise, setDevise] = useState<string>("");

  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      await loadClients();
      if (isEditing && id) {
        await loadQuote(id);
      }
      setLoading(false);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditing]);

  const loadClients = async () => {
    try {
      const data = await clientsApi.getAll();
      setClients(data);
    } catch (err) {
      console.error("Failed to load clients:", err);
      setError("Impossible de charger la liste des clients.");
    }
  };

  const loadQuote = async (quoteId: string) => {
    try {
      const quote = await quotesApi.getById(parseInt(quoteId));

      setFormData({
        client: quote.client_id.toString(),
        date: quote.date_creation
          ? quote.date_creation.split("T")[0]
          : new Date().toISOString().split("T")[0],
        validUntil: quote.date_validite.split("T")[0],
        notes: "",
      });

      setPaysId(quote.pays_id);
      setDevise(quote.devise);

      const lignesExistantes = quote.devis_ligne ?? [];
      if (lignesExistantes.length > 0) {
        setLines(
          lignesExistantes.map((l) => ({
            id: l.id.toString(),
            description: l.description,
            quantity: Number(l.quantite),
            unitPrice: Number(l.prix_unitaire_ht),
            tva: Number(l.taux_tva),
            // Sécurité : si une ligne REMISE existait déjà en base (données
            // historiques), on la ramène à PRODUIT plutôt que de planter -
            // l'utilisateur pourra corriger la ligne manuellement.
            typeLigne: l.type_ligne === "SERVICE" ? "SERVICE" : "PRODUIT",
          })),
        );
      }
    } catch (err) {
      console.error("Failed to load quote:", err);
      setError("Impossible de charger ce devis.");
    }
  };

  // Quand le client change, on récupère son pays et la devise associée
  const handleClientChange = async (clientId: string) => {
    setFormData({ ...formData, client: clientId });

    const client = clients.find((c) => c.id.toString() === clientId);
    if (!client) {
      setPaysId(null);
      setDevise("");
      return;
    }

    setPaysId(client.pays_id);
    try {
      const pays = await paysApi.getById(client.pays_id);
      setDevise(pays.devise);
    } catch (err) {
      console.error("Failed to load pays for client:", err);
      setDevise("");
    }
  };

  const addLine = () => {
    setLines([...lines, nouvelleLigneVide()]);
  };

  const removeLine = (id: string) => {
    setLines(lines.filter((line) => line.id !== id));
  };

  const updateLine = (
    id: string,
    field: keyof FormQuoteLine,
    value: string | number,
  ) => {
    setLines(
      lines.map((line) =>
        line.id === id ? { ...line, [field]: value } : line,
      ),
    );
  };

  const calculateSubtotal = () => {
    return lines.reduce(
      (sum, line) => sum + arrondir2(line.quantity * line.unitPrice),
      0,
    );
  };

  const calculateTVA = () => {
    return lines.reduce((sum, line) => {
      const ht = arrondir2(line.quantity * line.unitPrice);
      return sum + arrondir2((ht * line.tva) / 100);
    }, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTVA();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.client) {
      setError("Veuillez sélectionner un client.");
      return;
    }
    if (paysId === null) {
      setError("Impossible de déterminer le pays du client sélectionné.");
      return;
    }
    if (!devise) {
      setError("Impossible de déterminer la devise à utiliser pour ce client.");
      return;
    }
    if (lines.some((line) => line.unitPrice < 0)) {
      setError("Le prix unitaire doit être positif ou nul sur un devis.");
      return;
    }
    if (lines.some((line) => !line.description.trim())) {
      setError("Chaque ligne doit avoir une description.");
      return;
    }

    const lignes: DevisLignePayload[] = lines.map((line) => ({
      description: line.description,
      quantite: line.quantity,
      prix_unitaire_ht: line.unitPrice,
      taux_tva: line.tva,
      type_ligne: line.typeLigne,
    }));

    setSubmitting(true);
    try {
      if (isEditing && id) {
        await quotesApi.update(parseInt(id), {
          client_id: parseInt(formData.client),
          pays_id: paysId,
          date_validite: formData.validUntil,
          devise,
          lignes,
        });
      } else {
        await quotesApi.create({
          client_id: parseInt(formData.client),
          pays_id: paysId,
          date_validite: formData.validUntil,
          devise,
          lignes,
        });
      }
      navigate("/quotes");
    } catch (err) {
      console.error("Failed to save quote:", err);
      setError("Échec de l'enregistrement du devis. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-gray-500">Chargement du devis...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/quotes")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditing ? "Modifier le devis" : "Nouveau devis"}
            </h1>
            <p className="text-gray-500 mt-1">
              {isEditing
                ? "Modifiez les détails du devis"
                : "Créez un nouveau devis"}
            </p>
          </div>
        </div>
        <Button onClick={handleSubmit} disabled={submitting}>
          <Save className="h-4 w-4 mr-2" />
          Enregistrer
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informations générales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="client">Client</Label>
                    <select
                      id="client"
                      value={formData.client}
                      onChange={(e) => handleClientChange(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Sélectionner un client</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.nom}{" "}
                          {client.prenom ? `- ${client.prenom}` : ""}{" "}
                          {client.raison_sociale
                            ? `(${client.raison_sociale})`
                            : ""}
                        </option>
                      ))}
                    </select>
                    {formData.client && devise && (
                      <p className="text-xs text-gray-500">
                        Devise appliquée : {devise}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Date du devis</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                      required
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="validUntil">Valide jusqu'au</Label>
                    <Input
                      id="validUntil"
                      type="date"
                      value={formData.validUntil}
                      onChange={(e) =>
                        setFormData({ ...formData, validUntil: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Input
                      id="notes"
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      placeholder="Notes ou conditions particulières..."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lignes du devis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {lines.map((line) => (
                    <div
                      key={line.id}
                      className="border rounded-lg p-4 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="grid gap-4 flex-1 md:grid-cols-5">
                          <div className="space-y-2 md:col-span-2">
                            <Label>Description</Label>
                            <Input
                              value={line.description}
                              onChange={(e) =>
                                updateLine(
                                  line.id,
                                  "description",
                                  e.target.value,
                                )
                              }
                              placeholder="Description du produit/service"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Type</Label>
                            <select
                              value={line.typeLigne}
                              onChange={(e) =>
                                updateLine(line.id, "typeLigne", e.target.value)
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="PRODUIT">Produit</option>
                              <option value="SERVICE">Service</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label>Quantité</Label>
                            <Input
                              type="number"
                              min="1"
                              value={line.quantity}
                              onChange={(e) =>
                                updateLine(
                                  line.id,
                                  "quantity",
                                  parseFloat(e.target.value) || 1,
                                )
                              }
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Prix unitaire HT</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={line.unitPrice}
                              onChange={(e) =>
                                updateLine(
                                  line.id,
                                  "unitPrice",
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              required
                            />
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeLine(line.id)}
                          disabled={lines.length === 1}
                          className="ml-2"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                      <div className="space-y-2 max-w-[160px]">
                        <Label>TVA (%)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          value={line.tva}
                          onChange={(e) =>
                            updateLine(
                              line.id,
                              "tva",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          required
                        />
                      </div>
                      <div className="text-right text-sm text-gray-600">
                        Total ligne:{" "}
                        {formatCurrency(
                          arrondir2(line.quantity * line.unitPrice) +
                            arrondir2(
                              (arrondir2(line.quantity * line.unitPrice) *
                                line.tva) /
                                100,
                            ),
                        )}
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addLine}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une ligne
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Récapitulatif</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Sous-total HT</span>
                  <span className="font-medium">
                    {formatCurrency(calculateSubtotal())}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">TVA</span>
                  <span className="font-medium">
                    {formatCurrency(calculateTVA())}
                  </span>
                </div>
                <div className="border-t pt-4 flex justify-between">
                  <span className="font-semibold text-lg">Total TTC</span>
                  <span className="font-bold text-2xl text-blue-600">
                    {formatCurrency(calculateTotal())}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button type="submit" className="w-full" disabled={submitting}>
                  <Save className="h-4 w-4 mr-2" />
                  {submitting ? "Enregistrement..." : "Enregistrer le devis"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/quotes")}
                >
                  Annuler
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
