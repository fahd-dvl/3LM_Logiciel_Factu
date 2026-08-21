import React, { createContext, useContext, useState, useEffect } from "react";
import { authApi } from "../lib/api";

interface User {
  id: string;
  email: string;
  nom?: string;
  prenom?: string;
  telephone?: string;
  role?: "admin" | "user";
  entreprise_id?: number | null;
  entreprise_nom?: string | null;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    prenom: string;
    nom: string;
    telephone: string;
  }) => Promise<void>;
  logout: () => void;
  selectEnterprise: (entrepriseId: number) => Promise<void>;
  updateProfile: (data: {
    prenom?: string;
    nom?: string;
    telephone?: string;
  }) => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  needsEnterpriseSelection: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsEnterpriseSelection, setNeedsEnterpriseSelection] =
    useState(false);

  const applyUser = (userData: User) => {
    setUser(userData);
    setIsAuthenticated(true);
    setNeedsEnterpriseSelection(
      userData.entreprise_id === null || userData.entreprise_id === undefined,
    );
  };

  // ✅ Restore session by asking the backend — cookie is sent automatically
  useEffect(() => {
    (async () => {
      try {
        const { user: me } = await authApi.me();
        applyUser(me);
      } catch {
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const register = async (data: {
    email: string;
    password: string;
    prenom: string;
    nom: string;
    telephone: string;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authApi.register(data);
      applyUser({
        id: response.user.id,
        email: response.user.email,
        nom: response.user.nom,
        prenom: response.user.prenom,
        telephone: response.user.telephone,
        role: response.user.role,
        entreprise_id: response.entreprise_id ?? null,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de l'inscription",
      );
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authApi.login(email, password);
      applyUser({
        id: response.user.id,
        email: response.user.email,
        nom: response.user.nom,
        prenom: response.user.prenom,
        telephone: response.user.telephone,
        role: response.user.role,
        entreprise_id: response.entreprise_id ?? null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const selectEnterprise = async (entrepriseId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authApi.selectEnterprise(entrepriseId);
      setUser((prev) =>
        prev
          ? { ...prev, entreprise_id: response.entreprise_id ?? entrepriseId }
          : prev,
      );
      setNeedsEnterpriseSelection(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la sélection de l'entreprise",
      );
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Mettre à jour le profil
  const updateProfile = async (data: {
    prenom?: string;
    nom?: string;
    telephone?: string;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.updateProfile(data);

      // Mettre à jour l'utilisateur dans le state
      const updatedUser: User = {
        ...user!,
        prenom: data.prenom ?? user?.prenom,
        nom: data.nom ?? user?.nom,
        telephone: data.telephone ?? user?.telephone,
      };

      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));

      return response;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erreur lors de la mise à jour";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setNeedsEnterpriseSelection(false);
      setError(null);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        selectEnterprise,
        updateProfile,
        isAuthenticated,
        isLoading,
        error,
        clearError,
        needsEnterpriseSelection,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
