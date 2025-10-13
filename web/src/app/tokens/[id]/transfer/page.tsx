'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useWallet, useTokens, useUsers, useTransfers } from '@/hooks/useWallet';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface User {
  userAddress: string;
  role: string;
  status: string;
}

export default function TransferTokenPage() {
  const router = useRouter();
  const params = useParams();
  const tokenId = parseInt(params.id as string);
  
  const { currentUser, account, isApproved } = useWallet();
  const { getToken, getMyTokenBalance } = useTokens();
  const { transferToken } = useTransfers();
  const { getAllUsers } = useUsers();
  
  const [tokenName, setTokenName] = useState('');
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [validRecipients, setValidRecipients] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!account || !currentUser || !isApproved) {
      router.push('/');
      return;
    }

    if (currentUser.role.toLowerCase() === 'consumer') {
      alert('Los consumidores no pueden transferir tokens');
      router.push('/tokens');
      return;
    }

    const loadData = async () => {
      try {
        const tokenData = await getToken(tokenId);
        const tokenBalance = await getMyTokenBalance(tokenId);
        
        if (!tokenData || tokenBalance === 0) {
          alert('No tienes balance de este token');
          router.push('/tokens');
          return;
        }

        setTokenName(tokenData.name);
        setBalance(tokenBalance);

        // Obtener usuarios válidos según el rol
        const allUsers = await getAllUsers();
        const userRole = currentUser.role.toLowerCase();
        
        let targetRole = '';
        if (userRole === 'producer') targetRole = 'factory';
        else if (userRole === 'factory') targetRole = 'retailer';
        else if (userRole === 'retailer') targetRole = 'consumer';

        const valid = allUsers.filter(
          (u: User) => 
            u.status === 'Approved' && 
            u.role.toLowerCase() === targetRole &&
            u.userAddress.toLowerCase() !== account.toLowerCase()
        );

        setValidRecipients(valid);
      } catch (error) {
        console.error('Error loading data:', error);
        alert('Error al cargar datos');
        router.push('/tokens');
      }
    };

    if (tokenId) {
      loadData();
    }
  }, [account, currentUser, isApproved, tokenId, router, getToken, getMyTokenBalance, getAllUsers]);

  if (!currentUser || !isApproved) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!recipient) {
      alert('Por favor selecciona un destinatario');
      return;
    }

    const transferAmount = parseInt(amount);
    if (!transferAmount || transferAmount <= 0) {
      alert('Por favor ingresa una cantidad válida');
      return;
    }

    if (transferAmount > balance) {
      alert('No tienes suficiente balance');
      return;
    }

    try {
      setIsLoading(true);
      await transferToken(recipient, tokenId, transferAmount);
      
      alert('Transferencia iniciada exitosamente. Esperando aceptación del destinatario.');
      router.push('/transfers');
    } catch (error) {
      console.error('Error transferring token:', error);
      alert(error instanceof Error ? error.message : 'Error al transferir token');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleLabel = (role: string) => {
    const roleMap: { [key: string]: string } = {
      'producer': 'Productor',
      'factory': 'Fábrica',
      'retailer': 'Minorista',
      'consumer': 'Consumidor'
    };
    return roleMap[role.toLowerCase()] || role;
  };

  const getNextRoleInfo = () => {
    const role = currentUser.role.toLowerCase();
    if (role === 'producer') return 'Fábrica';
    if (role === 'factory') return 'Minorista';
    if (role === 'retailer') return 'Consumidor';
    return '';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Transferir Token</h1>

        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Token:</strong> {tokenName} (ID: #{tokenId})
          </p>
          <p className="text-sm text-blue-800 mt-1">
            <strong>Tu Balance:</strong> {balance} unidades
          </p>
        </div>

        {validRecipients.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">
              No hay usuarios de tipo <strong>{getNextRoleInfo()}</strong> disponibles para recibir la transferencia.
            </p>
            <Button variant="outline" onClick={() => router.back()}>
              Volver
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="recipient">Destinatario ({getNextRoleInfo()})</Label>
              <Select value={recipient} onValueChange={setRecipient}>
                <SelectTrigger id="recipient">
                  <SelectValue placeholder="Selecciona un destinatario" />
                </SelectTrigger>
                <SelectContent>
                  {validRecipients.map((user) => (
                    <SelectItem key={user.userAddress} value={user.userAddress}>
                      {getRoleLabel(user.role)} - {user.userAddress.slice(0, 8)}...{user.userAddress.slice(-6)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Cantidad a Transferir</Label>
              <Input
                id="amount"
                type="number"
                min="1"
                max={balance}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`Máximo: ${balance}`}
                required
              />
              <p className="text-xs text-gray-500">
                Balance disponible: {balance} unidades
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-sm mb-2 text-yellow-800">⚠️ Importante</h3>
              <ul className="text-xs text-yellow-700 space-y-1">
                <li>• La transferencia quedará pendiente hasta que el destinatario la acepte</li>
                <li>• El destinatario puede aceptar o rechazar la transferencia</li>
                <li>• Los tokens transferidos quedarán en espera hasta ser aceptados</li>
                <li>• Solo puedes transferir a usuarios del siguiente rol en la cadena</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? 'Transfiriendo...' : 'Transferir'}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
