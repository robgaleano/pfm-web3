#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool
} from '@modelcontextprotocol/sdk/types.js';

import { AnvilManager } from './tools/anvil.js';
import { CastOperations } from './tools/cast.js';
import { ForgeManagement } from './tools/forge.js';
import { SupplyChainHelpers } from './tools/supplychain.js';

import {
  AnvilConfig,
  ContractCallParams,
  TransactionParams,
  BalanceParams,
  CompileParams,
  TestParams,
  DeployParams,
  SupplyChainDeployParams,
  MCPToolResult
} from './types/foundry.js';

/**
 * Foundry MCP Server optimized for SupplyChain project with VSCode Copilot
 */
class FoundrySupplyChainMCPServer {
  private server: Server;
  private anvilManager: AnvilManager;
  private castOperations: CastOperations;
  private forgeManagement: ForgeManagement;
  private supplyChainHelpers: SupplyChainHelpers;

  constructor() {
    this.server = new Server(
      {
        name: 'foundry-supplychain',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize tool managers
    this.anvilManager = new AnvilManager();
    this.castOperations = new CastOperations();
    this.forgeManagement = new ForgeManagement();
    this.supplyChainHelpers = new SupplyChainHelpers();

    this.setupToolHandlers();
    this.setupErrorHandling();

    console.error('🚀 Foundry SupplyChain MCP Server initialized');
    console.error('📦 Optimized for VSCode Copilot');
  }

  private setupToolHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.getAvailableTools(),
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      console.error(`🔧 Ejecutando herramienta: ${name}`);

      try {
        let result: MCPToolResult;

        switch (name) {
          // ========== ANVIL TOOLS ==========
          case 'start_anvil':
            result = await this.anvilManager.startAnvil(args as AnvilConfig);
            break;

          case 'stop_anvil':
            result = await this.anvilManager.stopAnvil();
            break;

          case 'get_anvil_status':
            result = await this.anvilManager.getAnvilStatus();
            break;

          case 'get_accounts':
            result = await this.anvilManager.getAccounts();
            break;

          // ========== CAST TOOLS ==========
          case 'call_contract':
            result = await this.castOperations.callContract(
              args as unknown as ContractCallParams
            );
            break;

          case 'send_transaction':
            result = await this.castOperations.sendTransaction(
              args as unknown as TransactionParams
            );
            break;

          case 'get_balance':
            result = await this.castOperations.getBalance(
              args as unknown as BalanceParams
            );
            break;

          case 'get_transaction':
            result = await this.castOperations.getTransaction(
              (args as any)?.txHash as string,
              (args as any)?.rpcUrl as string
            );
            break;

          case 'get_transaction_receipt':
            result = await this.castOperations.getTransactionReceipt(
              (args as any)?.txHash as string,
              (args as any)?.rpcUrl as string
            );
            break;

          case 'get_block_number':
            result = await this.castOperations.getBlockNumber(
              (args as any)?.rpcUrl as string
            );
            break;

          case 'estimate_gas':
            result = await this.castOperations.estimateGas(
              args as unknown as TransactionParams
            );
            break;

          // ========== FORGE TOOLS ==========
          case 'compile_contracts':
            result = await this.forgeManagement.compileContracts(
              args as unknown as CompileParams
            );
            break;

          case 'run_tests':
            result = await this.forgeManagement.runTests(
              args as unknown as TestParams
            );
            break;

          case 'deploy_contract':
            result = await this.forgeManagement.deployContract(
              args as unknown as DeployParams
            );
            break;

          case 'generate_abi':
            result = await this.forgeManagement.generateAbi(
              (args as any)?.contractName as string,
              (args as any)?.workingDir as string
            );
            break;

          case 'get_bytecode':
            result = await this.forgeManagement.getBytecode(
              (args as any)?.contractName as string,
              (args as any)?.workingDir as string
            );
            break;

          case 'clean_project':
            result = await this.forgeManagement.clean(
              (args as any)?.workingDir as string
            );
            break;

          // ========== SUPPLY CHAIN HELPERS ==========
          case 'deploy_supplychain':
            result = await this.supplyChainHelpers.deploySupplyChain(
              args as unknown as SupplyChainDeployParams
            );
            break;

          case 'test_supplychain':
            result = await this.supplyChainHelpers.testSupplyChain();
            break;

          case 'setup_dev_environment':
            result = await this.supplyChainHelpers.setupDevEnvironment(
              (args as any)?.privateKey as string
            );
            break;

          default:
            result = {
              content: [
                {
                  type: 'text',
                  text: `❌ Herramienta desconocida: ${name}\n\n` +
                        `💡 Usa list_tools para ver las herramientas disponibles`,
                },
              ],
              isError: true,
            };
        }

        return {
          content: result.content,
          isError: result.isError,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Error desconocido';
        return {
          content: [
            {
              type: 'text',
              text: `❌ Error ejecutando '${name}': ${errorMessage}\n\n` +
                    `🔧 Verifica que Foundry esté instalado correctamente\n` +
                    `🔧 Confirma que los parámetros sean válidos`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private getAvailableTools(): Tool[] {
    return [
      // ========== ANVIL TOOLS ==========
      {
        name: 'start_anvil',
        description: 'Start a local Anvil blockchain node for development',
        inputSchema: {
          type: 'object',
          properties: {
            host: { type: 'string', description: 'Host to bind to (default: 127.0.0.1)' },
            port: { type: 'string', description: 'Port to listen on (default: 8545)' },
            chainId: { type: 'string', description: 'Chain ID (default: 31337)' },
            accounts: { type: 'string', description: 'Number of accounts to generate (default: 10)' },
            balance: { type: 'string', description: 'Initial balance for accounts in ETH (default: 10000)' },
            blockTime: { type: 'string', description: 'Block time in seconds' },
            gasLimit: { type: 'string', description: 'Gas limit for blocks' },
            gasPrice: { type: 'string', description: 'Gas price in wei' },
          },
        },
      },
      {
        name: 'stop_anvil',
        description: 'Stop the running Anvil blockchain node',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_anvil_status',
        description: 'Get the current status of the Anvil blockchain node',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_accounts',
        description: 'Get available accounts from the running Anvil node with balances',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },

      // ========== CAST TOOLS ==========
      {
        name: 'call_contract',
        description: 'Call a contract function (read-only, no transaction)',
        inputSchema: {
          type: 'object',
          properties: {
            contractAddress: { type: 'string', description: 'Contract address' },
            functionSignature: { type: 'string', description: 'Function signature (e.g., "balanceOf(address)")' },
            args: { type: 'array', items: { type: 'string' }, description: 'Function arguments' },
            rpcUrl: { type: 'string', description: 'RPC URL (default: http://127.0.0.1:8545)' },
            blockNumber: { type: 'string', description: 'Block number (optional)' },
          },
          required: ['contractAddress', 'functionSignature'],
        },
      },
      {
        name: 'send_transaction',
        description: 'Send a transaction to a smart contract',
        inputSchema: {
          type: 'object',
          properties: {
            contractAddress: { type: 'string', description: 'Contract address' },
            functionSignature: { type: 'string', description: 'Function signature' },
            args: { type: 'array', items: { type: 'string' }, description: 'Function arguments' },
            privateKey: { type: 'string', description: 'Private key for signing (use with caution)' },
            value: { type: 'string', description: 'ETH value to send' },
            gasLimit: { type: 'string', description: 'Gas limit' },
            gasPrice: { type: 'string', description: 'Gas price' },
            rpcUrl: { type: 'string', description: 'RPC URL (default: http://127.0.0.1:8545)' },
          },
          required: ['contractAddress', 'functionSignature'],
        },
      },
      {
        name: 'get_balance',
        description: 'Get the ETH balance of an address',
        inputSchema: {
          type: 'object',
          properties: {
            address: { type: 'string', description: 'Address to check balance' },
            blockNumber: { type: 'string', description: 'Block number (optional)' },
            ether: { type: 'boolean', description: 'Return balance in ETH instead of wei (default: true)' },
            rpcUrl: { type: 'string', description: 'RPC URL (default: http://127.0.0.1:8545)' },
          },
          required: ['address'],
        },
      },
      {
        name: 'get_transaction',
        description: 'Get transaction details by hash',
        inputSchema: {
          type: 'object',
          properties: {
            txHash: { type: 'string', description: 'Transaction hash' },
            rpcUrl: { type: 'string', description: 'RPC URL (default: http://127.0.0.1:8545)' },
          },
          required: ['txHash'],
        },
      },
      {
        name: 'get_transaction_receipt',
        description: 'Get transaction receipt by hash',
        inputSchema: {
          type: 'object',
          properties: {
            txHash: { type: 'string', description: 'Transaction hash' },
            rpcUrl: { type: 'string', description: 'RPC URL (default: http://127.0.0.1:8545)' },
          },
          required: ['txHash'],
        },
      },
      {
        name: 'get_block_number',
        description: 'Get current block number',
        inputSchema: {
          type: 'object',
          properties: {
            rpcUrl: { type: 'string', description: 'RPC URL (default: http://127.0.0.1:8545)' },
          },
        },
      },
      {
        name: 'estimate_gas',
        description: 'Estimate gas for a transaction',
        inputSchema: {
          type: 'object',
          properties: {
            contractAddress: { type: 'string', description: 'Contract address' },
            functionSignature: { type: 'string', description: 'Function signature' },
            args: { type: 'array', items: { type: 'string' }, description: 'Function arguments' },
            value: { type: 'string', description: 'ETH value to send' },
            rpcUrl: { type: 'string', description: 'RPC URL (default: http://127.0.0.1:8545)' },
          },
          required: ['contractAddress', 'functionSignature'],
        },
      },

      // ========== FORGE TOOLS ==========
      {
        name: 'compile_contracts',
        description: 'Compile Solidity contracts using Forge',
        inputSchema: {
          type: 'object',
          properties: {
            optimize: { type: 'boolean', description: 'Enable optimization (default: true)' },
            optimizerRuns: { type: 'number', description: 'Number of optimizer runs (default: 200)' },
            viaIr: { type: 'boolean', description: 'Use via-IR compilation' },
            force: { type: 'boolean', description: 'Force recompilation' },
            contracts: { type: 'array', items: { type: 'string' }, description: 'Specific contracts to compile' },
            workingDir: { type: 'string', description: 'Working directory (default: ./sc)' },
          },
        },
      },
      {
        name: 'run_tests',
        description: 'Run tests using Forge',
        inputSchema: {
          type: 'object',
          properties: {
            verbosity: { type: 'number', description: 'Verbosity level (0-5, default: 2)' },
            gasReport: { type: 'boolean', description: 'Generate gas report' },
            coverage: { type: 'boolean', description: 'Generate coverage report' },
            forkUrl: { type: 'string', description: 'Fork from this RPC URL' },
            forkBlockNumber: { type: 'number', description: 'Fork from this block number' },
            testPattern: { type: 'string', description: 'Test pattern to match' },
            contractPattern: { type: 'string', description: 'Contract pattern to match' },
            workingDir: { type: 'string', description: 'Working directory (default: ./sc)' },
          },
        },
      },
      {
        name: 'deploy_contract',
        description: 'Deploy a contract using Forge',
        inputSchema: {
          type: 'object',
          properties: {
            contractName: { type: 'string', description: 'Contract name to deploy' },
            constructorArgs: { type: 'array', items: { type: 'string' }, description: 'Constructor arguments' },
            privateKey: { type: 'string', description: 'Private key for deployment' },
            rpcUrl: { type: 'string', description: 'RPC URL (default: http://127.0.0.1:8545)' },
            value: { type: 'string', description: 'ETH value to send' },
            gasLimit: { type: 'string', description: 'Gas limit' },
            gasPrice: { type: 'string', description: 'Gas price' },
            verify: { type: 'boolean', description: 'Verify contract on Etherscan' },
            workingDir: { type: 'string', description: 'Working directory (default: ./sc)' },
          },
          required: ['contractName'],
        },
      },
      {
        name: 'generate_abi',
        description: 'Generate ABI for a compiled contract',
        inputSchema: {
          type: 'object',
          properties: {
            contractName: { type: 'string', description: 'Contract name' },
            workingDir: { type: 'string', description: 'Working directory (default: ./sc)' },
          },
          required: ['contractName'],
        },
      },
      {
        name: 'get_bytecode',
        description: 'Get bytecode for a compiled contract',
        inputSchema: {
          type: 'object',
          properties: {
            contractName: { type: 'string', description: 'Contract name' },
            workingDir: { type: 'string', description: 'Working directory (default: ./sc)' },
          },
          required: ['contractName'],
        },
      },
      {
        name: 'clean_project',
        description: 'Clean build artifacts',
        inputSchema: {
          type: 'object',
          properties: {
            workingDir: { type: 'string', description: 'Working directory (default: ./sc)' },
          },
        },
      },

      // ========== SUPPLY CHAIN HELPERS ==========
      {
        name: 'deploy_supplychain',
        description: 'Deploy SupplyChain contract and automatically update frontend config',
        inputSchema: {
          type: 'object',
          properties: {
            rpcUrl: { type: 'string', description: 'RPC URL (default: http://127.0.0.1:8545)' },
            privateKey: { type: 'string', description: 'Private key for deployment' },
            updateConfig: { type: 'boolean', description: 'Auto-update web/src/contracts/config.ts (default: true)' },
          },
        },
      },
      {
        name: 'test_supplychain',
        description: 'Run all SupplyChain tests with gas report',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'setup_dev_environment',
        description: 'Complete setup: compile, test, and deploy SupplyChain with frontend config',
        inputSchema: {
          type: 'object',
          properties: {
            privateKey: { type: 'string', description: 'Private key for deployment' },
          },
        },
      },
    ];
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('✅ Foundry SupplyChain MCP Server running on stdio');
  }
}

// Start the server
const server = new FoundrySupplyChainMCPServer();
server.run().catch(console.error);
