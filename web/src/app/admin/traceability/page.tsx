'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet, useTokens, useTransfers } from '@/hooks/useWallet';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import logger from '@/lib/logger';

interface Token {
  id: number;
  name: string;
  totalSupply: number;
  creator: string;
  parentId: number;
  dateCreated: number;
  features: string;
}

interface Transfer {
  id: number;
  from: string;
  to: string;
  tokenId: number;
  amount: number;
  status: string;
  dateCreated: number;
}

interface TokenNode {
  token: Token;
  level: number;
  children: TokenNode[];
  transfers: Transfer[];
}

export default function TraceabilityPage() {
  const router = useRouter();
  const { account, isAdmin, formatAddress } = useWallet();
  const { getAllTokens, getToken, getTokenLevel } = useTokens();
  const { getAllTransfers, getTransfer } = useTransfers();
  
  const [allTokens, setAllTokens] = useState<Token[]>([]);
  const [selectedTokenId, setSelectedTokenId] = useState<string>('');
  const [tokenTree, setTokenTree] = useState<TokenNode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!account || !isAdmin) {
      router.push('/');
      return;
    }

    loadAllTokens();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, isAdmin, router]);

  const loadAllTokens = async () => {
    try {
      setIsLoading(true);
      const tokenIds = await getAllTokens();
      const tokens = await Promise.all(
        tokenIds.map(async (id) => {
          const token = await getToken(id);
          return token;
        })
      );
      setAllTokens(tokens.filter(t => t !== null) as Token[]);
    } catch (error) {
      logger.error(`Error loading tokens: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const buildTokenTree = async (tokenId: number): Promise<TokenNode | null> => {
    try {
      const token = await getToken(tokenId);
      if (!token) return null;

      const level = await getTokenLevel(tokenId);

      // Obtener todas las transferencias de este token
      const allTransferIds = await getAllTransfers();
      const transfers = await Promise.all(
        allTransferIds.map(async (id) => {
          const transfer = await getTransfer(id);
          if (transfer && transfer.tokenId === tokenId) {
            return transfer;
          }
          return null;
        })
      );

      const validTransfers = transfers.filter(t => t !== null) as Transfer[];

      // Buscar tokens hijos (tokens que tienen este como padre)
      const childTokens = allTokens.filter(t => t.parentId === tokenId);
      const children = await Promise.all(
        childTokens.map(child => buildTokenTree(child.id))
      );

      return {
        token,
        level,
        children: children.filter(c => c !== null) as TokenNode[],
        transfers: validTransfers,
      };
    } catch (error) {
      logger.error(`Error building token tree: ${error}`);
      return null;
    }
  };

  const handleSearch = async () => {
    if (!selectedTokenId) return;

    try {
      setIsSearching(true);
      const tokenId = parseInt(selectedTokenId);
      const tree = await buildTokenTree(tokenId);
      setTokenTree(tree);
    } catch (error) {
      logger.error(`Error searching token: ${error}`);
    } finally {
      setIsSearching(false);
    }
  };

  const renderTokenNode = (node: TokenNode, isRoot: boolean = false) => {
    const getLevelColor = (level: number) => {
      switch (level) {
        case 0: return 'bg-green-50 border-green-300';
        case 1: return 'bg-blue-50 border-blue-300';
        case 2: return 'bg-purple-50 border-purple-300';
        default: return 'bg-gray-50 border-gray-300';
      }
    };

    const getLevelLabel = (level: number) => {
      switch (level) {
        case 0: return '🌱 Materia Prima';
        case 1: return '🏭 Producto Procesado';
        case 2: return '📦 Producto Final';
        default: return `Nivel ${level}`;
      }
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'Pending': return 'text-yellow-600 bg-yellow-100';
        case 'Accepted': return 'text-green-600 bg-green-100';
        case 'Rejected': return 'text-red-600 bg-red-100';
        default: return 'text-gray-600 bg-gray-100';
      }
    };

    const getStatusLabel = (status: string) => {
      switch (status) {
        case 'Pending': return 'Pendiente';
        case 'Accepted': return 'Aceptada';
        case 'Rejected': return 'Rechazada';
        default: return status;
      }
    };

    return (
      <div key={node.token.id} className={isRoot ? '' : 'ml-8 mt-4'}>
        <Card className={`p-6 border-2 ${getLevelColor(node.level)}`}>
          <div className="space-y-4">
            {/* Información del Token */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-bold">{node.token.name}</h3>
                <span className="px-3 py-1 rounded-full bg-white border-2 text-sm font-semibold">
                  {getLevelLabel(node.level)}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Token ID:</span>{' '}
                  <span className="font-mono font-semibold">#{node.token.id}</span>
                </div>
                <div>
                  <span className="text-gray-600">Supply Total:</span>{' '}
                  <span className="font-semibold">{node.token.totalSupply}</span>
                </div>
                <div>
                  <span className="text-gray-600">Creador:</span>{' '}
                  <span className="font-mono text-xs">{formatAddress(node.token.creator)}</span>
                </div>
                {node.token.parentId > 0 && (
                  <div>
                    <span className="text-gray-600">Token Padre:</span>{' '}
                    <span className="font-mono font-semibold">#{node.token.parentId}</span>
                  </div>
                )}
                <div className="md:col-span-2">
                  <span className="text-gray-600">Creado:</span>{' '}
                  <span className="text-xs">
                    {new Date(node.token.dateCreated * 1000).toLocaleString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>

              {node.token.features && node.token.features !== '{}' && (
                <div className="mt-3 p-3 bg-white/50 rounded border">
                  <span className="text-gray-600 text-sm">Características:</span>
                  <pre className="text-xs mt-1 overflow-x-auto">{node.token.features}</pre>
                </div>
              )}
            </div>

            {/* Transferencias del Token */}
            {node.transfers.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <span>🔄</span>
                  Historial de Transferencias ({node.transfers.length})
                </h4>
                <div className="space-y-2">
                  {node.transfers.map((transfer) => (
                    <div key={transfer.id} className="bg-white/70 p-3 rounded border text-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">Transfer #{transfer.id}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(transfer.status)}`}>
                          {getStatusLabel(transfer.status)}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-gray-600">De:</span>{' '}
                          <span className="font-mono">{formatAddress(transfer.from)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">A:</span>{' '}
                          <span className="font-mono">{formatAddress(transfer.to)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Cantidad:</span>{' '}
                          <span className="font-semibold">{transfer.amount}</span>
                        </div>
                      </div>
                      {transfer.dateCreated > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(transfer.dateCreated * 1000).toLocaleString('es-ES')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Tokens Derivados (Hijos) */}
        {node.children.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-3 ml-2">
              <div className="w-8 h-0.5 bg-gray-400"></div>
              <span className="text-sm font-semibold text-gray-600">
                Productos Derivados ({node.children.length})
              </span>
            </div>
            {node.children.map(child => renderTokenNode(child, false))}
          </div>
        )}
      </div>
    );
  };

  if (!account || !isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🔍 Trazabilidad Completa</h1>
          <p className="text-gray-600 mt-1">Vista de administrador - Solo lectura</p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          Volver
        </Button>
      </div>

      {/* Selector de Token */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="tokenId">Seleccionar Token para Rastrear</Label>
            <p className="text-xs text-gray-500 mt-1">
              Selecciona un token para ver su trazabilidad completa, incluyendo su origen, derivados y todas las transferencias
            </p>
          </div>

          {isLoading ? (
            <p className="text-gray-600">Cargando tokens disponibles...</p>
          ) : (
            <div className="flex gap-4">
              <select
                id="tokenId"
                value={selectedTokenId}
                onChange={(e) => setSelectedTokenId(e.target.value)}
                className="flex-1 px-4 py-2 border rounded-md bg-white"
              >
                <option value="">-- Selecciona un Token --</option>
                {allTokens.map((token) => (
                  <option key={token.id} value={token.id}>
                    #{token.id} - {token.name} (Supply: {token.totalSupply})
                  </option>
                ))}
              </select>
              
              <Button 
                onClick={handleSearch}
                disabled={!selectedTokenId || isSearching}
              >
                {isSearching ? 'Buscando...' : 'Rastrear'}
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Información de Ayuda */}
      {!tokenTree && !isSearching && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <span>ℹ️</span>
            ¿Cómo funciona la trazabilidad?
          </h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• <strong>🌱 Nivel 0:</strong> Materias primas creadas por Productores</li>
            <li>• <strong>🏭 Nivel 1:</strong> Productos procesados por Fábricas desde materias primas</li>
            <li>• <strong>📦 Nivel 2:</strong> Productos finales creados por Minoristas desde productos procesados</li>
            <li className="mt-2">• <strong>🔄 Transferencias:</strong> Se muestran todos los movimientos del token entre usuarios</li>
            <li>• <strong>🌳 Árbol de Derivados:</strong> Se visualizan todos los productos creados a partir del token seleccionado</li>
          </ul>
        </Card>
      )}

      {/* Resultado de Trazabilidad */}
      {isSearching && (
        <Card className="p-12 text-center">
          <div className="animate-pulse">
            <p className="text-gray-600">Construyendo árbol de trazabilidad...</p>
            <p className="text-sm text-gray-500 mt-2">Analizando tokens y transferencias</p>
          </div>
        </Card>
      )}

      {tokenTree && !isSearching && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Árbol de Trazabilidad</h2>
            <div className="flex gap-2 text-xs">
              <span className="px-3 py-1 rounded bg-green-100 text-green-700">🌱 Nivel 0</span>
              <span className="px-3 py-1 rounded bg-blue-100 text-blue-700">🏭 Nivel 1</span>
              <span className="px-3 py-1 rounded bg-purple-100 text-purple-700">📦 Nivel 2</span>
            </div>
          </div>
          {renderTokenNode(tokenTree, true)}
        </div>
      )}

      {!tokenTree && !isSearching && selectedTokenId && (
        <Card className="p-8 text-center">
          <p className="text-gray-600">Haz clic en &quot;Rastrear&quot; para ver la trazabilidad del token</p>
        </Card>
      )}
    </div>
  );
}
