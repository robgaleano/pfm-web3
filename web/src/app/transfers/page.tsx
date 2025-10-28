'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet, useTransfers, useTokens } from '@/hooks/useWallet';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
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
  const { currentUser, account, isApproved, getStatusColor, isAdmin } = useWallet();
  const { getMyTransfers, getMyPendingTransfers, getAllTransfers, getTransfer, acceptTransfer, rejectTransfer } = useTransfers();
  const { getToken } = useTokens();
  
  const [allTransfers, setAllTransfers] = useState<TransferWithToken[]>([]);
  const [pendingTransfers, setPendingTransfers] = useState<TransferWithToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [transferToReject, setTransferToReject] = useState<number | null>(null);

  const loadTransfers = async () => {
    try {
      setIsLoading(true);
      
      // ✅ Si es admin, obtener TODAS las transferencias; sino, solo las del usuario
      let transferIds: number[];
      let pendingIds: number[];
      
      if (isAdmin) {
        transferIds = await getAllTransfers();
        // Para admin, las pendientes son las que están en estado Pending (sin filtrar por receptor)
        pendingIds = [];
      } else {
        [transferIds, pendingIds] = await Promise.all([
          getMyTransfers(),
          getMyPendingTransfers(),
        ]);
      }

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
    
    // ✅ Recargar cuando la página gana foco (usuario vuelve de otra pestaña o navegación)
    const handleFocus = () => {
      loadTransfers();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, currentUser, isApproved, isAdmin, router]);

  if (!currentUser || !isApproved) {
    return null;
  }

  const handleAccept = async (transferId: number) => {
    if (processingId !== null) return;

    try {
      setProcessingId(transferId);
      
      await acceptTransfer(transferId);
      
      // ✅ FIX BUG 3: Limpiar estado y esperar confirmación de blockchain
      setAllTransfers([]);
      setPendingTransfers([]);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await loadTransfers();
      
      toast.success('Transferencia aceptada exitosamente', {
        description: `Transfer ID: ${transferId}`
      });
    } catch (error) {
      logger.error(`Error accepting transfer: ${error}`);
      toast.error('Error al aceptar transferencia', {
        description: error instanceof Error ? error.message : 'Intenta nuevamente'
      });
      await loadTransfers();
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (transferId: number) => {
    // Prevenir doble click
    if (processingId !== null) return;

    // Abrir dialog de confirmación
    setTransferToReject(transferId);
    setRejectDialogOpen(true);
  };

  const confirmReject = async () => {
    if (!transferToReject) return;

    try {
      setProcessingId(transferToReject);
      setRejectDialogOpen(false);
      
      await rejectTransfer(transferToReject);
      
      // ✅ FIX BUG 3: Limpiar estado y esperar confirmación de blockchain
      setAllTransfers([]);
      setPendingTransfers([]);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await loadTransfers();
      
      toast.info('Transferencia rechazada', {
        description: `Transfer ID: ${transferToReject}`
      });
    } catch (error) {
      logger.error(`Error rejecting transfer: ${error}`);
      toast.error('Error al rechazar transferencia', {
        description: error instanceof Error ? error.message : 'Intenta nuevamente'
      });
      await loadTransfers();
    } finally {
      setProcessingId(null);
      setTransferToReject(null);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {isAdmin ? 'Todas las Transferencias del Sistema' : 'Transferencias'}
          </h1>
          {isAdmin && (
            <p className="text-sm text-gray-600 mt-1">
              Vista de administrador - Modo solo lectura
            </p>
          )}
        </div>
        <Button
          onClick={() => loadTransfers()}
          disabled={isLoading}
          variant="outline"
          className="flex items-center gap-2"
        >
          <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {isLoading ? 'Actualizando...' : 'Actualizar'}
        </Button>
      </div>

      {/* Transferencias Pendientes - Solo mostrar si NO es admin */}
      {!isAdmin && (
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

                  <TooltipProvider>
                    <div className="flex gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={() => handleAccept(transfer.id)}
                            disabled={processingId === transfer.id}
                            className="flex-1 md:flex-initial"
                          >
                            {processingId === transfer.id ? 'Procesando...' : 'Aceptar'}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-sm">Requiere transacción en blockchain</p>
                          <p className="text-xs text-muted-foreground">Se te pedirá aprobar con MetaMask</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            onClick={() => handleReject(transfer.id)}
                            disabled={processingId === transfer.id}
                            className="flex-1 md:flex-initial"
                          >
                            Rechazar
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-sm">Requiere transacción en blockchain</p>
                          <p className="text-xs text-muted-foreground">Se te pedirá aprobar con MetaMask</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TooltipProvider>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
      )} {/* ✅ Cierre del bloque de pendientes (solo para no-admin) */}

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
            <p className="text-gray-600">
              {isAdmin ? 'No hay transferencias en el sistema aún' : 'No tienes transferencias aún'}
            </p>
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
                        {/* ✅ Solo mostrar "Enviado/Recibido" si la transferencia fue ACEPTADA */}
                        {!isAdmin && transfer.status === 'Accepted' && isSender && (
                          <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                            Enviado
                          </span>
                        )}
                        {!isAdmin && transfer.status === 'Accepted' && !isSender && (
                          <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800">
                            Recibido
                          </span>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>
                          <span className="font-medium">
                            {isAdmin || isSender ? 'De:' : 'Para:'}
                          </span>{' '}
                          <span className="font-mono">
                            {(isAdmin ? transfer.from : (isSender ? transfer.to : transfer.from)).slice(0, 10)}...
                            {(isAdmin ? transfer.from : (isSender ? transfer.to : transfer.from)).slice(-8)}
                          </span>
                        </div>
                        {isAdmin && (
                          <div>
                            <span className="font-medium">Para:</span>{' '}
                            <span className="font-mono">
                              {transfer.to.slice(0, 10)}...{transfer.to.slice(-8)}
                            </span>
                          </div>
                        )}
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

      {/* Dialog de confirmación para rechazar transferencia */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Rechazar transferencia?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La transferencia será marcada como rechazada
              y requerirá una transacción en la blockchain.
              {transferToReject && (
                <span className="block mt-2 font-mono text-sm">
                  Transfer ID: #{transferToReject}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmReject}
              className="bg-red-600 hover:bg-red-700"
            >
              Rechazar Transferencia
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
