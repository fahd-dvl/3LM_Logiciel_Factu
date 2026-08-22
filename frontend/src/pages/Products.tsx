// pages/Products.tsx
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
import { Label } from "../components/ui/label";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  Filter,
  X,
  FileDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Grid,
  List,
  TrendingUp,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import { formatCurrency } from "../lib/utils";
import {
  productsApi,
  categoriesApi,
  tauxTvaApi,
  type Product,
} from "../lib/api";

// ============================================
// HELPERS - Calculs robustes
// ============================================

// Extraire un nombre de manière robuste
const getPriceAsNumber = (price: any): number => {
  if (typeof price === "number") {
    return isNaN(price) ? 0 : price;
  }

  if (typeof price === "string") {
    const cleaned = price.replace(",", ".");
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }

  return 0;
};

// Calculer le total des prix
const calculateTotal = (products: Product[]): number => {
  return products.reduce((sum, product) => {
    return sum + getPriceAsNumber(product.prix_unitaire_ht);
  }, 0);
};

// Calculer la moyenne des prix
const calculateAverage = (products: Product[]): number => {
  if (products.length === 0) return 0;

  const total = calculateTotal(products);
  return total / products.length;
};

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [tauxTvaList, setTauxTvaList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [unitFilter, setUnitFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");

  useEffect(() => {
    loadProducts();
    loadCategories();
    loadTauxTva();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);

      const data = await productsApi.getAll();
      setProducts(data);
    } catch (error) {
      console.error("Failed to load products:", error);
      setLoadError("Impossible de charger les produits. Réessayez plus tard.");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await categoriesApi.getAll();
      setCategories(data);
    } catch (error) {
      console.error("Failed to load categories:", error);
      setCategories([]);
    }
  };

  const loadTauxTva = async () => {
    try {
      const data = await tauxTvaApi.getByEntreprise();
      setTauxTvaList(data);
    } catch (error) {
      console.error("Failed to load taux TVA:", error);
      setTauxTvaList([]);
    }
  };

  const filteredProducts = products
    .filter((product) => {
      const matchesSearch =
        product.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description &&
          product.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesUnit = unitFilter === "all" || product.unite === unitFilter;

      return matchesSearch && matchesUnit;
    })
    .sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "name":
          comparison = a.nom.localeCompare(b.nom);
          break;

        case "price":
          comparison =
            getPriceAsNumber(a.prix_unitaire_ht) -
            getPriceAsNumber(b.prix_unitaire_ht);
          break;

        case "unit":
          comparison = a.unite.localeCompare(b.unite);
          break;

        default:
          comparison = 0;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

  const units = [...new Set(products.map((p) => p.unite))];

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="h-4 w-4" />;
    }

    return sortOrder === "asc" ? (
      <ArrowUp className="h-4 w-4" />
    ) : (
      <ArrowDown className="h-4 w-4" />
    );
  };

  const exportToCSV = () => {
    const headers = ["Nom", "Description", "Prix HT", "Unité", "TVA"];

    const csvContent = [
      headers.join(","),
      ...filteredProducts.map((product) =>
        [
          product.nom,
          product.description || "",
          getPriceAsNumber(product.prix_unitaire_ht).toFixed(2),
          product.unite,
          product.taux_tva_id,
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `produits_${new Date().toISOString().split("T")[0]}.csv`;

    link.click();
  };

  const clearFilters = () => {
    setSearchTerm("");
    setUnitFilter("all");
  };

  const handleDelete = async (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) {
      try {
        await productsApi.delete(id);

        setProducts(products.filter((p) => p.id !== id));
      } catch (error) {
        console.error("Failed to delete product:", error);

        setLoadError("Échec de la suppression du produit. Réessayez.");
      }
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleSave = async (productData: Omit<Product, "id">) => {
    try {
      if (editingProduct) {
        const updated = await productsApi.update(
          editingProduct.id,
          productData,
        );

        setProducts(
          products.map((p) => (p.id === editingProduct.id ? updated : p)),
        );
      } else {
        const created = await productsApi.create(productData);

        setProducts([...products, created]);
      }

      setShowForm(false);
      setEditingProduct(null);
    } catch (error) {
      console.error("Failed to save product:", error);

      setLoadError(
        "Échec de l'enregistrement du produit. Vérifiez les champs et réessayez.",
      );
    }
  };

  const totalPrices = calculateTotal(products);
  const averagePrice = calculateAverage(products);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Produits & Services
          </h1>

          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gérez vos produits et services
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => {
              setEditingProduct(null);
              setShowForm(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouveau produit
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

      {loadError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />

          <p className="text-sm text-red-600 dark:text-red-400">{loadError}</p>

          <Button
            variant="ghost"
            size="sm"
            className="ml-auto"
            onClick={() => setLoadError(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Total produits */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Total produits
            </CardTitle>

            <Package className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {products.length}
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Produits & services
            </p>
          </CardContent>
        </Card>

        {/* Valeur moyenne */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Valeur moyenne
            </CardTitle>

            <DollarSign className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {products.length > 0
                ? formatCurrency(averagePrice)
                : formatCurrency(0)}
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Prix moyen HT • {products.length} produit
              {products.length !== 1 ? "s" : ""}
            </p>

            <div className="mt-2 text-xs text-gray-400">
              Total: {formatCurrency(totalPrices)}
            </div>
          </CardContent>
        </Card>

        {/* Types d'unités */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Types d'unités
            </CardTitle>

            <TrendingUp className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {units.length}
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Unités différentes
            </p>
          </CardContent>
        </Card>
      </div>

      {(searchTerm || unitFilter !== "all") && (
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
        <ProductForm
          product={editingProduct}
          categories={categories}
          tauxTvaList={tauxTvaList}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingProduct(null);
          }}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Liste des produits</CardTitle>

          <CardDescription>
            {filteredProducts.length} produit
            {filteredProducts.length !== 1 ? "s" : ""}
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
                  onClick={() => handleSort("price")}
                  className={
                    sortBy === "price" ? "bg-gray-100 dark:bg-gray-800" : ""
                  }
                >
                  Prix {getSortIcon("price")}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("unit")}
                  className={
                    sortBy === "unit" ? "bg-gray-100 dark:bg-gray-800" : ""
                  }
                >
                  Unité {getSortIcon("unit")}
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />

                <Input
                  placeholder="Rechercher un produit..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select
                value={unitFilter}
                onChange={(e) => setUnitFilter(e.target.value)}
              >
                <option value="all">Toutes les unités</option>

                {units.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div
            className={
              viewMode === "grid"
                ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3"
                : "space-y-4"
            }
          >
            {loading ? (
              <div
                className={`${
                  viewMode === "grid" ? "col-span-full" : ""
                } text-center py-8 text-gray-500 dark:text-gray-400`}
              >
                Chargement...
              </div>
            ) : (
              filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />

                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {product.nom}
                      </h3>
                    </div>

                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(product)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(product.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {product.description || ""}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(
                        getPriceAsNumber(product.prix_unitaire_ht),
                      )}
                    </span>

                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      / {product.unite}
                    </span>
                  </div>

                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    TVA: {product.taux_tva_id}%
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// PRODUCT FORM
// ============================================

function ProductForm({
  product,
  categories,
  tauxTvaList,
  onSave,
  onCancel,
}: {
  product: Product | null;
  categories: any[];
  tauxTvaList: any[];
  onSave: (data: Omit<Product, "id">) => void;
  onCancel: () => void;
}) {
  const [selectedCategorie, setSelectedCategorie] = useState<
    number | undefined
  >((product as any)?.categorie_id || undefined);

  const [formData, setFormData] = useState<Omit<Product, "id">>(
    product || {
      nom: "",
      description: "",
      prix_unitaire_ht: 0,
      unite: "pièce",
      taux_tva_id: 20,
      type: "PRODUIT",
      actif: true,
    },
  );

  // État spécifique pour conserver exactement la saisie du prix
  const [prixInput, setPrixInput] = useState(
    product ? getPriceAsNumber(product.prix_unitaire_ht).toFixed(2) : "",
  );

  const [prixError, setPrixError] = useState("");

  const handleCategorieChange = (value: string) => {
    const categorieId = value ? parseInt(value) : undefined;

    setSelectedCategorie(categorieId);

    setFormData((prev) => ({
      ...prev,
      categorie_id: categorieId,
    }));
  };

  // ============================================
  // VALIDATION DU PRIX
  // ============================================

  const validatePrix = (value: string): boolean => {
    // Format strict : chiffres + point + exactement 2 chiffres
    const validFormat = /^\d+\.\d{2}$/;

    if (!validFormat.test(value)) {
      setPrixError("Le prix doit respecter le format 0.00 (exemple : 125.50).");

      return false;
    }

    const numberValue = Number(value);

    if (isNaN(numberValue) || numberValue < 0) {
      setPrixError("Le prix doit être un nombre positif.");

      return false;
    }

    setPrixError("");
    return true;
  };

  const handlePrixChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Autorise uniquement les chiffres et un seul point
    if (!/^\d*\.?\d*$/.test(value)) {
      return;
    }

    // Maximum 2 chiffres après le point
    if (value.includes(".")) {
      const decimals = value.split(".")[1];

      if (decimals.length > 2) {
        return;
      }
    }

    setPrixInput(value);

    // Effacer le message pendant la saisie
    setPrixError("");

    // Ne convertir en nombre que si la saisie est complète
    if (/^\d+\.\d{2}$/.test(value)) {
      const numberValue = Number(value);

      setFormData((prev) => ({
        ...prev,
        prix_unitaire_ht: numberValue,
      }));
    }
  };

  const handlePrixBlur = () => {
    if (prixInput === "") {
      setPrixError("Le prix est obligatoire.");
      return;
    }

    validatePrix(prixInput);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Vérification stricte avant l'envoi
    if (!validatePrix(prixInput)) {
      return;
    }

    const prix = Number(prixInput);

    onSave({
      ...formData,
      prix_unitaire_ht: prix,
      categorie_id: selectedCategorie,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {product ? "Modifier le produit" : "Nouveau produit"}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Nom */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="nom">Nom *</Label>

              <Input
                id="nom"
                value={formData.nom}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    nom: e.target.value,
                  })
                }
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>

              <Input
                id="description"
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    description: e.target.value,
                  })
                }
              />
            </div>

            {/* ============================================
                PRIX HT
            ============================================ */}
            <div className="space-y-2">
              <Label htmlFor="prix">Prix HT (€) *</Label>

              <Input
                id="prix"
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={prixInput}
                onChange={handlePrixChange}
                onBlur={handlePrixBlur}
                className={
                  prixError ? "border-red-500 focus-visible:ring-red-500" : ""
                }
                required
              />

              {/* Message permanent expliquant le format */}
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Format obligatoire : <strong>0.00</strong> — Exemple :{" "}
                <strong>125.50</strong>
              </p>

              {/* Message d'erreur */}
              {prixError && <p className="text-xs text-red-500">{prixError}</p>}
            </div>

            {/* Unité */}
            <div className="space-y-2">
              <Label htmlFor="unite">Unité *</Label>

              <Input
                id="unite"
                value={formData.unite}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    unite: e.target.value,
                  })
                }
                required
              />
            </div>

            {/* Catégorie */}
            <div className="space-y-2">
              <Label htmlFor="categorie">Catégorie</Label>

              <Select
                id="categorie"
                value={selectedCategorie || ""}
                onChange={(e) => handleCategorieChange(e.target.value)}
              >
                <option value="">Sans catégorie</option>

                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nom}
                  </option>
                ))}
              </Select>
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>

              <Select
                id="type"
                value={formData.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value as "PRODUIT" | "SERVICE",
                  })
                }
              >
                <option value="PRODUIT">Produit</option>

                <option value="SERVICE">Service</option>
              </Select>
            </div>

            {/* TVA */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="tva">Taux de TVA *</Label>

              <Select
                id="tva"
                value={formData.taux_tva_id}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    taux_tva_id: parseFloat(e.target.value) || 0,
                  })
                }
                required
              >
                <option value="">Sélectionner un taux</option>

                {tauxTvaList.map((taux) => (
                  <option key={taux.id} value={taux.id}>
                    {taux.taux}% - {taux.libelle}
                  </option>
                ))}
              </Select>

              {tauxTvaList.length === 0 && (
                <p className="text-xs text-red-500">
                  Aucun taux de TVA disponible
                </p>
              )}

              <p className="text-xs text-gray-400">
                💡 TVA appliquée selon le pays de votre entreprise
              </p>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>

            <Button type="submit">{product ? "Modifier" : "Créer"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
