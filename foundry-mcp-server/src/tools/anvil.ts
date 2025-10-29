import { exec } from 'child_process';
import { promisify } from 'util';
import { AnvilConfig, AnvilProcess, MCPToolResult } from '../types/foundry.js';

const execAsync = promisify(exec);

/**
 * Manages Anvil blockchain node operations
 */
export class AnvilManager {
  private anvilProcess: AnvilProcess | null = null;

  /**
   * Start Anvil local blockchain
   */
  async startAnvil(config: AnvilConfig = {}): Promise<MCPToolResult> {
    try {
      // Check if Anvil is already running
      if (this.anvilProcess) {
        return {
          content: [{
            type: 'text',
            text: '⚠️ Anvil ya está ejecutándose\n\n' +
                  `📍 Puerto: ${this.anvilProcess.config.port || '8545'}\n` +
                  `🔗 RPC: http://${this.anvilProcess.config.host || '127.0.0.1'}:${this.anvilProcess.config.port || '8545'}`
          }],
          isError: false
        };
      }

      const host = config.host || '127.0.0.1';
      const port = config.port || '8545';
      const chainId = config.chainId || '31337';
      const accounts = config.accounts || '10';
      const balance = config.balance || '10000';

      const args = [
        '--host', host,
        '--port', port,
        '--chain-id', chainId,
        '--accounts', accounts,
        '--balance', balance
      ];

      if (config.blockTime) args.push('--block-time', config.blockTime);
      if (config.gasLimit) args.push('--gas-limit', config.gasLimit);
      if (config.gasPrice) args.push('--gas-price', config.gasPrice);

      // Start Anvil process
      const { spawn } = await import('child_process');
      const anvilProc = spawn('anvil', args);

      // Store process info
      this.anvilProcess = {
        process: anvilProc,
        config: { host, port, chainId, accounts, balance, ...config },
        startTime: new Date()
      };

      // Wait a bit for Anvil to start
      await new Promise(resolve => setTimeout(resolve, 2000));

      return {
        content: [{
          type: 'text',
          text: '✅ Anvil iniciado correctamente\n\n' +
                `🔗 RPC URL: http://${host}:${port}\n` +
                `⛓️  Chain ID: ${chainId}\n` +
                `👥 Cuentas: ${accounts}\n` +
                `💰 Balance inicial: ${balance} ETH\n\n` +
                `💡 Usa "get_accounts" para ver las cuentas disponibles\n` +
                `💡 Usa "stop_anvil" para detener el nodo`
        }],
        isError: false
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      return {
        content: [{
          type: 'text',
          text: `❌ Error al iniciar Anvil: ${errorMessage}\n\n` +
                `🔧 Verifica que Foundry esté instalado: foundryup\n` +
                `🔧 Prueba con un puerto diferente si el 8545 está ocupado`
        }],
        isError: true
      };
    }
  }

  /**
   * Stop Anvil blockchain node
   */
  async stopAnvil(): Promise<MCPToolResult> {
    try {
      if (!this.anvilProcess) {
        return {
          content: [{
            type: 'text',
            text: '⚠️ Anvil no está ejecutándose'
          }],
          isError: false
        };
      }

      this.anvilProcess.process.kill();
      this.anvilProcess = null;

      return {
        content: [{
          type: 'text',
          text: '✅ Anvil detenido correctamente'
        }],
        isError: false
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      return {
        content: [{
          type: 'text',
          text: `❌ Error al detener Anvil: ${errorMessage}`
        }],
        isError: true
      };
    }
  }

  /**
   * Get Anvil status
   */
  async getAnvilStatus(): Promise<MCPToolResult> {
    try {
      if (!this.anvilProcess) {
        return {
          content: [{
            type: 'text',
            text: '⚪ Anvil no está ejecutándose\n\n💡 Usa "start_anvil" para iniciar un nodo local'
          }],
          isError: false
        };
      }

      const uptime = Math.floor((Date.now() - this.anvilProcess.startTime.getTime()) / 1000);
      const config = this.anvilProcess.config;

      return {
        content: [{
          type: 'text',
          text: '🟢 Anvil ejecutándose\n\n' +
                `🔗 RPC: http://${config.host}:${config.port}\n` +
                `⛓️  Chain ID: ${config.chainId}\n` +
                `⏱️  Uptime: ${uptime}s\n` +
                `👥 Cuentas: ${config.accounts}\n` +
                `💰 Balance por cuenta: ${config.balance} ETH`
        }],
        isError: false
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      return {
        content: [{
          type: 'text',
          text: `❌ Error al obtener estado: ${errorMessage}`
        }],
        isError: true
      };
    }
  }

  /**
   * Get available accounts from Anvil
   */
  async getAccounts(): Promise<MCPToolResult> {
    try {
      if (!this.anvilProcess) {
        return {
          content: [{
            type: 'text',
            text: '⚠️ Anvil no está ejecutándose\n\n💡 Inicia Anvil primero con "start_anvil"'
          }],
          isError: false
        };
      }

      const rpcUrl = `http://${this.anvilProcess.config.host}:${this.anvilProcess.config.port}`;

      // Get accounts using cast
      const { stdout } = await execAsync(`cast rpc eth_accounts --rpc-url ${rpcUrl}`);
      const accounts = JSON.parse(stdout);

      let accountsList = '👥 Cuentas disponibles:\n\n';
      for (let i = 0; i < Math.min(accounts.length, 10); i++) {
        // Get balance for each account
        const { stdout: balanceOutput } = await execAsync(
          `cast balance ${accounts[i]} --rpc-url ${rpcUrl} --ether`
        );
        const balance = balanceOutput.trim();
        accountsList += `${i}: ${accounts[i]}\n   💰 ${balance} ETH\n\n`;
      }

      return {
        content: [{
          type: 'text',
          text: accountsList + `💡 Usa estas cuentas para testing y desarrollo local`
        }],
        isError: false
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      return {
        content: [{
          type: 'text',
          text: `❌ Error al obtener cuentas: ${errorMessage}`
        }],
        isError: true
      };
    }
  }
}
