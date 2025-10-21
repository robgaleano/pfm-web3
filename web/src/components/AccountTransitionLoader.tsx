'use client';

import { useEffect, useState } from 'react';

interface AccountTransitionLoaderProps {
  isTransitioning: boolean;
  message?: string;
}

export function AccountTransitionLoader({ 
  isTransitioning, 
  message = 'Cambiando de cuenta...' 
}: AccountTransitionLoaderProps) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (!isTransitioning) return;

    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);

    return () => clearInterval(interval);
  }, [isTransitioning]);

  if (!isTransitioning) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center space-y-6">
        {/* Logo animado */}
        <div className="relative w-24 h-24 mx-auto">
          <div className="absolute inset-0 border-4 border-blue-200 rounded-full animate-ping opacity-75"></div>
          <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-2 bg-blue-500 rounded-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-white animate-pulse"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
        </div>

        {/* Texto animado */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {message}
            <span className="inline-block w-12 text-left">{dots}</span>
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Cargando tu información de usuario
          </p>
        </div>

        {/* Barra de progreso animada */}
        <div className="w-64 mx-auto">
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-progress"></div>
          </div>
        </div>

        {/* Detalles adicionales */}
        <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Conectado a Blockchain</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-100"></div>
            <span>Sincronizando datos...</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes progress {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(400%);
          }
        }

        .animate-progress {
          animation: progress 1.5s ease-in-out infinite;
        }

        .delay-100 {
          animation-delay: 0.1s;
        }
      `}</style>
    </div>
  );
}
