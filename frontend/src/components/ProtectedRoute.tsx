// components/ProtectedRoute.tsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user, needsEnterpriseSelection } =
    useAuth();
  const location = useLocation();

  // ✅ Attendre que le chargement soit fini
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  // ✅ Si pas authentifié → rediriger vers login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // ✅ Si on est sur /choose-enterprise, on autorise l'accès
  // (même si l'utilisateur n'a pas encore d'entreprise)
  if (location.pathname === "/choose-enterprise") {
    return <>{children}</>;
  }

  // ✅ Si authentifié mais pas d'entreprise → rediriger vers choose-enterprise
  if (!user?.entreprise_id) {
    return <Navigate to="/choose-enterprise" replace />;
  }

  // ✅ Si tout est bon → afficher la page protégée
  return <>{children}</>;
}
