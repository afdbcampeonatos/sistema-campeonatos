"use client";

import { PublicHeader } from "@/components/PublicHeader";
import Link from "next/link";
import { FaArrowRight, FaTrophy } from "react-icons/fa";

interface Championship {
  id: string;
  name: string;
  slug: string;
  category: string;
  status: string;
  createdAt: Date;
}

interface PublicChampionshipsClientProps {
  championships: Championship[];
}

export const PublicChampionshipsClient = ({
  championships,
}: PublicChampionshipsClientProps) => {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader />
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Campeonatos Abertos
          </h1>
          <p className="text-gray-600">
            Confira os campeonatos com inscrições abertas e inscreva sua equipe
          </p>
        </div>

        {championships.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <FaTrophy className="text-6xl text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Nenhum campeonato aberto no momento
            </h2>
            <p className="text-gray-600">
              Novos campeonatos serão divulgados em breve
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {championships.map((championship) => (
              <div
                key={championship.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <FaTrophy className="text-blue-900 text-xl" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {championship.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {championship.category}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    Inscrições Abertas
                  </span>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    Criado em: {formatDate(championship.createdAt)}
                  </p>
                </div>

                <Link
                  href={`/campeonatos/${championship.slug}`}
                  className="flex items-center justify-center gap-2 w-full bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors font-medium"
                >
                  Inscrever Equipe
                  <FaArrowRight />
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
