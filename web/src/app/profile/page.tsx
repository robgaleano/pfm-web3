'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet, useDashboard } from '@/hooks/useWallet';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  const { currentUser, account, isApproved, getStatusColor, disconnectWallet } = useWallet();
  const { getDashboardData } = useDashboard();
  
  const [stats, setStats] = useState({
    totalTokens: 0,
    totalTransfers: 0,
    pendingTransfers: 0,
    totalBalance: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!account || !currentUser) {
      router.push('/');
      return;
    }

    const loadStats = async () => {
      try {
        setIsLoading(true);
        if (isApproved) {
          const data = await getDashboardData();
          if (data) {
            setStats({
              totalTokens: data.totalTokens,
              totalTransfers: data.totalTransfers,
              pendingTransfers: data.pendingTransfersCount,
              totalBalance: data.totalBalance,
            });
          }
        }
      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, [account, currentUser, isApproved, router, getDashboardData]);

  if (!currentUser) {
    return null;
  }

  const getRoleLabel = (role: string) => {
    const roleMap: { [key: string]: string } = {
      'producer': 'Productor',
      'factory': 'Fábrica',
      'retailer': 'Minorista',
      'consumer': 'Consumidor',
      'admin': 'Administrador',
    };
    return roleMap[role.toLowerCase()] || role;
  };

  const getStatusLabel = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'Pending': 'Pendiente',
      'Approved': 'Aprobado',
      'Rejected': 'Rechazado',
    };
    return statusMap[status] || status;
  };

  const handleDisconnect = () => {
    if (confirm('¿Estás seguro de desconectar tu wallet?')) {
      disconnectWallet();
      router.push('/');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Mi Perfil</h1>
          <Button variant="outline" onClick={() => router.back()}>
            Volver
          </Button>
        </div>

        {/* Información del Usuario */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Información de la Cuenta</h2>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Dirección de Wallet</p>
              <p className="font-mono text-sm bg-gray-50 p-3 rounded break-all">
                {account}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Rol</p>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded bg-blue-100 text-blue-800 font-medium">
                    {getRoleLabel(currentUser.role)}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Estado</p>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded font-medium ${getStatusColor(currentUser.status)}`}>
                    {getStatusLabel(currentUser.status)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Estadísticas */}
        {isApproved && !isLoading && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Estadísticas</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Tokens</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalTokens}</p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Balance Total</p>
                <p className="text-2xl font-bold text-green-600">{stats.totalBalance}</p>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Transferencias</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalTransfers}</p>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Pendientes</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pendingTransfers}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Estado de la Cuenta */}
        {!isApproved && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Estado de la Cuenta</h2>
            
            {currentUser.status === 'Pending' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Tu solicitud está pendiente de aprobación.</strong>
                  <br />
                  Un administrador revisará tu solicitud pronto. Una vez aprobada, podrás acceder a todas las funcionalidades del sistema.
                </p>
              </div>
            )}

            {currentUser.status === 'Rejected' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  <strong>Tu solicitud fue rechazada.</strong>
                  <br />
                  Por favor contacta con un administrador para más información.
                </p>
              </div>
            )}
          </Card>
        )}

        {/* Acciones Rápidas */}
        {isApproved && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Acciones Rápidas</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/tokens">
                <Button variant="outline" className="w-full">
                  Ver Mis Tokens
                </Button>
              </Link>
              
              <Link href="/transfers">
                <Button variant="outline" className="w-full">
                  Ver Transferencias
                </Button>
              </Link>
              
              <Link href="/dashboard">
                <Button variant="outline" className="w-full">
                  Ir al Dashboard
                </Button>
              </Link>

              {currentUser.role.toLowerCase() !== 'consumer' && (
                <Link href="/tokens/create">
                  <Button variant="outline" className="w-full">
                    Crear Token
                  </Button>
                </Link>
              )}
            </div>
          </Card>
        )}

        {/* Configuración */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Configuración</h2>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Red:</strong> Anvil Local (Chain ID: 31337)
              </p>
              <p className="text-sm text-gray-600">
                <strong>RPC:</strong> http://localhost:8545
              </p>
            </div>

            <Button 
              variant="destructive" 
              onClick={handleDisconnect}
              className="w-full md:w-auto"
            >
              Desconectar Wallet
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
