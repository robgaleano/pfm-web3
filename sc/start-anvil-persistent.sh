#!/bin/bash

# Iniciar Anvil con persistencia de estado
# El estado se guarda y restaura entre reinicios

STATE_FILE="./anvil-state.json"

if [ -f "$STATE_FILE" ]; then
    echo "📂 Cargando estado previo de Anvil..."
    anvil --load-state "$STATE_FILE" --dump-state "$STATE_FILE"
else
    echo "🆕 Iniciando Anvil nuevo con persistencia..."
    anvil --dump-state "$STATE_FILE"
fi
