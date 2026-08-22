// App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Layout } from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ChooseOrCreateEnterprise from "./pages/ChooseOrCreateEnterprise";
import ProfilPage from "./pages/ProfilPage";
import EditEnterprisePage from "./pages/EditEnterprisePage";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Products from "./pages/Products";
import Invoices from "./pages/Invoices";
import InvoiceForm from "./pages/InvoiceForm";
import Quotes from "./pages/Quotes"; // ✅ AJOUTER
import QuoteForm from "./pages/QuoteForm"; // ✅ AJOUTER

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            {/* PUBLIC ROUTES */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* CHOOSE ENTERPRISE */}
            <Route
              path="/choose-enterprise"
              element={
                <ProtectedRoute>
                  <ChooseOrCreateEnterprise />
                </ProtectedRoute>
              }
            />

            {/* PROTECTED ROUTES - Avec Layout */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/profile" replace />} />
              <Route path="profile" element={<ProfilPage />} />
              <Route
                path="edit-entreprise/:id"
                element={<EditEnterprisePage />}
              />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="clients" element={<Clients />} />
              <Route path="products" element={<Products />} />

              {/* ✅ ROUTES FACTURES */}
              <Route path="invoices" element={<Invoices />} />
              <Route path="invoices/new" element={<InvoiceForm />} />
              <Route path="invoices/:id/edit" element={<InvoiceForm />} />

              {/* ✅ ROUTES DEVIS */}
              <Route path="quotes" element={<Quotes />} />
              <Route path="quotes/new" element={<QuoteForm />} />
              <Route path="quotes/:id/edit" element={<QuoteForm />} />
            </Route>

            {/* REDIRECTS */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
