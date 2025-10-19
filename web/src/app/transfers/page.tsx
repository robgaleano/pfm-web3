'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet, useTransfers, useTokens } from '@/hooks/useWallet';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import logger from '@/lib/logger';

interface Transfer {
  id: number;
  from: string;
  to: string;
  tokenId: number;
  amount: number;
  status: string;
  dateCreated: number;
}

interface TransferWithToken extends Transfer {
  tokenName: string;
}

export default function TransfersPage() {
  const router = useRouter();
  const { currentUser, account, isApproved, getStatusColor } = useWallet();
  const { getMyTransfers, getMyPendingTransfers, getTransfer, acceptTransfer, rejectTransfer } = useTransfers();
  const { getToken } = useTokens();
  
  const [allTransfers, setAllTransfers] = useState<TransferWithToken[]>([]);
  const [pendingTransfers, setPendingTransfers] = useState<TransferWithToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const loadTransfers = async () => {
    try {
      setIsLoading(true);
      const [transferIds, pendingIds] = await Promise.all([
        getMyTransfers(),
        getMyPendingTransfers(),
      ]);

      const allTransfersData = await Promise.all(
        transferIds.map(async (id) => {
          const transfer = await getTransfer(id);
          if (!transfer) return null;
          
          const token = await getToken(transfer.tokenId);
          return {
            ...transfer,
            tokenName: token?.name || `Token #${transfer.tokenId}`,
          };
        })
      );

      const pendingTransfersData = await Promise.all(
        pendingIds.map(async (id) => {
          const transfer = await getTransfer(id);
          if (!transfer) return null;
          
          const token = await getToken(transfer.tokenId);
          return {
            ...transfer,
            tokenName: token?.name || `Token #${transfer.tokenId}`,
          };
        })
      );

      setAllTransfers(allTransfersData.filter(t => t !== null) as TransferWithToken[]);
      setPendingTransfers(pendingTransfersData.filter(t => t !== null) as TransferWithToken[]);
    } catch (error) {
      logger.error(`Error loading transfers: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!account || !currentUser || !isApproved) {
      router.push('/');
      return;
    }

    loadTransfers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, currentUser, isApproved, router]);

  if (!currentUser || !isApproved) {
    return null;
  }

  const handleAccept = async (transferId: number) => {
    try {
      setProcessingId(transferId);
      await acceptTransfer(transferId);
      alert('Transferencia aceptada exitosamente');
      await loadTransfers();
    } catch (error) {
      logger.error(`Error accepting transfer: ${error}`);
      alert(error instanceof Error ? error.message : 'Error al aceptar transferencia');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (transferId: number) => {
    if (!confirm('¿Estás seguro de rechazar esta transferencia?')) {
      return;
    }

    try {
      setProcessingId(transferId);
      await rejectTransfer(transferId);
      alert('Transferencia rechazada');
      await loadTransfers();
    } catch (error) {
      logger.error(`Error rejecting transfer: ${error}`);
      alert(error instanceof Error ? error.message : 'Error al rechazar transferencia');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusLabel = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'Pending': 'Pendiente',
      'Accepted': 'Aceptada',
      'Rejected': 'Rechazada',
      'Canceled': 'Cancelada',
    };
    return statusMap[status] || status;
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <h1 className="text-3xl font-bold">Transferencias</h1>

      {/* Transferencias Pendientes */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">
          Pendientes de Aceptar ({pendingTransfers.length})
        </h2>

        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Cargando transferencias...</p>
          </div>
        ) : pendingTransfers.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-600">No tienes transferencias pendientes</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {pendingTransfers.map((transfer) => (
              <Card key={transfer.id} className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{transfer.tokenName}</h3>
                      <span className="text-sm px-2 py-1 rounded bg-orange-100 text-orange-800">
                        {getStatusLabel(transfer.status)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">De:</span>{' '}
                        <span className="font-mono">{transfer.from.slice(0, 10)}...{transfer.from.slice(-8)}</span>
                      </div>
                      <div>
                        <span className="font-medium">Cantidad:</span> {transfer.amount}
                      </div>
                      <div>
                        <span className="font-medium">Token ID:</span> #{transfer.tokenId}
                      </div>
                      <div>
                        <span className="font-medium">Transfer ID:</span> #{transfer.id}
                      </div>
                    </div>

                    {transfer.dateCreated > 0 && (
                      <p className="text-xs text-gray-500">
                        {new Date(transfer.dateCreated * 1000).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleAccept(transfer.id)}
                      disabled={processingId === transfer.id}
                      className="flex-1 md:flex-initial"
                    >
                      {processingId === transfer.id ? 'Procesando...' : 'Aceptar'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleReject(transfer.id)}
                      disabled={processingId === transfer.id}
                      className="flex-1 md:flex-initial"
                    >
                      Rechazar
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Historial de Transferencias */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">
          Historial ({allTransfers.length})
        </h2>

        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Cargando historial...</p>
          </div>
        ) : allTransfers.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-600">No tienes transferencias aún</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {allTransfers.map((transfer) => {
              const isSender = transfer.from.toLowerCase() === account?.toLowerCase();
              
              return (
                <Card key={transfer.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{transfer.tokenName}</h4>
                        <span className={`text-xs px-2 py-1 rounded ${getStatusColor(transfer.status)}`}>
                          {getStatusLabel(transfer.status)}
                        </span>
                        {isSender && (
                          <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                            Enviado
                          </span>
                        )}
                        {!isSender && (
                          <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800">
                            Recibido
                          </span>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>
                          <span className="font-medium">
                            {isSender ? 'Para:' : 'De:'}
                          </span>{' '}
                          <span className="font-mono">
                            {(isSender ? transfer.to : transfer.from).slice(0, 10)}...
                            {(isSender ? transfer.to : transfer.from).slice(-8)}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Cantidad:</span> {transfer.amount}
                          {' '} | {' '}
                          <span className="font-medium">Transfer ID:</span> #{transfer.id}
                        </div>
                      </div>
                    </div>

                    {transfer.dateCreated > 0 && (
                      <div className="text-xs text-gray-500 text-right">
                        {new Date(transfer.dateCreated * 1000).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
