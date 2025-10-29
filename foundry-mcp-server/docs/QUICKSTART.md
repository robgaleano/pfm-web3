# ⚡ Quick Start - 5 Minutos para Empezar

Esta guía te ayudará a configurar y usar el MCP Foundry Server en **5 minutos**.

## ✅ Pre-requisitos

Antes de empezar, verifica que tienes:

```bash
# 1. Foundry instalado
forge --version
# Si no: curl -L https://foundry.paradigm.xyz | bash && foundryup

# 2. Node.js v18+
node --version
# Si no: instala desde https://nodejs.org/

# 3. El proyecto pfm-web3
cd ~/tu-proyecto/pfm-web3  # Ajusta a tu ruta
ls -la mcp-foundry-server
# Deberías ver el directorio
```

---

## 🚀 Paso 1: Verificar Instalación (30 segundos)

```bash
cd ~/tu-proyecto/pfm-web3/mcp-foundry-server  # Ajusta a tu ruta

# Verificar que el build existe
ls -la build/index.js

# Probar el servidor
node build/index.js
# Deberías ver:
# 🚀 Foundry SupplyChain MCP Server initialized
# 📦 Optimized for VSCode Copilot
# ✅ Foundry SupplyChain MCP Server running on stdio

# Presiona Ctrl+C para detener
```

✅ **Si ves esos mensajes, el MCP está listo!**

❌ **Si no funciona:**
```bash
npm install
npm run build
```

---

## ⚙️ Paso 2: Configurar VSCode (2 minutos)

### Opción A: Copiar configuración automáticamente

```bash
# Navega a la raíz de tu proyecto
cd ~/tu-proyecto/pfm-web3  # Ajusta a tu ruta

# Crear directorio .vscode si no existe
mkdir -p .vscode

# Copiar configuración de ejemplo
cp mcp-foundry-server/vscode-settings-example.json .vscode/settings.json
```

### Opción B: Manual

1. Abrir VSCode
2. `Cmd + Shift + P` (macOS) o `Ctrl + Shift + P` (Windows/Linux)
3. Escribir: `Preferences: Open User Settings (JSON)`
4. Agregar:

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

⚠️ **Reemplaza `/RUTA/ABSOLUTA/A/TU/PROYECTO/` con la ruta real de tu proyecto**

**Ejemplo en macOS/Linux:**
```
/Users/tuusuario/proyectos/pfm-web3/mcp-foundry-server/build/index.js
```

**Ejemplo en Windows:**
```
C:/Users/tuusuario/proyectos/pfm-web3/mcp-foundry-server/build/index.js
```

---

## 🔄 Paso 3: Reiniciar VSCode (30 segundos)

1. Cierra **completamente** VSCode (Cmd+Q en macOS)
2. Vuelve a abrirlo
3. Abre el proyecto pfm-web3

---

## 🧪 Paso 4: Probar en Copilot (2 minutos)

Abre el **chat de GitHub Copilot** y prueba estos comandos:

### Test 1: Verificar que funciona
```
¿Qué herramientas de Foundry tienes disponibles?
```

**Esperado:** Copilot lista las 20 herramientas del MCP

### Test 2: Comando simple
```
Muéstrame el estado de Anvil
```

**Esperado:** Respuesta indicando que Anvil no está corriendo (aún)

### Test 3: Iniciar Anvil
```
Inicia Anvil en el puerto 8545
```

**Esperado:** 
```
✅ Anvil iniciado correctamente
🔗 RPC URL: http://127.0.0.1:8545
⛓️  Chain ID: 31337
👥 Cuentas: 10
💰 Balance inicial: 10000 ETH
```

### Test 4: Comando complejo
```
Configura el entorno de desarrollo completo
```

**Esperado:**
```
🔨 Compilando contratos... ✅
🧪 Ejecutando tests... ✅ (15/15 tests pasaron)
🚀 Desplegando SupplyChain... ✅
📍 Contrato desplegado en: 0x5FbDB2...
✅ Configuración actualizada
🎉 ¡Todo listo para desarrollar!
```

---

## ✅ ¡Listo!

Si todos los tests pasaron, **el MCP está funcionando correctamente** y puedes:

### 🎯 Usar comandos en lenguaje natural:

```
"Compila los contratos"
"Ejecuta los tests con reporte de gas"
"Despliega SupplyChain y actualiza la configuración"
"¿Cuáles son las cuentas disponibles?"
"Crea un producto usando la cuenta 0"
"Muéstrame el balance de la primera cuenta"
```

### 📚 Aprender más:

- `README.md` - Documentación completa
- `EXAMPLES.md` - 10 escenarios de uso
- `VSCODE_SETUP.md` - Troubleshooting detallado

---

## 🐛 ¿Problemas?

### El MCP no aparece en Copilot

1. **Verifica la configuración:**
   ```bash
   cat .vscode/settings.json  # Desde la raíz del proyecto
   ```
   Debe contener la configuración de `mcpServers`

2. **Verifica los logs de Copilot:**
   - En VSCode: `View > Output`
   - Dropdown: Selecciona `GitHub Copilot`
   - Busca mensajes relacionados con MCP

3. **Reinicia VSCode completamente:**
   - `Cmd + Q` (macOS) o cerrar todas las ventanas
   - Vuelve a abrir

### Foundry no funciona

```bash
# Reinstalar Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Verificar
which forge
which cast
which anvil
```

### El servidor no inicia

```bash
cd mcp-foundry-server

# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install

# Recompilar
npm run build

# Probar
node build/index.js
```

---

## 🎉 Próximos Pasos

Una vez configurado:

### 1. **Desarrolla con Copilot:**
```
"Modifica la función createProduct para agregar validación de precio mínimo"
"Recompila y testea"
"Despliega de nuevo"
```

### 2. **Explora los ejemplos:**
Lee `EXAMPLES.md` para ver 10 escenarios completos de uso

### 3. **Experimenta:**
Prueba tus propios comandos en lenguaje natural

---

## 📊 Resumen de lo que tienes

- ✅ **20 herramientas** de Foundry accesibles desde Copilot
- ✅ **Automatización** de compilación, testing y deployment
- ✅ **Auto-actualización** de configuración del frontend
- ✅ **Comandos de alto nivel** específicos de SupplyChain
- ✅ **Documentación completa** con ejemplos

---

## 💡 Comandos Más Útiles

```bash
# Setup inicial
"Configura el entorno de desarrollo completo"

# Desarrollo iterativo
"Recompila y testea"
"Despliega de nuevo y actualiza config"

# Debugging
"Ejecuta solo los tests de transferencias con verbosidad máxima"
"Estima el gas para crear un producto"

# Interacción
"¿Cuáles son las cuentas disponibles?"
"Llama a la función getProduct con ID 1"
"Crea un producto usando la cuenta 0"
```

---

**¡Disfruta desarrollando smart contracts con el poder de Copilot! 🚀**

¿Dudas? Revisa `VSCODE_SETUP.md` para troubleshooting detallado.
