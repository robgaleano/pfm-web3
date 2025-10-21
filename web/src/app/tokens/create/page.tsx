'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet, useTokens } from '@/hooks/useWallet';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import logger from '@/lib/logger';

export default function CreateTokenPage() {
  const router = useRouter();
  const { currentUser, account, isApproved } = useWallet();
  const { createToken, getMyTokens, getToken, getMyTokenBalance } = useTokens();
  
  const [name, setName] = useState('');
  const [totalSupply, setTotalSupply] = useState('');
  const [features, setFeatures] = useState('');
  const [parentId, setParentId] = useState('0');
  const [isLoading, setIsLoading] = useState(false);
  const [availableTokens, setAvailableTokens] = useState<Array<{ id: number; name: string; balance: number }>>([]);

  useEffect(() => {
    if (!account || !currentUser || !isApproved) {
      router.push('/');
      return;
    }

    const role = currentUser.role.toLowerCase();
    if (!['producer', 'factory', 'retailer'].includes(role)) {
      router.push('/dashboard');
      return;
    }

    // Cargar tokens disponibles para factory y retailer
    if (role === 'factory' || role === 'retailer') {
      const loadTokens = async () => {
        try {
          const tokenIds = await getMyTokens();
          const tokensWithBalance = await Promise.all(
            tokenIds.map(async (id) => {
              const token = await getToken(id);
              const balance = await getMyTokenBalance(id);
              if (!token || balance === 0) return null;
              return { id: token.id, name: token.name, balance };
            })
          );
          setAvailableTokens(tokensWithBalance.filter((t): t is { id: number; name: string; balance: number } => t !== null));
        } catch (error) {
          logger.error(`Error loading tokens: ${error}`);
        }
      };
      loadTokens();
    }
  }, [account, currentUser, isApproved, router, getMyTokens, getToken, getMyTokenBalance]);

  if (!currentUser || !isApproved) {
    return null;
  }

  const role = currentUser.role.toLowerCase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !totalSupply || parseInt(totalSupply) <= 0) {
      toast.warning('Completa todos los campos', {
        description: 'Por favor completa todos los campos correctamente'
      });
      return;
    }

    if ((role === 'factory' || role === 'retailer') && parentId === '0') {
      toast.warning('Selecciona un token padre', {
        description: 'Debes seleccionar un token padre para procesar'
      });
      return;
    }

    try {
      setIsLoading(true);
      await createToken(
        name.trim(),
        parseInt(totalSupply),
        features.trim() || '{}',
        parseInt(parentId)
      );
      
      toast.success('Token creado exitosamente', {
        description: 'Redirigiendo a la lista de tokens...'
      });
      
      setTimeout(() => {
        router.push('/tokens');
      }, 1000);
    } catch (error) {
      logger.error(`Error creating token: ${error}`);
      toast.error('Error al crear token', {
        description: error instanceof Error ? error.message : 'Intenta nuevamente'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">
          {role === 'producer' && 'Crear Materia Prima'}
          {role === 'factory' && 'Procesar Material'}
          {role === 'retailer' && 'Crear Producto Final'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Producto</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={role === 'producer' ? 'Ej: Algodón Orgánico' : role === 'factory' ? 'Ej: Tela de Algodón' : 'Ej: Camiseta'}
              required
            />
          </div>

          {(role === 'factory' || role === 'retailer') && (
            <div className="space-y-2">
              <Label htmlFor="parentId">Token Base (Materia Prima)</Label>
              {availableTokens.length === 0 ? (
                <p className="text-sm text-red-600">
                  No tienes tokens con balance disponible. Debes recibir materiales primero.
                </p>
              ) : (
                <Select value={parentId} onValueChange={setParentId}>
                  <SelectTrigger id="parentId">
                    <SelectValue placeholder="Selecciona un token base" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTokens.map((token) => (
                      <SelectItem key={token.id} value={token.id.toString()}>
                        {token.name} (Balance: {token.balance})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="totalSupply">Cantidad a Producir</Label>
            <Input
              id="totalSupply"
              type="number"
              min="1"
              value={totalSupply}
              onChange={(e) => setTotalSupply(e.target.value)}
              placeholder="Ej: 1000"
              required
            />
            <p className="text-xs text-gray-500">
              Cantidad total de unidades a crear
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="features">Características (JSON) - Opcional</Label>
            <Input
              id="features"
              value={features}
              onChange={(e) => setFeatures(e.target.value)}
              placeholder='Ej: {"color": "blanco", "organic": true}'
            />
            <p className="text-xs text-gray-500">
              Información adicional del producto en formato JSON
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-sm mb-2">Información</h3>
            <ul className="text-xs text-blue-800 space-y-1">
              {role === 'producer' && (
                <>
                  <li>• Los productores solo pueden crear materias primas</li>
                  <li>• No requiere token padre (parentId = 0)</li>
                </>
              )}
              {role === 'factory' && (
                <>
                  <li>• Las fábricas procesan materias primas</li>
                  <li>• Debes tener balance del token padre para procesarlo</li>
                </>
              )}
              {role === 'retailer' && (
                <>
                  <li>• Los minoristas crean productos finales</li>
                  <li>• Debes tener balance del token padre para crear el producto</li>
                </>
              )}
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
              disabled={isLoading || ((role === 'factory' || role === 'retailer') && availableTokens.length === 0)}
              className="flex-1"
            >
              {isLoading ? 'Creando...' : 'Crear Token'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
