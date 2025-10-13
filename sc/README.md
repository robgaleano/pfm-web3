# 📦 SupplyChain Smart Contracts (`sc/`)

Este directorio contiene toda la lógica blockchain del sistema de trazabilidad de cadena de suministro. Aquí encontrarás los contratos inteligentes, scripts de despliegue, tests, configuración y utilidades necesarias para operar y auditar el sistema.

---

## 📁 Estructura de la Carpeta

```
sc/
├── .gitignore                # Ignora archivos temporales y de compilación
├── foundry.toml              # Configuración de Foundry y compilador
├── README.md                 # Esta documentación detallada
├── broadcast/                # Logs de despliegue (auto-generados)
├── cache/                    # Cache de compilación (auto-generado)
├── lib/                      # Librerías externas (forge-std)
├── script/                   # Scripts de despliegue
├── src/                      # Código fuente de contratos
└── test/                     # Tests unitarios
```

---

## ⚙️ Configuración y Utilidades

### `.gitignore`
**Propósito**: Indica a Git qué archivos NO debe versionar.

**Archivos ignorados:**
- `cache/`: Cache de compilación (se regenera automáticamente)
- `out/`: Archivos compilados (se regeneran)
- `broadcast/`: Logs de despliegue (solo para desarrollo local)
- `.env`: Variables de entorno con claves privadas
- `foundry.lock`: Lock file de dependencias

**¿Por qué?** Evita subir archivos sensibles, pesados o regenerables al repositorio.

### `foundry.toml`
**Propósito**: Configura el framework Foundry para compilación, testing y despliegue.

**Configuraciones principales:**
```toml
[profile.default]
src = "src"                    # Carpeta con contratos fuente
out = "out"                    # Carpeta para archivos compilados
libs = ["lib"]                 # Librerías externas
test = "test"                  # Carpeta de tests
cache_path = "cache"           # Cache de compilación

# Compilador Solidity
solc = "0.8.20"               # Versión de Solidity
evm_version = "paris"          # Versión de Ethereum Virtual Machine

# Optimizaciones
optimizer = true              # Activar optimizador
optimizer_runs = 200          # Nivel de optimización (balance costo/tamaño)

# Testing
verbosity = 2                 # Nivel de detalle en logs de tests

# Gas
gas_limit = 9223372036854775807  # Límite de gas para tests
gas_price = 20000000000       # Precio del gas (20 gwei)

# RPC endpoints
[rpc_endpoints]
local = "http://localhost:8545"  # Anvil local
```

**Utilidad**: Define cómo compilar, optimizar y testear los contratos.

---

## 🔥 Contrato Principal: `src/SupplyChain.sol`

### Propósito General
Gestiona la trazabilidad completa de productos en cadenas de suministro, desde la materia prima hasta el consumidor final. Implementa un sistema de roles controlados, transferencias seguras de 2 pasos, y trazabilidad inmutable en blockchain.

### Arquitectura Técnica

#### Enums (Estados)
```solidity
enum UserStatus {
    Pending,    // 0: Usuario registrado, esperando aprobación
    Approved,   // 1: Usuario aprobado por admin
    Rejected,   // 2: Usuario rechazado por admin
    Canceled    // 3: Usuario canceló su solicitud
}

enum TransferStatus {
    Pending,    // 0: Transferencia solicitada, esperando respuesta
    Accepted,   // 1: Transferencia aceptada y ejecutada
    Rejected    // 2: Transferencia rechazada
}
```

#### Structs (Estructuras de Datos)

**1. User**
```solidity
struct User {
    uint256 id;              // ID único autoincremental
    address userAddress;     // Dirección Ethereum del usuario
    string role;            // Rol: "producer", "factory", "retailer", "consumer"
    UserStatus status;      // Estado de aprobación
}
```
**Utilidad**: Almacena información de cada participante en la cadena de suministro.

**2. Token**
```solidity
struct Token {
    uint256 id;              // ID único del token/producto
    address creator;         // Quién creó este token
    string name;            // Nombre del producto/materia prima
    uint256 totalSupply;    // Cantidad total creada
    string features;        // Características en formato JSON
    uint256 parentId;       // ID del token padre (0 = materia prima)
    uint256 dateCreated;    // Timestamp de creación
}
```
**Utilidad**: Representa productos o materias primas con trazabilidad completa.

**3. Transfer**
```solidity
struct Transfer {
    uint256 id;              // ID único de la transferencia
    address from;            // Remitente
    address to;              // Destinatario
    uint256 tokenId;        // ID del token a transferir
    uint256 dateCreated;    // Timestamp de solicitud
    uint256 amount;         // Cantidad a transferir
    TransferStatus status;  // Estado actual
}
```
**Utilidad**: Registra solicitudes de transferencia entre usuarios.

#### Variables de Estado
```solidity
address public admin;                    // Administrador del contrato
uint256 public nextUserId = 1;          // Contador para IDs de usuarios
uint256 public nextTokenId = 1;         // Contador para IDs de tokens
uint256 public nextTransferId = 1;      // Contador para IDs de transferencias

// Mappings principales (bases de datos on-chain)
mapping(uint256 => User) public users;
mapping(uint256 => Token) public tokens;
mapping(uint256 => Transfer) public transfers;
mapping(address => uint256) public addressToUserId;

// Balances de tokens: tokenId => address => balance
mapping(uint256 => mapping(address => uint256)) public tokenBalances;

// Índices para búsquedas eficientes
mapping(address => uint256[]) public userTokens;
mapping(address => uint256[]) public userTransfers;
```

#### Modificadores (Modifiers)
```solidity
modifier onlyAdmin() {
    require(msg.sender == admin, "Only admin can perform this action");
    _;
}

modifier onlyApprovedUser() {
    require(addressToUserId[msg.sender] != 0, "User not registered");
    require(users[addressToUserId[msg.sender]].status == UserStatus.Approved, "User not approved");
    _;
}

modifier validRole(string memory role) {
    require(
        keccak256(bytes(role)) == keccak256(bytes("producer")) ||
        keccak256(bytes(role)) == keccak256(bytes("factory")) ||
        keccak256(bytes(role)) == keccak256(bytes("retailer")) ||
        keccak256(bytes(role)) == keccak256(bytes("consumer")),
        "Invalid role"
    );
    _;
}
```

#### Eventos (Events)
```solidity
event TokenCreated(uint256 indexed tokenId, address indexed creator, string name, uint256 totalSupply);
event TransferRequested(uint256 indexed transferId, address indexed from, address indexed to, uint256 tokenId, uint256 amount);
event TransferAccepted(uint256 indexed transferId);
event TransferRejected(uint256 indexed transferId);
event UserRoleRequested(address indexed user, string role);
event UserStatusChanged(address indexed user, UserStatus status);
```

### Funciones Detalladas

#### 1. Constructor
```solidity
constructor() {
    admin = msg.sender;
}
```
**¿Qué hace?** Establece al deployer como administrador del contrato.

#### 2. Gestión de Usuarios

**`requestUserRole(string memory role) public validRole(role)`**
- **Propósito**: Permite a cualquier dirección solicitar registro con un rol específico
- **Parámetros**: `role` - Uno de: "producer", "factory", "retailer", "consumer"
- **Validaciones**:
  - Usuario no registrado previamente
  - Rol válido (modifier `validRole`)
- **Efectos**:
  - Crea nuevo `User` con estado `Pending`
  - Asigna ID único
  - Mapea dirección → userId
- **Eventos**: `UserRoleRequested`
- **Caso de uso**: Primer paso para unirse al sistema

**`changeStatusUser(address userAddress, UserStatus newStatus) public onlyAdmin`**
- **Propósito**: Admin aprueba o rechaza solicitudes de usuarios
- **Parámetros**:
  - `userAddress`: Dirección del usuario
  - `newStatus`: Nuevo estado (Approved/Rejected)
- **Validaciones**:
  - Solo admin puede ejecutar
  - Usuario debe existir
- **Efectos**: Cambia estado del usuario
- **Eventos**: `UserStatusChanged`
- **Caso de uso**: Gestión de membresía del sistema

**`getUserInfo(address userAddress) public view returns (User memory)`**
- **Propósito**: Consulta información completa de un usuario
- **Parámetros**: `userAddress` - Dirección del usuario
- **Retorno**: Struct `User` completo
- **Validaciones**: Usuario debe existir
- **Caso de uso**: Frontend necesita mostrar datos del usuario

**`isAdmin(address userAddress) public view returns (bool)`**
- **Propósito**: Verifica si una dirección es el administrador
- **Parámetros**: `userAddress` - Dirección a verificar
- **Retorno**: `true` si es admin, `false` si no
- **Caso de uso**: Control de acceso en frontend

**`getAllUsers() public view onlyAdmin returns (User[] memory)`**
- **Propósito**: Lista todos los usuarios registrados (solo admin)
- **Retorno**: Array de structs `User`
- **Caso de uso**: Panel de administración

#### 3. Gestión de Tokens

**`createToken(string memory name, uint256 totalSupply, string memory features, uint256 parentId) public onlyApprovedUser`**
- **Propósito**: Crea un nuevo token/producto
- **Parámetros**:
  - `name`: Nombre del producto
  - `totalSupply`: Cantidad total a crear
  - `features`: JSON con características
  - `parentId`: ID del token padre (0 para materia prima)
- **Validaciones**:
  - Usuario aprobado
  - `totalSupply > 0`
  - `name` no vacío
  - Según rol:
    - Producer: solo `parentId = 0`
    - Factory/Retailer: debe tener balance del token padre
- **Efectos**:
  - Crea nuevo `Token`
  - Asigna `totalSupply` al creador
  - Agrega token a `userTokens`
- **Eventos**: `TokenCreated`
- **Caso de uso**: Crear materia prima o producto procesado

**`getToken(uint256 tokenId) public view returns (Token memory)`**
- **Propósito**: Consulta información completa de un token
- **Parámetros**: `tokenId` - ID del token
- **Retorno**: Struct `Token` completo
- **Validaciones**: Token debe existir
- **Caso de uso**: Mostrar detalles del producto

**`getTokenBalance(uint256 tokenId, address userAddress) public view returns (uint256)`**
- **Propósito**: Consulta balance de un token para un usuario específico
- **Parámetros**:
  - `tokenId`: ID del token
  - `userAddress`: Dirección del usuario
- **Retorno**: Cantidad de tokens que posee el usuario
- **Caso de uso**: Verificar disponibilidad antes de transferir

**`getUserTokens(address userAddress) public view returns (uint256[] memory)`**
- **Propósito**: Lista todos los IDs de tokens que posee un usuario
- **Parámetros**: `userAddress` - Dirección del usuario
- **Retorno**: Array de IDs de tokens
- **Caso de uso**: Mostrar inventario del usuario

#### 4. Sistema de Transferencias

**`transfer(address to, uint256 tokenId, uint256 amount) public onlyApprovedUser`**
- **Propósito**: Solicita transferencia de tokens a otro usuario
- **Parámetros**:
  - `to`: Dirección del destinatario
  - `tokenId`: ID del token a transferir
  - `amount`: Cantidad a transferir
- **Validaciones**:
  - Usuario aprobado
  - No transferir a sí mismo
  - Token existe
  - Balance suficiente
  - Destinatario registrado y aprobado
  - Flujo de roles válido (ver `_validateTransferRoles`)
- **Efectos**:
  - Crea nueva `Transfer` con estado `Pending`
  - Registra en `userTransfers` de ambos usuarios
- **Eventos**: `TransferRequested`
- **Caso de uso**: Iniciar proceso de transferencia

**`acceptTransfer(uint256 transferId) public`**
- **Propósito**: Aceptar y ejecutar una transferencia pendiente
- **Parámetros**: `transferId` - ID de la transferencia
- **Validaciones**:
  - Transferencia existe
  - Usuario es el destinatario
  - Transferencia está `Pending`
  - Remitente aún tiene balance suficiente
- **Efectos**:
  - Resta `amount` del remitente
  - Suma `amount` al destinatario
  - Si es primer token para destinatario, lo agrega a `userTokens`
  - Cambia estado a `Accepted`
- **Eventos**: `TransferAccepted`
- **Caso de uso**: Completar transferencia exitosa

**`rejectTransfer(uint256 transferId) public`**
- **Propósito**: Rechazar una transferencia pendiente
- **Parámetros**: `transferId` - ID de la transferencia
- **Validaciones**:
  - Transferencia existe
  - Usuario es el destinatario
  - Transferencia está `Pending`
- **Efectos**: Cambia estado a `Rejected`
- **Eventos**: `TransferRejected`
- **Caso de uso**: Cancelar transferencia

**`getTransfer(uint256 transferId) public view returns (Transfer memory)`**
- **Propósito**: Consulta información completa de una transferencia
- **Parámetros**: `transferId` - ID de la transferencia
- **Retorno**: Struct `Transfer` completo
- **Validaciones**: Transferencia debe existir
- **Caso de uso**: Mostrar detalles de una transacción

**`getUserTransfers(address userAddress) public view returns (uint256[] memory)`**
- **Propósito**: Lista todas las transferencias de un usuario
- **Parámetros**: `userAddress` - Dirección del usuario
- **Retorno**: Array de IDs de transferencias
- **Caso de uso**: Historial de transacciones

**`getPendingTransfers(address userAddress) public view returns (uint256[] memory)`**
- **Propósito**: Lista transferencias pendientes que el usuario debe responder
- **Parámetros**: `userAddress` - Dirección del usuario
- **Retorno**: Array de IDs de transferencias pendientes
- **Caso de uso**: Notificaciones de transferencias por aceptar/rechazar

#### 5. Funciones Internas y Helpers

**`_validateTransferRoles(address from, address to) internal view`**
- **Propósito**: Valida que la transferencia siga el flujo correcto de roles
- **Flujo permitido**:
  - Producer → Factory
  - Factory → Retailer
  - Retailer → Consumer
  - Consumer NO puede transferir
- **Validaciones**: Compara roles usando `keccak256` para eficiencia
- **Caso de uso**: Llamada interna desde `transfer()`

---

## 🧪 Tests: `test/SupplyChain.t.sol`

### Propósito General
Suite completa de 32 tests unitarios que valida toda la funcionalidad del contrato. Usa Foundry para testing automatizado.

### Estructura de Tests

#### Setup
```solidity
function setUp() public {
    supplyChain = new SupplyChain();
    admin = supplyChain.admin();
    // Configurar balances para cuentas de prueba
}
```

#### Tests de Setup y Configuración
- `testContractDeployment()`: Verifica despliegue correcto
- `testIsAdmin()`: Valida función de verificación de admin

#### Tests de Gestión de Usuarios
- `testUserRegistration()`: Registro exitoso
- `testUserRegistrationWithInvalidRole()`: Rechaza roles inválidos
- `testCannotRegisterTwice()`: Previene registro duplicado
- `testAdminApproveUser()`: Aprobación por admin
- `testAdminRejectUser()`: Rechazo por admin
- `testOnlyAdminCanChangeStatus()`: Control de acceso
- `testGetUserInfoForNonExistentUser()`: Manejo de errores

#### Tests de Creación de Tokens
- `testCreateTokenByProducer()`: Producer crea materia prima
- `testCreateTokenByFactory()`: Factory crea producto procesado
- `testCreateTokenByRetailer()`: Retailer crea producto final
- `testProducerCannotCreateProcessedProduct()`: Validación de roles
- `testFactoryCannotCreateWithoutParent()`: Requiere token padre
- `testCreateTokenWithInvalidSupply()`: Validación de supply
- `testCreateTokenWithEmptyName()`: Validación de nombre

#### Tests de Transferencias
- `testTransferBetweenValidRoles()`: Transferencia válida
- `testTransferToSelf()`: Previene auto-transferencia
- `testTransferNonExistentToken()`: Token debe existir
- `testTransferInsufficientBalance()`: Balance insuficiente
- `testTransferToUnregisteredUser()`: Destinatario registrado
- `testTransferToUnapprovedUser()`: Destinatario aprobado
- `testInvalidRoleTransfer()`: Flujo de roles inválido
- `testConsumerCannotTransfer()`: Consumer no puede transferir

#### Tests de Aceptación/Rechazo
- `testAcceptTransfer()`: Aceptación exitosa
- `testAcceptTransferByWrongUser()`: Solo destinatario puede aceptar
- `testAcceptAlreadyProcessedTransfer()`: No doble procesamiento
- `testAcceptTransferAfterSenderBalanceChange()`: Balance insuficiente
- `testRejectTransfer()`: Rechazo exitoso
- `testRejectTransferByWrongUser()`: Solo destinatario puede rechazar

#### Tests de Flujo Completo
- `testCompleteSupplyChainFlow()`: Flujo end-to-end Producer→Factory→Retailer→Consumer
- `testTraceabilityFlow()`: Verifica trazabilidad con parentId

#### Tests de Consultas
- `testGetToken()`: Consulta de token
- `testGetTransfer()`: Consulta de transferencia
- `testGetUserTokens()`: Lista tokens de usuario
- `testGetUserTransfers()`: Lista transferencias de usuario
- `testGetPendingTransfers()`: Lista pendientes

### Utilidades de Testing
- `vm.prank(address)`: Simula llamadas desde diferentes direcciones
- `vm.expectRevert("message")`: Espera reversiones específicas
- `assertEq()`, `assertTrue()`: Assertions de forge-std

---

## 🚀 Scripts de Despliegue: `script/Deploy.s.sol`

### Propósito
Automatiza el despliegue del contrato en diferentes redes (local, testnet, mainnet).

### Funciones Principales

**`run() public`**
- **Propósito**: Ejecuta el despliegue completo
- **Funcionalidades**:
  - Lee private key desde `.env` o usa default de Anvil
  - Inicia broadcasting de transacciones
  - Despliega `SupplyChain`
  - Muestra información post-deploy:
    - Dirección del contrato
    - Dirección del admin
    - Red utilizada
    - Instrucciones para configuración del frontend

### Uso
```bash
# Despliegue local
forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --private-key $PRIVATE_KEY --broadcast

# Despliegue en Sepolia
forge script script/Deploy.s.sol --rpc-url https://sepolia.infura.io/v3/$INFURA_KEY --private-key $PRIVATE_KEY --broadcast --verify
```

---

## 📚 Librerías: `lib/forge-std/`

### Propósito
Librería estándar de Foundry con utilidades para desarrollo, testing y scripting.

### Componentes Principales

#### Para Testing (`Test.sol`)
- `assertEq()`, `assertTrue()`, `assertFalse()`: Assertions
- `vm.prank()`, `vm.deal()`, `vm.warp()`: Cheatcodes para manipular estado
- `console.log()`: Logging en tests

#### Para Scripting (`Script.sol`)
- `vm.startBroadcast()`, `vm.stopBroadcast()`: Control de transacciones
- `vm.envUint()`, `vm.envString()`: Leer variables de entorno

#### Utilidades (`Std*.sol`)
- `StdMath`: Operaciones matemáticas seguras
- `StdJson`: Manipulación de JSON
- `StdStorage`: Manipulación de storage en tests

### Instalación
```bash
forge install foundry-rs/forge-std
```

---

## 🗄️ Archivos Generados

### `broadcast/`
**Propósito**: Logs detallados de cada despliegue.

**Estructura**:
```
broadcast/
└── Deploy.s.sol/
    └── 31337/              # Chain ID
        ├── run-latest.json # Último despliegue
        └── run-*.json      # Historial
```

**Contenido**: Transacciones, receipts, gas usado, direcciones desplegadas.

### `cache/`
**Propósito**: Cache de compilación para acelerar builds.

**Archivos**:
- `solidity-files-cache.json`: Cache de archivos fuente
- `test-failures`: Tests fallidos previos

---

## 🛡️ Seguridad y Mejores Prácticas

### Validaciones Implementadas
- Control de acceso con modificadores
- Validación de inputs (balances, roles, estados)
- Prevención de reentrancy (aunque no aplica aquí)
- Checks-effects-interactions pattern en transferencias

### Optimizaciones de Gas
- Uso de `uint256` en lugar de `uint8` para mappings
- Storage packing donde posible
- Validaciones eficientes con `keccak256` para strings

### Eventos para Trazabilidad
- Todos los cambios de estado emiten eventos
- Indexed parameters para búsquedas eficientes
- Permite reconstruir historial completo

---

## 📈 Flujo de Trabajo

### Desarrollo
1. **Editar contrato**: `src/SupplyChain.sol`
2. **Compilar**: `forge build`
3. **Escribir tests**: `test/SupplyChain.t.sol`
4. **Ejecutar tests**: `forge test -vvv`
5. **Desplegar local**: `forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast`

### Debugging
- **Logs**: `console.log()` en contratos y tests
- **Broadcast**: Revisar `broadcast/` para transacciones
- **Cache**: Limpiar con `forge clean` si hay problemas

### Producción
- **Verificación**: `--verify` en despliegue
- **Tests**: Ejecutar suite completa antes de deploy
- **Auditoría**: Revisar eventos y validaciones

---

## 📝 Referencias

- [Foundry Book](https://book.getfoundry.sh/)
- [Solidity Documentation](https://docs.soliditylang.org/)
- [forge-std GitHub](https://github.com/foundry-rs/forge-std)
- [Ethereum Virtual Machine](https://ethereum.org/en/developers/docs/evm/)

---

## 🔍 Glosario

- **Smart Contract**: Código ejecutable en blockchain
- **Token**: Representación digital de un producto/materia prima
- **Transfer**: Movimiento de tokens entre usuarios
- **Role**: Función en la cadena de suministro (Producer, Factory, etc.)
- **Trazabilidad**: Seguimiento del origen y transformación de productos
- **Gas**: Unidad que mide el costo computacional en Ethereum
- **Event**: Notificación emitida por el contrato
- **Modifier**: Función que modifica el comportamiento de otras funciones
- **Mapping**: Estructura de datos clave-valor en Solidity

---

¿Necesitas más detalles sobre alguna función específica o tienes preguntas sobre la implementación?

## ⚙️ Configuración y Utilidades

### `.gitignore`
Ignora archivos generados por el compilador, logs, variables de entorno y dependencias. Evita que archivos sensibles o pesados se suban al repositorio.

### `foundry.toml`
Configura el framework Foundry:
- Versiones de Solidity y EVM
- Optimizaciones de compilador
- Rutas de carpetas
- RPC local para desarrollo

---

## 🔥 Contrato Principal: `src/SupplyChain.sol`

### Propósito
Gestiona la trazabilidad de productos en la cadena de suministro, desde la materia prima hasta el consumidor final, con control de roles y transferencias seguras.

### Estructuras Clave
- **Enums**: Estados de usuario (`UserStatus`), estados de transferencia (`TransferStatus`)
- **Structs**: `User`, `Token`, `Transfer`
- **Mappings**: Bases de datos on-chain para usuarios, tokens, transferencias y balances

### Funcionalidades Principales

#### 1. Gestión de Usuarios
- `requestUserRole(role)`: Solicita registro con rol (producer, factory, retailer, consumer)
- `changeStatusUser(address, status)`: Admin aprueba/rechaza usuarios
- `getUserInfo(address)`: Consulta datos de usuario
- `isAdmin(address)`: Verifica si una dirección es admin
- `getAllUsers()`: Lista todos los usuarios (solo admin)

#### 2. Gestión de Tokens
- `createToken(name, totalSupply, features, parentId)`: Crea productos/materia prima
  - Producer: solo parentId=0
  - Factory/Retailer: deben tener balance del token padre
- `getToken(tokenId)`: Consulta datos de un token
- `getTokenBalance(tokenId, address)`: Consulta balance de un token para un usuario
- `getUserTokens(address)`: Lista todos los tokens de un usuario

#### 3. Transferencias
- `transfer(to, tokenId, amount)`: Solicita transferencia de tokens (según flujo de roles)
- `acceptTransfer(transferId)`: Destinatario acepta y ejecuta la transferencia
- `rejectTransfer(transferId)`: Destinatario rechaza la transferencia
- `getTransfer(transferId)`: Consulta datos de una transferencia
- `getUserTransfers(address)`: Lista todas las transferencias de un usuario
- `getPendingTransfers(address)`: Lista transferencias pendientes para un usuario

#### 4. Validaciones y Seguridad
- Modificadores: `onlyAdmin`, `onlyApprovedUser`, `validRole`
- Validación de flujo: Producer→Factory→Retailer→Consumer
- Control de balances y estados

#### 5. Eventos
- `TokenCreated`, `TransferRequested`, `TransferAccepted`, `TransferRejected`, `UserRoleRequested`, `UserStatusChanged`
- Permiten al frontend escuchar cambios en tiempo real

---

## 🧪 Tests: `test/SupplyChain.t.sol`

- 32 tests unitarios cubren todos los casos de uso
- Validan registro, aprobación, creación de tokens, transferencias, rechazos y trazabilidad
- Uso de `vm.prank` para simular diferentes actores
- Ejecución: `forge test`

---

## 🚀 Scripts de Despliegue: `script/Deploy.s.sol`

- Automatiza el despliegue del contrato en redes locales o testnet
- Muestra información relevante post-deploy (dirección del contrato, admin, red)
- Uso: `forge script script/Deploy.s.sol --rpc-url <url> --private-key <key> --broadcast`

---

## 📚 Librerías: `lib/forge-std/`

- Utilidades para testing, scripting y assertions
- Incluye `Test.sol`, `Script.sol`, `console.sol`, y más
- Instalación automática con Foundry

---

## 🗄️ Archivos Generados
- `broadcast/`: Logs de cada despliegue (útil para debugging y auditoría)
- `cache/`: Cache de compilación para acelerar builds

---

## 🛡️ Seguridad y Buenas Prácticas
- Validación estricta de roles y estados
- Uso de eventos para trazabilidad
- Control de acceso con modificadores
- Pruebas exhaustivas para evitar errores lógicos

---

## 📈 Flujo de Trabajo Sugerido
1. Escribir/editar contrato en `src/SupplyChain.sol`
2. Compilar: `forge build`
3. Escribir/editar tests en `test/SupplyChain.t.sol`
4. Ejecutar tests: `forge test`
5. Deployar localmente: `forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --private-key <key> --broadcast`
6. Consultar logs en `broadcast/`

---

## 📝 Referencias
- [Foundry Book](https://book.getfoundry.sh/)
- [Solidity Docs](https://docs.soliditylang.org/)
- [forge-std](https://github.com/foundry-rs/forge-std)

---

¿Dudas sobre alguna función, flujo o archivo? ¡Consulta este README o revisa los comentarios en el código fuente!
