// Configuración del contrato SupplyChain
// NOTA: Actualizar estas direcciones después del deployment
import SupplyChainAbi from './SupplyChain.abi.json';
import { InterfaceAbi } from 'ethers';

export const CONTRACT_CONFIG = {
  // Dirección del contrato desplegado (actualizar después del deploy)
  address: "0x5fbdb2315678afecb367f032d93f642f64180aa3", // Deployed on Anvil
  
  // Dirección del administrador (primera cuenta de Anvil)
  adminAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  
  // ABI del contrato SupplyChain
  abi: SupplyChainAbi as InterfaceAbi
};

// Configuración de red Anvil
export const NETWORK_CONFIG = {
  chainId: 31337,
  chainName: 'Anvil Local',
  rpcUrl: 'http://localhost:8545',
  currency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18,
  },
};

// Cuentas de prueba (solo para desarrollo)
export const TEST_ACCOUNTS = {
  admin: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  producer: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
  factory: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
  retailer: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
  consumer: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
};

// Roles válidos
export const VALID_ROLES = ['producer', 'factory', 'retailer', 'consumer'] as const;
export type Role = typeof VALID_ROLES[number];

// Estados de usuario
export const USER_STATUS = {
  PENDING: 0,
  APPROVED: 1,
  REJECTED: 2,
  CANCELED: 3,
} as const;

// Estados de transferencia
export const TRANSFER_STATUS = {
  PENDING: 0,
  ACCEPTED: 1,
  REJECTED: 2,
} as const;