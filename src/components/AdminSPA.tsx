'use client';

import { useState } from 'react';
import { DashboardClient } from './DashboardClient';
import { CampeonatosClient } from './CampeonatosClient';
import { TimesAtletasClient } from './TimesAtletasClient';
import { CategoryManager } from './CategoryManager';
import { SidebarWithNavigation } from './SidebarWithNavigation';
import { Header } from './Header';

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

interface AdminSPAProps {
  initialView?: 'dashboard' | 'campeonatos' | 'times-atletas' | 'configuracoes';
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
  };
  campeonatosData: {
    championships: Championship[];
    categories: Category[];
  };
  timesAtletasData: {
    teams: Team[];
  };
  configuracoesData: {
    categories: Category[];
  };
}

export type AdminView = 'dashboard' | 'campeonatos' | 'times-atletas' | 'configuracoes';

export const AdminSPA = ({
  initialView = 'dashboard',
  dashboardData,
  campeonatosData,
  timesAtletasData,
  configuracoesData,
}: AdminSPAProps) => {
  const [currentView, setCurrentView] = useState<AdminView>(initialView);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Renderizar o conteúdo baseado na view atual
  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <DashboardClient
            championships={dashboardData.championships}
            activeCount={dashboardData.activeCount}
            categories={dashboardData.categories}
          />
        );
      case 'campeonatos':
        return (
          <CampeonatosClient
            championships={campeonatosData.championships}
            categories={campeonatosData.categories}
          />
        );
      case 'times-atletas':
        return (
          <TimesAtletasClient teams={timesAtletasData.teams} />
        );
      case 'configuracoes':
        return (
          <div>
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
              <p className="text-gray-600 mt-2">Gerencie as categorias dos campeonatos</p>
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
      <SidebarWithNavigation
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        currentView={currentView}
        onViewChange={setCurrentView}
      />
      <div
        className={`flex-1 transition-all duration-300 ${
          isSidebarCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        <Header
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        <main className="p-6">{renderContent()}</main>
      </div>
    </div>
  );
};

