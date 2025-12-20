"use client";

import { FaCog, FaFutbol, FaTrophy, FaUsers } from "react-icons/fa";
import { HiHome } from "react-icons/hi";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import type { AdminView } from "./AdminSPA";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "./ui/sheet";

interface MobileNavigationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentView: AdminView;
  onViewChange: (view: AdminView) => void;
}

interface SidebarLinkProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}

const SidebarLink = ({
  icon,
  label,
  isActive,
  onClick,
}: SidebarLinkProps) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center w-full py-3 px-4 gap-3 rounded-lg transition-colors ${
        isActive
          ? "bg-blue-900 text-white"
          : "text-gray-300 hover:bg-slate-800 hover:text-white"
      }`}
    >
      <span className="text-xl shrink-0">{icon}</span>
      <span className="font-medium whitespace-nowrap">{label}</span>
    </button>
  );
};

export const MobileNavigationSheet = ({
  open,
  onOpenChange,
  currentView,
  onViewChange,
}: MobileNavigationSheetProps) => {
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
      id: "partidas" as AdminView,
      icon: <FaFutbol />,
      label: "Partidas",
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
    onOpenChange(false); // Fechar o Sheet após seleção
  };

  const groupedItems = {
    gestao: menuItems.filter((item) => item.section === "gestao"),
    cadastros: menuItems.filter((item) => item.section === "cadastros"),
    sistema: menuItems.filter((item) => item.section === "sistema"),
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[280px] p-0 bg-slate-900 text-white" hideCloseButton>
        {/* Título oculto para acessibilidade */}
        <VisuallyHidden.Root>
          <SheetTitle>Menu de Navegação</SheetTitle>
        </VisuallyHidden.Root>
        
        {/* Header com Logo */}
        <div className="p-4 border-b border-slate-800">
          <div className="text-left">
            <h1 className="text-xl font-bold text-white">AFDB</h1>
            <p className="text-xs text-gray-400">CAMPEONATOS</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Gestão */}
          <div>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Gestão
            </h2>
            <div className="space-y-1">
              {groupedItems.gestao.map((item) => (
                <SidebarLink
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  isActive={currentView === item.id}
                  onClick={() => handleNavigation(item.id)}
                />
              ))}
            </div>
          </div>

          {/* Cadastros */}
          <div>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Cadastros
            </h2>
            <div className="space-y-1">
              {groupedItems.cadastros.map((item) => (
                <SidebarLink
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  isActive={currentView === item.id}
                  onClick={() => handleNavigation(item.id)}
                />
              ))}
            </div>
          </div>

          {/* Sistema */}
          <div>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Sistema
            </h2>
            <div className="space-y-1">
              {groupedItems.sistema.map((item) => (
                <SidebarLink
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  isActive={currentView === item.id}
                  onClick={() => handleNavigation(item.id)}
                />
              ))}
            </div>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
};

