# 📁 Índice de Archivos del Proyecto

## 📖 Documentación (6 archivos)

### **QUICKSTART.md** ⚡ EMPIEZA AQUÍ
- Guía de 5 minutos para configurar y usar el MCP
- Pre-requisitos verificación
- Configuración paso a paso
- Tests básicos
- Troubleshooting rápido

### **README.md** 📚 Referencia Principal
- Descripción del proyecto
- Instalación completa
- Lista de todas las herramientas (20)
- Ejemplos de uso
- Configuración en VSCode
- Troubleshooting detallado

### **VSCODE_SETUP.md** ⚙️ Configuración VSCode
- Guía específica para VSCode Copilot
- Verificación de instalación
- Configuración de settings.json
- Debug de problemas
- Múltiples opciones de configuración

### **EXAMPLES.md** 💡 Casos de Uso Reales
- 10 escenarios completos de uso
- Desde setup básico hasta mainnet deployment
- Workflows del día a día
- Comandos de ejemplo
- Tips y trucos

### **ARCHITECTURE.md** 🏗️ Documentación Técnica
- Explicación del funcionamiento interno
- Diagramas de flujo
- Componentes y responsabilidades
- Patrones de diseño
- Guía para extender el MCP

### **SUMMARY.md** 📊 Resumen Ejecutivo
- Visión general del proyecto
- Estadísticas completas
- Comparación antes/después
- Checklist de instalación
- Próximos pasos

---

## 💻 Código Fuente (6 archivos TypeScript)

### **src/index.ts** (520 líneas)
**Servidor MCP Principal**
- Inicialización del servidor MCP
- Registro de 20 herramientas
- Router de llamadas a tools
- Manejo de errores global
- Gestión del protocolo MCP

**Herramientas registradas:**
- 4 Anvil tools
- 7 Cast tools
- 6 Forge tools
- 3 SupplyChain helpers

### **src/types/foundry.ts** (110 líneas)
**Definiciones de Tipos TypeScript**
- `MCPToolResult` - Tipo de respuesta estándar
- `AnvilConfig` - Configuración de Anvil
- `ContractCallParams` - Parámetros para llamadas
- `TransactionParams` - Parámetros para transacciones
- `CompileParams` - Configuración de compilación
- `TestParams` - Configuración de tests
- `DeployParams` - Parámetros de deployment
- `SupplyChainDeployParams` - Deploy con auto-config

### **src/tools/anvil.ts** (210 líneas)
**Gestión de Anvil**

Herramientas implementadas:
1. `startAnvil()` - Iniciar blockchain local
2. `stopAnvil()` - Detener nodo
3. `getAnvilStatus()` - Estado del nodo
4. `getAccounts()` - Cuentas con balances

Características:
- Gestión de procesos en background
- Configuración flexible (port, chainId, accounts, balance)
- Monitoreo de uptime
- Recuperación de cuentas con balances

### **src/tools/cast.ts** (320 líneas)
**Operaciones de Blockchain**

Herramientas implementadas:
1. `callContract()` - Llamadas read-only
2. `sendTransaction()` - Enviar transacciones
3. `getBalance()` - Consultar balances (ETH/wei)
4. `getTransaction()` - Detalles de TX
5. `getTransactionReceipt()` - Recibo de TX
6. `getBlockNumber()` - Número de bloque actual
7. `estimateGas()` - Estimación de gas

Características:
- Validación de parámetros
- Formato flexible (ETH/wei)
- Parsing de hashes de TX
- Manejo de errores específico

### **src/tools/forge.ts** (360 líneas)
**Gestión de Contratos**

Herramientas implementadas:
1. `compileContracts()` - Compilar con optimización
2. `runTests()` - Tests con gas report
3. `deployContract()` - Deploy automatizado
4. `generateAbi()` - Generar ABI desde artifact
5. `getBytecode()` - Obtener bytecode
6. `clean()` - Limpiar artefactos

Características:
- Compilación optimizada configurable
- Tests con verbosity y patrones
- Fork testing
- Gas reporting
- Coverage reports
- Parsing de resultados de tests

### **src/tools/supplychain.ts** (200 líneas)
**Helpers Específicos del Proyecto**

Herramientas implementadas:
1. `deploySupplyChain()` - Deploy + auto-update config.ts
2. `testSupplyChain()` - Tests con gas report
3. `setupDevEnvironment()` - Setup completo (compile + test + deploy)

Características:
- **Auto-actualización de frontend:**
  - Lee ABI del artifact
  - Actualiza `web/src/contracts/config.ts`
  - Timestamp del deployment
- Workflow de alto nivel
- Validación end-to-end

---

## ⚙️ Configuración (5 archivos)

### **package.json**
```json
{
  "name": "mcp-foundry-supplychain",
  "version": "1.0.0",
  "scripts": {
    "build": "tsc",
    "start": "node build/index.js",
    "dev": "tsc --watch",
    "clean": "rm -rf build",
    "watch": "tsc --watch"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.4"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "typescript": "^5.6.3"
  }
}
```

### **tsconfig.json**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "outDir": "./build",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true
  }
}
```

### **.env.example**
Variables de entorno configurables:
- `NODE_ENV` - Entorno (development/production)
- `DEFAULT_RPC_URL` - RPC por defecto
- `DEFAULT_CHAIN_ID` - Chain ID
- `SC_DIR` - Directorio de smart contracts
- `WEB_DIR` - Directorio del frontend
- `AUTO_UPDATE_CONFIG` - Auto-actualizar config.ts

### **.gitignore**
```
node_modules/
build/
dist/
*.log
.env
.DS_Store
```

### **vscode-settings-example.json**
Configuración lista para copiar a VSCode:
```json
{
  "github.copilot.advanced": {
    "mcpServers": {
      "foundry-supplychain": {
        "command": "node",
        "args": [
          "/ruta/absoluta/al/mcp-foundry-server/build/index.js"
        ],
        "env": {
          "NODE_ENV": "production"
        }
      }
    }
  }
}
```

---

## 🏗️ Archivos Generados

### **build/** (generado por `npm run build`)
```
build/
├── index.js              # Servidor compilado
├── index.d.ts           # Type definitions
├── index.js.map         # Source map
├── tools/
│   ├── anvil.js
│   ├── cast.js
│   ├── forge.js
│   └── supplychain.js
└── types/
    └── foundry.js
```

### **node_modules/** (generado por `npm install`)
- `@modelcontextprotocol/sdk` - SDK oficial de MCP
- `@types/node` - Type definitions de Node.js
- Dependencias transitivas

---

## 📊 Estadísticas del Proyecto

### Código
- **Archivos de código:** 6
- **Líneas de código:** ~1,720
- **Lenguaje:** TypeScript (strict mode)
- **Herramientas:** 20

### Documentación
- **Archivos de docs:** 6
- **Palabras totales:** ~15,000
- **Escenarios de ejemplo:** 10
- **Guías:** 3 (Quick Start, VSCode Setup, Architecture)

### Dependencias
- **Producción:** 1 (`@modelcontextprotocol/sdk`)
- **Desarrollo:** 2 (`@types/node`, `typescript`)
- **Tamaño total:** ~15 MB (con node_modules)
- **Tamaño build:** ~500 KB

---

## 🗂️ Estructura Completa del Directorio

```
mcp-foundry-server/
│
├── 📖 Documentación
│   ├── QUICKSTART.md           # ⚡ Guía de 5 minutos
│   ├── README.md               # 📚 Documentación principal
│   ├── VSCODE_SETUP.md         # ⚙️ Setup VSCode
│   ├── EXAMPLES.md             # 💡 10 escenarios de uso
│   ├── ARCHITECTURE.md         # 🏗️ Arquitectura técnica
│   ├── SUMMARY.md              # 📊 Resumen ejecutivo
│   └── INDEX.md                # 📁 Este archivo
│
├── 💻 Código Fuente
│   └── src/
│       ├── index.ts            # 🚀 Servidor MCP (520 líneas)
│       ├── types/
│       │   └── foundry.ts      # 📝 Tipos (110 líneas)
│       └── tools/
│           ├── anvil.ts        # ⚡ Anvil Manager (210 líneas)
│           ├── cast.ts         # 📞 Cast Operations (320 líneas)
│           ├── forge.ts        # 🔨 Forge Management (360 líneas)
│           └── supplychain.ts  # 🎯 SupplyChain Helpers (200 líneas)
│
├── ⚙️ Configuración
│   ├── package.json                    # NPM config
│   ├── tsconfig.json                   # TypeScript config
│   ├── .env.example                    # Vars de entorno
│   ├── .gitignore                      # Git ignore
│   └── vscode-settings-example.json    # VSCode config ejemplo
│
├── 🏗️ Generados
│   ├── build/                  # Código compilado (git ignored)
│   │   ├── index.js
│   │   ├── tools/
│   │   └── types/
│   ├── node_modules/           # Dependencias NPM (git ignored)
│   └── package-lock.json       # Lock file de NPM
│
└── 📦 Total: 18 archivos fuente + generados
```

---

## 🎯 Guía de Navegación

### ¿Nuevo en el proyecto?
→ Empieza con **QUICKSTART.md**

### ¿Quieres ver ejemplos?
→ Lee **EXAMPLES.md**

### ¿Problemas configurando VSCode?
→ Consulta **VSCODE_SETUP.md**

### ¿Necesitas referencia completa?
→ Lee **README.md**

### ¿Quieres entender cómo funciona?
→ Revisa **ARCHITECTURE.md**

### ¿Quieres ver un resumen ejecutivo?
→ Lee **SUMMARY.md**

### ¿Vas a modificar el código?
→ Estudia los archivos en `src/`

---

## 🚀 Comandos Útiles

```bash
# Ver estructura del proyecto
tree -L 3 -I 'node_modules|build'

# Ver líneas de código
find src -name "*.ts" -exec wc -l {} + | sort -n

# Ver archivos de documentación
ls -lh *.md

# Ver tamaño del build
du -sh build/

# Buscar en el código
grep -r "search_term" src/

# Ver dependencias instaladas
npm list --depth=0
```

---

## 📝 Notas para Desarrolladores

### Agregar nueva herramienta:
1. Definir tipos en `src/types/foundry.ts`
2. Implementar en `src/tools/*.ts`
3. Registrar en `src/index.ts`
4. Documentar en `README.md`
5. Agregar ejemplo en `EXAMPLES.md`

### Modificar configuración:
1. Editar `package.json` para scripts/deps
2. Editar `tsconfig.json` para compilación
3. Editar `.env.example` para nuevas vars

### Actualizar documentación:
1. README.md - Cambios principales
2. EXAMPLES.md - Nuevos casos de uso
3. ARCHITECTURE.md - Cambios técnicos
4. SUMMARY.md - Actualizar estadísticas

---

**Última actualización:** 29 de octubre de 2025  
**Versión:** 1.0.0  
**Autor:** SupplyChain Tracker Team
