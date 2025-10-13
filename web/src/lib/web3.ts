import { ethers, BrowserProvider, Contract } from 'ethers';
import { CONTRACT_CONFIG } from '@/contracts/config';

/**
 * Servicio Web3 para interactuar con el blockchain
 * Proporciona funciones helper y utilities para el contrato
 */
export class Web3Service {
  private provider: BrowserProvider | null = null;
  private contract: Contract | null = null;

  /**
   * Inicializar el servicio con provider y contract
   */
  async initialize() {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed');
    }

    this.provider = new BrowserProvider(window.ethereum);
    const signer = await this.provider.getSigner();
    this.contract = new Contract(CONTRACT_CONFIG.address, CONTRACT_CONFIG.abi, signer);

    return {
      provider: this.provider,
      contract: this.contract,
    };
  }

  /**
   * Verificar si MetaMask está instalado
   */
  static isMetaMaskInstalled(): boolean {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  }

  /**
   * Verificar si estamos en la red correcta
   */
  static async checkNetwork(): Promise<boolean> {
    if (!window.ethereum) return false;

    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      return parseInt(chainId, 16) === 31337; // Anvil network
    } catch (error) {
      return false;
    }
  }

  /**
   * Cambiar a la red Anvil
   */
  static async switchToAnvilNetwork(): Promise<void> {
    if (!window.ethereum) throw new Error('MetaMask not installed');

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x7a69' }], // 31337 en hex
      });
    } catch (error: any) {
      // Si la red no está agregada, la agregamos
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
      } else {
        throw error;
      }
    }
  }

  /**
   * Obtener cuentas conectadas
   */
  static async getAccounts(): Promise<string[]> {
    if (!window.ethereum) throw new Error('MetaMask not installed');

    return await window.ethereum.request({ method: 'eth_accounts' });
  }

  /**
   * Solicitar conexión de cuentas
   */
  static async requestAccounts(): Promise<string[]> {
    if (!window.ethereum) throw new Error('MetaMask not installed');

    return await window.ethereum.request({ method: 'eth_requestAccounts' });
  }

  /**
   * Formatear dirección de Ethereum
   */
  static formatAddress(address: string): string {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  /**
   * Validar dirección de Ethereum
   */
  static isValidAddress(address: string): boolean {
    try {
      return ethers.isAddress(address);
    } catch {
      return false;
    }
  }

  /**
   * Formatear timestamp a fecha legible
   */
  static formatDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Formatear cantidad con separadores de miles
   */
  static formatAmount(amount: number | string): string {
    return new Intl.NumberFormat('es-ES').format(Number(amount));
  }

  /**
   * Convertir BigInt a número
   */
  static bigIntToNumber(value: any): number {
    return Number(value.toString());
  }

  /**
   * Validar JSON string
   */
  static validateJSON(jsonString: string): boolean {
    try {
      JSON.parse(jsonString);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Obtener error legible de transacción
   */
  static parseTransactionError(error: any): string {
    if (error.reason) {
      return error.reason;
    }
    
    if (error.data?.message) {
      return error.data.message;
    }

    if (error.message) {
      // Extraer mensaje útil de errores complejoscl
      if (error.message.includes('user rejected')) {
        return 'Transacción cancelada por el usuario';
      }
      if (error.message.includes('insufficient funds')) {
        return 'Fondos insuficientes para gas';
      }
      if (error.message.includes('execution reverted')) {
        return 'Transacción revertida - verifica los datos';
      }
      return error.message;
    }

    return 'Error desconocido en la transacción';
  }

  /**
   * Obtener gas estimate para una transacción
   */
  async estimateGas(method: string, ...args: any[]): Promise<bigint> {
    if (!this.contract) throw new Error('Contract not initialized');

    try {
      return await this.contract[method].estimateGas(...args);
    } catch (error) {
      console.error('Error estimating gas:', error);
      throw new Error('No se pudo estimar el gas para esta transacción');
    }
  }

  /**
   * Ejecutar transacción con handling de errores
   */
  async executeTransaction(method: string, ...args: any[]): Promise<any> {
    if (!this.contract) throw new Error('Contract not initialized');

    try {
      const tx = await this.contract[method](...args);
      const receipt = await tx.wait();
      return receipt;
    } catch (error) {
      throw new Error(Web3Service.parseTransactionError(error));
    }
  }

  /**
   * Realizar llamada de solo lectura al contrato
   */
  async callContract(method: string, ...args: any[]): Promise<any> {
    if (!this.contract) throw new Error('Contract not initialized');

    try {
      return await this.contract[method](...args);
    } catch (error) {
      throw new Error(`Error calling ${method}: ${Web3Service.parseTransactionError(error)}`);
    }
  }

  /**
   * Obtener balance de ETH de una dirección
   */
  async getETHBalance(address: string): Promise<string> {
    if (!this.provider) throw new Error('Provider not initialized');

    const balance = await this.provider.getBalance(address);
    return ethers.formatEther(balance);
  }

  /**
   * Obtener información de la red
   */
  async getNetworkInfo() {
    if (!this.provider) throw new Error('Provider not initialized');

    const network = await this.provider.getNetwork();
    return {
      chainId: Number(network.chainId),
      name: network.name,
    };
  }

  /**
   * Cleanup del servicio
   */
  cleanup() {
    this.provider = null;
    this.contract = null;
  }
}

// Instancia singleton del servicio
export const web3Service = new Web3Service();

// Helpers exportados directamente
export const {
  formatAddress,
  isValidAddress,
  formatDate,
  formatAmount,
  bigIntToNumber,
  validateJSON,
  parseTransactionError,
  isMetaMaskInstalled,
  checkNetwork,
  switchToAnvilNetwork,
  getAccounts,
  requestAccounts,
} = Web3Service;