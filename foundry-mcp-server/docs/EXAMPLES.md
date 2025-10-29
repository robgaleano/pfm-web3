# 📚 Ejemplos de Uso - MCP Foundry para SupplyChain

Esta guía muestra ejemplos reales de cómo usar el MCP con VSCode Copilot en el proyecto SupplyChain.

## 🎬 Escenario 1: Primer Setup del Proyecto

### Objetivo
Configurar el entorno de desarrollo por primera vez.

### Comandos de Copilot

```
👤: "Configura el entorno de desarrollo completo para SupplyChain"

🤖: [Ejecuta setup_dev_environment]
    🔨 Compilando contratos... ✅
    🧪 Ejecutando tests... ✅ (15/15 tests pasaron)
    🚀 Desplegando SupplyChain... ✅
    📍 Contrato desplegado en: 0x5FbDB2315678afecb367f032d93F642f64180aa3
    ✅ Configuración actualizada: web/src/contracts/config.ts
    🎉 ¡Todo listo para desarrollar!
```

### Qué hace internamente

1. Compila contratos en `sc/` con optimización
2. Ejecuta todos los tests con gas report
3. Despliega SupplyChain en Anvil local (port 8545)
4. Actualiza automáticamente `web/src/contracts/config.ts` con:
   - Nueva dirección del contrato
   - ABI actualizado

### Después de esto

Puedes iniciar el frontend y empezar a trabajar:
```bash
cd web
npm run dev
```

---

## 🎬 Escenario 2: Desarrollo Iterativo

### Objetivo
Modificar el contrato, testear y redesplegar.

### Workflow

```
👤: "Modifica la función createProduct para agregar validación de precio mínimo"

🤖: [Edita sc/src/SupplyChain.sol]
    ✅ Agregada validación: require(price >= 1 ether)

👤: "Compila el contrato y ejecuta los tests"

🤖: [Ejecuta compile_contracts + run_tests]
    ✅ Compilación exitosa (0 warnings)
    ❌ 2/15 tests fallaron
    
    Test fallidos:
    - testCreateProductWithZeroPrice
    - testCreateProductWithLowPrice
    
    💡 Los tests esperan que se permita precio = 0

👤: "Ajusta los tests para validar que el precio sea >= 1 ether"

🤖: [Edita sc/test/SupplyChain.t.sol]
    ✅ Tests actualizados

👤: "Ejecuta los tests de nuevo"

🤖: [Ejecuta run_tests]
    ✅ 15/15 tests pasaron
    📊 Gas promedio: 125,432

👤: "Despliega de nuevo y actualiza config"

🤖: [Ejecuta deploy_supplychain]
    ✅ Contrato desplegado en: 0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9
    ✅ web/src/contracts/config.ts actualizado
```

---

## 🎬 Escenario 3: Testing Específico

### Objetivo
Ejecutar solo tests de transferencias con debugging.

### Comandos

```
👤: "Ejecuta solo los tests relacionados con transferencias con verbosidad máxima"

🤖: [Ejecuta run_tests con testPattern="Transfer" y verbosity=5]
    🧪 Tests de transferencias
    
    ✅ testCreateTransfer
       Gas usado: 89,234
       
    ✅ testAcceptTransfer
       Gas usado: 134,567
       
    ✅ testRejectTransfer
       Gas usado: 45,123
       
    ✅ testCannotAcceptOwnTransfer
       Revert detectado: "Cannot accept own transfer"
       
    ✅ testCannotAcceptTwice
       Revert detectado: "Transfer already processed"
    
    📊 5/5 tests pasaron
    💨 Gas total: 312,924
```

### Testing con Fork

```
👤: "Ejecuta los tests haciendo fork de mainnet en el bloque 18000000"

🤖: [Ejecuta run_tests con forkUrl y forkBlockNumber]
    🔱 Fork desde mainnet
    📦 Bloque: 18000000
    🧪 Ejecutando tests...
    ✅ 15/15 tests pasaron
```

---

## 🎬 Escenario 4: Interacción con Contratos

### Objetivo
Interactuar con el contrato desplegado desde Copilot.

### Comandos

```
👤: "¿Cuáles son las cuentas disponibles en Anvil?"

🤖: [Ejecuta get_accounts]
    👥 Cuentas disponibles:
    
    0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
       💰 10000 ETH
    
    1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
       💰 10000 ETH
    
    2: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
       💰 10000 ETH
    
    [... 7 más]

👤: "Llama a la función productCount del contrato SupplyChain"

🤖: [Ejecuta call_contract]
    ✅ Llamada exitosa
    📊 Resultado: 0
    
👤: "Crea un producto usando la cuenta 0 de Anvil"

🤖: [Ejecuta send_transaction con createProduct]
    ✅ Transacción enviada
    📞 Función: createProduct(string,string,uint256)
    🔗 TX Hash: 0xabc123...
    
👤: "¿Cuál es el nuevo productCount?"

🤖: [Ejecuta call_contract]
    ✅ Llamada exitosa
    📊 Resultado: 1

👤: "Muéstrame los detalles del producto ID 1"

🤖: [Ejecuta call_contract con getProduct]
    ✅ Llamada exitosa
    📊 Resultado:
    {
      id: 1,
      name: "MacBook Pro",
      origin: "Apple Factory",
      price: 1500000000000000000000 wei (1500 ETH),
      owner: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266,
      currentHolder: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
    }
```

---

## 🎬 Escenario 5: Debugging de Gas

### Objetivo
Analizar y optimizar consumo de gas.

### Comandos

```
👤: "Estima el gas para crear un producto"

🤖: [Ejecuta estimate_gas]
    ⛽ Estimación de gas
    📞 Función: createProduct(string,string,uint256)
    💨 Gas estimado: 125,432

👤: "Ejecuta los tests con reporte de gas completo"

🤖: [Ejecuta run_tests con gasReport=true]
    📊 Reporte de Gas
    
    SupplyChain Tests:
    ├─ createProduct ............ 125,432 gas
    ├─ createTransfer ........... 89,234 gas
    ├─ acceptTransfer ........... 134,567 gas
    ├─ rejectTransfer ........... 45,123 gas
    └─ getProduct ............... 3,421 gas (view)
    
    💡 Funciones más costosas:
    1. acceptTransfer (134,567 gas)
    2. createProduct (125,432 gas)
    3. createTransfer (89,234 gas)

👤: "¿Cómo puedo optimizar acceptTransfer?"

🤖: Sugerencias para optimizar acceptTransfer:
    
    1. Usa storage packing para variables relacionadas
    2. Evita múltiples SSTORE en la misma transacción
    3. Considera usar unchecked para aritmética segura
    4. Reduce el número de eventos emitidos
    
    ¿Quieres que implemente alguna de estas optimizaciones?
```

---

## 🎬 Escenario 6: Deployment a Testnet

### Objetivo
Desplegar a una testnet real (ej: Sepolia).

### Setup previo

Necesitas:
1. RPC URL de Sepolia
2. Private key con ETH de testnet
3. Etherscan API key (para verificación)

### Comandos

```
👤: "Despliega SupplyChain a Sepolia con verificación en Etherscan"

🤖: Antes de desplegar a Sepolia, necesito:
    - RPC URL de Sepolia
    - Private key (no la compartas en el chat)
    - Etherscan API key
    
    ¿Tienes estos datos configurados?

👤: "Sí, usa el RPC https://sepolia.infura.io/v3/YOUR_KEY y verifica el contrato"

🤖: [Ejecuta deploy_contract con verify=true]
    🔨 Compilando...
    🚀 Desplegando a Sepolia...
    ⏳ Esperando confirmaciones...
    ✅ Contrato desplegado en: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
    🔗 TX Hash: 0xdef456...
    ✔️  Verificando en Etherscan...
    ✅ Contrato verificado: https://sepolia.etherscan.io/address/0x742d...
    
    ⚠️  IMPORTANTE: 
    Para usar este contrato en el frontend, actualiza manualmente:
    - RPC_URL en Web3Context.tsx
    - CONTRACT_CONFIG.address en config.ts
```

---

## 🎬 Escenario 7: Análisis de Transacciones

### Objetivo
Revisar detalles de transacciones específicas.

### Comandos

```
👤: "Crea un producto y muéstrame el receipt de la transacción"

🤖: [Ejecuta send_transaction + get_transaction_receipt]
    ✅ Producto creado
    
    🧾 Recibo de transacción:
    
    Transaction Hash: 0xabc123...
    Block Number: 125
    Gas Used: 125,432
    Status: Success ✅
    
    Events emitted:
    - ProductCreated(id=1, owner=0xf39Fd...)
    
    Logs:
    [
      {
        event: "ProductCreated",
        args: {
          productId: 1,
          name: "MacBook Pro",
          owner: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
        }
      }
    ]

👤: "¿Cuál es el bloque actual?"

🤖: [Ejecuta get_block_number]
    📦 Número de bloque actual: 126
```

---

## 🎬 Escenario 8: Mantenimiento y Limpieza

### Objetivo
Limpiar artefactos y recompilar desde cero.

### Comandos

```
👤: "Limpia todos los artefactos de compilación"

🤖: [Ejecuta clean_project]
    ✅ Artefactos de compilación limpiados
    📁 Eliminado: sc/out/
    📁 Eliminado: sc/cache/
    
    💡 Ejecuta "compile_contracts" para recompilar

👤: "Recompila todo desde cero con optimización máxima"

🤖: [Ejecuta compile_contracts con viaIr=true, optimize=true, optimizerRuns=1000000]
    🔨 Compilando con optimización máxima...
    ⚙️  Via IR: Sí
    ⚙️  Optimizer runs: 1,000,000
    ⏳ Esto puede tomar un tiempo...
    ✅ Compilación exitosa
    📦 Bytecode optimizado generado
    
    💡 Esta compilación produce el bytecode más pequeño posible
    💡 Ideal para deployment en mainnet
```

---

## 🎬 Escenario 9: Obtener ABI y Bytecode

### Objetivo
Exportar ABI y bytecode para integraciones externas.

### Comandos

```
👤: "Genera el ABI del contrato SupplyChain"

🤖: [Ejecuta generate_abi]
    ✅ ABI generada
    📝 Contrato: SupplyChain
    
    📄 ABI:
    ```json
    [
      {
        "type": "function",
        "name": "createProduct",
        "inputs": [
          { "name": "name", "type": "string" },
          { "name": "origin", "type": "string" },
          { "name": "price", "type": "uint256" }
        ],
        "outputs": [
          { "name": "", "type": "uint256" }
        ],
        "stateMutability": "nonpayable"
      },
      // ... más funciones
    ]
    ```

👤: "¿Cuál es el bytecode del contrato?"

🤖: [Ejecuta get_bytecode]
    ✅ Bytecode obtenido
    📝 Contrato: SupplyChain
    📦 Tamaño: 12,456 bytes
    
    📄 Bytecode:
    0x608060405234801561001057600080fd5b50...
    
    💡 Puedes usar este bytecode para deployment manual
```

---

## 🎬 Escenario 10: Workflow Completo de Producción

### Objetivo
Preparar el contrato para deployment en mainnet.

### Comandos

```
👤: "Prepara SupplyChain para deployment en mainnet"

🤖: Checklist para deployment en mainnet:
    
    1. ✅ Limpieza de artefactos
    2. ✅ Compilación optimizada
    3. ✅ Ejecución de tests
    4. ✅ Análisis de gas
    5. ✅ Generación de documentación
    
    ¿Procedo con estos pasos?

👤: "Sí, hazlo"

🤖: [Ejecuta secuencia completa]
    
    1️⃣ Limpiando artefactos... ✅
    
    2️⃣ Compilando con optimización para mainnet...
       ⚙️  Optimizer runs: 200
       ⚙️  Via IR: Sí
       ✅ Compilación exitosa
    
    3️⃣ Ejecutando suite de tests completa...
       ✅ 15/15 tests pasaron
       ⏱️  Tiempo total: 3.2s
    
    4️⃣ Generando reporte de gas...
       📊 createProduct: 125,432 gas
       📊 acceptTransfer: 134,567 gas
       📊 rejectTransfer: 45,123 gas
       💰 Costo estimado (30 gwei):
           - Deploy: ~$45 USD
           - createProduct: ~$4 USD
           - acceptTransfer: ~$5 USD
    
    5️⃣ Generando ABI y bytecode...
       ✅ ABI: sc/out/SupplyChain.sol/SupplyChain.json
       ✅ Bytecode: 12,456 bytes
    
    🎉 SupplyChain listo para deployment en mainnet
    
    ⚠️  CHECKLIST FINAL:
    [ ] Auditoría de seguridad completada
    [ ] RPC URL de mainnet configurado
    [ ] Private key con ETH suficiente
    [ ] Etherscan API key configurado
    [ ] Backup de deployment scripts
    [ ] Plan de rollback definido
```

---

## 💡 Tips y Trucos

### Comando rápido para redeploy durante desarrollo

```
👤: "Recompila, testea y despliega"

🤖: [compile_contracts + run_tests + deploy_supplychain]
```

### Verificar estado antes de trabajar

```
👤: "¿Está todo listo para desarrollar?"

🤖: Verificando entorno...
    ✅ Foundry instalado
    ✅ Anvil corriendo (port 8545)
    ✅ Contratos compilados
    ✅ Tests pasando
    ✅ Frontend configurado
    
    🎉 ¡Listo para desarrollar!
```

### Obtener ayuda contextual

```
👤: "¿Qué puedo hacer con el MCP de Foundry?"

🤖: Herramientas disponibles:
    
    🔧 Anvil (4): start, stop, status, accounts
    📞 Cast (7): call, send, balance, tx, receipt, block, estimate
    🔨 Forge (6): compile, test, deploy, abi, bytecode, clean
    🎯 SupplyChain (3): deploy, test, setup
    
    ¿Qué te gustaría hacer?
```

---

## 📝 Notas Importantes

1. **Private Keys**: Nunca compartas private keys en el chat. Usa variables de entorno.

2. **RPC URLs**: El MCP usa `http://127.0.0.1:8545` por defecto. Para otras redes, especifica el RPC.

3. **Auto-update Config**: Por defecto, `deploy_supplychain` actualiza `web/src/contracts/config.ts`. Puedes desactivarlo con `updateConfig: false`.

4. **Gas Prices**: Las estimaciones de gas son en wei. Para mainnet, multiplica por el gas price actual.

5. **Testing**: Siempre ejecuta tests antes de desplegar, especialmente en testnet/mainnet.

---

**¿Más ejemplos?** Experimenta con tus propios comandos. El MCP entiende lenguaje natural!
