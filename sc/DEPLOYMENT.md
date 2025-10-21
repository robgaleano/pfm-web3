# 🔧 Guía de Deployment del Smart Contract

## 📋 Tabla de Contenidos
- [Problema: Direcciones Inconsistentes](#problema-direcciones-inconsistentes)
- [Soluciones Disponibles](#soluciones-disponibles)
- [Uso Recomendado](#uso-recomendado)

---

## ❌ Problema: Direcciones Inconsistentes

Cuando redespliegas un contrato en Anvil, la dirección cambia porque:

```
Dirección del contrato = keccak256(rlp([sender_address, nonce]))
```

- **sender_address**: La cuenta que despliega (siempre la misma: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`)
- **nonce**: El número de transacciones que ha hecho esa cuenta (incrementa con cada tx)

Si Anvil ya procesó transacciones, el nonce > 0, y obtienes una dirección diferente.

---

## ✅ Soluciones Disponibles

### 🎯 **Opción 1: Script de Redeploy Automático** (RECOMENDADO para desarrollo)

Usa el script `redeploy.sh` que automatiza todo:

```bash
cd sc
./redeploy.sh
```

Este script:
1. ✅ Mata el proceso Anvil actual
2. ✅ Inicia Anvil limpio (nonce = 0)
3. ✅ Compila el contrato (`forge build`)
4. ✅ Despliega el contrato
5. ✅ Extrae y actualiza el ABI en `web/src/contracts/`
6. ✅ Actualiza la dirección en `config.ts` automáticamente

**Resultado**: Siempre obtienes `0x5FbDB2315678afecb367f032d93F642f64180aa3`

---

### 💾 **Opción 2: Anvil con Estado Persistente** (para desarrollo continuo)

Si quieres mantener el estado de la blockchain entre reinicios:

```bash
cd sc
chmod +x start-anvil-persistent.sh
./start-anvil-persistent.sh
```

Esto guarda el estado en `anvil-state.json`. La blockchain se restaura al reiniciar.

**⚠️ Nota**: La dirección del contrato NO será la misma si redespliegas, porque el nonce se mantiene.

**Cuándo usar esto**:
- Tienes datos de prueba que quieres mantener
- No quieres recrear usuarios/tokens cada vez
- Estás trabajando en el frontend sin cambiar el contrato

---

### 🔄 **Opción 3: Manual (lo que hacías antes)**

```bash
# 1. Reiniciar Anvil
pkill -9 anvil
anvil > /dev/null 2>&1 &

# 2. Compilar
forge build

# 3. Desplegar
forge script script/Deploy.s.sol --broadcast

# 4. Actualizar ABI
jq '.abi' out/SupplyChain.sol/SupplyChain.json > ../web/src/contracts/SupplyChain.abi.json

# 5. Actualizar dirección en config.ts manualmente
```

---

### 🏭 **Opción 4: Usar CREATE2 en el Contrato** (avanzado)

Para direcciones TOTALMENTE determinísticas independientemente del nonce, podrías usar el opcode `CREATE2`:

```solidity
// En un factory contract
address predictableAddress = address(uint160(uint256(keccak256(abi.encodePacked(
    bytes1(0xff),
    address(this),
    salt,
    keccak256(bytecode)
)))));
```

**⚠️ Complejo**: Requiere un contrato factory y más infraestructura.

---

## 🚀 Uso Recomendado

### Durante Desarrollo Activo del Contrato

Usa el **script de redeploy** cada vez que cambies el contrato:

```bash
./redeploy.sh
```

### Durante Desarrollo del Frontend (sin cambios en contrato)

Usa **Anvil persistente** para mantener tus datos de prueba:

```bash
# Primera vez
./start-anvil-persistent.sh

# Después puedes seguir trabajando normalmente
# El estado se guarda automáticamente
```

Para resetear todo:
```bash
rm anvil-state.json
./start-anvil-persistent.sh
```

---

## 📊 Comparación

| Método | Dirección Consistente | Mantiene Datos | Esfuerzo | Recomendado Para |
|--------|---------------------|----------------|----------|------------------|
| `redeploy.sh` | ✅ SÍ | ❌ NO | 🟢 Bajo | Cambios en contrato |
| Anvil persistente | ❌ NO* | ✅ SÍ | 🟢 Bajo | Desarrollo frontend |
| Manual | ✅ SÍ | ❌ NO | 🔴 Alto | Aprendizaje |
| CREATE2 | ✅ SÍ | Depende | 🔴 Alto | Producción |

*Solo es consistente si no redespliegas

---

## 🎓 Entendiendo la Determinación de Direcciones

```javascript
// La dirección del contrato se calcula así:
const contractAddress = ethers.getCreateAddress({
  from: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', // Cuenta #0 de Anvil
  nonce: 0  // Primera transacción de esta cuenta
});

// Resultado: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

Por eso:
- **Mismo deployer + mismo nonce = misma dirección**
- Si Anvil se reinicia → nonce vuelve a 0 → misma dirección
- Si Anvil sigue corriendo → nonce incrementa → dirección diferente

---

## 💡 Tips

1. **Agrega un alias** en tu `~/.zshrc`:
   ```bash
   alias redeploy='cd /ruta/a/tu/proyecto/sc && ./redeploy.sh && cd -'
   ```

2. **Git ignore** el estado de Anvil:
   ```bash
   echo "anvil-state.json" >> .gitignore
   ```

3. **Variables de entorno**: Puedes usar un archivo `.env` para la private key en producción:
   ```bash
   # .env
   DEPLOYER_PRIVATE_KEY=tu_private_key_real
   ```

4. **Testing**: Los tests de Foundry siempre usan un ambiente limpio, no te preocupes por esto en tests.

---

## 🆘 Troubleshooting

**Problema**: El script falla con "Address already in use"
```bash
# Solución: Mata todos los procesos de Anvil
pkill -9 anvil
```

**Problema**: La dirección sigue cambiando
```bash
# Verifica que estás usando la cuenta correcta
cast wallet address --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
# Debe ser: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
```

**Problema**: El ABI no se actualiza
```bash
# Verifica que jq está instalado
brew install jq

# Verifica la ruta del archivo
ls ../web/src/contracts/SupplyChain.abi.json
```

---

## 📚 Referencias

- [Foundry Book - Anvil](https://book.getfoundry.sh/anvil/)
- [Ethereum: Contract Address Derivation](https://ethereum.org/en/developers/docs/smart-contracts/deploying/)
- [EIP-1014: CREATE2](https://eips.ethereum.org/EIPS/eip-1014)
