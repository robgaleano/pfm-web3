'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet, useUsers } from '@/hooks/useWallet';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import logger from '@/lib/logger';

export default function Home() {
  const router = useRouter();
  const { account, connectWallet, currentUser, isAdmin, isApproved } = useWallet();
  const { requestRole } = useUsers();
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConnect = async () => {
    try {
      await connectWallet();
    } catch (error) {
      logger.error(`Error connecting wallet: ${error}`);
    }
  };

  const handleRequestRole = async () => {
    if (!selectedRole) {
      alert('Por favor selecciona un rol');
      return;
    }

    try {
      setIsSubmitting(true);
      await requestRole(selectedRole);
      alert('Solicitud enviada exitosamente. Espera la aprobación del administrador.');
    } catch (error) {
      logger.error(`Error requesting role: ${error}`);
      alert('Error al solicitar rol');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Redirigir según el tipo de usuario
  useEffect(() => {
    if (!account) return;

    // Si es admin (sin necesidad de rol), ir a admin
    if (isAdmin && !currentUser) {
      router.push('/admin');
      return;
    }

    // Si tiene rol aprobado, ir a dashboard
    if (currentUser && isApproved) {
      router.push('/dashboard');
      return;
    }
  }, [account, isAdmin, currentUser, isApproved, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">
            Supply Chain Tracker
          </h1>
          <p className="text-gray-600">
            Sistema de trazabilidad blockchain
          </p>
        </div>

        {!account ? (
          <div className="space-y-4">
            <p className="text-center text-gray-700">
              Conecta tu billetera MetaMask para comenzar
            </p>
            <Button onClick={handleConnect} className="w-full" size="lg">
              Conectar Wallet
            </Button>
          </div>
        ) : isAdmin && !currentUser ? (
          // Admin puro - redirigiendo a panel de administración
          <div className="space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm text-purple-800">
                <strong>👑 Administrador detectado</strong>
              </p>
              <p className="text-xs text-purple-700 mt-2">
                Redirigiendo al panel de administración...
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Wallet:</strong><br />
                <span className="font-mono text-xs break-all">{account}</span>
              </p>
            </div>
          </div>
        ) : !currentUser ? (
          // Usuario sin rol - mostrar formulario
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Wallet conectada:</strong><br />
                <span className="font-mono text-xs break-all">{account}</span>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Selecciona tu rol</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="producer">Producer (Productor)</SelectItem>
                  <SelectItem value="factory">Factory (Fábrica)</SelectItem>
                  <SelectItem value="retailer">Retailer (Minorista)</SelectItem>
                  <SelectItem value="consumer">Consumer (Consumidor)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleRequestRole} className="w-full" disabled={isSubmitting || !selectedRole}>
              {isSubmitting ? 'Solicitando...' : 'Solicitar Rol'}
            </Button>
          </div>
        ) : currentUser.status === 'Pending' ? (
          // Usuario con solicitud pendiente
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Estado:</strong> Solicitud pendiente
              </p>
              <p className="text-xs text-yellow-700 mt-2">
                Tu solicitud de rol <strong>{currentUser.role}</strong> está esperando aprobación del administrador.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Wallet:</strong><br />
                <span className="font-mono text-xs break-all">{account}</span>
              </p>
            </div>

            <p className="text-center text-sm text-gray-600">
              Recibirás acceso cuando un administrador apruebe tu solicitud.
            </p>
          </div>
        ) : currentUser.status === 'Rejected' ? (
          // Usuario rechazado
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                <strong>Estado:</strong> Solicitud rechazada
              </p>
              <p className="text-xs text-red-700 mt-2">
                Tu solicitud de rol <strong>{currentUser.role}</strong> fue rechazada por el administrador.
              </p>
            </div>

            <Button onClick={() => setSelectedRole('')} className="w-full" variant="outline">
              Solicitar Otro Rol
            </Button>
          </div>
        ) : null}

        <div className="text-center text-xs text-gray-500 pt-4 border-t">
          <p>Asegúrate de estar conectado a la red Anvil (localhost:8545)</p>
        </div>
      </Card>
    </div>
  );
}