#!/bin/bash

# Script para redesplegar el contrato manteniendo la dirección consistente
# Uso: ./redeploy.sh

set -e  # Salir si hay algún error

echo "🔄 Reiniciando Anvil..."
pkill -9 anvil 2>/dev/null || true
sleep 1
anvil > /dev/null 2>&1 &
ANVIL_PID=$!
echo "✅ Anvil iniciado (PID: $ANVIL_PID)"

# Esperar a que Anvil esté listo
echo "⏳ Esperando a que Anvil esté listo..."
sleep 2

echo "🔨 Compilando contrato..."
forge build

echo "🚀 Desplegando contrato..."
forge script script/Deploy.s.sol \
  --rpc-url http://localhost:8545 \
  --broadcast \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Extraer la dirección del contrato del deployment
CONTRACT_ADDRESS=$(grep -A 2 "Contract Address" broadcast/Deploy.s.sol/31337/run-latest.json | grep "contractAddress" | cut -d'"' -f4)

echo ""
echo "✅ Contrato desplegado en: $CONTRACT_ADDRESS"

echo "📝 Actualizando ABI..."
jq '.abi' out/SupplyChain.sol/SupplyChain.json > ../web/src/contracts/SupplyChain.abi.json

echo "🔧 Actualizando config.ts..."
# Actualizar la dirección del contrato en config.ts
sed -i '' "s/address: \"0x[a-fA-F0-9]*\"/address: \"$CONTRACT_ADDRESS\"/" ../web/src/contracts/config.ts

echo ""
echo "✅ Deployment completo!"
echo "📍 Dirección del contrato: $CONTRACT_ADDRESS"
echo "🌐 Chain ID: 31337"
echo "🔗 RPC: http://localhost:8545"
echo ""
echo "ℹ️  Esta dirección será siempre la misma mientras:"
echo "   - Uses la misma private key (cuenta #0 de Anvil)"
echo "   - Anvil se reinicie limpio (nonce 0)"
