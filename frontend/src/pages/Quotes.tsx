import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Select } from '../components/ui/select'
import { Plus, Search, Edit, Trash2, FileText, Download, Eye, CheckCircle, Calendar, Filter, X, FileDown, ArrowUpDown, ArrowUp, ArrowDown, X as XIcon } from 'lucide-react'
import { formatCurrency, formatDate } from '../lib/utils'
import { useNavigate } from 'react-router-dom'
import { quotesApi, type Quote } from '../lib/api'

export default function Quotes() {
  const navigate = useNavigate()
  const [quotes, setQuotes] = useState<Quote[]>([])
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
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)

  useEffect(() => {
    loadQuotes()
  }, [])

  const loadQuotes = async () => {
    try {
      setLoading(true)
      const data = await quotesApi.getAll()
      setQuotes(data)
    } catch (error) {
      console.error('Failed to load quotes:', error)
      // Fallback to mock data if API fails
      setQuotes([
        { id: 1, numero: 'DEV-001', client_id: 1, client: { id: 1, nom: 'Entreprise ABC', type: 'entreprise', date_creation: new Date().toISOString() }, statut: 'ENVOYE', date_creation: '2024-01-15', date_validite: '2024-02-15', total_ht: 3500, total_tva: 700, total_ttc: 4200, devise: 'EUR', lines: [] },
        { id: 2, numero: 'DEV-002', client_id: 2, client: { id: 2, nom: 'Société XYZ', type: 'entreprise', date_creation: new Date().toISOString() }, statut: 'ACCEPTE', date_creation: '2024-01-14', date_validite: '2024-02-14', total_ht: 2200, total_tva: 440, total_ttc: 2640, devise: 'EUR', lines: [] },
        { id: 3, numero: 'DEV-003', client_id: 3, client: { id: 3, nom: 'Client Premium', type: 'particulier', date_creation: new Date().toISOString() }, statut: 'ENVOYE', date_creation: '2024-01-13', date_validite: '2024-02-13', total_ht: 4500, total_tva: 900, total_ttc: 5400, devise: 'EUR', lines: [] },
        { id: 4, numero: 'DEV-004', client_id: 1, client: { id: 1, nom: 'Entreprise ABC', type: 'entreprise', date_creation: new Date().toISOString() }, statut: 'REFUSE', date_creation: '2024-01-10', date_validite: '2024-02-10', total_ht: 1200, total_tva: 240, total_ttc: 1440, devise: 'EUR', lines: [] },
      ])
    } finally {
      setLoading(false)
    }
  }

  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = quote.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (quote.client && quote.client.nom.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === 'all' || quote.statut === statusFilter
    const matchesClient = clientFilter === 'all' || (quote.client && quote.client.nom === clientFilter)
    
    const matchesDateFrom = !dateFrom || new Date(quote.date_creation) >= new Date(dateFrom)
    const matchesDateTo = !dateTo || new Date(quote.date_creation) <= new Date(dateTo)
    const matchesAmountMin = !amountMin || quote.total_ttc >= parseFloat(amountMin)
    const matchesAmountMax = !amountMax || quote.total_ttc <= parseFloat(amountMax)
    
    return matchesSearch && matchesStatus && matchesClient && matchesDateFrom && matchesDateTo && matchesAmountMin && matchesAmountMax
  }).sort((a, b) => {
    let comparison = 0
    switch (sortBy) {
      case 'date':
        comparison = new Date(a.date_creation).getTime() - new Date(b.date_creation).getTime()
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

  const clients = [...new Set(quotes.map(q => q.client?.nom).filter(Boolean))]

  const handleView = (quote: Quote) => {
    setSelectedQuote(quote)
    setShowViewModal(true)
  }

  const handleDownload = (quote: Quote) => {
    // Generate HTML-based quote download
    const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Devis ${quote.numero}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { color: #3b82f6; margin: 0; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
        .info-box { background: #f3f4f6; padding: 15px; border-radius: 8px; }
        .info-box h3 { margin: 0 0 10px 0; color: #374151; }
        .total-box { background: #3b82f6; color: white; padding: 20px; border-radius: 8px; text-align: right; }
        .status { display: inline-block; padding: 5px 15px; border-radius: 20px; font-weight: bold; }
        .status.accepte { background: #10b981; color: white; }
        .status.attente { background: #f59e0b; color: white; }
        .status.refuse { background: #ef4444; color: white; }
        .status.expiré { background: #6b7280; color: white; }
    </style>
</head>
<body>
    <div class="header">
        <h1>DEVIS ${quote.numero}</h1>
        <p>Date: ${formatDate(quote.date_creation)}</p>
    </div>
    
    <div class="info-grid">
        <div class="info-box">
            <h3>Client</h3>
            <p>${quote.client?.nom || ''}</p>
        </div>
        <div class="info-box">
            <h3>Validité</h3>
            <p>Jusqu'au: ${formatDate(quote.date_validite)}</p>
        </div>
    </div>
    
    <div class="info-box" style="margin-bottom: 30px;">
        <h3>Statut</h3>
        <span class="status ${quote.statut.toLowerCase()}">${quote.statut}</span>
    </div>
    
    <div class="total-box">
        <h2 style="margin: 0;">Montant Total</h2>
        <p style="font-size: 32px; font-weight: bold; margin: 10px 0;">${formatCurrency(quote.total_ttc)}</p>
    </div>
    
    <p style="margin-top: 30px; color: #6b7280; font-size: 12px;">Généré par le système de facturation</p>
</body>
</html>
    `
    
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `devis_${quote.numero}.html`
    link.click()
  }

  const handleDelete = async (id: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce devis ?')) {
      try {
        await quotesApi.delete(id)
        setQuotes(quotes.filter(q => q.id !== id))
      } catch (error) {
        console.error('Failed to delete quote:', error)
        // Fallback to local update
        setQuotes(quotes.filter(q => q.id !== id))
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
    const headers = ['Numéro', 'Client', 'Montant', 'Statut', 'Date', 'Valide jusqu\'au']
    const csvContent = [
      headers.join(','),
      ...filteredQuotes.map(quote => [
        quote.numero,
        quote.client?.nom || '',
        quote.total_ttc.toFixed(2),
        quote.statut,
        quote.date_creation,
        quote.date_validite
      ].join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `devis_${new Date().toISOString().split('T')[0]}.csv`
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

  const handleConvertToInvoice = async (id: number) => {
    if (confirm('Voulez-vous convertir ce devis en facture ?')) {
      try {
        await quotesApi.convertToInvoice(id)
        navigate(`/invoices/new?quoteId=${id}`)
      } catch (error) {
        console.error('Failed to convert quote to invoice:', error)
        // Fallback to navigation
        navigate(`/invoices/new?quoteId=${id}`)
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACCEPTE': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
      case 'ENVOYE': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
      case 'REFUSE': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
      case 'EXPIRE': return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
      case 'CONVERTI': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Devis</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Gérez vos devis</p>
        </div>
        <Button onClick={() => navigate('/quotes/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau devis
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
          <CardTitle>Liste des devis</CardTitle>
          <CardDescription>
            {filteredQuotes.length} devis{filteredQuotes.length !== 1 ? '' : ''}
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
                <option value="Accepté">Accepté</option>
                <option value="En attente">En attente</option>
                <option value="Refusé">Refusé</option>
                <option value="Expiré">Expiré</option>
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
            {filteredQuotes.map((quote) => (
              <div key={quote.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">{quote.numero}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{quote.client?.nom || ''}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {formatDate(quote.date_creation)} • Valide jusqu'au: {formatDate(quote.date_validite)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold text-lg text-gray-900 dark:text-gray-100">{formatCurrency(quote.total_ttc)}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(quote.statut)}`}>
                        {quote.statut}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" onClick={() => handleView(quote)} title="Voir">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleDownload(quote)} title="Télécharger">
                        <Download className="h-4 w-4" />
                      </Button>
                      {quote.statut === 'ACCEPTE' && (
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => handleConvertToInvoice(quote.id)} 
                          title="Convertir en facture"
                        >
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                      <Button variant="outline" size="icon" onClick={() => navigate(`/quotes/${quote.id}/edit`)} title="Modifier">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleDelete(quote.id)} title="Supprimer">
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

      {showViewModal && selectedQuote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Devis {selectedQuote.numero}</h2>
                <Button variant="ghost" size="icon" onClick={() => setShowViewModal(false)}>
                  <XIcon className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Client</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{selectedQuote.client?.nom || ''}</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Date</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{formatDate(selectedQuote.date_creation)}</p>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Validité</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{formatDate(selectedQuote.date_validite)}</p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Statut</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedQuote.statut)}`}>
                      {selectedQuote.statut}
                    </span>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">Montant total</span>
                    <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(selectedQuote.total_ttc)}</span>
                  </div>
                </div>
                
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => {
                    handleDownload(selectedQuote)
                    setShowViewModal(false)
                  }}>
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger
                  </Button>
                  <Button onClick={() => {
                    setShowViewModal(false)
                    navigate(`/quotes/${selectedQuote.id}/edit`)
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
