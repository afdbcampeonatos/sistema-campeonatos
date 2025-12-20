'use client';

import Link from 'next/link';

export const PublicHeader = () => {
  return (
    <header className="bg-white border-b border-gray-200 py-4 px-6">
      <div className="max-w-7xl mx-auto">
        <Link href="/" className="inline-block">
          <h1 className="text-2xl font-bold text-blue-900">AFDB CAMPEONATOS</h1>
        </Link>
      </div>
    </header>
  );
};

