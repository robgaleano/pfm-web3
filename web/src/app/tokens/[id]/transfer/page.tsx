'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useWallet, useTokens, useUsers, useTransfers } from '@/hooks/useWallet';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import logger from '@/lib/logger';

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
  const { getToken, getMyTokenBalance, getTokenLevel } = useTokens();
  const { transferToken, refreshData } = useTransfers();
  const { getApprovedUsers } = useUsers(); // ✅ Usar función pública
  
  const [tokenName, setTokenName] = useState('');
  const [balance, setBalance] = useState(0);
  const [tokenLevel, setTokenLevel] = useState<number | null>(null);
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [validRecipients, setValidRecipients] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [levelError, setLevelError] = useState<string | null>(null);

  useEffect(() => {
    if (!account || !currentUser || !isApproved) {
      router.push('/');
      return;
    }

    if (currentUser.role.toLowerCase() === 'consumer') {
      toast.warning('Acción no permitida', {
        description: 'Los consumidores no pueden transferir tokens'
      });
      router.push('/tokens');
      return;
    }

    const loadData = async () => {
      try {
        const tokenData = await getToken(tokenId);
        const tokenBalance = await getMyTokenBalance(tokenId);
        
        if (!tokenData || tokenBalance === 0) {
          toast.warning('Sin balance', {
            description: 'No tienes balance de este token'
          });
          router.push('/tokens');
          return;
        }

        setTokenName(tokenData.name);
        setBalance(tokenBalance);

        // ✅ Calcular nivel del token
        const level = await getTokenLevel(tokenId);
        setTokenLevel(level);

        // ✅ Validar que el nivel del token corresponde al rol del usuario
        const userRole = currentUser.role.toLowerCase();
        let errorMessage: string | null = null;

        if (userRole === 'producer') {
          if (level !== 0) {
            errorMessage = 'Como Productor, solo puedes transferir materias primas (nivel 0). Este token es de nivel ' + level + '.';
          }
        } else if (userRole === 'factory') {
          if (level === 0) {
            errorMessage = 'Como Fábrica, solo puedes transferir productos procesados (nivel 1). No puedes transferir materias primas (nivel 0) directamente a Minoristas.';
          } else if (level !== 1) {
            errorMessage = 'Como Fábrica, solo puedes transferir productos procesados (nivel 1). Este token es de nivel ' + level + '.';
          }
        } else if (userRole === 'retailer') {
          if (level === 1) {
            errorMessage = 'Como Minorista, solo puedes transferir productos finales (nivel 2). No puedes transferir productos de fábrica (nivel 1) directamente a Consumidores.';
          } else if (level !== 2) {
            errorMessage = 'Como Minorista, solo puedes transferir productos finales (nivel 2). Este token es de nivel ' + level + '.';
          }
        }

        setLevelError(errorMessage);

        // Si hay error de nivel, no cargar destinatarios
        if (errorMessage) {
          setValidRecipients([]);
          return;
        }

        // Obtener usuarios válidos según el rol
        const allUsers = await getApprovedUsers();
        
        let targetRole = '';
        if (userRole === 'producer') targetRole = 'factory';
        else if (userRole === 'factory') targetRole = 'retailer';
        else if (userRole === 'retailer') targetRole = 'consumer';

        const valid = allUsers.filter(
          (u: User) => {
            const userRoleTrimmed = u.role.toLowerCase().trim();
            const isApproved = u.status === 'Approved';
            const isTargetRole = userRoleTrimmed === targetRole;
            const isNotSelf = u.userAddress.toLowerCase() !== account.toLowerCase();
            
            return isApproved && isTargetRole && isNotSelf;
          }
        );

        logger.info(`Valid recipients found: ${valid.length}`);
        if (valid.length > 0) {
          logger.info(`Valid recipients addresses: ${valid.map(v => v.userAddress).join(', ')}`);
        }
        setValidRecipients(valid);
      } catch (error) {
        logger.error(`Error loading data: ${error}`);
        toast.error('Error al cargar datos', {
          description: 'No se pudieron cargar los datos del token'
        });
        router.push('/tokens');
      }
    };

    if (tokenId) {
      loadData();
    }
    // ✅ Removidas las funciones de las dependencias para evitar loop infinito
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, currentUser, isApproved, tokenId, router]);

  if (!currentUser || !isApproved) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevenir doble submit
    if (isLoading) return;

    if (!recipient) {
      toast.warning('Selecciona un destinatario', {
        description: 'Por favor selecciona un destinatario para la transferencia'
      });
      return;
    }

    const transferAmount = parseInt(amount);
    if (!transferAmount || transferAmount <= 0) {
      toast.warning('Cantidad inválida', {
        description: 'Por favor ingresa una cantidad válida mayor a 0'
      });
      return;
    }

    if (transferAmount > balance) {
      toast.warning('Balance insuficiente', {
        description: `Tu balance es ${balance}, no puedes transferir ${transferAmount}`
      });
      return;
    }

    setIsLoading(true);

    try {
      await transferToken(recipient, tokenId, transferAmount);
      
      toast.success('Transferencia iniciada exitosamente', {
        description: 'Esperando aceptación del destinatario'
      });
      
      // ✅ Refrescar datos del contexto antes de redirigir
      await refreshData();
      
      setTimeout(() => {
        router.push('/transfers');
      }, 500); // Reducido a 500ms ya que refreshData ya esperó
    } catch (error) {
      setIsLoading(false);
      logger.error(`Error transferring token: ${error}`);
      toast.error('Error al transferir token', {
        description: error instanceof Error ? error.message : 'Intenta nuevamente'
      });
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
          {tokenLevel !== null && (
            <p className="text-sm text-blue-800 mt-1">
              <strong>Nivel del Token:</strong> {tokenLevel} ({
                tokenLevel === 0 ? 'Materia Prima' :
                tokenLevel === 1 ? 'Producto Procesado' :
                tokenLevel === 2 ? 'Producto Final' :
                'Nivel ' + tokenLevel
              })
            </p>
          )}
        </div>

        {/* ✅ Mostrar error de nivel si existe */}
        {levelError ? (
          <div className="text-center py-8">
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
              <h3 className="font-semibold text-lg mb-3 text-red-800 flex items-center justify-center gap-2">
                <span className="text-2xl">🚫</span>
                Transferencia No Permitida
              </h3>
              <p className="text-red-700 mb-4">
                {levelError}
              </p>
              <div className="mt-4 p-3 bg-red-100 rounded border border-red-200">
                <p className="text-sm text-red-800 font-semibold mb-2">
                  📋 Reglas de la Cadena de Suministro:
                </p>
                <ul className="text-xs text-red-700 space-y-1 text-left">
                  <li>• <strong>Productor</strong> → Solo transfiere <strong>materias primas (nivel 0)</strong> a Fábricas</li>
                  <li>• <strong>Fábrica</strong> → Solo transfiere <strong>productos procesados (nivel 1)</strong> a Minoristas</li>
                  <li>• <strong>Minorista</strong> → Solo transfiere <strong>productos finales (nivel 2)</strong> a Consumidores</li>
                </ul>
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                <p className="text-sm text-blue-800">
                  💡 <strong>¿Qué hacer?</strong>
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  {currentUser.role.toLowerCase() === 'factory' && tokenLevel === 0 && (
                    <>Primero debes <strong>procesar</strong> este material creando un nuevo token (nivel 1) usando este token como materia prima.</>
                  )}
                  {currentUser.role.toLowerCase() === 'retailer' && tokenLevel === 1 && (
                    <>Primero debes <strong>crear un producto final</strong> (nivel 2) usando este token de fábrica como base.</>
                  )}
                  {tokenLevel !== 0 && tokenLevel !== 1 && (
                    <>Este token no puede ser transferido por tu rol. Verifica que tengas el token correcto.</>
                  )}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={() => router.back()}>
              Volver a Mis Tokens
            </Button>
          </div>
        ) : validRecipients.length === 0 ? (
          <div className="text-center py-8">
            <div className="mb-4">
              <p className="text-gray-600 mb-2">
                No hay usuarios de tipo <strong>{getNextRoleInfo()}</strong> disponibles para recibir la transferencia.
              </p>
              <p className="text-sm text-gray-500">
                Como <strong>{getRoleLabel(currentUser?.role || '')}</strong>, solo puedes transferir a usuarios de tipo <strong>{getNextRoleInfo()}</strong>.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Por favor, solicita al administrador que apruebe usuarios de tipo {getNextRoleInfo()}.
              </p>
            </div>
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
