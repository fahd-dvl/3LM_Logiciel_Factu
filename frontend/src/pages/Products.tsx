import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Select } from '../components/ui/select'
import { Label } from '../components/ui/label'
import { Plus, Search, Edit, Trash2, Package, Filter, X, FileDown, ArrowUpDown, ArrowUp, ArrowDown, Grid, List, TrendingUp, DollarSign } from 'lucide-react'
import { formatCurrency } from '../lib/utils'
import { productsApi, type Product } from '../lib/api'

export default function Products() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [unitFilter, setUnitFilter] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid')

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const data = await productsApi.getAll()
      setProducts(data)
    } catch (error) {
      console.error('Failed to load products:', error)
      // Fallback to mock data if API fails
      setProducts([
        { id: 1, nom: 'Consultation web', description: 'Consultation pour développement web', prix_unitaire_ht: 150, unite: 'heure', taux_tva: 20, type: 'SERVICE', actif: true },
        { id: 2, nom: 'Développement site', description: 'Création de site web complet', prix_unitaire_ht: 2500, unite: 'projet', taux_tva: 20, type: 'SERVICE', actif: true },
        { id: 3, nom: 'Maintenance mensuelle', description: 'Maintenance et support technique', prix_unitaire_ht: 300, unite: 'mois', taux_tva: 20, type: 'SERVICE', actif: true },
      ])
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products
    .filter(product => {
      const matchesSearch = product.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesUnit = unitFilter === 'all' || product.unite === unitFilter
      return matchesSearch && matchesUnit
    })
    .sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'name':
          comparison = a.nom.localeCompare(b.nom)
          break
        case 'price':
          comparison = a.prix_unitaire_ht - b.prix_unitaire_ht
          break
        case 'unit':
          comparison = a.unite.localeCompare(b.unite)
          break
        default:
          comparison = 0
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

  const units = [...new Set(products.map(p => p.unite))]

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return <ArrowUpDown className="h-4 w-4" />
    return sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
  }

  const exportToCSV = () => {
    const headers = ['Nom', 'Description', 'Prix HT', 'Unité', 'TVA']
    const csvContent = [
      headers.join(','),
      ...filteredProducts.map(product => [
        product.nom,
        product.description || '',
        product.prix_unitaire_ht.toFixed(2),
        product.unite,
        product.taux_tva
      ].join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `produits_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const clearFilters = () => {
    setSearchTerm('')
    setUnitFilter('all')
  }

  const handleDelete = async (id: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      try {
        await productsApi.delete(id)
        setProducts(products.filter(p => p.id !== id))
      } catch (error) {
        console.error('Failed to delete product:', error)
        // Fallback to local update
        setProducts(products.filter(p => p.id !== id))
      }
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setShowForm(true)
  }

  const handleSave = async (productData: Omit<Product, 'id'>) => {
    try {
      if (editingProduct) {
        const updated = await productsApi.update(editingProduct.id, productData)
        setProducts(products.map(p => p.id === editingProduct.id ? updated : p))
      } else {
        const created = await productsApi.create(productData)
        setProducts([...products, created])
      }
      setShowForm(false)
      setEditingProduct(null)
    } catch (error) {
      console.error('Failed to save product:', error)
      // Fallback to local update
      if (editingProduct) {
        setProducts(products.map(p => p.id === editingProduct.id ? { ...productData, id: editingProduct.id } : p))
      } else {
        setProducts([...products, { ...productData, id: Date.now() }])
      }
      setShowForm(false)
      setEditingProduct(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Produits & Services</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Gérez vos produits et services</p>
        </div>
        <Button onClick={() => { setEditingProduct(null); setShowForm(true) }}>
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
          onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
          title={viewMode === 'list' ? 'Vue grille' : 'Vue liste'}
        >
          {viewMode === 'list' ? <Grid className="h-4 w-4" /> : <List className="h-4 w-4" />}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">Total produits</CardTitle>
            <Package className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{products.length}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Produits & services</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">Valeur moyenne</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {products.length > 0 ? formatCurrency(products.reduce((sum, p) => sum + p.prix_unitaire_ht, 0) / products.length) : formatCurrency(0)}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Prix moyen HT</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">Types d'unités</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{units.length}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Unités différentes</p>
          </CardContent>
        </Card>
      </div>

      {(searchTerm || unitFilter !== 'all') && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">Filtres actifs</span>
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Effacer tout
          </Button>
        </div>
      )}

      {showForm && (
        <ProductForm
          product={editingProduct}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingProduct(null) }}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Liste des produits</CardTitle>
          <CardDescription>
            {filteredProducts.length} produit{filteredProducts.length !== 1 ? 's' : ''}
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
                  onClick={() => handleSort('name')}
                  className={sortBy === 'name' ? 'bg-gray-100 dark:bg-gray-800' : ''}
                >
                  Nom {getSortIcon('name')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('price')}
                  className={sortBy === 'price' ? 'bg-gray-100 dark:bg-gray-800' : ''}
                >
                  Prix {getSortIcon('price')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('unit')}
                  className={sortBy === 'unit' ? 'bg-gray-100 dark:bg-gray-800' : ''}
                >
                  Unité {getSortIcon('unit')}
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
              <Select value={unitFilter} onChange={(e) => setUnitFilter(e.target.value)}>
                <option value="all">Toutes les unités</option>
                {units.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </Select>
            </div>
          </div>
          <div className={viewMode === 'grid' ? 'grid gap-4 md:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}>
            {loading ? (
              <div className={`${viewMode === 'grid' ? 'col-span-full' : ''} text-center py-8 text-gray-500 dark:text-gray-400`}>Chargement...</div>
            ) : (
              filteredProducts.map((product) => (
                <div key={product.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">{product.nom}</h3>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="outline" size="icon" onClick={() => handleEdit(product)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleDelete(product.id)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{product.description || ''}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(product.prix_unitaire_ht)}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">/ {product.unite}</span>
                  </div>
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    TVA: {typeof product.taux_tva === 'object' ? product.taux_tva.taux : product.taux_tva}%
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ProductForm({ product, onSave, onCancel }: { product: Product | null; onSave: (data: Omit<Product, 'id'>) => void; onCancel: () => void }) {
  const [formData, setFormData] = useState<Omit<Product, 'id'>>(product || {
    nom: '',
    description: '',
    prix_unitaire_ht: 0,
    unite: 'pièce',
    taux_tva: 20,
    type: 'PRODUIT',
    actif: true,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{product ? 'Modifier le produit' : 'Nouveau produit'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="nom">Nom</Label>
              <Input
                id="nom"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prix">Prix HT (€)</Label>
              <Input
                id="prix"
                type="number"
                step="0.01"
                value={formData.prix_unitaire_ht}
                onChange={(e) => setFormData({ ...formData, prix_unitaire_ht: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unite">Unité</Label>
              <Input
                id="unite"
                value={formData.unite}
                onChange={(e) => setFormData({ ...formData, unite: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tva">TVA (%)</Label>
              <Input
                id="tva"
                type="number"
                value={typeof formData.taux_tva === 'object' ? formData.taux_tva.taux : formData.taux_tva}
                onChange={(e) => setFormData({ ...formData, taux_tva: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
            <Button type="submit">
              {product ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
