"use client";

import { useState } from "react";
import { CampeonatosClient } from "./CampeonatosClient";
import { CategoryManager } from "./CategoryManager";
import { DashboardClient } from "./DashboardClient";
import { Header } from "./Header";
import { MobileNavigationSheet } from "./MobileNavigationSheet";
import { PartidasClient } from "./PartidasClient";
import { SidebarWithNavigation } from "./SidebarWithNavigation";
import { TimesAtletasClient } from "./TimesAtletasClient";

interface Championship {
  id: string;
  name: string;
  category: string;
  status: string;
  slug: string;
  registrationStart: Date | null;
  registrationEnd: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Team {
  id: string;
  name: string;
  category: string;
  responsibleName: string;
  responsibleCpf: string;
  phone: string;
  shieldUrl: string | null;
  status: string;
  createdAt: Date;
  championship: {
    id: string;
    name: string;
    slug: string;
  };
  players: Array<{
    id: string;
    name: string;
    rg: string;
    photoUrl: string | null;
  }>;
}

interface Match {
  id: string;
  championshipId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  status: string;
  currentHalf: number;
  currentMinute: number;
  scheduledAt: Date | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  createdAt: Date;
  championship: {
    id: string;
    name: string;
    slug: string;
  };
  homeTeam: {
    id: string;
    name: string;
    shieldUrl: string | null;
  };
  awayTeam: {
    id: string;
    name: string;
    shieldUrl: string | null;
  };
}

interface ChampionshipSummary {
  id: string;
  name: string;
  slug: string;
}

interface AdminSPAProps {
  initialView?:
    | "dashboard"
    | "campeonatos"
    | "partidas"
    | "times-atletas"
    | "configuracoes";
  dashboardData: {
    championships: Array<{
      id: string;
      name: string;
      category: string;
      status: string;
      createdAt: Date;
    }>;
    activeCount: number;
    categories: Array<{
      id: string;
      name: string;
      description: string | null;
      active: boolean;
    }>;
    matchesThisWeek: number;
    nextMatch: {
      homeTeam: string;
      awayTeam: string;
      scheduledAt: Date;
    } | null;
    totalTeams: number;
    totalPlayers: number;
  };
  campeonatosData: {
    championships: Championship[];
    categories: Category[];
  };
  partidasData: {
    matches: Match[];
    championships: ChampionshipSummary[];
  };
  timesAtletasData: {
    teams: Team[];
  };
  configuracoesData: {
    categories: Category[];
  };
}

export type AdminView =
  | "dashboard"
  | "campeonatos"
  | "partidas"
  | "times-atletas"
  | "configuracoes";

export const AdminSPA = ({
  initialView = "dashboard",
  dashboardData,
  campeonatosData,
  partidasData,
  timesAtletasData,
  configuracoesData,
}: AdminSPAProps) => {
  const [currentView, setCurrentView] = useState<AdminView>(initialView);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Renderizar o conteúdo baseado na view atual
  const renderContent = () => {
    switch (currentView) {
      case "dashboard":
        return (
          <DashboardClient
            championships={dashboardData.championships}
            activeCount={dashboardData.activeCount}
            categories={dashboardData.categories}
            matchesThisWeek={dashboardData.matchesThisWeek}
            nextMatch={dashboardData.nextMatch}
            totalTeams={dashboardData.totalTeams}
            totalPlayers={dashboardData.totalPlayers}
          />
        );
      case "campeonatos":
        return (
          <CampeonatosClient
            championships={campeonatosData.championships}
            categories={campeonatosData.categories}
          />
        );
      case "partidas":
        return (
          <PartidasClient
            matches={partidasData.matches}
            championships={partidasData.championships}
          />
        );
      case "times-atletas":
        return <TimesAtletasClient teams={timesAtletasData.teams} />;
      case "configuracoes":
        return (
          <div>
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
                Configurações
              </h1>
              <p className="text-gray-600 mt-2">
                Gerencie as categorias dos campeonatos
              </p>
            </div>
            <CategoryManager initialCategories={configuracoesData.categories} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar - Oculto em mobile, visível a partir de md */}
      <div className="hidden md:block">
        <SidebarWithNavigation
          isCollapsed={isSidebarCollapsed}
          onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          currentView={currentView}
          onViewChange={setCurrentView}
        />
      </div>
      
      {/* Container principal - Sem margin em mobile */}
      <div
        className={`flex-1 transition-all duration-300 ${
          isSidebarCollapsed ? "md:ml-20" : "md:ml-64"
        }`}
      >
        <Header
          onToggleSidebar={() => setIsMobileMenuOpen(true)}
        />
        <main className="p-4 md:p-6">{renderContent()}</main>
      </div>

      {/* Sheet Mobile Navigation */}
      <MobileNavigationSheet
        open={isMobileMenuOpen}
        onOpenChange={setIsMobileMenuOpen}
        currentView={currentView}
        onViewChange={setCurrentView}
      />
    </div>
  );
};
