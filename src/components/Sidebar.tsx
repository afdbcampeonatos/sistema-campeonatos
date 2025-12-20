"use client";

import { usePathname, useRouter } from "next/navigation";
import { FaCog, FaTrophy, FaUsers } from "react-icons/fa";
import { HiHome, HiMenuAlt2 } from "react-icons/hi";

interface SidebarLinkProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}

const SidebarLink = ({ icon, label, isActive, onClick }: SidebarLinkProps) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-colors ${
        isActive
          ? "bg-blue-900 text-white"
          : "text-gray-300 hover:bg-slate-800 hover:text-white"
      }`}
    >
      <span className="text-xl shrink-0">{icon}</span>
      <span className="font-medium whitespace-nowrap overflow-hidden text-ellipsis">
        {label}
      </span>
    </button>
  );
};

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export const Sidebar = ({ isCollapsed, onToggle }: SidebarProps) => {
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    {
      id: "visao-geral",
      icon: <HiHome />,
      label: "Visão Geral",
      section: "gestao",
      path: "/admin",
    },
    {
      id: "campeonatos",
      icon: <FaTrophy />,
      label: "Campeonatos",
      section: "gestao",
      path: "/admin/campeonatos",
    },
    {
      id: "times-atletas",
      icon: <FaUsers />,
      label: "Times/Atletas",
      section: "cadastros",
      path: "/admin",
    },
    {
      id: "configuracoes",
      icon: <FaCog />,
      label: "Configurações",
      section: "sistema",
      path: "/admin/configuracoes",
    },
  ];

  // Determinar qual item está ativo baseado no pathname
  const getActiveItemId = () => {
    if (pathname === "/admin/configuracoes") {
      return "configuracoes";
    }
    if (pathname.startsWith("/admin/campeonatos")) {
      return "campeonatos";
    }
    // Por padrão, se estiver em /admin, é "Visão Geral"
    if (pathname === "/admin") {
      return "visao-geral";
    }
    return null;
  };

  const activeItemId = getActiveItemId();

  const handleNavigation = (path: string, itemId: string) => {
    router.push(path);
  };

  const groupedItems = {
    gestao: menuItems.filter((item) => item.section === "gestao"),
    cadastros: menuItems.filter((item) => item.section === "cadastros"),
    sistema: menuItems.filter((item) => item.section === "sistema"),
  };

  return (
    <aside
      className={`bg-slate-900 text-white transition-all duration-300 flex flex-col overflow-hidden ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Logo */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <h1 className="text-xl font-bold text-white">AFDB CAMPEONATOS</h1>
          )}
          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Toggle sidebar"
          >
            <HiMenuAlt2 className="text-xl" />
          </button>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        {/* Gestão */}
        {!isCollapsed && (
          <div>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-4">
              Gestão
            </h2>
            <div className="space-y-1">
              {groupedItems.gestao.map((item) => (
                <SidebarLink
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  isActive={activeItemId === item.id}
                  onClick={() => handleNavigation(item.path, item.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Cadastros */}
        {!isCollapsed && (
          <div>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-4">
              Cadastros
            </h2>
            <div className="space-y-1">
              {groupedItems.cadastros.map((item) => (
                <SidebarLink
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  isActive={activeItemId === item.id}
                  onClick={() => handleNavigation(item.path, item.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Sistema */}
        {!isCollapsed && (
          <div>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-4">
              Sistema
            </h2>
            <div className="space-y-1">
              {groupedItems.sistema.map((item) => (
                <SidebarLink
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  isActive={activeItemId === item.id}
                  onClick={() => handleNavigation(item.path, item.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Collapsed view - apenas ícones */}
        {isCollapsed && (
          <div className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.path, item.id)}
                className={`flex items-center justify-center w-full p-3 rounded-lg transition-colors ${
                  activeItemId === item.id
                    ? "bg-blue-900 text-white"
                    : "text-gray-300 hover:bg-slate-800 hover:text-white"
                }`}
                title={item.label}
              >
                <span className="text-xl">{item.icon}</span>
              </button>
            ))}
          </div>
        )}
      </nav>
    </aside>
  );
};
