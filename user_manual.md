# 📘 Manual de Usuario - Supply Chain Tracker

## 🚀 Inicio Rápido (Para Impacientes)

**Para desarrolladores que quieren empezar YA:**

```bash
# Terminal 1 - Inicia la blockchain
cd sc
anvil

# Terminal 2 - Despliega el contrato
cd sc
forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast

# Terminal 3 - Inicia el frontend
cd web
npm install  # Solo la primera vez
npm run dev
```

**Luego en MetaMask:**
1. Agrega red: RPC `http://localhost:8545`, Chain ID `31337`
2. Importa cuenta: Clave privada `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
3. Abre `http://localhost:3000` y conecta tu billetera

**¡Listo! Ahora lee el resto del manual para entender cómo funciona todo.**

---

## Tabla de Contenidos
1. [Inicio Rápido](#-inicio-rápido-para-impacientes)
2. [Introducción](#introducción)
3. [Requisitos Previos](#requisitos-previos)
4. [Configuración Inicial](#configuración-inicial)
5. [Conceptos Básicos](#conceptos-básicos)
6. [Flujos de Trabajo por Rol](#flujos-de-trabajo-por-rol)
7. [Guía Paso a Paso](#guía-paso-a-paso)
8. [Preguntas Frecuentes](#preguntas-frecuentes)
9. [Solución de Problemas](#solución-de-problemas)
10. [Anexos](#anexo-comandos-rápidos-de-referencia)

---

## Introducción

**Supply Chain Tracker** es una aplicación descentralizada (DApp) basada en blockchain que permite rastrear productos a lo largo de toda la cadena de suministro, desde la producción de materias primas hasta el consumidor final.

### ¿Qué puedes hacer con esta aplicación?

- **Registrar usuarios** con diferentes roles en la cadena de suministro
- **Crear tokens digitales** que representan productos o materias primas
- **Transferir tokens** entre participantes de la cadena
- **Rastrear el historial completo** de cada producto
- **Gestionar aprobaciones** de usuarios (solo administradores)

---

## Requisitos Previos

### Hardware y Software

1. **Navegador Compatible**
   - Google Chrome (recomendado)
   - Firefox
   - Brave
   - Edge (basado en Chromium)

2. **MetaMask**
   - Extensión de navegador instalada
   - Versión recomendada: 11.0 o superior
   - [Descargar MetaMask](https://metamask.io/download/)

3. **Conexión a Internet**
   - Estable para interactuar con la blockchain

### Conocimientos Básicos

- Uso básico de billeteras de criptomonedas (MetaMask)
- Concepto de transacciones en blockchain
- Manejo de claves privadas y seguridad

---

## Configuración Inicial

### Paso 0: Arrancar la Aplicación (Desarrolladores/Testing)

> ⚠️ **Esta sección es para desarrolladores o usuarios en ambiente de pruebas local**

#### 0.1 Iniciar la Blockchain Local (Anvil)

1. Abre una terminal
2. Navega a la carpeta del proyecto de contratos inteligentes:
   ```bash
   cd /ruta/a/tu/proyecto/sc
   ```
3. Inicia Anvil (blockchain local):
   ```bash
   anvil
   ```
4. **Mantén esta terminal abierta**. Verás algo como:
   ```
   Available Accounts
   ==================
   (0) 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000.000000000000000000 ETH)
   (1) 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (10000.000000000000000000 ETH)
   (2) 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC (10000.000000000000000000 ETH)
   ...

   Private Keys
   ==================
   (0) 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   (1) 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
   (2) 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
   ...
   ```

5. **Guarda estas claves privadas** (las necesitarás para MetaMask)

#### 0.2 Desplegar el Contrato (Primera vez o después de cambios)

1. Abre una **nueva terminal** (mantén Anvil corriendo)
2. Navega a la carpeta de contratos:
   ```bash
   cd /ruta/a/tu/proyecto/sc
   ```
3. Despliega el contrato:
   ```bash
   forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast
   ```
4. **Guarda la dirección del contrato** que aparece en el output:
   ```
   Contract Address: 0x5FbDB2315678afecb367f032d93F642f64180aa3
   ```
   
   > 📝 **Nota**: Esta dirección debe coincidir con la configurada en `web/src/contracts/config.ts`. Si desplegaste el contrato por primera vez o cambió la dirección, actualiza el archivo de configuración:
   ```typescript
   // web/src/contracts/config.ts
   export const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Tu dirección
   ```

#### 0.3 Iniciar el Frontend (Aplicación Web)

1. Abre una **nueva terminal** (tercera terminal)
2. Navega a la carpeta del frontend:
   ```bash
   cd /ruta/a/tu/proyecto/web
   ```
3. Instala las dependencias (solo la primera vez):
   ```bash
   npm install
   ```
4. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```
5. Verás un mensaje como:
   ```
   ▲ Next.js 15.x.x
   - Local:        http://localhost:3000
   - Ready in X.Xs
   ```
6. Abre tu navegador en `http://localhost:3000`

#### 0.4 Verificar que Todo Funciona

Deberías tener **3 terminales abiertas**:
- ✅ Terminal 1: Anvil corriendo (blockchain)
- ✅ Terminal 2: Listo después del deploy (contrato desplegado)
- ✅ Terminal 3: Next.js corriendo (aplicación web)

---

### Paso 1: Configurar MetaMask

#### 1.1 Instalar MetaMask

1. Visita [metamask.io](https://metamask.io)
2. Haz clic en "Download"
3. Selecciona tu navegador
4. Sigue las instrucciones de instalación
5. Crea una nueva billetera o importa una existente
6. **IMPORTANTE**: Guarda tu frase de recuperación en un lugar seguro

#### 1.2 Conectar a la Red Local (Desarrollo)

Si estás usando la aplicación en un entorno de desarrollo local:

1. Abre MetaMask
2. Haz clic en el selector de red (parte superior)
3. Selecciona "Agregar red" → "Agregar red manualmente"
4. Completa los datos:
   - **Nombre de la red**: Anvil Local
   - **Nueva URL de RPC**: `http://localhost:8545`
   - **ID de cadena**: `31337`
   - **Símbolo de moneda**: ETH
   - **URL del explorador de bloques**: (dejar vacío)
5. Haz clic en "Guardar"

#### 1.3 Importar Cuenta de Desarrollo (Solo para testing)

Para propósitos de prueba con Anvil, puedes importar cuentas con fondos:

**Opción A: Importar por Clave Privada**

1. En MetaMask, haz clic en el icono de cuenta (arriba a la derecha)
2. Selecciona **"Importar cuenta"**
3. Asegúrate de que esté seleccionado **"Clave privada"**
4. Pega una de las claves privadas que Anvil mostró al iniciar:
   ```
   Cuenta Admin (0): 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   Cuenta Producer (1): 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
   Cuenta Factory (2): 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
   Cuenta Retailer (3): 0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6
   Cuenta Consumer (4): 0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a
   ```
5. Haz clic en **"Importar"**
6. La cuenta aparecerá con 10,000 ETH (de prueba)
7. **Opcional**: Renombra la cuenta (clic en ⋮ → Detalles de la cuenta → editar nombre)
   - Ejemplo: "Anvil - Admin", "Anvil - Producer", etc.

**Opción B: Usar las Cuentas Predeterminadas de Anvil**

Anvil genera las mismas cuentas cada vez que se inicia. Aquí están las más útiles:

| Rol Sugerido | Dirección | Clave Privada |
|--------------|-----------|---------------|
| **Admin** | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` |
| **Producer** | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` |
| **Factory** | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a` |
| **Retailer** | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` | `0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6` |
| **Consumer** | `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65` | `0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a` |

**Importar múltiples cuentas:**
1. Repite el proceso de "Importar cuenta" para cada clave privada
2. Puedes cambiar entre cuentas haciendo clic en el icono de cuenta
3. Cada cuenta tendrá 10,000 ETH de prueba

> ⚠️ **ADVERTENCIA CRÍTICA**: 
> - Estas claves son PÚBLICAS y conocidas por todos
> - NUNCA las uses en redes principales (Ethereum Mainnet, Polygon, etc.)
> - Son SOLO para desarrollo y testing local
> - Cualquiera puede acceder a fondos reales enviados a estas direcciones

### Paso 2: Acceder a la Aplicación

1. Abre tu navegador
2. Navega a la URL de la aplicación:
   - Desarrollo local: `http://localhost:3000`
   - Producción: URL proporcionada por tu organización
3. Verás la página de inicio de Supply Chain Tracker

### Paso 3: Conectar tu Billetera

1. En la página principal, haz clic en **"Conectar Billetera"**
2. MetaMask se abrirá automáticamente
3. Selecciona la cuenta que deseas conectar
4. Haz clic en **"Siguiente"** y luego en **"Conectar"**
5. Tu dirección de billetera aparecerá en la esquina superior derecha

---

## Conceptos Básicos

### Roles en el Sistema

La aplicación maneja cuatro roles principales:

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| **Admin** | Administrador del sistema | Aprobar/rechazar usuarios, acceso completo |
| **Producer** | Productor de materias primas | Crear materias primas, transferir tokens |
| **Factory** | Fabricante/Procesador | Crear productos derivados, transferir tokens |
| **Retailer** | Distribuidor/Minorista | Recibir productos, transferir a consumidores |
| **Consumer** | Consumidor final | Recibir productos finales |

### Estados de Usuario

- **Pending (Pendiente)**: Usuario registrado, esperando aprobación del admin
- **Approved (Aprobado)**: Usuario autorizado para operar en el sistema
- **Rejected (Rechazado)**: Usuario no autorizado por el admin
- **Canceled (Cancelado)**: Usuario canceló su propia solicitud

### Tokens

Los **tokens** representan productos físicos o materias primas:

- **ID único**: Identificador numérico del token
- **Nombre**: Descripción del producto (ej: "Algodón Orgánico")
- **Cantidad**: Cantidad disponible en unidades
- **Características**: Detalles adicionales en formato JSON
- **Token Padre**: Referencia al token del que deriva (0 si es materia prima)
- **Creador**: Dirección del usuario que lo creó
- **Fecha de Creación**: Timestamp de cuando se creó

### Transferencias

Las **transferencias** mueven tokens entre usuarios:

- **Pending (Pendiente)**: Transferencia enviada, esperando aceptación
- **Accepted (Aceptada)**: Transferencia completada exitosamente
- **Rejected (Rechazada)**: Transferencia rechazada por el receptor

---

## Flujos de Trabajo por Rol

### 🔷 Flujo del Administrador

#### Objetivo
Gestionar y aprobar usuarios del sistema

#### Proceso

1. **Acceder al Panel de Admin**
   - Navega a la sección "Admin" en el menú
   - Solo visible si eres el administrador del contrato

2. **Revisar Solicitudes Pendientes**
   - Verás una lista de usuarios con estado "Pending"
   - Revisa: dirección, rol solicitado, fecha de registro

3. **Aprobar o Rechazar Usuarios**
   - Haz clic en **"Aprobar"** para autorizar al usuario
   - Haz clic en **"Rechazar"** para denegar el acceso
   - Confirma la transacción en MetaMask
   - Espera la confirmación en blockchain

4. **Monitorear Usuarios Activos**
   - Visualiza todos los usuarios aprobados
   - Consulta el historial de cambios de estado

---

### 🌾 Flujo del Productor (Producer)

#### Objetivo
Crear materias primas y transferirlas a fabricantes

#### Proceso

1. **Registro Inicial**
   - Conecta tu billetera
   - Ve a "Perfil" → "Solicitar Rol"
   - Selecciona **"Producer"**
   - Confirma la transacción
   - Espera aprobación del admin (recibirás notificación)

2. **Crear Materia Prima**
   - Accede a "Tokens" → "Crear Token"
   - Completa el formulario:
     - **Nombre**: Ej. "Algodón Orgánico 100kg"
     - **Cantidad**: Ej. 100
     - **Características**: Ej. `{"origen": "Argentina", "certificación": "Orgánico"}`
     - **Token Padre**: Dejar en 0 (es materia prima)
   - Haz clic en **"Crear Token"**
   - Confirma en MetaMask
   - Espera confirmación

3. **Visualizar tus Tokens**
   - Ve a "Dashboard"
   - Verás todos los tokens que has creado
   - Consulta el balance disponible de cada uno

4. **Transferir a Fabricante**
   - En "Transferencias" → "Nueva Transferencia"
   - Selecciona:
     - **Token**: Tu materia prima
     - **Destinatario**: Dirección del fabricante
     - **Cantidad**: Cantidad a transferir
   - Confirma en MetaMask
   - El fabricante debe aceptar la transferencia

5. **Rastrear Transferencias**
   - En "Transferencias" verás:
     - Transferencias pendientes
     - Transferencias aceptadas
     - Transferencias rechazadas
   - Filtra por estado para mejor control

---

### 🏭 Flujo del Fabricante (Factory)

#### Objetivo
Recibir materias primas, crear productos derivados y distribuirlos

#### Proceso

1. **Registro Inicial**
   - Conecta tu billetera
   - Ve a "Perfil" → "Solicitar Rol"
   - Selecciona **"Factory"**
   - Confirma y espera aprobación

2. **Recibir Materias Primas**
   - Ve a "Transferencias"
   - Verás transferencias pendientes donde eres el destinatario
   - Revisa los detalles:
     - Remitente
     - Token (materia prima)
     - Cantidad
   - Haz clic en **"Aceptar"** o **"Rechazar"**
   - Confirma en MetaMask

3. **Verificar Balance Recibido**
   - Ve a "Dashboard"
   - Verifica que el balance se haya actualizado
   - Ahora tienes materias primas disponibles

4. **Crear Producto Derivado**
   - Ve a "Tokens" → "Crear Token"
   - Completa:
     - **Nombre**: Ej. "Camiseta de Algodón Talla M"
     - **Cantidad**: Ej. 50
     - **Características**: Ej. `{"color": "blanco", "talla": "M", "material": "100% algodón"}`
     - **Token Padre**: ID del token de algodón que recibiste
   - Confirma en MetaMask
   - El producto queda registrado en blockchain

5. **Transferir a Distribuidor**
   - En "Transferencias" → "Nueva Transferencia"
   - Selecciona el producto terminado
   - Ingresa dirección del retailer
   - Especifica cantidad
   - Confirma

---

### 🏪 Flujo del Distribuidor (Retailer)

#### Objetivo
Recibir productos de fabricantes y distribuir a consumidores

#### Proceso

1. **Registro Inicial**
   - Conecta billetera
   - Solicita rol **"Retailer"**
   - Espera aprobación

2. **Recibir Productos de Fabricantes**
   - Ve a "Transferencias"
   - Revisa transferencias pendientes
   - Verifica detalles del producto:
     - Nombre
     - Cantidad
     - Características
     - Fabricante origen
   - Acepta o rechaza según criterios de calidad

3. **Gestionar Inventario**
   - Dashboard muestra todos tus productos
   - Visualiza balance de cada token
   - Consulta historial de recepción

4. **Transferir a Consumidores**
   - Nueva transferencia
   - Selecciona producto
   - Ingresa dirección del consumidor
   - Especifica cantidad (unidades vendidas)
   - Confirma transacción

5. **Rastrear Trazabilidad**
   - Consulta el historial completo de un token
   - Verifica el recorrido: Productor → Fabricante → Tú → Consumidor
   - Accede a características en cada etapa

---

### 🛒 Flujo del Consumidor (Consumer)

#### Objetivo
Recibir productos finales y verificar autenticidad

#### Proceso

1. **Registro Inicial**
   - Conecta billetera
   - Solicita rol **"Consumer"**
   - Espera aprobación (generalmente rápida)

2. **Recibir Producto**
   - Ve a "Transferencias"
   - Aparecerá transferencia del retailer
   - Revisa detalles del producto
   - Haz clic en **"Aceptar"**
   - Confirma en MetaMask

3. **Verificar Autenticidad**
   - Ve a "Mis Tokens"
   - Selecciona el producto recibido
   - Consulta:
     - **Token Padre**: Materia prima original
     - **Creador**: Fabricante
     - **Características**: Detalles del producto
     - **Historial**: Todos los pasos en la cadena

4. **Rastrear Origen Completo**
   - Haz clic en el ID del token padre
   - Navegas hacia atrás en la cadena
   - Puedes ver:
     - Productor original de materia prima
     - Fabricante que procesó
     - Distribuidor que vendió
   - Todo verificable en blockchain

---

## Guía Paso a Paso

### 📋 Escenario Completo: De la Materia Prima al Consumidor

#### Participantes
- **Admin**: 0xf39F... (ya configurado en el contrato)
- **Producer**: Juan (productor de algodón)
- **Factory**: María (fabricante de textiles)
- **Retailer**: Pedro (tienda de ropa)
- **Consumer**: Ana (cliente final)

---

### PASO 1: Admin Configura el Sistema

1. Admin conecta su billetera (la que desplegó el contrato)
2. Va a sección "Admin"
3. Sistema lo reconoce automáticamente como admin
4. Espera solicitudes de usuarios

---

### PASO 2: Juan (Producer) se Registra

1. Juan abre la aplicación
2. Conecta su billetera MetaMask
3. Va a "Perfil"
4. Hace clic en **"Solicitar Rol de Usuario"**
5. Formulario:
   - **Rol**: Selecciona "Producer"
6. Clic en **"Solicitar Rol"**
7. MetaMask se abre → Confirma transacción (gas fee ~0.001 ETH)
8. Mensaje: "Solicitud enviada. Espera aprobación del admin"

---

### PASO 3: Admin Aprueba a Juan

1. Admin actualiza página en sección "Admin"
2. Ve nueva solicitud de Juan:
   - Dirección: 0x70997...
   - Rol: Producer
   - Estado: Pending
3. Revisa que la dirección sea correcta
4. Clic en botón **"Aprobar"** junto a Juan
5. MetaMask → Confirma transacción
6. Estado de Juan cambia a **"Approved"** ✅

---

### PASO 4: María, Pedro y Ana se Registran

**María (Factory):**
- Conecta billetera
- Solicita rol "Factory"
- Admin la aprueba

**Pedro (Retailer):**
- Conecta billetera
- Solicita rol "Retailer"
- Admin lo aprueba

**Ana (Consumer):**
- Conecta billetera
- Solicita rol "Consumer"
- Admin la aprueba

---

### PASO 5: Juan Crea Materia Prima (Algodón)

1. Juan va a sección **"Tokens"**
2. Clic en **"Crear Nuevo Token"**
3. Formulario:
   - **Nombre del Token**: "Algodón Orgánico Premium"
   - **Cantidad Total**: 1000
   - **Características**: `{"origen": "Mendoza, Argentina", "certificación": "Orgánico USDA", "cosecha": "2025"}`
   - **ID Token Padre**: 0 (es materia prima original)
4. Clic en **"Crear Token"**
5. MetaMask → Confirma
6. Mensaje: "Token creado exitosamente con ID: 1"
7. En Dashboard, Juan ve:
   - Token #1: Algodón Orgánico Premium
   - Balance: 1000 unidades

---

### PASO 6: Juan Transfiere Algodón a María

1. Juan copia la dirección de billetera de María (María se la envió)
2. Va a **"Transferencias"** → **"Nueva Transferencia"**
3. Formulario:
   - **Token**: Selecciona "Algodón Orgánico Premium (#1)"
   - **Destinatario**: Pega dirección de María (0x3C44...)
   - **Cantidad**: 500
4. Clic en **"Enviar Transferencia"**
5. MetaMask → Confirma
6. Mensaje: "Transferencia #1 enviada. Esperando aceptación."
7. Estado: Pending

---

### PASO 7: María Acepta la Transferencia

1. María abre la aplicación
2. Va a **"Transferencias"**
3. Ve notificación de transferencia pendiente:
   - De: 0x70997... (Juan)
   - Token: Algodón Orgánico Premium (#1)
   - Cantidad: 500
   - Estado: Pending
4. Clic en **"Ver Detalles"**
5. Revisa características del algodón
6. Clic en **"Aceptar Transferencia"**
7. MetaMask → Confirma
8. Mensaje: "Transferencia aceptada ✅"
9. Dashboard actualiza:
   - Token #1: Balance 500 unidades

---

### PASO 8: María Crea Producto (Camisetas)

1. María va a **"Tokens"** → **"Crear Nuevo Token"**
2. Formulario:
   - **Nombre**: "Camiseta Premium Algodón Orgánico"
   - **Cantidad**: 200
   - **Características**: `{"material": "100% algodón orgánico", "tallas": ["S", "M", "L"], "colores": ["blanco", "negro"], "proceso": "Teñido natural"}`
   - **ID Token Padre**: 1 (el algodón de Juan)
3. Clic en **"Crear Token"**
4. MetaMask → Confirma
5. Token #2 creado
6. Dashboard muestra:
   - Token #1 (Algodón): 500 unidades
   - Token #2 (Camisetas): 200 unidades

---

### PASO 9: María Transfiere Camisetas a Pedro

1. María va a **"Transferencias"** → **"Nueva"**
2. Formulario:
   - **Token**: Camiseta Premium (#2)
   - **Destinatario**: Dirección de Pedro
   - **Cantidad**: 100
3. Confirma transacción
4. Transferencia #2 enviada (Pending)

---

### PASO 10: Pedro Acepta y Transfiere a Ana

1. Pedro ve transferencia pendiente
2. Acepta las 100 camisetas
3. Balance actualiza: Token #2 = 100 unidades
4. Pedro crea nueva transferencia:
   - Token: Camiseta Premium (#2)
   - Destinatario: Dirección de Ana
   - Cantidad: 1
5. Confirma → Transferencia #3 (Pending)

---

### PASO 11: Ana Recibe y Verifica Producto

1. Ana ve transferencia pendiente de Pedro
2. Clic en **"Ver Detalles"**
3. Información completa:
   ```
   Token #2: Camiseta Premium Algodón Orgánico
   De: Pedro (Retailer)
   Cantidad: 1
   Características: {"material": "100% algodón orgánico", ...}
   Token Padre: #1 (Algodón Orgánico Premium)
   ```
4. Clic en **"Aceptar"**
5. MetaMask → Confirma
6. Camiseta recibida ✅

---

### PASO 12: Ana Rastrea el Origen Completo

1. Ana va a **"Mis Tokens"**
2. Ve: Token #2 (balance: 1)
3. Clic en **"Ver Trazabilidad"**
4. Sistema muestra la cadena completa:

```
🌾 PRODUCTOR (Juan)
   ↓ Token #1: Algodón Orgánico Premium
   ↓ Origen: Mendoza, Argentina
   ↓ Certificación: Orgánico USDA
   
🏭 FABRICANTE (María)
   ↓ Token #2: Camiseta Premium
   ↓ Proceso: Teñido natural
   ↓ Material: 100% algodón orgánico
   
🏪 RETAILER (Pedro)
   ↓ Distribuidor autorizado
   
🛒 CONSUMIDOR (Ana)
   ✅ Producto final verificado
```

5. Ana puede verificar en blockchain cada paso
6. Cada transacción tiene hash único y es inmutable

---

## Preguntas Frecuentes

### General

**P: ¿Necesito criptomonedas para usar la aplicación?**  
R: Sí, necesitas ETH para pagar las tarifas de gas de cada transacción en la blockchain. En desarrollo local, se usan ETH de prueba sin valor real.

**P: ¿Cuánto cuesta cada operación?**  
R: Las tarifas varían según la red:
- Red local (Anvil): ~0.001 ETH (prueba)
- Ethereum Mainnet: Variable según congestión
- Layer 2 (Polygon, Arbitrum): Centavos de dólar

**P: ¿Puedo cambiar mi rol después de registrarme?**  
R: No directamente. Deberías contactar al admin para que rechace tu solicitud actual y luego solicitar un nuevo rol.

**P: ¿Qué pasa si rechazo una transferencia?**  
R: Los tokens permanecen con el remitente y la transferencia queda marcada como "Rejected". El remitente puede intentar enviarla a otra dirección.

### Seguridad

**P: ¿Es segura la aplicación?**  
R: Sí, toda la lógica está en un smart contract auditable. Sin embargo:
- Nunca compartas tu clave privada
- Verifica siempre las direcciones antes de transferir
- Revisa las transacciones en MetaMask antes de confirmar

**P: ¿Puedo recuperar tokens enviados por error?**  
R: No, las transacciones en blockchain son inmutables. Si el destinatario no acepta, los tokens NO se transfieren. Si acepta, no hay forma de revertirlo.

**P: ¿Qué hago si pierdo acceso a mi billetera?**  
R: Si tienes tu frase de recuperación de 12/24 palabras, puedes restaurar tu billetera. Sin ella, el acceso se pierde permanentemente.

### Técnicas

**P: ¿Por qué mi transacción está pendiente mucho tiempo?**  
R: Posibles causas:
- Gas fee muy bajo (aumenta el gas en MetaMask)
- Red congestionada (espera o aumenta prioridad)
- Error en el contrato (verifica en el explorador de bloques)

**P: ¿Puedo usar la aplicación en móvil?**  
R: Sí, si usas MetaMask Mobile o un navegador con billetera integrada (Trust Browser, Coinbase Wallet).

**P: ¿Dónde puedo ver el historial completo de transacciones?**  
R: En la sección "Transferencias" o usando un explorador de bloques (Etherscan) con la dirección del contrato.

### Operaciones

**P: ¿Puedo transferir solo parte de mis tokens?**  
R: Sí, especificas la cantidad exacta en el campo "Cantidad" al crear la transferencia.

**P: ¿Cuántos tokens puedo crear?**  
R: No hay límite técnico, pero cada creación requiere gas. Planifica bien tus tokens.

**P: ¿Qué formato usar en "Características"?**  
R: Usa JSON válido. Ejemplo:
```json
{
  "peso": "10kg",
  "color": "rojo",
  "certificaciones": ["ISO 9001", "Orgánico"]
}
```

**P: ¿Puedo eliminar un token creado?**  
R: No, los tokens en blockchain son permanentes. Puedes transferir todo el balance a una dirección de "quemado" (burn address).

---

## Solución de Problemas

### Problema: "No se puede conectar a la aplicación"

**Para ambiente de desarrollo local:**

1. **Verifica que Anvil esté corriendo:**
   ```bash
   # En una terminal, ejecuta:
   ps aux | grep anvil
   ```
   Si no ves el proceso, inicia Anvil:
   ```bash
   cd sc
   anvil
   ```

2. **Verifica que el frontend esté corriendo:**
   ```bash
   # En otra terminal:
   cd web
   npm run dev
   ```

3. **Verifica las URLs:**
   - Blockchain (Anvil): `http://localhost:8545`
   - Frontend: `http://localhost:3000`

4. **Reinicia todo si es necesario:**
   ```bash
   # Terminal 1 - Detén Anvil (Ctrl+C) y reinicia:
   cd sc
   anvil
   
   # Terminal 2 - Redespliega el contrato:
   cd sc
   forge script script/Deploy.s.sol \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --broadcast
   
   # Terminal 3 - Reinicia el frontend:
   cd web
   npm run dev
   ```

---

### Problema: "No se puede conectar a MetaMask"

**Soluciones:**
1. Verifica que MetaMask esté instalado y desbloqueado
2. Actualiza MetaMask a la última versión
3. Borra la caché del navegador
4. Intenta con otro navegador
5. Verifica que estés en la red correcta

---

### Problema: "Contract not deployed" o "Invalid contract address"

**Causas:**
- El contrato no se ha desplegado en la blockchain local
- Anvil se reinició y perdió el estado
- La dirección del contrato en el código no coincide

**Soluciones:**

1. **Verifica que Anvil esté corriendo:**
   ```bash
   lsof -i :8545
   ```

2. **Despliega el contrato:**
   ```bash
   cd sc
   forge script script/Deploy.s.sol \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --broadcast
   ```

3. **Verifica la dirección desplegada:**
   Busca en el output del deploy la línea:
   ```
   Contract Address: 0x5FbDB2315678afecb367f032d93F642f64180aa3
   ```

4. **Actualiza la configuración del frontend (si es necesaria):**
   ```bash
   cd web
   # Edita src/contracts/config.ts
   # Asegúrate de que CONTRACT_ADDRESS coincida con la dirección desplegada
   ```

5. **Reinicia el frontend:**
   ```bash
   cd web
   # Detén el servidor (Ctrl+C)
   npm run dev
   ```

6. **Si Anvil se reinició:**
   - Cada vez que reinicias Anvil, pierdes todos los contratos desplegados
   - Debes redesplegar el contrato con el comando del paso 2
   - La dirección suele ser la misma si usas el mismo deployer
   - Todas las cuentas vuelven a tener 10,000 ETH

---

### Problema: "Transacción fallida"

**Diagnóstico:**
1. Abre MetaMask → Actividad
2. Busca la transacción fallida
3. Clic en "Ver en explorador"
4. Lee el mensaje de error

**Causas comunes:**
- **Insufficient funds**: No tienes suficiente ETH para gas
  - Verifica tu balance en MetaMask
  - Si es necesario, transfiere ETH desde otra cuenta (ver comandos en Anexo)
- **User rejected**: Cancelaste en MetaMask (intenta de nuevo)
- **Execution reverted**: El contrato rechazó la operación
  - Verifica que estés aprobado como usuario
  - Confirma que tengas balance suficiente del token
  - Asegúrate de usar el rol correcto

---

### Problema: "Insufficient funds" o "No tengo ETH para gas"

**Causa:**
La cuenta no tiene suficiente ETH para pagar las tarifas de transacción (gas fees).

**Soluciones:**

1. **Verificar balance actual:**
   ```bash
   # Reemplaza con tu dirección
   cast balance TU_DIRECCION --rpc-url http://localhost:8545 --ether
   ```

2. **Transferir ETH desde la cuenta Admin:**
   ```bash
   # Transferir 100 ETH desde Admin a tu cuenta
   cast send TU_DIRECCION \
     --value 100ether \
     --rpc-url http://localhost:8545 \
     --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   ```

3. **Añadir fondos a cuentas específicas:**
   ```bash
   # Producer (0x70997970C51812dc3A010C7d01b50e0d17dc79C8)
   cast send 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 --value 100ether \
     --rpc-url http://localhost:8545 \
     --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   
   # Factory (0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC)
   cast send 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC --value 100ether \
     --rpc-url http://localhost:8545 \
     --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   
   # Retailer (0x90F79bf6EB2c4f870365E785982E1f101E93b906)
   cast send 0x90F79bf6EB2c4f870365E785982E1f101E93b906 --value 100ether \
     --rpc-url http://localhost:8545 \
     --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   
   # Consumer (0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65)
   cast send 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65 --value 100ether \
     --rpc-url http://localhost:8545 \
     --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   ```

4. **Nota importante:**
   - En Anvil, cada reinicio resetea todos los balances a 10,000 ETH
   - Si reinicias Anvil, todas las cuentas vuelven a tener fondos automáticamente
   - Solo necesitas transferir fondos si usaste una cuenta nueva que no es de Anvil

---

### Problema: "No aparezco como aprobado"

**Soluciones:**
1. Actualiza la página (F5)
2. Verifica en "Perfil" tu estado actual
3. Contacta al admin para confirmar aprobación
4. Si ya fuiste aprobado, desconecta y reconecta MetaMask
5. Limpia caché del navegador

---

### Problema: "No veo mis tokens"

**Soluciones:**
1. Actualiza la página
2. Ve a "Dashboard" y espera a que cargue
3. Verifica que estás en la cuenta correcta de MetaMask
4. Confirma en el explorador de bloques que las transacciones se confirmaron
5. Si el problema persiste, verifica los logs de consola (F12)

---

### Problema: "La transferencia no aparece como pendiente para el destinatario"

**Verificaciones:**
1. Confirma que la transferencia se envió (revisa en "Mis Transferencias")
2. Verifica la dirección del destinatario (debe ser exacta)
3. El destinatario debe actualizar su página
4. Asegúrate de que el destinatario esté aprobado en el sistema
5. Verifica en el explorador que la transacción se confirmó

---

### Problema: "Error de red o RPC"

**Soluciones:**
1. Verifica conexión a internet
2. En MetaMask, cambia de red y vuelve a la correcta
3. Si usas red local, verifica que Anvil esté corriendo:
   ```bash
   # En terminal, verifica si Anvil está activo:
   lsof -i :8545
   # Deberías ver algo como:
   # COMMAND   PID   USER   FD   TYPE DEVICE SIZE/OFF NODE NAME
   # anvil   12345   user    9u  IPv4  ...      0t0  TCP *:8545 (LISTEN)
   
   # Si no hay respuesta, inicia Anvil:
   cd sc
   anvil
   ```
4. Revisa que la URL del RPC sea correcta:
   - Local: `http://localhost:8545`
   - ID cadena: `31337`
5. Reinicia MetaMask si es necesario
6. **Si el problema persiste en desarrollo local:**
   ```bash
   # Detén Anvil (Ctrl+C en su terminal)
   # Limpia el caché:
   rm -rf sc/cache sc/out
   # Reinicia Anvil:
   anvil
   # Redespliega el contrato:
   forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast
   ```

---

### Problema: "Gas estimation failed"

**Causas y soluciones:**
1. **No estás aprobado**: Espera aprobación del admin
2. **Balance insuficiente**: Verifica que tienes los tokens que intentas transferir
3. **Rol incorrecto**: Solo ciertos roles pueden crear tokens:
   - Producer: puede crear materias primas (parent = 0)
   - Factory: puede crear productos derivados (parent > 0)
4. **Destinatario inválido**: Asegúrate de que sea una dirección válida
5. **Cantidad mayor al balance**: Verifica tu balance disponible

---

### Problema: "MetaMask muestra gas fee muy alto"

**Soluciones:**
1. En red local (Anvil), el gas es simulado, no te preocupes
2. En redes principales:
   - Espera a que la red esté menos congestionada (horarios nocturnos suelen ser mejores)
   - Usa herramientas como [ETH Gas Station](https://ethgasstation.info/)
   - Considera usar Layer 2 (Polygon, Arbitrum)
3. Ajusta el gas manualmente en MetaMask (Avanzado)

---

### Contacto y Soporte

Si ninguna solución funciona:

1. **Recopila información:**
   - Hash de la transacción fallida
   - Mensaje de error exacto
   - Capturas de pantalla
   - Tu dirección de billetera (0x...)
   - Navegador y versión de MetaMask

2. **Contacta al soporte:**
   - Email: support@supplychaintracker.com
   - Discord: [Enlace del servidor]
   - GitHub Issues: [Enlace al repositorio]

3. **Recursos adicionales:**
   - Documentación técnica: `/sc/README.md`
   - Mejoras de UI: `/web/UI-IMPROVEMENTS.md`
   - Explorador de bloques local: `http://localhost:8545` (si aplica)

---

## Glosario de Términos

- **Blockchain**: Tecnología de registro distribuido e inmutable
- **Smart Contract**: Programa autoejecutado en blockchain
- **Gas**: Tarifa para ejecutar operaciones en blockchain
- **Token**: Representación digital de un activo (en este caso, producto)
- **Wallet/Billetera**: Software que almacena claves criptográficas
- **MetaMask**: Billetera de criptomonedas para navegadores
- **Transaction Hash**: Identificador único de una transacción
- **Confirmación**: Validación de una transacción por la red
- **Trazabilidad**: Capacidad de rastrear el historial completo de un producto
- **DApp**: Aplicación descentralizada (Decentralized Application)

---

## Anexo: Comandos Rápidos de Referencia

### Comandos de Desarrollo Local

**Iniciar la Blockchain (Anvil):**
```bash
cd sc
anvil
```

**Desplegar/Redesplegar Contrato:**
```bash
cd sc
forge script script/Deploy.s.sol \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --broadcast
```

**Ejecutar Tests del Contrato:**
```bash
cd sc
forge test
# O con más detalle:
forge test -vvv
```

**Iniciar el Frontend:**
```bash
cd web
npm run dev
```

**Limpiar Caché (si hay problemas):**
```bash
# Limpiar caché de Foundry:
cd sc
forge clean

# Limpiar caché de Next.js:
cd web
rm -rf .next
npm run dev
```

**Ver Estado de Procesos:**
```bash
# Ver si Anvil está corriendo:
lsof -i :8545

# Ver si Next.js está corriendo:
lsof -i :3000
```

**Detener Procesos:**
```bash
# En la terminal correspondiente, presiona:
Ctrl + C

# O mata el proceso por puerto:
kill -9 $(lsof -t -i:8545)  # Detener Anvil
kill -9 $(lsof -t -i:3000)  # Detener Next.js
```

**Transferir ETH entre Cuentas (si es necesario):**
```bash
# Desde Admin a cualquier cuenta (ejemplo: Factory)
cast send 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC \
  --value 100ether \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Ver balance de una cuenta:
cast balance 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC \
  --rpc-url http://localhost:8545 \
  --ether
```

**Añadir Fondos a Todas las Cuentas del Sistema:**
```bash
# Producer (Cuenta 1 - 0x70997970C51812dc3A010C7d01b50e0d17dc79C8)
cast send 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 --value 100ether \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Factory (Cuenta 2 - 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC)
cast send 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC --value 100ether \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Retailer (Cuenta 3 - 0x90F79bf6EB2c4f870365E785982E1f101E93b906)
cast send 0x90F79bf6EB2c4f870365E785982E1f101E93b906 --value 100ether \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Consumer (Cuenta 4 - 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65)
cast send 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65 --value 100ether \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

**Verificar Balances de Todas las Cuentas:**
```bash
echo "Admin:" && cast balance 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --rpc-url http://localhost:8545 --ether && \
echo "Producer:" && cast balance 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 --rpc-url http://localhost:8545 --ether && \
echo "Factory:" && cast balance 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC --rpc-url http://localhost:8545 --ether && \
echo "Retailer:" && cast balance 0x90F79bf6EB2c4f870365E785982E1f101E93b906 --rpc-url http://localhost:8545 --ether && \
echo "Consumer:" && cast balance 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65 --rpc-url http://localhost:8545 --ether
```

### Cuentas de Prueba Anvil (Clave Privada)

```
Admin (0xf39Fd6...):    0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
Producer (0x70997...):  0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
Factory (0x3C44C...):   0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
Retailer (0x90F79...):  0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6
Consumer (0x15d34...):  0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a
```

### Configuración de Red en MetaMask

```
Nombre de red:     Anvil Local
URL RPC:           http://localhost:8545
ID de cadena:      31337
Símbolo:          ETH
Explorador:       (dejar vacío)
```

### URLs Importantes

- **Frontend Local**: http://localhost:3000
- **Blockchain RPC**: http://localhost:8545
- **MetaMask Download**: https://metamask.io/download/

---

## Anexo: Atajos de Teclado

- **Dashboard**: `Alt + D` o `⌥ + D` (Mac)
- **Crear Token**: `Alt + T` o `⌥ + T` (Mac)
- **Nueva Transferencia**: `Alt + N` o `⌥ + N` (Mac)
- **Actualizar página**: `F5` o `Cmd + R` (Mac)
- **Abrir consola**: `F12` o `Cmd + Opt + I` (Mac)

---

## Control de Versiones

- **Versión del Manual**: 1.1.0
- **Fecha de Creación**: 13 de Octubre de 2025
- **Última Actualización**: 13 de Octubre de 2025
- **Aplicable a**: Supply Chain Tracker v1.0

---

## 📊 Diagrama de Flujo Completo

```
┌─────────────────────────────────────────────────────────────┐
│                    CONFIGURACIÓN INICIAL                     │
│                                                              │
│  Terminal 1: anvil                                          │
│  Terminal 2: forge script script/Deploy.s.sol --broadcast   │
│  Terminal 3: npm run dev                                    │
│                                                              │
│  MetaMask: Agregar red Anvil (localhost:8545, chain 31337) │
│  MetaMask: Importar cuenta con clave privada               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      FLUJO DE USUARIOS                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
        ┌───────────────────┴───────────────────┐
        ↓                                       ↓
┌───────────────┐                      ┌────────────────┐
│  ADMIN        │                      │  USUARIOS      │
│  (Ya existe)  │                      │  (Nuevos)      │
└───────────────┘                      └────────────────┘
        │                                       │
        │                                       ↓
        │                         ┌─────────────────────────┐
        │                         │ 1. Conectar billetera   │
        │                         │ 2. Solicitar rol        │
        │                         │ 3. Estado: PENDING      │
        │                         └─────────────────────────┘
        │                                       ↓
        ↓                                       ↓
┌───────────────────────────┐                  │
│ Admin ve solicitud        │ ←────────────────┘
│ Aprobar / Rechazar        │
└───────────────────────────┘
                ↓
        ┌───────┴────────┐
        ↓                ↓
   APROBADO         RECHAZADO
        │                │
        ↓                └──→ Fin
┌─────────────────────────────────────────────────────────────┐
│                   FLUJO DE PRODUCCIÓN                        │
└─────────────────────────────────────────────────────────────┘
        ↓
┌───────────────────┐
│   PRODUCER        │
│ Crea materia prima│ Token #1 (parentId: 0)
└───────────────────┘
        ↓
┌───────────────────┐
│ Transfiere a      │ Estado: PENDING
│ Factory           │
└───────────────────┘
        ↓
┌───────────────────┐
│   FACTORY         │
│ Acepta materia    │ Estado: ACCEPTED
│ prima             │
└───────────────────┘
        ↓
┌───────────────────┐
│   FACTORY         │
│ Crea producto     │ Token #2 (parentId: 1)
└───────────────────┘
        ↓
┌───────────────────┐
│ Transfiere a      │ Estado: PENDING
│ Retailer          │
└───────────────────┘
        ↓
┌───────────────────┐
│   RETAILER        │
│ Acepta producto   │ Estado: ACCEPTED
└───────────────────┘
        ↓
┌───────────────────┐
│ Transfiere a      │ Estado: PENDING
│ Consumer          │
└───────────────────┘
        ↓
┌───────────────────┐
│   CONSUMER        │
│ Acepta producto   │ Estado: ACCEPTED
│ Verifica origen   │ Trazabilidad completa ✅
└───────────────────┘
```

---

## 🎯 Checklist de Verificación

### Para Desarrolladores (Primera vez)

- [ ] Foundry instalado (`forge --version`)
- [ ] Node.js instalado (`node --version`)
- [ ] MetaMask instalado en navegador
- [ ] Anvil iniciado en Terminal 1
- [ ] Contrato desplegado en Terminal 2
- [ ] Frontend corriendo en Terminal 3 (`http://localhost:3000`)
- [ ] Red Anvil agregada en MetaMask (Chain ID: 31337)
- [ ] Al menos 1 cuenta importada con fondos
- [ ] Billetera conectada en la aplicación

### Para Usuarios (Cada sesión)

- [ ] Anvil corriendo (`lsof -i :8545`)
- [ ] Frontend corriendo (`lsof -i :3000`)
- [ ] MetaMask desbloqueado
- [ ] Red correcta seleccionada (Anvil Local)
- [ ] Cuenta con fondos seleccionada
- [ ] Estado de usuario: Approved

### Troubleshooting (Si algo falla)

- [ ] Verificar logs de Anvil (Terminal 1)
- [ ] Verificar consola del navegador (F12)
- [ ] Verificar transacciones en MetaMask
- [ ] Redesplegar contrato si Anvil se reinició
- [ ] Limpiar caché del navegador
- [ ] Reiniciar MetaMask

---

**🎉 ¡Felicidades! Ya estás listo para usar Supply Chain Tracker.**

Si tienes dudas adicionales, consulta la sección de Preguntas Frecuentes o contacta al soporte técnico.

---

*Este manual es un documento vivo y se actualizará con nuevas funcionalidades y mejoras.*
