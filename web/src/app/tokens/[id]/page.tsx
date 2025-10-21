'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useWallet, useTokens } from '@/hooks/useWallet';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import logger from '@/lib/logger';
import Link from 'next/link';

interface TokenDetail {
  id: number;
  name: string;
  totalSupply: number;
  creator: string;
  parentId: number;
  features: string;
  dateCreated: number;
}

export default function TokenDetailPage() {
  const router = useRouter();
  const params = useParams();
  const tokenId = parseInt(params.id as string);
  
  const { currentUser, account, isApproved } = useWallet();
  const { getToken, getMyTokenBalance } = useTokens();
  
  const [token, setToken] = useState<TokenDetail | null>(null);
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!account || !currentUser || !isApproved) {
      router.push('/');
      return;
    }

    const loadToken = async () => {
      try {
        setIsLoading(true);
        const tokenData = await getToken(tokenId);
        const tokenBalance = await getMyTokenBalance(tokenId);
        
        if (tokenData) {
          setToken({
            id: tokenData.id,
            name: tokenData.name,
            totalSupply: tokenData.totalSupply,
            creator: tokenData.creator,
            parentId: tokenData.parentId,
            features: tokenData.features,
            dateCreated: tokenData.dateCreated || 0,
          });
          setBalance(tokenBalance);
        } else {
          toast.error('Token no encontrado', {
            description: 'El token solicitado no existe'
          });
          router.push('/tokens');
        }
      } catch (error) {
        logger.error(`Error loading token: ${error}`);
        toast.error('Error al cargar token', {
          description: error instanceof Error ? error.message : 'Intenta nuevamente'
        });
        router.push('/tokens');
      } finally {
        setIsLoading(false);
      }
    };

    if (tokenId) {
      loadToken();
    }
    // ✅ Removidas las funciones de las dependencias para evitar loop infinito
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, currentUser, isApproved, tokenId, router]);

  if (!currentUser || !isApproved) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <div className="h-9 w-48 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
          </div>

          <Card className="p-8">
            <div className="space-y-6">
              <div className="border-b pb-4 space-y-2">
                <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-10 w-20 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-28 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!token) {
    return null;
  }

  const canTransfer = balance > 0 && currentUser.role.toLowerCase() !== 'consumer';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Detalle del Token</h1>
          <Button variant="outline" onClick={() => router.back()}>
            Volver
          </Button>
        </div>

        <Card className="p-8">
          <div className="space-y-6">
            <div className="border-b pb-4">
              <h2 className="text-2xl font-bold mb-2">{token.name}</h2>
              <p className="text-gray-600">Token ID: #{token.id}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Tu Balance</p>
                  <p className="text-3xl font-bold text-blue-600">{balance}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Supply Total</p>
                  <p className="text-2xl font-semibold">{token.totalSupply}</p>
                </div>

                {token.parentId > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Token Padre</p>
                    <Link href={`/tokens/${token.parentId}`}>
                      <Button variant="link" className="p-0 h-auto">
                        Ver Token #{token.parentId}
                      </Button>
                    </Link>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Creador</p>
                  <p className="font-mono text-sm break-all">{token.creator}</p>
                </div>

                {token.dateCreated > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Fecha de Creación</p>
                    <p className="text-sm">
                      {new Date(token.dateCreated * 1000).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {token.features && token.features !== '{}' && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Características</p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm overflow-x-auto">
                    {JSON.stringify(JSON.parse(token.features), null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {canTransfer && (
              <div className="pt-4 border-t">
                <Link href={`/tokens/${token.id}/transfer`}>
                  <Button className="w-full md:w-auto" size="lg">
                    Transferir Token
                  </Button>
                </Link>
              </div>
            )}

            {!canTransfer && balance === 0 && (
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600">
                  No tienes balance de este token para transferir
                </p>
              </div>
            )}

            {currentUser.role.toLowerCase() === 'consumer' && balance > 0 && (
              <div className="pt-4 border-t">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    Los consumidores no pueden transferir tokens. Este es el producto final de la cadena de suministro.
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
