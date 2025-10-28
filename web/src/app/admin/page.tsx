'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet, useUsers } from '@/hooks/useWallet';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import logger from '@/lib/logger';
import Link from 'next/link';

interface User {
  userAddress: string;
  role: string;
  status: string;
}

export default function AdminPage() {
  const router = useRouter();
  const { account, isAdmin } = useWallet();
  const { getAllUsers } = useUsers();
  
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // El admin puede acceder sin necesidad de tener un rol de usuario
    if (!account || !isAdmin) {
      router.push('/');
      return;
    }

    const loadData = async () => {
      try {
        setIsLoading(true);
        const allUsers = await getAllUsers();
        setUsers(allUsers);

        const stats = {
          total: allUsers.length,
          pending: allUsers.filter((u: User) => u.status === 'Pending').length,
          approved: allUsers.filter((u: User) => u.status === 'Approved').length,
          rejected: allUsers.filter((u: User) => u.status === 'Rejected').length,
        };
        setStats(stats);
      } catch (error) {
        logger.error(`Error loading users: ${error}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, isAdmin, router]);

  // El admin puede acceder sin currentUser (rol de usuario)
  if (!account || !isAdmin) {
    return null;
  }

  const getRoleStats = () => {
    const roles = users.reduce((acc: { [key: string]: number }, user) => {
      const role = user.role;
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(roles).map(([role, count]) => ({
      role,
      count,
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Panel de Administración</h1>
          <p className="text-gray-600 mt-1">Gestión del sistema</p>
        </div>
        <Link href="/admin/users">
          <Button>Gestionar Usuarios</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Cargando datos...</p>
        </div>
      ) : (
        <>
          {/* Estadísticas Generales */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="p-6">
              <div className="text-sm text-gray-600 mb-2">Total Usuarios</div>
              <div className="text-3xl font-bold">{stats.total}</div>
              <div className="text-xs text-gray-500 mt-1">
                Registrados en el sistema
              </div>
            </Card>

            <Card className="p-6 border-orange-200">
              <div className="text-sm text-gray-600 mb-2">Pendientes</div>
              <div className="text-3xl font-bold text-orange-600">{stats.pending}</div>
              <div className="text-xs text-gray-500 mt-1">
                Esperando aprobación
              </div>
            </Card>

            <Card className="p-6 border-green-200">
              <div className="text-sm text-gray-600 mb-2">Aprobados</div>
              <div className="text-3xl font-bold text-green-600">{stats.approved}</div>
              <div className="text-xs text-gray-500 mt-1">
                Usuarios activos
              </div>
            </Card>

            <Card className="p-6 border-red-200">
              <div className="text-sm text-gray-600 mb-2">Rechazados</div>
              <div className="text-3xl font-bold text-red-600">{stats.rejected}</div>
              <div className="text-xs text-gray-500 mt-1">
                Solicitudes denegadas
              </div>
            </Card>
          </div>

          {/* Distribución por Rol */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Distribución por Rol</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {getRoleStats().map(({ role, count }) => (
                <div key={role} className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 capitalize">{role}</div>
                  <div className="text-2xl font-bold mt-1">{count}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Solicitudes Pendientes */}
          {stats.pending > 0 && (
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  Solicitudes Pendientes ({stats.pending})
                </h2>
                <Link href="/admin/users">
                  <Button variant="outline" size="sm">
                    Ver Todas
                  </Button>
                </Link>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-sm text-orange-800">
                  Tienes <strong>{stats.pending}</strong> solicitud(es) de usuario esperando tu revisión.
                </p>
              </div>
            </Card>
          )}

          {/* Acciones Rápidas */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Acciones Rápidas</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-6">
                <h3 className="font-semibold mb-2">Gestión de Usuarios</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Aprobar o rechazar solicitudes de nuevos usuarios
                </p>
                <Link href="/admin/users">
                  <Button className="w-full">
                    Ir a Usuarios
                  </Button>
                </Link>
              </Card>

              <Card className="p-6 bg-blue-50 border-blue-200">
                <h3 className="font-semibold mb-2">🔍 Trazabilidad Completa</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Ver el árbol completo de tokens y todas las transferencias
                </p>
                <Link href="/admin/traceability">
                  <Button className="w-full">
                    Ver Trazabilidad
                  </Button>
                </Link>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-2">Volver al Dashboard</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Regresa a tu dashboard principal
                </p>
                <Link href="/dashboard">
                  <Button variant="outline" className="w-full">
                    Dashboard
                  </Button>
                </Link>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
