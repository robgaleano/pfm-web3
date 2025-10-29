/**
 * TypeScript types for Foundry MCP Server
 */

export interface MCPToolResult {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError?: boolean;
}

// ========== ANVIL TYPES ==========

export interface AnvilConfig {
  host?: string;
  port?: string;
  chainId?: string;
  accounts?: string;
  balance?: string;
  blockTime?: string;
  gasLimit?: string;
  gasPrice?: string;
}

export interface AnvilProcess {
  process: any;
  config: AnvilConfig;
  startTime: Date;
}

// ========== CAST TYPES ==========

export interface ContractCallParams {
  contractAddress: string;
  functionSignature: string;
  args?: string[];
  rpcUrl?: string;
  blockNumber?: string;
}

export interface TransactionParams {
  contractAddress: string;
  functionSignature: string;
  args?: string[];
  privateKey?: string;
  from?: string;
  value?: string;
  gasLimit?: string;
  gasPrice?: string;
  rpcUrl?: string;
}

export interface BalanceParams {
  address: string;
  blockNumber?: string;
  ether?: boolean;
  rpcUrl?: string;
}

// ========== FORGE TYPES ==========

export interface CompileParams {
  optimize?: boolean;
  optimizerRuns?: number;
  viaIr?: boolean;
  force?: boolean;
  contracts?: string[];
  workingDir?: string;
}

export interface TestParams {
  verbosity?: number;
  gasReport?: boolean;
  coverage?: boolean;
  forkUrl?: string;
  forkBlockNumber?: number;
  testPattern?: string;
  contractPattern?: string;
  workingDir?: string;
}

export interface DeployParams {
  contractName: string;
  constructorArgs?: string[];
  privateKey?: string;
  rpcUrl?: string;
  value?: string;
  gasLimit?: string;
  gasPrice?: string;
  verify?: boolean;
  workingDir?: string;
}

// ========== SUPPLY CHAIN SPECIFIC TYPES ==========

export interface SupplyChainDeployParams {
  rpcUrl?: string;
  privateKey?: string;
  updateConfig?: boolean; // Auto-update web/src/contracts/config.ts
}

export interface ProductCreateParams {
  name: string;
  origin: string;
  price: number;
  rpcUrl?: string;
  privateKey?: string;
}

export interface TransferAcceptParams {
  transferId: number;
  rpcUrl?: string;
  privateKey?: string;
}
