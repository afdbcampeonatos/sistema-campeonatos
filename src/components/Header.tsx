'use client';

import { HiSearch, HiMenuAlt2 } from 'react-icons/hi';
import { FaUserCircle, FaSignOutAlt } from 'react-icons/fa';
import { signOut, useSession } from 'next-auth/react';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header = ({ onToggleSidebar }: HeaderProps) => {
  const { data: session } = useSession();

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4 flex-1">
        {/* Botão Hamburger - Visível em mobile, oculto em desktop */}
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors md:hidden h-12 w-12 flex items-center justify-center"
          aria-label="Abrir menu"
        >
          <HiMenuAlt2 className="text-xl text-gray-700" />
        </button>

        {/* Barra de Pesquisa - Ocultada em mobile, visível em desktop */}
        <div className="relative flex-1 max-w-md hidden md:block">
          <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
          <input
            type="text"
            placeholder="Pesquisar..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent"
          />
        </div>
      </div>

      {/* Perfil do Admin */}
      <div className="flex items-center gap-2 md:gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-gray-900">
            {session?.user?.name || 'Admin'}
          </p>
          <p className="text-xs text-gray-500">
            {session?.user?.email || 'Administrador'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-full hover:bg-gray-100 transition-colors h-12 w-12 md:h-10 md:w-10 flex items-center justify-center">
            <FaUserCircle className="text-2xl md:text-xl text-gray-700" />
          </button>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 h-12 w-12 md:h-10 md:w-10 flex items-center justify-center"
            title="Sair"
            aria-label="Sair"
          >
            <FaSignOutAlt className="text-xl" />
          </button>
        </div>
      </div>
    </header>
  );
};

