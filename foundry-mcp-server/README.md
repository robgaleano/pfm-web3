# 🔧 Foundry MCP Server para SupplyChain

Un servidor MCP (Model Context Protocol) optimizado para el proyecto SupplyChain, diseñado específicamente para funcionar con **VSCode Copilot**.

## 🎯 ¿Qué hace este MCP?

Permite que GitHub Copilot en VSCode interactúe directamente con herramientas de Foundry (`forge`, `cast`, `anvil`) usando **lenguaje natural**, sin necesidad de escribir comandos manualmente.

### ✨ Características principales

- ✅ **Gestión de Anvil**: Iniciar/detener blockchain local
- ✅ **Operaciones Cast**: Interactuar con contratos desplegados
- ✅ **Gestión Forge**: Compilar, testear y desplegar contratos
- ✅ **Helpers SupplyChain**: Comandos específicos para este proyecto
- ✅ **Auto-actualización**: Actualiza `config.ts` automáticamente al desplegar

## 📦 Instalación

### Prerrequisitos

1. **Foundry** debe estar instalado:
   ```bash
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   ```

2. **Node.js** v18 o superior

### Setup del MCP

```bash
# 1. Navegar al directorio del MCP
cd mcp-foundry-server

# 2. Instalar dependencias
npm install

# 3. Compilar TypeScript
npm run build

# 4. Verificar que funciona
node build/index.js
```

## ⚙️ Configuración en VSCode

### Opción 1: Settings JSON (Recomendado)

Agrega esto a tu `.vscode/settings.json` o settings globales de VSCode:

```json
{
  "github.copilot.advanced": {
    "mcpServers": {
      "foundry-supplychain": {
        "command": "node",
        "args": [
          "/RUTA/ABSOLUTA/A/TU/PROYECTO/pfm-web3/mcp-foundry-server/build/index.js"
        ],
        "env": {
          "NODE_ENV": "production"
        }
      }
    }
  }
}
```

**Importante**: Reemplaza `/RUTA/ABSOLUTA/A/TU/PROYECTO/` con la ruta real de tu proyecto.

**Ejemplos:**
- macOS/Linux: `/Users/tuusuario/proyectos/pfm-web3/mcp-foundry-server/build/index.js`
- Windows: `C:/Users/tuusuario/proyectos/pfm-web3/mcp-foundry-server/build/index.js`

**Tip:** También puedes usar la variable `${workspaceFolder}` si configuras en `.vscode/settings.json` del workspace:
```json
{
  "github.copilot.advanced": {
    "mcpServers": {
      "foundry-supplychain": {
        "command": "node",
        "args": ["${workspaceFolder}/mcp-foundry-server/build/index.js"]
      }
    }
  }
}
```

### Opción 2: MCP Config File

Si VSCode Copilot soporta archivo de configuración externo:

```json
{
  "mcpServers": {
    "foundry-supplychain": {
      "command": "node",
      "args": ["${workspaceFolder}/mcp-foundry-server/build/index.js"]
    }
  }
}
```

## 🚀 Uso con VSCode Copilot

Una vez configurado, puedes usar **lenguaje natural** en el chat de Copilot:

### Ejemplos de uso

#### 1. Iniciar entorno de desarrollo

```
👤: "Inicia anvil en el puerto 8545"
🤖: [ejecuta start_anvil]
    ✅ Anvil iniciado correctamente
    🔗 RPC URL: http://127.0.0.1:8545
    💡 Usa "get_accounts" para ver las cuentas disponibles
```

#### 2. Compilar y testear

```
👤: "Compila el contrato SupplyChain y ejecuta los tests"
🤖: [ejecuta compile_contracts + run_tests]
    ✅ Compilación exitosa
    ✅ 15/15 tests pasaron
    📊 Gas report generado
```

#### 3. Desplegar con auto-config

```
👤: "Despliega SupplyChain y actualiza la configuración del frontend"
🤖: [ejecuta deploy_supplychain]
    ✅ Contrato desplegado en: 0x5FbDB2...
    ✅ Configuración actualizada
    📄 Archivo: web/src/contracts/config.ts
```

#### 4. Setup completo (TODO EN UNO)

```
👤: "Configura el entorno de desarrollo completo"
🤖: [ejecuta setup_dev_environment]
    🔨 Compilando contratos... ✅
    🧪 Ejecutando tests... ✅
    🚀 Desplegando SupplyChain... ✅
    🎉 ¡Todo listo para desarrollar!
```

#### 5. Interactuar con contratos

```
👤: "¿Cuál es el balance de la dirección 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266?"
🤖: [ejecuta get_balance]
    💰 Balance: 10000 ETH

👤: "Llama a la función getProduct del contrato SupplyChain con ID 1"
🤖: [ejecuta call_contract]
    ✅ Llamada exitosa
    📊 Resultado: [datos del producto]
```

## 🛠️ Herramientas Disponibles

### Anvil Manager (4 herramientas)
- `start_anvil` - Iniciar blockchain local
- `stop_anvil` - Detener nodo Anvil
- `get_anvil_status` - Estado del nodo
- `get_accounts` - Cuentas con balances

### Cast Operations (7 herramientas)
- `call_contract` - Llamadas read-only
- `send_transaction` - Enviar transacciones
- `get_balance` - Consultar balances
- `get_transaction` - Detalles de TX
- `get_transaction_receipt` - Recibo de TX
- `get_block_number` - Número de bloque actual
- `estimate_gas` - Estimación de gas

### Forge Management (6 herramientas)
- `compile_contracts` - Compilar contratos
- `run_tests` - Ejecutar tests
- `deploy_contract` - Desplegar contratos
- `generate_abi` - Generar ABI
- `get_bytecode` - Obtener bytecode
- `clean_project` - Limpiar artefactos

### SupplyChain Helpers (3 herramientas HIGH-LEVEL)
- `deploy_supplychain` - Deploy + auto-config frontend
- `test_supplychain` - Tests con gas report
- `setup_dev_environment` - Setup completo (compile + test + deploy)

## 🏗️ Arquitectura del Proyecto

```
mcp-foundry-server/
├── src/
│   ├── index.ts              # 🚀 Servidor MCP principal
│   ├── types/
│   │   └── foundry.ts        # 📝 Tipos TypeScript
│   └── tools/
│       ├── anvil.ts          # ⚡ Gestión de Anvil
│       ├── cast.ts           # 📞 Operaciones Cast
│       ├── forge.ts          # 🔨 Gestión Forge
│       └── supplychain.ts    # 🎯 Helpers SupplyChain
├── build/                    # 📦 Código compilado
├── package.json
├── tsconfig.json
└── README.md                 # 📖 Este archivo
```

## 🔐 Seguridad

⚠️ **IMPORTANTE**: Este MCP maneja claves privadas para deployment.

### Buenas prácticas:

1. **NUNCA** hardcodees claves privadas
2. Usa variables de entorno cuando sea posible
3. Solo usa cuentas de **desarrollo/testing**
4. No uses este MCP con claves de mainnet

### Ejemplo seguro:

```bash
# En lugar de pasar la clave directamente
👤: "Despliega con la clave privada de la cuenta 0 de Anvil"

# El MCP puede usar la primera cuenta de Anvil automáticamente
🤖: [usa get_accounts para obtener cuenta 0 + deploy]
```

## 🐛 Troubleshooting

### Error: "Foundry no encontrado"

```bash
# Instalar Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Verificar instalación
forge --version
cast --version
anvil --version
```

### Error: "Puerto 8545 ya está en uso"

```bash
# Opción 1: Detener Anvil existente
pkill -9 anvil

# Opción 2: Usar otro puerto
👤: "Inicia anvil en el puerto 8546"
```

### Error: "No se puede compilar"

```bash
# Verificar que estás en el directorio correcto
cd /ruta/a/pfm-web3

# Limpiar y recompilar
👤: "Limpia el proyecto y recompila"
```

### El MCP no aparece en Copilot

1. Verifica que compilaste el proyecto: `npm run build`
2. Confirma la ruta en `settings.json` sea absoluta y correcta
3. Reinicia VSCode completamente
4. Verifica logs de Copilot en Output panel

## 📊 Ejemplo de Flujo Completo

```
# 1. Iniciar entorno
👤: "Configura el entorno de desarrollo completo"
🤖: ✅ Anvil iniciado
    ✅ Contratos compilados
    ✅ Tests pasados (15/15)
    ✅ SupplyChain desplegado en 0x5FbDB2...
    ✅ Frontend configurado

# 2. Desarrollo iterativo
👤: "Modifica la función X en SupplyChain"
🤖: [edita archivo]

👤: "Recompila y testea"
🤖: [compile_contracts + run_tests]
    ✅ Compilación exitosa
    ✅ Tests pasaron

# 3. Redeploy
👤: "Despliega de nuevo y actualiza config"
🤖: [deploy_supplychain]
    ✅ Nueva dirección: 0xabc123...
    ✅ Config actualizado

# 4. Testing manual
👤: "¿Cuáles son las cuentas disponibles?"
🤖: [get_accounts]
    0: 0xf39Fd... (10000 ETH)
    1: 0x70997... (10000 ETH)
    ...

👤: "Usa la cuenta 0 para crear un producto"
🤖: [send_transaction]
    ✅ Producto creado: ID #1
```

## 🔗 Integración con el Proyecto

Este MCP está específicamente diseñado para el proyecto SupplyChain:

- ✅ Detecta automáticamente la estructura `sc/` y `web/`
- ✅ Actualiza `web/src/contracts/config.ts` al desplegar
- ✅ Usa parámetros optimizados para SupplyChain.sol
- ✅ Helpers específicos para workflows comunes

## 📚 Recursos

- [Foundry Book](https://book.getfoundry.sh/) - Documentación oficial
- [Model Context Protocol](https://modelcontextprotocol.io/) - Especificación MCP
- [VSCode Copilot Docs](https://code.visualstudio.com/docs/copilot) - Documentación Copilot

## 🤝 Contribuir

Este MCP es específico para el proyecto SupplyChain, pero puedes extenderlo:

1. Agrega nuevos helpers en `src/tools/supplychain.ts`
2. Registra las nuevas tools en `src/index.ts`
3. Recompila: `npm run build`
4. Reinicia VSCode

## 📝 Licencia

MIT - Usa libremente para tu proyecto

---

**Optimizado para VSCode Copilot** 🚀 | **SupplyChain Tracker** 📦
