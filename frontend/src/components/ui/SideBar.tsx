// components/Sidebar.tsx
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  FilePlus,
  FileCheck,
  FilePlus2,
  MessageSquare,
  Building2,
  UserCircle,
  LogOut,
  Settings,
  Menu,
  X,
  Users,
  Package,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useState } from "react";

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ isMobileOpen, onMobileClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    {
      path: "/dashboard",
      icon: LayoutDashboard,
      label: "Dashboard",
      description: "Vue d'ensemble",
    },
    {
      path: "/invoices/new",
      icon: FilePlus,
      label: "Créer une facture",
      description: "Nouvelle facture",
    },
    {
      path: "/invoices",
      icon: FileText,
      label: "Factures",
      description: "Toutes les factures",
    },
    {
      path: "/quotes/new",
      icon: FilePlus2,
      label: "Créer un devis",
      description: "Nouveau devis",
    },
    {
      path: "/quotes",
      icon: FileCheck,
      label: "Devis",
      description: "Tous les devis",
    },
    {
      path: "/clients",
      icon: Users,
      label: "Clients",
      description: "Gestion des clients",
    },
    {
      path: "/products",
      icon: Package,
      label: "Produits",
      description: "Catalogue",
    },
    {
      path: "/chat",
      icon: MessageSquare,
      label: "Chat",
      description: "Assistant IA",
    },
  ];

  const bottomMenuItems = [
    {
      path: `/edit-entreprise/${user?.entreprise_id || 1}`,
      icon: Building2,
      label: "Modifier entreprise",
      description: "Informations",
    },
    {
      path: "/profile",
      icon: UserCircle,
      label: "Modifier profil",
      description: "Mes informations",
    },
    {
      path: "/settings",
      icon: Settings,
      label: "Paramètres",
      description: "Configuration",
    },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  if (isMobileOpen !== undefined) {
    return (
      <MobileSidebar
        isOpen={isMobileOpen}
        onClose={onMobileClose || (() => {})}
        menuItems={menuItems}
        bottomMenuItems={bottomMenuItems}
        handleLogout={handleLogout}
        user={user}
        location={location}
      />
    );
  }

  return (
    <DesktopSidebar
      isCollapsed={isCollapsed}
      toggleCollapse={toggleCollapse}
      menuItems={menuItems}
      bottomMenuItems={bottomMenuItems}
      handleLogout={handleLogout}
      user={user}
      location={location}
    />
  );
}

// ============================================
// SHARED: nav item renderer with gold active rail
// ============================================

function NavLink({ item, isActive, isCollapsed, onClick }: any) {
  const Icon = item.icon;
  return (
    <Link
      to={item.path}
      onClick={onClick}
      title={isCollapsed ? item.label : ""}
      className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
        isActive
          ? "bg-[#1E2E52] text-white"
          : "text-[#9AA6C4] hover:bg-[#1E2E52] hover:text-white"
      }`}
    >
      {isActive && (
        <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-[#D6A24C]" />
      )}
      <Icon
        className={`h-5 w-5 flex-shrink-0 ${isActive ? "text-[#D6A24C]" : ""}`}
      />
      {!isCollapsed && (
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium block truncate">
            {item.label}
          </span>
          <span className="text-xs text-[#6B7A9E] block truncate">
            {item.description}
          </span>
        </div>
      )}
    </Link>
  );
}

// ============================================
// DESKTOP SIDEBAR
// ============================================

function DesktopSidebar({
  isCollapsed,
  toggleCollapse,
  menuItems,
  bottomMenuItems,
  handleLogout,
  user,
  location,
}: any) {
  return (
    <aside
      className={`hidden md:flex flex-col bg-[#16233F] text-white transition-all duration-300 ${
        isCollapsed ? "w-20" : "w-64"
      } h-screen sticky top-0 border-r border-[#26375C]`}
    >
      <div className="flex items-center justify-between p-4 border-b border-[#26375C]">
        {!isCollapsed && (
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-md border border-[#D6A24C]/50 flex items-center justify-center flex-shrink-0">
              <span className="text-[#D6A24C] text-xs font-bold tracking-wide">
                LF
              </span>
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-white leading-tight truncate">
                LogiFactu
              </h1>
              <p className="text-xs text-[#6B7A9E] truncate">
                {user?.entreprise_nom || "Mon entreprise"}
              </p>
            </div>
          </div>
        )}
        <button
          onClick={toggleCollapse}
          className="p-1 rounded-lg hover:bg-[#1E2E52] text-[#6B7A9E] hover:text-white transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.map((item: any) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== "/dashboard" &&
              location.pathname.startsWith(item.path));
          return (
            <NavLink
              key={item.path}
              item={item}
              isActive={isActive}
              isCollapsed={isCollapsed}
            />
          );
        })}
      </nav>

      <div className="border-t border-[#26375C] p-3 space-y-1">
        {bottomMenuItems.map((item: any) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              item={item}
              isActive={isActive}
              isCollapsed={isCollapsed}
            />
          );
        })}

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg transition-colors text-[#E88D8D] hover:bg-[#3A2233] hover:text-[#FF9F9F]"
          title={isCollapsed ? "Déconnexion" : ""}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && (
            <span className="text-sm font-medium">Déconnexion</span>
          )}
        </button>

        {!isCollapsed && (
          <div className="mt-3 pt-3 border-t border-[#26375C]">
            <p className="text-xs text-[#C7CEE2] truncate">
              {user?.prenom} {user?.nom}
            </p>
            <p className="text-xs text-[#6B7A9E] truncate">{user?.email}</p>
          </div>
        )}
      </div>
    </aside>
  );
}

// ============================================
// MOBILE SIDEBAR
// ============================================

function MobileSidebar({
  isOpen,
  onClose,
  menuItems,
  bottomMenuItems,
  handleLogout,
  user,
  location,
}: any) {
  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={onClose}
      />

      <aside className="fixed top-0 left-0 h-full w-72 bg-[#16233F] text-white z-50 md:hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-[#26375C]">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-md border border-[#D6A24C]/50 flex items-center justify-center flex-shrink-0">
              <span className="text-[#D6A24C] text-xs font-bold tracking-wide">
                LF
              </span>
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold leading-tight truncate">
                LogiFactu
              </h1>
              <p className="text-xs text-[#6B7A9E] truncate">
                {user?.entreprise_nom || "Mon entreprise"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[#1E2E52] text-[#6B7A9E] hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map((item: any) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                item={item}
                isActive={isActive}
                isCollapsed={false}
                onClick={onClose}
              />
            );
          })}
        </nav>

        <div className="border-t border-[#26375C] p-3 space-y-1">
          {bottomMenuItems.map((item: any) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                item={item}
                isActive={isActive}
                isCollapsed={false}
                onClick={onClose}
              />
            );
          })}

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-[#E88D8D] hover:bg-[#3A2233] hover:text-[#FF9F9F]"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm font-medium">Déconnexion</span>
          </button>

          <div className="mt-3 pt-3 border-t border-[#26375C]">
            <p className="text-xs text-[#C7CEE2] truncate">
              {user?.prenom} {user?.nom}
            </p>
            <p className="text-xs text-[#6B7A9E] truncate">{user?.email}</p>
          </div>
        </div>
      </aside>
    </>
  );
}
