import { exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { CompileParams, TestParams, DeployParams, MCPToolResult } from '../types/foundry.js';

const execAsync = promisify(exec);

/**
 * Manages Forge operations for contract development
 */
export class ForgeManagement {

  /**
   * Compile Solidity contracts
   */
  async compileContracts(params: CompileParams = {}): Promise<MCPToolResult> {
    try {
      const { optimize = true, optimizerRuns = 200, viaIr = false, force = false, contracts = [], workingDir = './sc' } = params;

      let command = 'forge build';

      if (optimize) {
        command += ` --optimizer-runs ${optimizerRuns}`;
      }

      if (viaIr) {
        command += ' --via-ir';
      }

      if (force) {
        command += ' --force';
      }

      if (contracts.length > 0) {
        command += ` --contracts ${contracts.join(',')}`;
      }

      const { stdout, stderr } = await execAsync(command, { cwd: workingDir });

      // Check for compilation errors
      if (stderr && stderr.includes('error')) {
        throw new Error(stderr);
      }

      // Parse output for warnings and success message
      const hasWarnings = stderr && stderr.includes('warning');
      const warningCount = hasWarnings ? (stderr.match(/warning/gi) || []).length : 0;

      return {
        content: [{
          type: 'text',
          text: `✅ Compilación exitosa\n\n` +
                `📁 Directorio: ${workingDir}\n` +
                `⚙️  Optimización: ${optimize ? `Sí (${optimizerRuns} runs)` : 'No'}\n` +
                (hasWarnings ? `⚠️  Warnings: ${warningCount}\n\n` : '\n') +
                `💡 Los contratos están listos para desplegar\n` +
                `💡 Usa "run_tests" para verificar la funcionalidad`
        }],
        isError: false
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      return {
        content: [{
          type: 'text',
          text: `❌ Error de compilación:\n\n${errorMessage}\n\n` +
                `🔧 Revisa la sintaxis de Solidity\n` +
                `🔧 Verifica las importaciones de contratos\n` +
                `🔧 Actualiza la versión del compilador si es necesario`
        }],
        isError: true
      };
    }
  }

  /**
   * Run Forge tests
   */
  async runTests(params: TestParams = {}): Promise<MCPToolResult> {
    try {
      const { verbosity = 2, gasReport = false, coverage = false, forkUrl, forkBlockNumber, testPattern, contractPattern, workingDir = './sc' } = params;

      let command = 'forge test';

      // Add verbosity flags
      if (verbosity > 0) {
        command += ' ' + '-v'.repeat(verbosity);
      }

      if (gasReport) {
        command += ' --gas-report';
      }

      if (coverage) {
        command += ' --coverage';
      }

      if (forkUrl) {
        command += ` --fork-url ${forkUrl}`;
        if (forkBlockNumber) {
          command += ` --fork-block-number ${forkBlockNumber}`;
        }
      }

      if (testPattern) {
        command += ` --match-test ${testPattern}`;
      }

      if (contractPattern) {
        command += ` --match-contract ${contractPattern}`;
      }

      const { stdout, stderr } = await execAsync(command, { cwd: workingDir });

      // Parse test results
      const output = stdout + stderr;
      const passedMatch = output.match(/(\d+) passed/);
      const failedMatch = output.match(/(\d+) failed/);
      const passed = passedMatch ? parseInt(passedMatch[1]) : 0;
      const failed = failedMatch ? parseInt(failedMatch[1]) : 0;

      const allPassed = failed === 0 && passed > 0;

      return {
        content: [{
          type: 'text',
          text: `${allPassed ? '✅' : '❌'} Tests completados\n\n` +
                `✅ Pasaron: ${passed}\n` +
                `❌ Fallaron: ${failed}\n\n` +
                (gasReport ? `📊 Reporte de gas generado\n\n` : '') +
                (allPassed ? 
                  `💡 Todos los tests pasaron - Listo para deploy\n` :
                  `🔧 Revisa los tests que fallaron arriba\n`) +
                `\n${output}`
        }],
        isError: !allPassed
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      return {
        content: [{
          type: 'text',
          text: `❌ Error ejecutando tests: ${errorMessage}`
        }],
        isError: true
      };
    }
  }

  /**
   * Deploy a contract using Forge
   */
  async deployContract(params: DeployParams): Promise<MCPToolResult> {
    try {
      const { contractName, constructorArgs = [], privateKey, rpcUrl = 'http://127.0.0.1:8545', value, gasLimit, gasPrice, verify = false, workingDir = './sc' } = params;

      let command = `forge create src/${contractName}.sol:${contractName}`;

      if (constructorArgs.length > 0) {
        command += ` --constructor-args ${constructorArgs.join(' ')}`;
      }

      if (privateKey) {
        command += ` --private-key ${privateKey}`;
      }

      command += ` --rpc-url ${rpcUrl}`;

      if (value) {
        command += ` --value ${value}`;
      }

      if (gasLimit) {
        command += ` --gas-limit ${gasLimit}`;
      }

      if (gasPrice) {
        command += ` --gas-price ${gasPrice}`;
      }

      if (verify) {
        command += ' --verify';
      }

      const { stdout } = await execAsync(command, { cwd: workingDir });

      // Parse deployed address
      const addressMatch = stdout.match(/Deployed to: (0x[a-fA-F0-9]{40})/);
      const deployedAddress = addressMatch ? addressMatch[1] : 'N/A';

      // Parse transaction hash
      const txHashMatch = stdout.match(/Transaction hash: (0x[a-fA-F0-9]{64})/);
      const txHash = txHashMatch ? txHashMatch[1] : 'N/A';

      return {
        content: [{
          type: 'text',
          text: `✅ Contrato desplegado exitosamente\n\n` +
                `📝 Contrato: ${contractName}\n` +
                `📍 Dirección: ${deployedAddress}\n` +
                `🔗 TX Hash: ${txHash}\n` +
                `🌐 RPC: ${rpcUrl}\n\n` +
                `💡 Guarda esta dirección para interactuar con el contrato\n` +
                `💡 Usa "call_contract" o "send_transaction" para interactuar`
        }],
        isError: false
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      return {
        content: [{
          type: 'text',
          text: `❌ Error al desplegar contrato: ${errorMessage}\n\n` +
                `🔧 Verifica que el contrato esté compilado\n` +
                `🔧 Confirma que la clave privada sea válida\n` +
                `🔧 Revisa que el RPC URL sea correcto`
        }],
        isError: true
      };
    }
  }

  /**
   * Generate ABI for a contract
   */
  async generateAbi(contractName: string, workingDir: string = './sc'): Promise<MCPToolResult> {
    try {
      const abiPath = join(workingDir, `out/${contractName}.sol/${contractName}.json`);
      const artifact = JSON.parse(readFileSync(abiPath, 'utf-8'));
      const abi = JSON.stringify(artifact.abi, null, 2);

      return {
        content: [{
          type: 'text',
          text: `✅ ABI generada\n\n` +
                `📝 Contrato: ${contractName}\n` +
                `📄 ABI:\n\`\`\`json\n${abi}\n\`\`\``
        }],
        isError: false
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      return {
        content: [{
          type: 'text',
          text: `❌ Error al generar ABI: ${errorMessage}\n\n` +
                `🔧 Asegúrate de que el contrato esté compilado primero`
        }],
        isError: true
      };
    }
  }

  /**
   * Get bytecode for a contract
   */
  async getBytecode(contractName: string, workingDir: string = './sc'): Promise<MCPToolResult> {
    try {
      const command = `forge inspect ${contractName} bytecode`;
      const { stdout } = await execAsync(command, { cwd: workingDir });

      return {
        content: [{
          type: 'text',
          text: `✅ Bytecode obtenido\n\n` +
                `📝 Contrato: ${contractName}\n` +
                `📦 Tamaño: ${stdout.trim().length / 2} bytes\n` +
                `📄 Bytecode:\n${stdout.trim().substring(0, 200)}...`
        }],
        isError: false
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      return {
        content: [{
          type: 'text',
          text: `❌ Error al obtener bytecode: ${errorMessage}`
        }],
        isError: true
      };
    }
  }

  /**
   * Clean build artifacts
   */
  async clean(workingDir: string = './sc'): Promise<MCPToolResult> {
    try {
      await execAsync('forge clean', { cwd: workingDir });

      return {
        content: [{
          type: 'text',
          text: `✅ Artefactos de compilación limpiados\n\n💡 Ejecuta "compile_contracts" para recompilar`
        }],
        isError: false
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      return {
        content: [{
          type: 'text',
          text: `❌ Error al limpiar: ${errorMessage}`
        }],
        isError: true
      };
    }
  }
}
