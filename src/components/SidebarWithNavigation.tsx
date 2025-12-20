"use client";

import { FaCog, FaTrophy, FaUsers } from "react-icons/fa";
import { HiHome, HiMenuAlt2 } from "react-icons/hi";
import type { AdminView } from "./AdminSPA";

interface SidebarLinkProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  isCollapsed?: boolean;
}

const SidebarLink = ({
  icon,
  label,
  isActive,
  onClick,
  isCollapsed,
}: SidebarLinkProps) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center w-full py-3 rounded-lg transition-colors ${
        isCollapsed ? "justify-center px-2" : "gap-3 px-4"
      } ${
        isActive
          ? "bg-blue-900 text-white"
          : "text-gray-300 hover:bg-slate-800 hover:text-white"
      }`}
      title={isCollapsed ? label : undefined}
    >
      <span className="text-xl shrink-0">{icon}</span>
      {!isCollapsed && (
        <span className="font-medium whitespace-nowrap">{label}</span>
      )}
    </button>
  );
};

interface SidebarWithNavigationProps {
  isCollapsed: boolean;
  onToggle: () => void;
  currentView: AdminView;
  onViewChange: (view: AdminView) => void;
}

export const SidebarWithNavigation = ({
  isCollapsed,
  onToggle,
  currentView,
  onViewChange,
}: SidebarWithNavigationProps) => {
  const menuItems = [
    {
      id: "dashboard" as AdminView,
      icon: <HiHome />,
      label: "Visão Geral",
      section: "gestao",
    },
    {
      id: "campeonatos" as AdminView,
      icon: <FaTrophy />,
      label: "Campeonatos",
      section: "gestao",
    },
    {
      id: "times-atletas" as AdminView,
      icon: <FaUsers />,
      label: "Times/Atletas",
      section: "cadastros",
    },
    {
      id: "configuracoes" as AdminView,
      icon: <FaCog />,
      label: "Configurações",
      section: "sistema",
    },
  ];

  const handleNavigation = (view: AdminView) => {
    onViewChange(view);
  };

  const groupedItems = {
    gestao: menuItems.filter((item) => item.section === "gestao"),
    cadastros: menuItems.filter((item) => item.section === "cadastros"),
    sistema: menuItems.filter((item) => item.section === "sistema"),
  };

  return (
    <aside
      className={`bg-slate-900 text-white transition-all duration-300 flex flex-col overflow-hidden fixed left-0 top-0 h-full z-40 ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Logo */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        {!isCollapsed && (
          <div>
            <h1 className="text-xl font-bold text-white">AFDB</h1>
            <p className="text-xs text-gray-400">CAMPEONATOS</p>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-slate-800 transition-colors text-gray-300 hover:text-white"
          aria-label={isCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
        >
          <HiMenuAlt2 className="text-xl" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Gestão */}
        <div>
          {!isCollapsed && (
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Gestão
            </h2>
          )}
          <div className="space-y-1">
            {groupedItems.gestao.map((item) => (
              <SidebarLink
                key={item.id}
                icon={item.icon}
                label={item.label}
                isActive={currentView === item.id}
                onClick={() => handleNavigation(item.id)}
                isCollapsed={isCollapsed}
              />
            ))}
          </div>
        </div>

        {/* Cadastros */}
        <div>
          {!isCollapsed && (
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Cadastros
            </h2>
          )}
          <div className="space-y-1">
            {groupedItems.cadastros.map((item) => (
              <SidebarLink
                key={item.id}
                icon={item.icon}
                label={item.label}
                isActive={currentView === item.id}
                onClick={() => handleNavigation(item.id)}
                isCollapsed={isCollapsed}
              />
            ))}
          </div>
        </div>

        {/* Sistema */}
        <div>
          {!isCollapsed && (
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Sistema
            </h2>
          )}
          <div className="space-y-1">
            {groupedItems.sistema.map((item) => (
              <SidebarLink
                key={item.id}
                icon={item.icon}
                label={item.label}
                isActive={currentView === item.id}
                onClick={() => handleNavigation(item.id)}
                isCollapsed={isCollapsed}
              />
            ))}
          </div>
        </div>
      </nav>
    </aside>
  );
};
