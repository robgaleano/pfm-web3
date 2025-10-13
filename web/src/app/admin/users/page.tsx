'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet, useUsers } from '@/hooks/useWallet';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface User {
  userAddress: string;
  role: string;
  status: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { currentUser, account, isAdmin, getStatusColor } = useWallet();
  const { getAllUsers, approveUser, rejectUser } = useUsers();
  
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [processingAddress, setProcessingAddress] = useState<string | null>(null);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const allUsers = await getAllUsers();
      setUsers(allUsers);
      applyFilters(allUsers, statusFilter, roleFilter);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = (userList: User[], status: string, role: string) => {
    let filtered = [...userList];

    if (status !== 'all') {
      filtered = filtered.filter((u) => u.status === status);
    }

    if (role !== 'all') {
      filtered = filtered.filter((u) => u.role.toLowerCase() === role.toLowerCase());
    }

    setFilteredUsers(filtered);
  };

  useEffect(() => {
    if (!account || !currentUser || !isAdmin) {
      router.push('/');
      return;
    }

    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, currentUser, isAdmin, router]);

  useEffect(() => {
    applyFilters(users, statusFilter, roleFilter);
  }, [statusFilter, roleFilter, users]);

  if (!currentUser || !isAdmin) {
    return null;
  }

  const handleApprove = async (userAddress: string) => {
    try {
      setProcessingAddress(userAddress);
      await approveUser(userAddress);
      alert('Usuario aprobado exitosamente');
      await loadUsers();
    } catch (error) {
      console.error('Error approving user:', error);
      alert(error instanceof Error ? error.message : 'Error al aprobar usuario');
    } finally {
      setProcessingAddress(null);
    }
  };

  const handleReject = async (userAddress: string) => {
    if (!confirm('¿Estás seguro de rechazar esta solicitud?')) {
      return;
    }

    try {
      setProcessingAddress(userAddress);
      await rejectUser(userAddress);
      alert('Usuario rechazado');
      await loadUsers();
    } catch (error) {
      console.error('Error rejecting user:', error);
      alert(error instanceof Error ? error.message : 'Error al rechazar usuario');
    } finally {
      setProcessingAddress(null);
    }
  };

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

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
          <p className="text-gray-600 mt-1">
            {filteredUsers.length} de {users.length} usuarios
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          Volver
        </Button>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Filtrar por Estado</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los Estados</SelectItem>
                <SelectItem value="Pending">Pendientes</SelectItem>
                <SelectItem value="Approved">Aprobados</SelectItem>
                <SelectItem value="Rejected">Rechazados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Filtrar por Rol</label>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los Roles</SelectItem>
                <SelectItem value="producer">Productor</SelectItem>
                <SelectItem value="factory">Fábrica</SelectItem>
                <SelectItem value="retailer">Minorista</SelectItem>
                <SelectItem value="consumer">Consumidor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Lista de Usuarios */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Cargando usuarios...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-600">No hay usuarios que coincidan con los filtros</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((user) => (
            <Card key={user.userAddress} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-mono text-sm break-all">
                      {user.userAddress}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm px-3 py-1 rounded bg-blue-100 text-blue-800 font-medium">
                      {getRoleLabel(user.role)}
                    </span>
                    <span className={`text-sm px-3 py-1 rounded font-medium ${getStatusColor(user.status)}`}>
                      {getStatusLabel(user.status)}
                    </span>
                  </div>
                </div>

                {user.status === 'Pending' && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleApprove(user.userAddress)}
                      disabled={processingAddress === user.userAddress}
                      size="sm"
                      className="flex-1 md:flex-initial"
                    >
                      {processingAddress === user.userAddress ? 'Procesando...' : 'Aprobar'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleReject(user.userAddress)}
                      disabled={processingAddress === user.userAddress}
                      size="sm"
                      className="flex-1 md:flex-initial"
                    >
                      Rechazar
                    </Button>
                  </div>
                )}

                {user.status === 'Approved' && (
                  <div className="text-sm text-green-600 font-medium">
                    ✓ Usuario Activo
                  </div>
                )}

                {user.status === 'Rejected' && (
                  <div className="text-sm text-red-600 font-medium">
                    ✗ Solicitud Rechazada
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
