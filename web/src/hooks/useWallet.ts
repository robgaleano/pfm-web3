'use client';

import { useWeb3 } from '@/contexts/Web3Context';
import logger from '@/lib/logger';

/**
 * Hook personalizado que expone las funcionalidades del Web3Context
 * Simplifica el acceso a las funciones de blockchain para los componentes
 */
export function useWallet() {
  const {
    isConnected,
    account,
    currentUser,
    isAdmin,
    isLoading,
    connectWallet,
    disconnectWallet,
    refreshData,
  } = useWeb3();

  return {
    // Estado de conexión
    isConnected,
    account,
    currentUser,
    isAdmin,
    isLoading,

    // Funciones de conexión
    connectWallet,
    disconnectWallet,
    refreshData,

    // Estados derivados
    isRegistered: !!currentUser,
    isApproved: currentUser?.status === 'Approved',
    isPending: currentUser?.status === 'Pending',
    isRejected: currentUser?.status === 'Rejected',
    userRole: currentUser?.role || null,

    // Helpers
    getStatusColor: (status: string) => {
      switch (status) {
        case 'Pending': return 'text-yellow-600 bg-yellow-100';
        case 'Approved': return 'text-green-600 bg-green-100';
        case 'Rejected': return 'text-red-600 bg-red-100';
        case 'Canceled': return 'text-gray-600 bg-gray-100';
        default: return 'text-gray-600 bg-gray-100';
      }
    },

    getRoleColor: (role: string) => {
      switch (role) {
        case 'producer': return 'text-green-700 bg-green-100';
        case 'factory': return 'text-blue-700 bg-blue-100';
        case 'retailer': return 'text-purple-700 bg-purple-100';
        case 'consumer': return 'text-orange-700 bg-orange-100';
        default: return 'text-gray-700 bg-gray-100';
      }
    },

    formatAddress: (address: string) => {
      if (!address) return '';
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    },

    formatDate: (timestamp: number) => {
      return new Date(timestamp * 1000).toLocaleDateString();
    },

    formatAmount: (amount: number) => {
      return new Intl.NumberFormat().format(amount);
    },
  };
}

/**
 * Hook para gestión de usuarios (principalmente para admin)
 */
export function useUsers() {
  const {
    getUserInfo,
    changeUserStatus,
    getAllUsers,
    getApprovedUsers, // ✅ Nueva función pública
    registerUser,
    refreshData,
  } = useWeb3();

  return {
    getUserInfo,
    changeUserStatus,
    getAllUsers,
    getApprovedUsers, // ✅ Exportar función pública
    registerUser,
    refreshData,

    // Helpers para estados de usuario
    approveUser: (userAddress: string) => changeUserStatus(userAddress, 1), // Approved
    rejectUser: (userAddress: string) => changeUserStatus(userAddress, 2),  // Rejected
    cancelUser: (userAddress: string) => changeUserStatus(userAddress, 3),  // Canceled
    
    // Alias para requestRole (más semántico para el frontend)
    requestRole: (role: string) => registerUser(role),
  };
}

/**
 * Hook para gestión de tokens
 */
export function useTokens() {
  const {
    createToken,
    getToken,
    getUserTokens,
    getTokenBalance,
    getAllTokenIds, // ✅ Nueva función para admin
    refreshData,
    account,
    isAdmin,
  } = useWeb3();

  return {
    createToken,
    getToken,
    getUserTokens,
    getTokenBalance,
    getAllTokenIds, // ✅ Exponer para admin
    refreshData,

    // Helpers
    getMyTokens: () => getUserTokens(account!),
    getMyTokenBalance: (tokenId: number) => getTokenBalance(tokenId, account!),
    // ✅ Helper para admin: obtener todos los tokens con detalles
    getAllTokens: async () => {
      if (!isAdmin) throw new Error('Only admin can access all tokens');
      const tokenIds = await getAllTokenIds();
      return tokenIds;
    },

    // Función helper para crear tokens con validación
    createTokenWithValidation: async (
      name: string,
      totalSupply: number,
      features: string,
      parentId: number = 0
    ) => {
      if (!name.trim()) throw new Error('El nombre no puede estar vacío');
      if (totalSupply <= 0) throw new Error('La cantidad debe ser mayor a 0');
      
      try {
        const featuresJson = JSON.parse(features);
        return await createToken(name, totalSupply, JSON.stringify(featuresJson), parentId);
      } catch (error) {
        if (error instanceof SyntaxError) {
          throw new Error('Las características deben ser un JSON válido');
        }
        throw error;
      }
    },
  };
}

/**
 * Hook para gestión de transferencias
 */
export function useTransfers() {
  const {
    transferToken,
    acceptTransfer,
    rejectTransfer,
    getTransfer,
    getUserTransfers,
    getPendingTransfers,
    getAllTransferIds, // ✅ Nueva función para admin
    refreshData,
    account,
    isAdmin,
  } = useWeb3();

  return {
    transferToken,
    acceptTransfer,
    rejectTransfer,
    getTransfer,
    getUserTransfers,
    getPendingTransfers,
    getAllTransferIds, // ✅ Exponer para admin
    refreshData,

    // Helpers
    getMyTransfers: () => getUserTransfers(account!),
    getMyPendingTransfers: () => getPendingTransfers(account!),
    // ✅ Helper para admin: obtener todas las transferencias con detalles
    getAllTransfers: async () => {
      if (!isAdmin) throw new Error('Only admin can access all transfers');
      const transferIds = await getAllTransferIds();
      return transferIds;
    },

    // Función helper para transferir con validación
    transferTokenWithValidation: async (
      to: string,
      tokenId: number,
      amount: number
    ) => {
      if (!to || !to.startsWith('0x')) {
        throw new Error('Dirección de destino inválida');
      }
      if (amount <= 0) {
        throw new Error('La cantidad debe ser mayor a 0');
      }
      
      return await transferToken(to, tokenId, amount);
    },
  };
}

/**
 * Hook para datos específicos del dashboard
 */
export function useDashboard() {
  const { account, currentUser, isAdmin } = useWeb3();
  const { getMyTokens, getMyTokenBalance } = useTokens();
  const { getMyTransfers, getMyPendingTransfers } = useTransfers();

  const getDashboardData = async () => {
    if (!account || !currentUser) return null;

    try {
      const [tokens, transfers, pendingTransfers] = await Promise.all([
        getMyTokens(),
        getMyTransfers(),
        getMyPendingTransfers(),
      ]);

      // Calcular estadísticas
      const totalTokens = tokens.length;
      const totalTransfers = transfers.length;
      const pendingTransfersCount = pendingTransfers.length;

      // Obtener balances totales
      let totalBalance = 0;
      for (const tokenId of tokens) {
        const balance = await getMyTokenBalance(tokenId);
        totalBalance += balance;
      }

      return {
        totalTokens,
        totalTransfers,
        pendingTransfersCount,
        totalBalance,
        tokens,
        transfers,
        pendingTransfers,
      };
    } catch (error) {
      logger.error(`Error getting dashboard data: ${error}`);
      return null;
    }
  };

  return {
    getDashboardData,
    userRole: currentUser?.role,
    isAdmin,
  };
}