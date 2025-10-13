'use client';

import { useWallet, useDashboard } from '@/hooks/useWallet';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const router = useRouter();
  const { currentUser, account, isApproved } = useWallet();
  const { getDashboardData } = useDashboard();
  const [stats, setStats] = useState({
    totalTokens: 0,
    totalTransfers: 0,
    pendingTransfers: 0,
  });

  useEffect(() => {
    if (!account || !currentUser || !isApproved) {
      router.push('/');
      return;
    }

    const loadStats = async () => {
      const data = await getDashboardData();
      if (data) {
        setStats({
          totalTokens: data.totalTokens,
          totalTransfers: data.totalTransfers,
          pendingTransfers: data.pendingTransfersCount,
        });
      }
    };

    loadStats();
  }, [account, currentUser, isApproved, router, getDashboardData]);

  if (!currentUser || !isApproved) {
    return null;
  }

  const getRoleActions = () => {
    const role = currentUser.role.toLowerCase();
    
    if (role === 'producer') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/tokens/create">
            <Button className="w-full h-24 text-lg">
              Crear Materia Prima
            </Button>
          </Link>
          <Link href="/tokens">
            <Button variant="outline" className="w-full h-24 text-lg">
              Ver Mis Tokens
            </Button>
          </Link>
        </div>
      );
    }
    
    if (role === 'factory') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/tokens/create">
            <Button className="w-full h-24 text-lg">
              Procesar Material
            </Button>
          </Link>
          <Link href="/transfers">
            <Button variant="outline" className="w-full h-24 text-lg">
              Gestionar Transferencias
            </Button>
          </Link>
        </div>
      );
    }
    
    if (role === 'retailer') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/tokens/create">
            <Button className="w-full h-24 text-lg">
              Crear Producto Final
            </Button>
          </Link>
          <Link href="/transfers">
            <Button variant="outline" className="w-full h-24 text-lg">
              Gestionar Transferencias
            </Button>
          </Link>
        </div>
      );
    }
    
    if (role === 'consumer') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/tokens">
            <Button className="w-full h-24 text-lg">
              Mis Productos
            </Button>
          </Link>
          <Link href="/transfers">
            <Button variant="outline" className="w-full h-24 text-lg">
              Ver Transferencias
            </Button>
          </Link>
        </div>
      );
    }
    
    if (role === 'admin') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/admin/users">
            <Button className="w-full h-24 text-lg">
              Gestionar Usuarios
            </Button>
          </Link>
          <Link href="/admin">
            <Button variant="outline" className="w-full h-24 text-lg">
              Panel Admin
            </Button>
          </Link>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Bienvenido, <span className="font-semibold capitalize">{currentUser.role}</span>
          </p>
        </div>
        <Link href="/profile">
          <Button variant="outline">Mi Perfil</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="text-sm text-gray-600 mb-2">Total Tokens</div>
          <div className="text-3xl font-bold">{stats.totalTokens}</div>
          <div className="text-xs text-gray-500 mt-1">
            Tokens bajo tu propiedad
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-sm text-gray-600 mb-2">Transferencias</div>
          <div className="text-3xl font-bold">{stats.totalTransfers}</div>
          <div className="text-xs text-gray-500 mt-1">
            Total de transferencias
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-sm text-gray-600 mb-2">Pendientes</div>
          <div className="text-3xl font-bold text-orange-600">{stats.pendingTransfers}</div>
          <div className="text-xs text-gray-500 mt-1">
            Transferencias por gestionar
          </div>
        </Card>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Wallet:</strong> <span className="font-mono">{account}</span>
        </p>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Acciones Rápidas</h2>
        {getRoleActions()}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <h3 className="font-semibold mb-2">Gestión de Tokens</h3>
          <p className="text-sm text-gray-600 mb-4">
            Administra tus tokens y realiza transferencias
          </p>
          <Link href="/tokens">
            <Button variant="outline" className="w-full">
              Ver Todos los Tokens
            </Button>
          </Link>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-2">Transferencias</h3>
          <p className="text-sm text-gray-600 mb-4">
            Revisa y gestiona transferencias pendientes
          </p>
          <Link href="/transfers">
            <Button variant="outline" className="w-full">
              Ir a Transferencias
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
