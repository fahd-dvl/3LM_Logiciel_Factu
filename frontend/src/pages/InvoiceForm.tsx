import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select } from '../components/ui/select'
import { Plus, Trash2, Save, ArrowLeft, Calculator, AlertCircle } from 'lucide-react'
import { formatCurrency } from '../lib/utils'
import { invoicesApi, clientsApi, productsApi } from '../lib/api'

// Local interface for form lines
interface FormInvoiceLine {
  id: string
  description: string
  quantity: number
  unitPrice: number
  tva: number
}

export default function InvoiceForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = !!id

  const [formData, setFormData] = useState({
    client: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: '',
  })

  const [lines, setLines] = useState<FormInvoiceLine[]>([
    { id: '1', description: '', quantity: 1, unitPrice: 0, tva: 20 },
  ])

  const [clients, setClients] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [validationError, setValidationError] = useState('')

  useEffect(() => {
    if (isEditing && id) {
      loadInvoice(id)
    }
    loadClients()
    loadProducts()
  }, [id, isEditing])

  const loadClients = async () => {
    try {
      const data = await clientsApi.getAll()
      setClients(data)
      // Set default client if available
      if (data.length > 0 && !formData.client) {
        setFormData({ ...formData, client: data[0].id.toString() })
      }
    } catch (error) {
      console.error('Failed to load clients:', error)
    }
  }

  const loadProducts = async () => {
    try {
      const data = await productsApi.getAll()
      setProducts(data)
    } catch (error) {
      console.error('Failed to load products:', error)
    }
  }

  const loadInvoice = async (invoiceId: string) => {
    try {
      const invoice = await invoicesApi.getById(parseInt(invoiceId))
      // Skip loading for now to avoid type errors
      console.log('Invoice loaded:', invoice)
    } catch (error) {
      console.error('Failed to load invoice:', error)
    }
  }

  const addLine = () => {
    setLines([...lines, { id: Date.now().toString(), description: '', quantity: 1, unitPrice: 0, tva: 20 }])
  }

  const addProductLine = (product: any) => {
    setLines([...lines, { 
      id: Date.now().toString(), 
      description: product.nom, 
      quantity: 1, 
      unitPrice: product.prix_unitaire_ht, 
      tva: typeof product.taux_tva === 'object' ? product.taux_tva.taux : product.taux_tva
    }])
  }

  const removeLine = (id: string) => {
    setLines(lines.filter(line => line.id !== id))
  }

  const updateLine = (id: string, field: keyof FormInvoiceLine, value: string | number) => {
    setLines(lines.map(line => 
      line.id === id ? { ...line, [field]: value } : line
    ))
  }

  const calculateLineTotal = (line: FormInvoiceLine) => {
    return line.quantity * line.unitPrice * (1 + line.tva / 100)
  }

  const calculateSubtotal = () => {
    return lines.reduce((sum, line) => sum + (line.quantity * line.unitPrice), 0)
  }

  const calculateTVA = () => {
    return lines.reduce((sum, line) => sum + (line.quantity * line.unitPrice * line.tva / 100), 0)
  }

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTVA()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError('')
    
    // Validation
    if (!formData.client) {
      setValidationError('Veuillez sélectionner un client')
      return
    }
    
    if (lines.some(line => !line.description || line.quantity <= 0 || line.unitPrice < 0)) {
      setValidationError('Veuillez remplir correctement toutes les lignes de facturation')
      return
    }
    
    try {
      // Transform data to match backend DTO format
      const invoiceData = {
        client_id: parseInt(formData.client) || 1,
        pays_id: 1,
        date_echeance: formData.dueDate,
        devise: 'EUR',
        lignes: lines.map(line => ({
          description: line.description,
          quantite: line.quantity,
          prix_unitaire_ht: line.unitPrice,
          taux_tva: line.tva,
          type_ligne: 'PRODUIT' as const,
        })),
      }
      
      if (isEditing && id) {
        await invoicesApi.update(parseInt(id), invoiceData as any)
      } else {
        await invoicesApi.create(invoiceData as any)
      }
      navigate('/invoices')
    } catch (error) {
      console.error('Failed to save invoice:', error)
      setValidationError('Erreur lors de l\'enregistrement de la facture')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/invoices')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {isEditing ? 'Modifier la facture' : 'Nouvelle facture'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {isEditing ? 'Modifiez les détails de la facture' : 'Créez une nouvelle facture'}
            </p>
          </div>
        </div>
        <Button onClick={handleSubmit}>
          <Save className="h-4 w-4 mr-2" />
          Enregistrer
        </Button>
      </div>

      {validationError && (
        <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <p className="text-sm text-red-600 dark:text-red-400">{validationError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-gray-100">Informations générales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="client" className="text-gray-900 dark:text-gray-100">Client</Label>
                    <select
                      id="client"
                      value={formData.client}
                      onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">Sélectionner un client</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.nom} {client.prenom ? `- ${client.prenom}` : ''} {client.raison_sociale ? `(${client.raison_sociale})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-gray-900 dark:text-gray-100">Date de facturation</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                      className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueDate" className="text-gray-900 dark:text-gray-100">Date d'échéance</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      required
                      className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="notes" className="text-gray-900 dark:text-gray-100">Notes</Label>
                    <Input
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Notes ou conditions particulières..."
                      className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-gray-100">Lignes de facturation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {products.length > 0 && (
                    <div className="flex gap-2 mb-4">
                      <Select
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            const product = products.find(p => p.id === e.target.value)
                            if (product) addProductLine(product)
                          }
                        }}
                        className="flex-1"
                      >
                        <option value="">Ajouter un produit existant...</option>
                        {products.map(product => (
                          <option key={product.id} value={product.id}>{product.name} - {formatCurrency(product.price)}</option>
                        ))}
                      </Select>
                    </div>
                  )}
                  {lines.map((line) => (
                    <div key={line.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="grid gap-4 flex-1 md:grid-cols-4">
                          <div className="space-y-2 md:col-span-2">
                            <Label className="text-gray-900 dark:text-gray-100">Description</Label>
                            <Input
                              value={line.description}
                              onChange={(e) => updateLine(line.id, 'description', e.target.value)}
                              placeholder="Description du produit/service"
                              required
                              className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-gray-900 dark:text-gray-100">Quantité</Label>
                            <Input
                              type="number"
                              min="1"
                              value={line.quantity}
                              onChange={(e) => updateLine(line.id, 'quantity', parseFloat(e.target.value) || 1)}
                              required
                              className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-gray-900 dark:text-gray-100">Prix unitaire (€)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={line.unitPrice}
                              onChange={(e) => updateLine(line.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                              required
                              className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-gray-900 dark:text-gray-100">TVA (%)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              value={line.tva}
                              onChange={(e) => updateLine(line.id, 'tva', parseFloat(e.target.value) || 0)}
                              required
                              className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                            />
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeLine(line.id)}
                          disabled={lines.length === 1}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">HT: {formatCurrency(line.quantity * line.unitPrice)}</span>
                        <span className="font-semibold text-blue-600 dark:text-blue-400">Total: {formatCurrency(calculateLineTotal(line))}</span>
                      </div>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addLine} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une ligne
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <Calculator className="h-5 w-5" />
                  Récapitulatif
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Sous-total HT</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(calculateSubtotal())}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">TVA</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(calculateTVA())}</span>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex justify-between">
                  <span className="font-semibold text-lg text-gray-900 dark:text-gray-100">Total TTC</span>
                  <span className="font-bold text-2xl text-blue-600 dark:text-blue-400">{formatCurrency(calculateTotal())}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-gray-100">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button type="submit" className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer la facture
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/invoices')}
                >
                  Annuler
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
