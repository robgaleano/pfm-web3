/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import { CONTRACT_CONFIG } from '@/contracts/config';
import logger from '@/lib/logger';
import { toast } from 'sonner';

// Tipos
export interface User {
  id: number;
  userAddress: string;
  role: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Canceled';
}

export interface Token {
  id: number;
  creator: string;
  name: string;
  totalSupply: number;
  features: string;
  parentId: number;
  dateCreated: number;
}

export interface Transfer {
  id: number;
  from: string;
  to: string;
  tokenId: number;
  dateCreated: number;
  amount: number;
  status: 'Pending' | 'Accepted' | 'Rejected';
}

export interface Web3ContextType {
  // Estado de conexión
  isConnected: boolean;
  account: string | null;
  provider: BrowserProvider | null;
  contract: Contract | null;
  isLoading: boolean;
  isTransitioning: boolean; // ✅ Nuevo estado para transiciones
  
  // Usuario actual
  currentUser: User | null;
  isAdmin: boolean;
  
  // Funciones de conexión
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  
  // Funciones de usuario
  registerUser: (role: string) => Promise<void>;
  getUserInfo: (address?: string) => Promise<User | null>;
  changeUserStatus: (userAddress: string, status: number) => Promise<void>;
  getAllUsers: () => Promise<User[]>;
  getApprovedUsers: () => Promise<User[]>; // ✅ Nueva función pública
  
  // Funciones de tokens
  createToken: (name: string, totalSupply: number, features: string, parentId: number) => Promise<void>;
  getToken: (tokenId: number) => Promise<Token | null>;
  getTokenLevel: (tokenId: number) => Promise<number>; // ✅ Nueva función para calcular nivel
  getUserTokens: (address?: string) => Promise<number[]>;
  getTokenBalance: (tokenId: number, address?: string) => Promise<number>;
  getAllTokenIds: () => Promise<number[]>; // ✅ Nueva función para admin
  
  // Funciones de transferencias
  transferToken: (to: string, tokenId: number, amount: number) => Promise<void>;
  acceptTransfer: (transferId: number) => Promise<void>;
  rejectTransfer: (transferId: number) => Promise<void>;
  getTransfer: (transferId: number) => Promise<Transfer | null>;
  getUserTransfers: (address?: string) => Promise<number[]>;
  getPendingTransfers: (address?: string) => Promise<number[]>;
  getAllTransferIds: () => Promise<number[]>; // ✅ Nueva función para admin
  
  // Refresh
  refreshData: () => Promise<void>;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export function Web3Provider({ children }: { children: ReactNode }) {
  // Estados principales
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false); // ✅ Estado de transición
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [shouldNavigateHome, setShouldNavigateHome] = useState(false);

  // Verificar conexión persistente al cargar
  useEffect(() => {
    checkPersistedConnection();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Configurar listeners cuando se conecta
  useEffect(() => {
    if (isConnected && window.ethereum) {
      setupEventListeners();
      
      // Cleanup: remover listeners al desmontar
      return () => {
        if (window.ethereum?.removeListener) {
          window.ethereum.removeListener('accountsChanged', () => {});
          window.ethereum.removeListener('chainChanged', () => {});
        }
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);

  // Manejar navegación después de cambio de cuenta
  useEffect(() => {
    if (shouldNavigateHome && typeof window !== 'undefined') {
      setShouldNavigateHome(false);
      
      // ✅ Navegación simple sin toast (el loader ya indica el proceso)
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    }
  }, [shouldNavigateHome]);

  // Verificar conexión guardada en localStorage
  const checkPersistedConnection = async () => {
    try {
      if (typeof window === 'undefined') return;
      
      const savedAccount = localStorage.getItem('supply-chain-account');
      if (savedAccount && window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.includes(savedAccount)) {
          await connectToSavedAccount(savedAccount);
        } else {
          localStorage.removeItem('supply-chain-account');
        }
      }
    } catch (error) {
      logger.error(`Error checking persisted connection: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Conectar a cuenta guardada
  const connectToSavedAccount = async (savedAccount: string) => {
    try {
      if (!window.ethereum) return;

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(CONTRACT_CONFIG.address, CONTRACT_CONFIG.abi, signer);

      setProvider(provider);
      setContract(contract);
      setAccount(savedAccount);
      setIsConnected(true);

      // Cargar datos del usuario
      await loadUserData(savedAccount, contract);
    } catch (error) {
      logger.error(`Error connecting to saved account: ${error}`);
      localStorage.removeItem('supply-chain-account');
    }
  };

  // Conectar wallet
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        toast.error('MetaMask no está instalado', {
          description: 'Por favor instala MetaMask para usar esta aplicación'
        });
        return;
      }

      // Verificar red
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (parseInt(chainId, 16) !== 31337) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x7a69' }], // 31337 en hex
          });
        } catch (error: any) {
          if (error.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x7a69',
                chainName: 'Anvil Local',
                rpcUrls: ['http://localhost:8545'],
                nativeCurrency: {
                  name: 'ETH',
                  symbol: 'ETH',
                  decimals: 18,
                },
              }],
            });
          }
        }
      }

      // Solicitar conexión
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const account = accounts[0];

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(CONTRACT_CONFIG.address, CONTRACT_CONFIG.abi, signer);

      setProvider(provider);
      setContract(contract);
      setAccount(account);
      setIsConnected(true);

      // Guardar en localStorage
      localStorage.setItem('supply-chain-account', account);

      // Cargar datos del usuario
      await loadUserData(account, contract);

    } catch (error) {
      logger.error(`Error connecting wallet: ${error}`);
      toast.error('Error al conectar wallet', {
        description: 'No se pudo conectar con MetaMask'
      });
    }
  };

  // Desconectar wallet
  const disconnectWallet = () => {
    setIsConnected(false);
    setAccount(null);
    setProvider(null);
    setContract(null);
    setCurrentUser(null);
    setIsAdmin(false);
    localStorage.removeItem('supply-chain-account');
  };

  // Cargar datos del usuario
  const loadUserData = async (address: string, contract: Contract) => {
    try {
      // Verificar que el contrato esté desplegado
      const code = await contract.runner?.provider?.getCode(CONTRACT_CONFIG.address);
      if (!code || code === '0x') {
        logger.error('Contract not deployed at the configured address. Please deploy the contract first.');
        toast.error('Smart contract no encontrado', {
          description: 'Asegúrate de que Anvil esté corriendo y el contrato desplegado'
        });
        disconnectWallet();
        return;
      }

      // Verificar si es admin
      try {
        const adminCheck = await contract.isAdmin(address);
        setIsAdmin(adminCheck);
      } catch (adminError: any) {
        logger.error(`Error checking admin status: ${adminError?.message || adminError}`);
        setIsAdmin(false);
      }

      // Intentar cargar info del usuario
      try {
        const userInfo = await contract.getUserInfo(address);
        setCurrentUser({
          id: Number(userInfo.id),
          userAddress: userInfo.userAddress,
          role: userInfo.role,
          status: ['Pending', 'Approved', 'Rejected', 'Canceled'][userInfo.status] as any,
        });
      } catch {
        // Usuario no registrado (esto es esperado para usuarios nuevos)
        logger.debug(`User not registered: ${address}`);
        setCurrentUser(null);
      }
    } catch (error) {
      logger.error(`Error loading user data: ${error}`);
    }
  };

  // Configurar event listeners
  const setupEventListeners = () => {
    if (!window.ethereum) return;

    window.ethereum.on('accountsChanged', async (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
        toast.info('Wallet desconectada');
      } else {
        const newAccount = accounts[0];
        logger.info(`Account changed to: ${newAccount}`);
        
        // ✅ Activar estado de transición
        setIsTransitioning(true);
        
        setAccount(newAccount);
        localStorage.setItem('supply-chain-account', newAccount);
        
        if (contract) {
          // Cargar datos del nuevo usuario
          await loadUserData(newAccount, contract);
          
          // ✅ Delay mínimo para que se vea el loading (mejor UX)
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Activar navegación
          setShouldNavigateHome(true);
        }
      }
    });

    window.ethereum.on('chainChanged', () => {
      window.location.reload();
    });
  };

  // Funciones de usuario
  const registerUser = async (role: string) => {
    if (!contract) throw new Error('Contract not connected');
    
    const tx = await contract.requestUserRole(role);
    await tx.wait();
    await refreshData();
  };

  const getUserInfo = async (address?: string): Promise<User | null> => {
    if (!contract) throw new Error('Contract not connected');
    
    const targetAddress = address || account;
    if (!targetAddress) throw new Error('No address provided');

    try {
      const userInfo = await contract.getUserInfo(targetAddress);
      return {
        id: Number(userInfo.id),
        userAddress: userInfo.userAddress,
        role: userInfo.role,
        status: ['Pending', 'Approved', 'Rejected', 'Canceled'][userInfo.status] as any,
      };
    } catch (error) {
      logger.error(`Error fetching user info for address ${targetAddress}: ${error}`);
      return null;
    }
  };

  const changeUserStatus = async (userAddress: string, status: number) => {
    if (!contract) throw new Error('Contract not connected');
    
    const tx = await contract.changeStatusUser(userAddress, status);
    await tx.wait();
  };

  const getAllUsers = async (): Promise<User[]> => {
    if (!contract) throw new Error('Contract not connected');
    
    const users = await contract.getAllUsers();
    return users.map((user: any) => ({
      id: Number(user.id),
      userAddress: user.userAddress,
      role: user.role,
      status: ['Pending', 'Approved', 'Rejected', 'Canceled'][user.status] as any,
    }));
  };

  const getApprovedUsers = async (): Promise<User[]> => {
    if (!contract) throw new Error('Contract not connected');
    
    try {
      // Obtener solo los IDs (esto funciona siempre con ethers.js)
      const userIds = await contract.getApprovedUserIds();
      
      // Obtener los detalles de cada usuario individualmente
      const usersPromises = userIds.map(async (id: any) => {
        const userId = Number(id);
        const user = await contract.users(userId);
        return {
          id: userId,
          userAddress: user.userAddress,
          role: user.role,
          status: ['Pending', 'Approved', 'Rejected', 'Canceled'][Number(user.status)] as any,
        };
      });
      
      const mappedUsers = await Promise.all(usersPromises);
      
      return mappedUsers;
    } catch (error) {
      logger.error(`Error in getApprovedUsers: ${error}`);
      throw error;
    }
  };

  // Funciones de tokens
  const createToken = async (name: string, totalSupply: number, features: string, parentId: number) => {
    if (!contract) throw new Error('Contract not connected');
    
    const tx = await contract.createToken(name, totalSupply, features, parentId);
    await tx.wait();
    await refreshData();
  };

  const getToken = async (tokenId: number): Promise<Token | null> => {
    if (!contract) throw new Error('Contract not connected');
    
    try {
      const token = await contract.getToken(tokenId);
      return {
        id: Number(token.id),
        creator: token.creator,
        name: token.name,
        totalSupply: Number(token.totalSupply),
        features: token.features,
        parentId: Number(token.parentId),
        dateCreated: Number(token.dateCreated),
      };
    } catch (error) {
      logger.error(`Error fetching token info for token ID ${tokenId}: ${error}`);
      return null;
    }
  };

  const getTokenLevel = async (tokenId: number): Promise<number> => {
    if (!contract) throw new Error('Contract not connected');
    
    try {
      const token = await getToken(tokenId);
      if (!token) return 0;
      
      // Si no tiene padre, es nivel 0 (materia prima)
      if (token.parentId === 0) {
        return 0;
      }
      
      // Recursivamente calcular el nivel
      const parentLevel = await getTokenLevel(token.parentId);
      return parentLevel + 1;
    } catch (error) {
      logger.error(`Error calculating token level for token ID ${tokenId}: ${error}`);
      return 0;
    }
  };

  const getUserTokens = async (address?: string): Promise<number[]> => {
    if (!contract) throw new Error('Contract not connected');
    
    const targetAddress = address || account;
    if (!targetAddress) throw new Error('No address provided');

    const tokens = await contract.getUserTokens(targetAddress);
    return tokens.map((token: any) => Number(token));
  };

  const getTokenBalance = async (tokenId: number, address?: string): Promise<number> => {
    if (!contract) throw new Error('Contract not connected');
    
    const targetAddress = address || account;
    if (!targetAddress) throw new Error('No address provided');

    const balance = await contract.getTokenBalance(tokenId, targetAddress);
    return Number(balance);
  };

  // ✅ Nueva función para admin: obtener todos los tokens
  const getAllTokenIds = async (): Promise<number[]> => {
    if (!contract) throw new Error('Contract not connected');
    if (!isAdmin) throw new Error('Only admin can access all tokens');

    const tokenIds = await contract.getAllTokenIds();
    return tokenIds.map((id: any) => Number(id));
  };

  // Funciones de transferencias
  const transferToken = async (to: string, tokenId: number, amount: number) => {
    if (!contract) throw new Error('Contract not connected');
    
    const tx = await contract.transfer(to, tokenId, amount);
    await tx.wait();
    await refreshData();
  };

  const acceptTransfer = async (transferId: number) => {
    if (!contract) throw new Error('Contract not connected');
    
    const tx = await contract.acceptTransfer(transferId);
    await tx.wait();
    await refreshData();
  };

  const rejectTransfer = async (transferId: number) => {
    if (!contract) throw new Error('Contract not connected');
    
    const tx = await contract.rejectTransfer(transferId);
    await tx.wait();
    await refreshData();
  };

  const getTransfer = async (transferId: number): Promise<Transfer | null> => {
    if (!contract) throw new Error('Contract not connected');
    
    try {
      const transfer = await contract.getTransfer(transferId);
      return {
        id: Number(transfer.id),
        from: transfer.from,
        to: transfer.to,
        tokenId: Number(transfer.tokenId),
        dateCreated: Number(transfer.dateCreated),
        amount: Number(transfer.amount),
        status: ['Pending', 'Accepted', 'Rejected'][transfer.status] as any,
      };
    } catch (error) {
      logger.error(`Error fetching transfer info for transfer ID ${transferId}: ${error}`);
      return null;
    }
  };

  const getUserTransfers = async (address?: string): Promise<number[]> => {
    if (!contract) throw new Error('Contract not connected');
    
    const targetAddress = address || account;
    if (!targetAddress) throw new Error('No address provided');

    const transfers = await contract.getUserTransfers(targetAddress);
    return transfers.map((transfer: any) => Number(transfer));
  };

  const getPendingTransfers = async (address?: string): Promise<number[]> => {
    if (!contract) throw new Error('Contract not connected');
    
    const targetAddress = address || account;
    if (!targetAddress) throw new Error('No address provided');

    const transfers = await contract.getPendingTransfers(targetAddress);
    return transfers.map((transfer: any) => Number(transfer));
  };

  // ✅ Nueva función para admin: obtener todas las transferencias
  const getAllTransferIds = async (): Promise<number[]> => {
    if (!contract) throw new Error('Contract not connected');
    if (!isAdmin) throw new Error('Only admin can access all transfers');

    const transferIds = await contract.getAllTransferIds();
    return transferIds.map((id: any) => Number(id));
  };

  // Refresh data
  const refreshData = async () => {
    if (account && contract) {
      await loadUserData(account, contract);
    }
  };

  const value: Web3ContextType = {
    // Estado
    isConnected,
    account,
    provider,
    contract,
    isLoading,
    isTransitioning, // ✅ Agregar estado de transición
    currentUser,
    isAdmin,
    
    // Funciones de conexión
    connectWallet,
    disconnectWallet,
    
    // Funciones de usuario
    registerUser,
    getUserInfo,
    changeUserStatus,
    getAllUsers,
    getApprovedUsers, // ✅ Nueva función pública
    
    // Funciones de tokens
    createToken,
    getToken,
    getTokenLevel, // ✅ Nueva función para calcular nivel
    getUserTokens,
    getTokenBalance,
    getAllTokenIds, // ✅ Nueva función para admin
    
    // Funciones de transferencias
    transferToken,
    acceptTransfer,
    rejectTransfer,
    getTransfer,
    getUserTransfers,
    getPendingTransfers,
    getAllTransferIds, // ✅ Nueva función para admin
    
    // Refresh
    refreshData,
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
}

// Declaración de tipos para window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}