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
  
  // Funciones de tokens
  createToken: (name: string, totalSupply: number, features: string, parentId: number) => Promise<void>;
  getToken: (tokenId: number) => Promise<Token | null>;
  getUserTokens: (address?: string) => Promise<number[]>;
  getTokenBalance: (tokenId: number, address?: string) => Promise<number>;
  
  // Funciones de transferencias
  transferToken: (to: string, tokenId: number, amount: number) => Promise<void>;
  acceptTransfer: (transferId: number) => Promise<void>;
  rejectTransfer: (transferId: number) => Promise<void>;
  getTransfer: (transferId: number) => Promise<Transfer | null>;
  getUserTransfers: (address?: string) => Promise<number[]>;
  getPendingTransfers: (address?: string) => Promise<number[]>;
  
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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [shouldNavigateHome, setShouldNavigateHome] = useState(false);

  // Verificar conexión persistente al cargar
  useEffect(() => {
    checkPersistedConnection();
    
    // Verificar si hay un toast pendiente después de navegación
    if (typeof window !== 'undefined') {
      const pendingToast = sessionStorage.getItem('pending-toast');
      if (pendingToast) {
        try {
          const { type, message, description } = JSON.parse(pendingToast);
          // Mostrar el toast después de un pequeño delay para asegurar que el DOM esté listo
          setTimeout(() => {
            toast[type as 'success' | 'error' | 'info' | 'warning'](message, {
              description,
              duration: 6000
            });
          }, 500);
          sessionStorage.removeItem('pending-toast');
        } catch (error) {
          logger.error(`Error showing pending toast: ${error}`);
          sessionStorage.removeItem('pending-toast');
        }
      }
    }
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
      
      // Mostrar toast ANTES de navegar
      const toastId = toast.info('Redirigiendo a la página principal...', {
        duration: Infinity, // No se cierra automáticamente
        description: 'Cargando tu información de usuario'
      });
      
      // Delay para permitir que el toast se muestre ANTES de recargar
      setTimeout(() => {
        // Guardar el toast en sessionStorage para mostrarlo después de recargar
        sessionStorage.setItem('pending-toast', JSON.stringify({
          type: 'info',
          message: 'Cuenta cambiada exitosamente',
          description: 'Tu información de usuario ha sido actualizada'
        }));
        
        // Cerrar el toast actual antes de navegar
        toast.dismiss(toastId);
        
        // Navegar
        window.location.href = '/';
      }, 1000); // 1 segundo de delay
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
        
        setAccount(newAccount);
        localStorage.setItem('supply-chain-account', newAccount);
        
        if (contract) {
          // Cargar datos del nuevo usuario
          await loadUserData(newAccount, contract);
          
          // Activar navegación
          // El toast se mostrará antes y después de la navegación
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
    
    // Funciones de tokens
    createToken,
    getToken,
    getUserTokens,
    getTokenBalance,
    
    // Funciones de transferencias
    transferToken,
    acceptTransfer,
    rejectTransfer,
    getTransfer,
    getUserTransfers,
    getPendingTransfers,
    
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