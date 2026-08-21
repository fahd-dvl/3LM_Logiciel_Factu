import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Select } from '../components/ui/select'
import { Plus, Search, Edit, Trash2, FileText, Download, Eye, Calendar, Filter, X, FileDown, ArrowUpDown, ArrowUp, ArrowDown, X as XIcon } from 'lucide-react'
import { formatCurrency, formatDate } from '../lib/utils'
import { useNavigate } from 'react-router-dom'
import { invoicesApi, type Invoice } from '../lib/api'

export default function Invoices() {
  const navigate = useNavigate()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [clientFilter, setClientFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [amountMin, setAmountMin] = useState('')
  const [amountMax, setAmountMax] = useState('')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [sortBy, setSortBy] = useState('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)

  useEffect(() => {
    loadInvoices()
  }, [])

  const loadInvoices = async () => {
    try {
      setLoading(true)
      const data = await invoicesApi.getAll()
      setInvoices(data)
    } catch (error) {
      console.error('Failed to load invoices:', error)
      // Fallback to mock data if API fails
      setInvoices([
        { id: 1, numero: 'FAC-001', client_id: 1, client: { id: 1, nom: 'Entreprise ABC', type: 'entreprise', date_creation: new Date().toISOString() }, statut: 'PAYEE', date_emission: '2024-01-15', date_echeance: '2024-02-15', total_ht: 2500, total_tva: 500, total_ttc: 3000, devise: 'EUR', est_acompte: false, lines: [] },
        { id: 2, numero: 'FAC-002', client_id: 2, client: { id: 2, nom: 'Société XYZ', type: 'entreprise', date_creation: new Date().toISOString() }, statut: 'EN_RETARD', date_emission: '2024-01-14', date_echeance: '2024-02-14', total_ht: 1800, total_tva: 360, total_ttc: 2160, devise: 'EUR', est_acompte: false, lines: [] },
        { id: 3, numero: 'FAC-003', client_id: 3, client: { id: 3, nom: 'Client Premium', type: 'particulier', date_creation: new Date().toISOString() }, statut: 'PAYEE', date_emission: '2024-01-13', date_echeance: '2024-02-13', total_ht: 3200, total_tva: 640, total_ttc: 3840, devise: 'EUR', est_acompte: false, lines: [] },
        { id: 4, numero: 'FAC-004', client_id: 1, client: { id: 1, nom: 'Entreprise ABC', type: 'entreprise', date_creation: new Date().toISOString() }, statut: 'ENVOYEE', date_emission: '2024-01-10', date_echeance: '2024-02-10', total_ht: 950, total_tva: 190, total_ttc: 1140, devise: 'EUR', est_acompte: false, lines: [] },
      ])
    } finally {
      setLoading(false)
    }
  }

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (invoice.client && invoice.client.nom.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === 'all' || invoice.statut === statusFilter
    const matchesClient = clientFilter === 'all' || (invoice.client && invoice.client.nom === clientFilter)
    
    const matchesDateFrom = !dateFrom || new Date(invoice.date_emission) >= new Date(dateFrom)
    const matchesDateTo = !dateTo || new Date(invoice.date_emission) <= new Date(dateTo)
    const matchesAmountMin = !amountMin || invoice.total_ttc >= parseFloat(amountMin)
    const matchesAmountMax = !amountMax || invoice.total_ttc <= parseFloat(amountMax)
    
    return matchesSearch && matchesStatus && matchesClient && matchesDateFrom && matchesDateTo && matchesAmountMin && matchesAmountMax
  }).sort((a, b) => {
    let comparison = 0
    switch (sortBy) {
      case 'date':
        comparison = new Date(a.date_emission).getTime() - new Date(b.date_emission).getTime()
        break
      case 'amount':
        comparison = a.total_ttc - b.total_ttc
        break
      case 'client':
        comparison = (a.client?.nom || '').localeCompare(b.client?.nom || '')
        break
      case 'status':
        comparison = a.statut.localeCompare(b.statut)
        break
      default:
        comparison = 0
    }
    return sortOrder === 'asc' ? comparison : -comparison
  })

  const clients = [...new Set(invoices.map(i => i.client?.nom).filter(Boolean))]

  const handleView = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setShowViewModal(true)
  }

  const handleDownload = (invoice: Invoice) => {
    // Generate HTML-based invoice download
    const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Facture ${invoice.numero}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { color: #3b82f6; margin: 0; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
        .info-box { background: #f3f4f6; padding: 15px; border-radius: 8px; }
        .info-box h3 { margin: 0 0 10px 0; color: #374151; }
        .total-box { background: #3b82f6; color: white; padding: 20px; border-radius: 8px; text-align: right; }
        .status { display: inline-block; padding: 5px 15px; border-radius: 20px; font-weight: bold; }
        .status.payée { background: #10b981; color: white; }
        .status.attente { background: #f59e0b; color: white; }
        .status.annulée { background: #ef4444; color: white; }
    </style>
</head>
<body>
    <div class="header">
        <h1>FACTURE ${invoice.numero}</h1>
        <p>Date: ${formatDate(invoice.date_emission)}</p>
    </div>
    
    <div class="info-grid">
        <div class="info-box">
            <h3>Client</h3>
            <p>${invoice.client?.nom || ''}</p>
        </div>
        <div class="info-box">
            <h3>Échéance</h3>
            <p>${formatDate(invoice.date_echeance)}</p>
        </div>
    </div>
    
    <div class="info-box" style="margin-bottom: 30px;">
        <h3>Statut</h3>
        <span class="status ${invoice.statut.toLowerCase()}">${invoice.statut}</span>
    </div>
    
    <div class="total-box">
        <h2 style="margin: 0;">Montant Total</h2>
        <p style="font-size: 32px; font-weight: bold; margin: 10px 0;">${formatCurrency(invoice.total_ttc)}</p>
    </div>
    
    <p style="margin-top: 30px; color: #6b7280; font-size: 12px;">Généré par le système de facturation</p>
</body>
</html>
    `
    
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `facture_${invoice.numero}.html`
    link.click()
  }

  const handleDelete = async (id: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) {
      try {
        await invoicesApi.delete(id)
        setInvoices(invoices.filter(i => i.id !== id))
      } catch (error) {
        console.error('Failed to delete invoice:', error)
        // Fallback to local update
        setInvoices(invoices.filter(i => i.id !== id))
      }
    }
  }

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
    const headers = ['Numéro', 'Client', 'Montant', 'Statut', 'Date', 'Échéance']
    const csvContent = [
      headers.join(','),
      ...filteredInvoices.map(inv => [
        inv.numero,
        inv.client?.nom || '',
        inv.total_ttc.toFixed(2),
        inv.statut,
        inv.date_emission,
        inv.date_echeance
      ].join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `factures_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
    setClientFilter('all')
    setDateFrom('')
    setDateTo('')
    setAmountMin('')
    setAmountMax('')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAYEE': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
      case 'ENVOYEE': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
      case 'ANNULEE': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
      case 'EN_RETARD': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
      case 'PARTIELLEMENT_PAYEE': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Factures</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Gérez vos factures</p>
        </div>
        <Button onClick={() => navigate('/invoices/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle facture
        </Button>
        <Button variant="outline" onClick={exportToCSV}>
          <FileDown className="h-4 w-4 mr-2" />
          Exporter CSV
        </Button>
      </div>

      {(searchTerm || statusFilter !== 'all' || clientFilter !== 'all' || dateFrom || dateTo || amountMin || amountMax) && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">Filtres actifs</span>
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Effacer tout
          </Button>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Liste des factures</CardTitle>
          <CardDescription>
            {filteredInvoices.length} facture{filteredInvoices.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSort('date')}
              className={sortBy === 'date' ? 'bg-gray-100 dark:bg-gray-800' : ''}
            >
              Date {getSortIcon('date')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSort('amount')}
              className={sortBy === 'amount' ? 'bg-gray-100 dark:bg-gray-800' : ''}
            >
              Montant {getSortIcon('amount')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSort('client')}
              className={sortBy === 'client' ? 'bg-gray-100 dark:bg-gray-800' : ''}
            >
              Client {getSortIcon('client')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSort('status')}
              className={sortBy === 'status' ? 'bg-gray-100 dark:bg-gray-800' : ''}
            >
              Statut {getSortIcon('status')}
            </Button>
          </div>
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
            </div>
            
            <div className="grid gap-4 md:grid-cols-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">Tous les statuts</option>
                <option value="Payée">Payée</option>
                <option value="En attente">En attente</option>
                <option value="Annulée">Annulée</option>
              </Select>
              <Select value={clientFilter} onChange={(e) => setClientFilter(e.target.value)}>
                <option value="all">Tous les clients</option>
                {clients.map(client => (
                  <option key={client} value={client}>{client}</option>
                ))}
              </Select>
            </div>
            
            {showAdvancedFilters && (
              <div className="mt-4 grid gap-4 md:grid-cols-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Date de début</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Date de fin</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Montant min (€)</label>
                  <Input
                    type="number"
                    placeholder="Min"
                    value={amountMin}
                    onChange={(e) => setAmountMin(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Montant max (€)</label>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={amountMax}
                    onChange={(e) => setAmountMax(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
          {loading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">Chargement...</div>
          ) : (
            <div className="space-y-4">
            {filteredInvoices.map((invoice) => (
              <div key={invoice.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">{invoice.numero}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{invoice.client?.nom || ''}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {formatDate(invoice.date_emission)} • Échéance: {formatDate(invoice.date_echeance)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold text-lg text-gray-900 dark:text-gray-100">{formatCurrency(invoice.total_ttc)}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(invoice.statut)}`}>
                        {invoice.statut}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" onClick={() => handleView(invoice)} title="Voir">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleDownload(invoice)} title="Télécharger">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => navigate(`/invoices/${invoice.id}/edit`)} title="Modifier">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleDelete(invoice.id)} title="Supprimer">
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showViewModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Facture {selectedInvoice.numero}</h2>
                <Button variant="ghost" size="icon" onClick={() => setShowViewModal(false)}>
                  <XIcon className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Client</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{selectedInvoice.client?.nom || ''}</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Date</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{formatDate(selectedInvoice.date_emission)}</p>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Échéance</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{formatDate(selectedInvoice.date_echeance)}</p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Statut</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedInvoice.statut)}`}>
                      {selectedInvoice.statut}
                    </span>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">Montant total</span>
                    <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(selectedInvoice.total_ttc)}</span>
                  </div>
                </div>
                
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => {
                    handleDownload(selectedInvoice)
                    setShowViewModal(false)
                  }}>
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger
                  </Button>
                  <Button onClick={() => {
                    setShowViewModal(false)
                    navigate(`/invoices/${selectedInvoice.id}/edit`)
                  }}>
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
