import { exec } from 'child_process';
import { promisify } from 'util';
import { ContractCallParams, TransactionParams, BalanceParams, MCPToolResult } from '../types/foundry.js';

const execAsync = promisify(exec);

/**
 * Manages Cast operations for blockchain interactions
 */
export class CastOperations {

  /**
   * Call a contract function (read-only)
   */
  async callContract(params: ContractCallParams): Promise<MCPToolResult> {
    try {
      const { contractAddress, functionSignature, args = [], rpcUrl, blockNumber } = params;

      let command = `cast call ${contractAddress} "${functionSignature}"`;
      
      if (args.length > 0) {
        command += ` ${args.join(' ')}`;
      }

      if (rpcUrl) {
        command += ` --rpc-url ${rpcUrl}`;
      }

      if (blockNumber) {
        command += ` --block ${blockNumber}`;
      }

      const { stdout, stderr } = await execAsync(command);

      if (stderr && !stdout) {
        throw new Error(stderr);
      }

      return {
        content: [{
          type: 'text',
          text: `✅ Llamada exitosa\n\n` +
                `📞 Función: ${functionSignature}\n` +
                `📍 Contrato: ${contractAddress}\n` +
                `📊 Resultado:\n${stdout.trim()}`
        }],
        isError: false
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      return {
        content: [{
          type: 'text',
          text: `❌ Error en llamada al contrato: ${errorMessage}\n\n` +
                `🔧 Verifica que el contrato esté desplegado\n` +
                `🔧 Confirma que la firma de la función sea correcta`
        }],
        isError: true
      };
    }
  }

  /**
   * Send a transaction to a contract
   */
  async sendTransaction(params: TransactionParams): Promise<MCPToolResult> {
    try {
      const { contractAddress, functionSignature, args = [], privateKey, value, gasLimit, gasPrice, rpcUrl } = params;

      let command = `cast send ${contractAddress} "${functionSignature}"`;

      if (args.length > 0) {
        command += ` ${args.join(' ')}`;
      }

      if (privateKey) {
        command += ` --private-key ${privateKey}`;
      }

      if (value) {
        command += ` --value ${value}`;
      }

      if (gasLimit) {
        command += ` --gas-limit ${gasLimit}`;
      }

      if (gasPrice) {
        command += ` --gas-price ${gasPrice}`;
      }

      if (rpcUrl) {
        command += ` --rpc-url ${rpcUrl}`;
      }

      const { stdout, stderr } = await execAsync(command);

      if (stderr && !stdout) {
        throw new Error(stderr);
      }

      // Parse transaction hash from output
      const txHashMatch = stdout.match(/transactionHash\s+(.+)/i) || stdout.match(/0x[a-fA-F0-9]{64}/);
      const txHash = txHashMatch ? txHashMatch[1] || txHashMatch[0] : 'N/A';

      return {
        content: [{
          type: 'text',
          text: `✅ Transacción enviada\n\n` +
                `📞 Función: ${functionSignature}\n` +
                `📍 Contrato: ${contractAddress}\n` +
                `🔗 TX Hash: ${txHash}\n\n` +
                `💡 Usa "get_transaction_receipt" para ver los detalles completos`
        }],
        isError: false
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      return {
        content: [{
          type: 'text',
          text: `❌ Error al enviar transacción: ${errorMessage}\n\n` +
                `🔧 Verifica que tengas suficiente gas\n` +
                `🔧 Confirma que la clave privada sea válida\n` +
                `🔧 Revisa los parámetros de la función`
        }],
        isError: true
      };
    }
  }

  /**
   * Get balance of an address
   */
  async getBalance(params: BalanceParams): Promise<MCPToolResult> {
    try {
      const { address, blockNumber, ether = true, rpcUrl } = params;

      let command = `cast balance ${address}`;

      if (ether) {
        command += ' --ether';
      }

      if (blockNumber) {
        command += ` --block ${blockNumber}`;
      }

      if (rpcUrl) {
        command += ` --rpc-url ${rpcUrl}`;
      }

      const { stdout } = await execAsync(command);
      const balance = stdout.trim();

      return {
        content: [{
          type: 'text',
          text: `💰 Balance\n\n` +
                `📍 Dirección: ${address}\n` +
                `💵 Balance: ${balance}${ether ? ' ETH' : ' wei'}`
        }],
        isError: false
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      return {
        content: [{
          type: 'text',
          text: `❌ Error al obtener balance: ${errorMessage}`
        }],
        isError: true
      };
    }
  }

  /**
   * Get transaction details
   */
  async getTransaction(txHash: string, rpcUrl?: string): Promise<MCPToolResult> {
    try {
      let command = `cast tx ${txHash}`;

      if (rpcUrl) {
        command += ` --rpc-url ${rpcUrl}`;
      }

      const { stdout } = await execAsync(command);

      return {
        content: [{
          type: 'text',
          text: `📋 Detalles de transacción\n\n${stdout.trim()}`
        }],
        isError: false
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      return {
        content: [{
          type: 'text',
          text: `❌ Error al obtener transacción: ${errorMessage}`
        }],
        isError: true
      };
    }
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(txHash: string, rpcUrl?: string): Promise<MCPToolResult> {
    try {
      let command = `cast receipt ${txHash}`;

      if (rpcUrl) {
        command += ` --rpc-url ${rpcUrl}`;
      }

      const { stdout } = await execAsync(command);

      return {
        content: [{
          type: 'text',
          text: `🧾 Recibo de transacción\n\n${stdout.trim()}`
        }],
        isError: false
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      return {
        content: [{
          type: 'text',
          text: `❌ Error al obtener recibo: ${errorMessage}`
        }],
        isError: true
      };
    }
  }

  /**
   * Get current block number
   */
  async getBlockNumber(rpcUrl?: string): Promise<MCPToolResult> {
    try {
      let command = 'cast block-number';

      if (rpcUrl) {
        command += ` --rpc-url ${rpcUrl}`;
      }

      const { stdout } = await execAsync(command);

      return {
        content: [{
          type: 'text',
          text: `📦 Número de bloque actual: ${stdout.trim()}`
        }],
        isError: false
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      return {
        content: [{
          type: 'text',
          text: `❌ Error al obtener número de bloque: ${errorMessage}`
        }],
        isError: true
      };
    }
  }

  /**
   * Estimate gas for a transaction
   */
  async estimateGas(params: TransactionParams): Promise<MCPToolResult> {
    try {
      const { contractAddress, functionSignature, args = [], value, rpcUrl } = params;

      let command = `cast estimate ${contractAddress} "${functionSignature}"`;

      if (args.length > 0) {
        command += ` ${args.join(' ')}`;
      }

      if (value) {
        command += ` --value ${value}`;
      }

      if (rpcUrl) {
        command += ` --rpc-url ${rpcUrl}`;
      }

      const { stdout } = await execAsync(command);
      const gasEstimate = stdout.trim();

      return {
        content: [{
          type: 'text',
          text: `⛽ Estimación de gas\n\n` +
                `📞 Función: ${functionSignature}\n` +
                `💨 Gas estimado: ${gasEstimate}`
        }],
        isError: false
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      return {
        content: [{
          type: 'text',
          text: `❌ Error al estimar gas: ${errorMessage}`
        }],
        isError: true
      };
    }
  }
}
