'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet, useTokens } from '@/hooks/useWallet';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import logger from '@/lib/logger';
import Link from 'next/link';

interface Token {
  id: number;
  name: string;
  totalSupply: number;
  creator: string;
  parentId: number;
  features: string;
}

export default function TokensPage() {
  const router = useRouter();
  const { currentUser, account, isApproved, isAdmin } = useWallet();
  const { getMyTokens, getAllTokens, getToken, getMyTokenBalance, getTokenBalance } = useTokens();
  const [tokens, setTokens] = useState<Array<Token & { balance: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!account || !currentUser || !isApproved) {
      router.push('/');
      return;
    }

    const loadTokens = async () => {
      try {
        setIsLoading(true);
        
        // ✅ Si es admin, obtener TODOS los tokens; sino, solo los del usuario
        const tokenIds = isAdmin ? await getAllTokens() : await getMyTokens();
        
        const tokensData = await Promise.all(
          tokenIds.map(async (id) => {
            const token = await getToken(id);
            // ✅ Para admin, mostrar balance 0 si no tiene tokens
            const balance = isAdmin 
              ? await getTokenBalance(id, account!)
              : await getMyTokenBalance(id);
            if (!token) return null;
            return { 
              id: token.id,
              name: token.name,
              totalSupply: token.totalSupply,
              creator: token.creator,
              parentId: token.parentId,
              features: token.features,
              balance 
            };
          })
        );

        setTokens(tokensData.filter((t): t is Token & { balance: number } => t !== null));
      } catch (error) {
        logger.error(`Error loading tokens: ${error}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadTokens();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, currentUser, isApproved, isAdmin, router]);

  if (!currentUser || !isApproved) {
    return null;
  }

  const canCreateTokens = ['producer', 'factory', 'retailer'].includes(
    currentUser.role.toLowerCase()
  );

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">
            {isAdmin ? 'Todos los Tokens del Sistema' : 'Mis Tokens'}
          </h1>
          {isAdmin && (
            <p className="text-sm text-gray-600 mt-1">
              Vista de administrador - Modo solo lectura
            </p>
          )}
        </div>
        {canCreateTokens && (
          <Link href="/tokens/create">
            <Button>Crear Nuevo Token</Button>
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Cargando tokens...</p>
        </div>
      ) : tokens.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-600 mb-4">
            {isAdmin ? 'No hay tokens en el sistema aún' : 'No tienes tokens aún'}
          </p>
          {canCreateTokens && (
            <Link href="/tokens/create">
              <Button>Crear Mi Primer Token</Button>
            </Link>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tokens.map((token) => (
            <Card key={token.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-semibold">{token.name}</h3>
                  <span className="text-sm text-gray-500">#{token.id}</span>
                </div>

                <div className="space-y-2">
                  {isAdmin && (
                    <div className="flex justify-between text-sm border-b pb-2 mb-2">
                      <span className="text-gray-600">Creador:</span>
                      <span className="font-mono text-xs">
                        {token.creator.slice(0, 6)}...{token.creator.slice(-4)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {isAdmin ? 'Mi Balance:' : 'Balance:'}
                    </span>
                    <span className="font-semibold">{token.balance}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Supply Total:</span>
                    <span className="font-medium">{token.totalSupply}</span>
                  </div>
                  {token.parentId > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Token Padre:</span>
                      <span className="font-medium">#{token.parentId}</span>
                    </div>
                  )}
                </div>

                {token.features && token.features !== '{}' && (
                  <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                    {token.features}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Link href={`/tokens/${token.id}`} className="flex-1">
                    <Button variant="outline" className="w-full" size="sm">
                      Ver Detalles
                    </Button>
                  </Link>
                  {token.balance > 0 && !isAdmin && currentUser.role.toLowerCase() !== 'consumer' && (
                    <Link href={`/tokens/${token.id}/transfer`} className="flex-1">
                      <Button className="w-full" size="sm">
                        Transferir
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
