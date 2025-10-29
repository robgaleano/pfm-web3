# 🏗️ Arquitectura del MCP Foundry Server

## 📊 Visión General

Este documento explica cómo funciona internamente el MCP Foundry Server y cómo se integra con VSCode Copilot.

## 🔄 Flujo de Comunicación

```
┌─────────────────┐
│  VSCode Copilot │
│  (Usuario)      │
└────────┬────────┘
         │ Lenguaje Natural
         │ "Compila el contrato"
         ▼
┌─────────────────────┐
│  MCP SDK            │
│  (Protocol Layer)   │
└────────┬────────────┘
         │ JSON-RPC
         │ CallToolRequest
         ▼
┌─────────────────────────────┐
│  index.ts                   │
│  (Tool Router)              │
│  - ListTools                │
│  - CallTool                 │
└────────┬────────────────────┘
         │
         ├─────────────┬──────────────┬────────────────┐
         ▼             ▼              ▼                ▼
    ┌─────────┐  ┌─────────┐   ┌─────────┐     ┌─────────────┐
    │ Anvil   │  │  Cast   │   │  Forge  │     │ SupplyChain │
    │ Manager │  │  Ops    │   │  Mgmt   │     │  Helpers    │
    └────┬────┘  └────┬────┘   └────┬────┘     └──────┬──────┘
         │            │              │                  │
         └────────────┴──────────────┴──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Foundry CLI      │
                    │ - anvil          │
                    │ - cast           │
                    │ - forge          │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │  Blockchain      │
                    │  - Local (Anvil) │
                    │  - Testnet       │
                    │  - Mainnet       │
                    └──────────────────┘
```

## 🧩 Componentes Principales

### 1. **index.ts** - Servidor MCP Principal

**Responsabilidades:**
- Inicializar el servidor MCP
- Registrar herramientas disponibles
- Enrutar llamadas a las tools correctas
- Manejo de errores global
- Gestión del ciclo de vida del servidor

**Código clave:**
```typescript
class FoundrySupplyChainMCPServer {
  private server: Server;
  private anvilManager: AnvilManager;
  private castOperations: CastOperations;
  private forgeManagement: ForgeManagement;
  private supplyChainHelpers: SupplyChainHelpers;

  constructor() {
    this.server = new Server({ name: 'foundry-supplychain', version: '1.0.0' });
    this.setupToolHandlers();
  }
}
```

**Flujo:**
1. VSCode Copilot envía `ListToolsRequest` → Responde con 20 herramientas
2. Usuario pide algo → Copilot elige la tool correcta → `CallToolRequest`
3. Router ejecuta la tool → Devuelve resultado formateado

### 2. **tools/anvil.ts** - Gestión de Blockchain Local

**Responsabilidades:**
- Iniciar/detener procesos de Anvil
- Monitorear estado del nodo
- Obtener cuentas y balances
- Gestionar configuración de red

**Arquitectura interna:**
```typescript
class AnvilManager {
  private anvilProcess: AnvilProcess | null = null;

  async startAnvil(config: AnvilConfig): Promise<MCPToolResult> {
    // 1. Verificar si ya está corriendo
    // 2. Construir comando con parámetros
    // 3. Spawn proceso de Anvil
    // 4. Almacenar referencia del proceso
    // 5. Retornar resultado formateado
  }
}
```

**Gestión de procesos:**
```typescript
interface AnvilProcess {
  process: ChildProcess;
  config: AnvilConfig;
  startTime: Date;
}
```

### 3. **tools/cast.ts** - Interacciones con Blockchain

**Responsabilidades:**
- Llamadas read-only a contratos
- Envío de transacciones
- Consultas de balances
- Análisis de transacciones
- Estimación de gas

**Patrón de implementación:**
```typescript
class CastOperations {
  async callContract(params: ContractCallParams): Promise<MCPToolResult> {
    // 1. Construir comando cast call
    // 2. Agregar parámetros (address, function, args)
    // 3. Ejecutar comando con execAsync
    // 4. Parsear salida
    // 5. Formatear resultado con emojis
    // 6. Manejo de errores con sugerencias
  }
}
```

**Ejemplo de comando generado:**
```bash
cast call 0x5FbDB2... "getProduct(uint256)" 1 --rpc-url http://127.0.0.1:8545
```

### 4. **tools/forge.ts** - Gestión de Contratos

**Responsabilidades:**
- Compilación de contratos
- Ejecución de tests
- Deployment de contratos
- Generación de ABIs
- Limpieza de artefactos

**Compilación inteligente:**
```typescript
async compileContracts(params: CompileParams): Promise<MCPToolResult> {
  // 1. Construir comando forge build
  // 2. Agregar optimizaciones
  // 3. Ejecutar en working directory
  // 4. Parsear salida para warnings/errors
  // 5. Generar reporte de compilación
}
```

**Gestión de tests:**
```typescript
async runTests(params: TestParams): Promise<MCPToolResult> {
  // 1. Construir comando forge test
  // 2. Agregar verbosity, gas-report, coverage
  // 3. Filtros (testPattern, contractPattern)
  // 4. Fork configuration (si aplica)
  // 5. Parsear resultados (passed/failed)
  // 6. Formatear reporte con gas usage
}
```

### 5. **tools/supplychain.ts** - Helpers Específicos del Proyecto

**Responsabilidades:**
- Deployment con auto-config del frontend
- Testing específico de SupplyChain
- Setup completo del entorno
- Actualización automática de config.ts

**Workflow de deploy:**
```typescript
async deploySupplyChain(params: SupplyChainDeployParams): Promise<MCPToolResult> {
  // 1. Compilar contratos
  if (compileResult.isError) return compileResult;

  // 2. Desplegar contrato
  const deployResult = await forge.deployContract(...);

  // 3. Extraer dirección del contrato
  const address = parseAddress(deployResult);

  // 4. Leer ABI del artifact
  const abi = readABI('./sc/out/SupplyChain.sol/SupplyChain.json');

  // 5. Actualizar config.ts
  if (updateConfig) {
    writeFile('./web/src/contracts/config.ts', {
      address,
      abi
    });
  }

  // 6. Retornar resultado completo
  return formatSuccess(...);
}
```

## 🔌 Integración con MCP SDK

### Protocol Layer

El MCP SDK maneja:
- **Transporte**: stdio (stdin/stdout)
- **Serialización**: JSON-RPC 2.0
- **Esquemas**: Zod validation
- **Tipos**: TypeScript strict types

### Request/Response Flow

**1. ListToolsRequest:**
```json
{
  "jsonrpc": "2.0",
  "method": "tools/list",
  "id": 1
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "tools": [
      {
        "name": "start_anvil",
        "description": "Start a local Anvil blockchain node",
        "inputSchema": { ... }
      },
      // ... 19 more tools
    ]
  },
  "id": 1
}
```

**2. CallToolRequest:**
```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "compile_contracts",
    "arguments": {
      "optimize": true,
      "optimizerRuns": 200
    }
  },
  "id": 2
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "✅ Compilación exitosa\n\n📁 Directorio: ./sc\n⚙️  Optimización: Sí (200 runs)"
      }
    ],
    "isError": false
  },
  "id": 2
}
```

## 🎯 Design Patterns Utilizados

### 1. **Factory Pattern** - Tool Creation

```typescript
private getAvailableTools(): Tool[] {
  return [
    this.createAnvilTool('start_anvil', ...),
    this.createCastTool('call_contract', ...),
    this.createForgeTool('compile_contracts', ...),
    // ...
  ];
}
```

### 2. **Strategy Pattern** - Command Execution

```typescript
switch (name) {
  case 'start_anvil':
    result = await this.anvilManager.startAnvil(args);
    break;
  case 'call_contract':
    result = await this.castOperations.callContract(args);
    break;
  // ...
}
```

### 3. **Builder Pattern** - Command Construction

```typescript
let command = 'forge build';
if (optimize) command += ` --optimizer-runs ${optimizerRuns}`;
if (viaIr) command += ' --via-ir';
if (force) command += ' --force';
```

### 4. **Template Method** - Result Formatting

```typescript
private formatResult(data: any, toolName: string): MCPToolResult {
  return {
    content: [{
      type: 'text',
      text: this.formatWithEmojis(data, toolName)
    }],
    isError: false
  };
}
```

## 🔒 Seguridad

### Input Validation

```typescript
// 1. Schema validation con Zod (via MCP SDK)
const AnvilConfigSchema = z.object({
  host: z.string().optional(),
  port: z.string().regex(/^\d+$/).optional(),
  // ...
});

// 2. Runtime validation
if (!params.contractAddress.startsWith('0x')) {
  throw new Error('Invalid address format');
}

// 3. Command sanitization
const safeAddress = params.contractAddress.replace(/[^0-9a-fA-Fx]/g, '');
```

### Private Key Handling

```typescript
// ❌ MAL - Nunca loggear claves
console.log('Deploying with key:', privateKey);

// ✅ BIEN - No exponer en logs
console.error('🚀 Desplegando contrato...');
// privateKey solo se usa en el comando interno
```

## ⚡ Optimizaciones

### 1. **Caching de Procesos**

```typescript
class AnvilManager {
  private anvilProcess: AnvilProcess | null = null;

  async startAnvil(config: AnvilConfig): Promise<MCPToolResult> {
    // Reutilizar proceso existente si está corriendo
    if (this.anvilProcess) {
      return { content: [{ type: 'text', text: '⚠️ Anvil ya está ejecutándose' }] };
    }
    // ...
  }
}
```

### 2. **Lazy Loading**

```typescript
constructor() {
  // Instanciar tools solo cuando se necesitan
  this.anvilManager = new AnvilManager();
  this.castOperations = new CastOperations();
  // ...
}
```

### 3. **Async Execution**

```typescript
// Todos los comandos son async para no bloquear
async compileContracts(params: CompileParams): Promise<MCPToolResult> {
  const { stdout } = await execAsync(command, { cwd: workingDir });
  // ...
}
```

## 🧪 Testing Strategy

### Unit Tests (Propuestos)

```typescript
describe('AnvilManager', () => {
  it('should start anvil with default config', async () => {
    const manager = new AnvilManager();
    const result = await manager.startAnvil({});
    expect(result.isError).toBe(false);
    expect(result.content[0].text).toContain('✅');
  });
});
```

### Integration Tests (Propuestos)

```typescript
describe('SupplyChainHelpers', () => {
  it('should deploy and update config', async () => {
    const helpers = new SupplyChainHelpers();
    const result = await helpers.deploySupplyChain({ updateConfig: true });
    
    // Verificar que config.ts fue actualizado
    const config = readFileSync('./web/src/contracts/config.ts', 'utf-8');
    expect(config).toContain('0x');
  });
});
```

## 📊 Métricas y Logging

### Console Logging

```typescript
// stderr para logs (no interfiere con stdout de MCP)
console.error('🚀 Foundry SupplyChain MCP Server initialized');
console.error('📦 Optimized for VSCode Copilot');
console.error(`🔧 Ejecutando herramienta: ${name}`);
```

### Error Handling

```typescript
try {
  // Ejecutar comando
  const { stdout, stderr } = await execAsync(command);
  
  // Verificar errores
  if (stderr && stderr.includes('error')) {
    throw new Error(stderr);
  }
  
  return formatSuccess(stdout);
} catch (error) {
  return formatError(error, 'Sugerencias de solución...');
}
```

## 🔄 Extensibilidad

### Agregar Nueva Tool

**1. Definir tipos:**
```typescript
// types/foundry.ts
export interface NewFeatureParams {
  param1: string;
  param2: number;
}
```

**2. Implementar lógica:**
```typescript
// tools/forge.ts
async newFeature(params: NewFeatureParams): Promise<MCPToolResult> {
  // Implementación
}
```

**3. Registrar tool:**
```typescript
// index.ts
case 'new_feature':
  result = await this.forgeManagement.newFeature(args as NewFeatureParams);
  break;
```

**4. Agregar a lista:**
```typescript
// index.ts - getAvailableTools()
{
  name: 'new_feature',
  description: 'Description...',
  inputSchema: { ... }
}
```

## 🎓 Aprendizajes Clave

### 1. **MCP es un Protocolo, no una API**
- Usa JSON-RPC sobre stdio
- VSCode Copilot traduce lenguaje natural → tool calls
- El servidor solo responde a requests específicos

### 2. **Formato de Respuesta Importa**
- Emojis mejoran la legibilidad en Copilot
- Estructura consistente (✅/❌ + datos + 💡 sugerencias)
- Errores deben incluir soluciones sugeridas

### 3. **Herramientas de Alto Nivel > Low-Level**
- `setup_dev_environment` mejor que `compile` + `test` + `deploy` separados
- `deploy_supplychain` mejor que `deploy_contract` + update manual
- Copilot prefiere comandos con contexto del proyecto

### 4. **TypeScript Strict Mode Ayuda**
- Catch errores en compile-time
- IntelliSense mejor en VSCode
- Refactoring más seguro

## 🚀 Roadmap Futuro

### Fase 1 (Actual)
- ✅ 20 herramientas básicas
- ✅ SupplyChain helpers
- ✅ Auto-update config
- ✅ VSCode Copilot integration

### Fase 2 (Próximos pasos)
- [ ] Cache de resultados de compilación
- [ ] Snapshot/restore de estado de Anvil
- [ ] Testing con múltiples redes en paralelo
- [ ] Generación automática de tests

### Fase 3 (Futuro)
- [ ] Análisis estático de seguridad
- [ ] Optimización automática de gas
- [ ] Integration con Hardhat
- [ ] Multi-chain deployment orchestration

---

**Construido con 💙 para el proyecto SupplyChain**

Para más detalles técnicos, revisa el código fuente en `src/`.
