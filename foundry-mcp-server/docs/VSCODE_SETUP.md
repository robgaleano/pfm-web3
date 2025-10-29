# 🎯 Guía de Configuración para VSCode Copilot

## Paso 1: Verificar Instalación del MCP

```bash
# Desde el directorio raíz de tu proyecto
cd ~/tu-proyecto/pfm-web3  # Ajusta a tu ruta
cd mcp-foundry-server

# Verificar que el build existe
ls -la build/index.js
# Deberías ver: -rw-r--r--  1 ... build/index.js
```

## Paso 2: Configurar VSCode Settings

### Opción A: Settings de Usuario (Recomendado)

1. Abre VSCode
2. Presiona `Cmd + Shift + P` (macOS) o `Ctrl + Shift + P` (Windows/Linux)
3. Escribe: `Preferences: Open User Settings (JSON)`
4. Agrega esta configuración:

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

**⚠️ IMPORTANTE**: Reemplaza `/RUTA/ABSOLUTA/A/TU/PROYECTO/` con la ruta real de tu proyecto.

**Ejemplos:**
- macOS/Linux: `/Users/tuusuario/proyectos/pfm-web3/mcp-foundry-server/build/index.js`
- Windows: `C:/Users/tuusuario/proyectos/pfm-web3/mcp-foundry-server/build/index.js`

### Opción B: Settings del Workspace

1. Crea/edita `.vscode/settings.json` en la raíz del proyecto:

```json
{
  "github.copilot.advanced": {
    "mcpServers": {
      "foundry-supplychain": {
        "command": "node",
        "args": [
          "${workspaceFolder}/mcp-foundry-server/build/index.js"
        ],
        "env": {
          "NODE_ENV": "production"
        }
      }
    }
  }
}
```

## Paso 3: Reiniciar VSCode

1. Cierra completamente VSCode
2. Vuelve a abrirlo
3. Abre tu proyecto pfm-web3

## Paso 4: Verificar que Funciona

### Test 1: Verificar que el MCP está activo

Abre el chat de Copilot y pregunta:

```
¿Qué herramientas de Foundry tienes disponibles?
```

Copilot debería responder con la lista de herramientas del MCP.

### Test 2: Comando simple

```
Muéstrame el estado de Anvil
```

Debería ejecutar `get_anvil_status` y mostrar si Anvil está corriendo o no.

### Test 3: Comando complejo

```
Inicia Anvil en el puerto 8545 con 10 cuentas
```

Debería ejecutar `start_anvil` con los parámetros correctos.

## Paso 5: Debug (Si no funciona)

### Ver logs de Copilot

1. En VSCode, ve a: `View > Output`
2. En el dropdown, selecciona: `GitHub Copilot`
3. Busca mensajes relacionados con MCP

### Verificar manualmente el MCP

```bash
# Navega al directorio del MCP
cd ~/tu-proyecto/pfm-web3/mcp-foundry-server  # Ajusta a tu ruta

# Ejecutar el servidor directamente
node build/index.js

# Deberías ver:
# 🚀 Foundry SupplyChain MCP Server initialized
# 📦 Optimized for VSCode Copilot
# ✅ Foundry SupplyChain MCP Server running on stdio
```

Si ves esos mensajes, el servidor funciona correctamente.

### Problemas comunes

#### 1. "Cannot find module '@modelcontextprotocol/sdk'"

```bash
cd mcp-foundry-server
npm install
npm run build
```

#### 2. "Foundry commands not found"

```bash
# Instalar Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Verificar
which forge
which cast
which anvil
```

#### 3. "Permission denied"

```bash
chmod +x build/index.js
```

#### 4. VSCode no reconoce la configuración

- Asegúrate de tener la última versión de GitHub Copilot extension
- Verifica que la sintaxis JSON sea correcta (sin comas extra)
- Reinicia VSCode completamente

## Configuración Avanzada

### Usar variables de entorno

Si quieres configurar RPC URL o claves por defecto:

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
          "NODE_ENV": "production",
          "DEFAULT_RPC_URL": "http://127.0.0.1:8545",
          "AUTO_UPDATE_CONFIG": "true"
        }
      }
    }
  }
}
```

### Múltiples MCPs

Si tienes otros MCPs configurados:

```json
{
  "github.copilot.advanced": {
    "mcpServers": {
      "foundry-supplychain": {
        "command": "node",
        "args": [
          "/RUTA/ABSOLUTA/A/TU/PROYECTO/pfm-web3/mcp-foundry-server/build/index.js"
        ]
      },
      "otro-mcp": {
        "command": "node",
        "args": ["path/to/otro-mcp/index.js"]
      }
    }
  }
}
```

## Comandos de Ejemplo para Probar

Una vez configurado, prueba estos comandos en el chat de Copilot:

### Básicos
```
- "Inicia anvil"
- "Muéstrame las cuentas disponibles"
- "¿Cuál es el balance de la primera cuenta?"
- "Compila los contratos"
```

### Intermedios
```
- "Ejecuta los tests de SupplyChain con reporte de gas"
- "Despliega SupplyChain y actualiza la configuración del frontend"
- "Llama a la función getProduct del contrato con ID 1"
```

### Avanzados
```
- "Configura el entorno de desarrollo completo"
- "Estima el gas para crear un producto"
- "Genera el ABI del contrato SupplyChain"
```

## Verificación Final

Si todo está configurado correctamente:

1. ✅ `npm run build` compila sin errores
2. ✅ `node build/index.js` inicia el servidor
3. ✅ VSCode Copilot reconoce las herramientas
4. ✅ Los comandos ejecutan las funciones correctas

---

**¿Problemas?** Revisa la sección de Troubleshooting en el README.md principal.
