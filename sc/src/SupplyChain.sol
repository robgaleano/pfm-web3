// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SupplyChain
 * @dev Smart contract para gestionar trazabilidad en cadenas de suministro
 * @notice Este contrato implementa un sistema de tokens para rastrear productos 
 *         desde producción hasta consumo final con roles controlados
 */
contract SupplyChain {
    // ==================== ENUMS ====================
    
    /**
     * @dev Estados posibles de un usuario en el sistema
     */
    enum UserStatus { 
        Pending,    // Esperando aprobación del admin
        Approved,   // Usuario aprobado para operar
        Rejected,   // Usuario rechazado por admin
        Canceled    // Usuario canceló su solicitud
    }
    
    /**
     * @dev Estados posibles de una transferencia
     */
    enum TransferStatus { 
        Pending,    // Transferencia enviada, esperando respuesta
        Accepted,   // Transferencia aceptada por el receptor
        Rejected    // Transferencia rechazada por el receptor
    }

    // ==================== STRUCTS ====================
    
    /**
     * @dev Estructura que representa un token (producto/materia prima)
     */
    struct Token {
        uint256 id;                           // ID único del token
        address creator;                      // Dirección que creó el token
        string name;                         // Nombre del producto/materia prima
        uint256 totalSupply;                 // Cantidad total creada
        string features;                     // JSON con características del producto
        uint256 parentId;                    // ID del token padre (0 si es materia prima)
        uint256 dateCreated;                 // Timestamp de creación
        // mapping(address => uint256) balance; // Balance por dirección (se maneja por separado)
    }
    
    /**
     * @dev Estructura que representa una transferencia entre usuarios
     */
    struct Transfer {
        uint256 id;                          // ID único de la transferencia
        address from;                        // Dirección que envía
        address to;                          // Dirección que recibe
        uint256 tokenId;                     // ID del token a transferir
        uint256 dateCreated;                 // Timestamp de creación
        uint256 amount;                      // Cantidad a transferir
        TransferStatus status;               // Estado actual de la transferencia
    }
    
    /**
     * @dev Estructura que representa un usuario registrado
     */
    struct User {
        uint256 id;                          // ID único del usuario
        address userAddress;                 // Dirección del usuario
        string role;                         // Rol: "producer", "factory", "retailer", "consumer"
        UserStatus status;                   // Estado del usuario
    }

    // ==================== STATE VARIABLES ====================
    
    address public admin;                    // Dirección del administrador del contrato
    uint256 public nextTokenId = 1;         // Contador para IDs de tokens
    uint256 public nextTransferId = 1;      // Contador para IDs de transferencias
    uint256 public nextUserId = 1;          // Contador para IDs de usuarios
    
    // Mappings principales
    mapping(uint256 => Token) public tokens;                    // ID => Token
    mapping(uint256 => Transfer) public transfers;              // ID => Transfer
    mapping(uint256 => User) public users;                      // ID => User
    mapping(address => uint256) public addressToUserId;         // Address => User ID
    
    // Mapping para balances: tokenId => address => balance
    mapping(uint256 => mapping(address => uint256)) public tokenBalances;
    
    // Mappings para búsquedas eficientes
    mapping(address => uint256[]) public userTokens;            // Tokens por usuario
    mapping(address => uint256[]) public userTransfers;         // Transferencias por usuario

    // ==================== EVENTS ====================
    
    event TokenCreated(
        uint256 indexed tokenId, 
        address indexed creator, 
        string name, 
        uint256 totalSupply
    );
    
    event TransferRequested(
        uint256 indexed transferId, 
        address indexed from, 
        address indexed to, 
        uint256 tokenId, 
        uint256 amount
    );
    
    event TransferAccepted(uint256 indexed transferId);
    event TransferRejected(uint256 indexed transferId);
    
    event UserRoleRequested(address indexed user, string role);
    event UserStatusChanged(address indexed user, UserStatus status);

    // ==================== MODIFIERS ====================
    
    /**
     * @dev Modifier que solo permite al admin ejecutar la función
     */
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }
    
    /**
     * @dev Modifier que solo permite a usuarios aprobados ejecutar la función
     */
    modifier onlyApprovedUser() {
        require(addressToUserId[msg.sender] != 0, "User not registered");
        require(users[addressToUserId[msg.sender]].status == UserStatus.Approved, "User not approved");
        _;
    }
    
    /**
     * @dev Modifier que valida que el rol sea válido
     */
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

    // ==================== CONSTRUCTOR ====================
    
    /**
     * @dev Constructor que establece al deployer como admin y lo registra automáticamente
     */
    constructor() {
        admin = msg.sender;
        
        // Registrar automáticamente al admin como usuario aprobado
        uint256 adminUserId = nextUserId++;
        users[adminUserId] = User({
            id: adminUserId,
            userAddress: admin,
            role: "admin",
            status: UserStatus.Approved
        });
        addressToUserId[admin] = adminUserId;
        
        emit UserRoleRequested(admin, "admin");
        emit UserStatusChanged(admin, UserStatus.Approved);
    }

    // ==================== USER MANAGEMENT FUNCTIONS ====================
    
    /**
     * @dev Función para solicitar un rol en el sistema
     * @param role El rol solicitado: "producer", "factory", "retailer", "consumer"
     */
    function requestUserRole(string memory role) public validRole(role) {
        require(addressToUserId[msg.sender] == 0, "User already registered");
        
        uint256 userId = nextUserId++;
        
        users[userId] = User({
            id: userId,
            userAddress: msg.sender,
            role: role,
            status: UserStatus.Pending
        });
        
        addressToUserId[msg.sender] = userId;
        
        emit UserRoleRequested(msg.sender, role);
    }
    
    /**
     * @dev Función para que el admin cambie el estado de un usuario
     * @param userAddress Dirección del usuario
     * @param newStatus Nuevo estado a asignar
     */
    function changeStatusUser(address userAddress, UserStatus newStatus) public onlyAdmin {
        uint256 userId = addressToUserId[userAddress];
        require(userId != 0, "User not found");
        
        users[userId].status = newStatus;
        
        emit UserStatusChanged(userAddress, newStatus);
    }
    
    /**
     * @dev Función para obtener información de un usuario
     * @param userAddress Dirección del usuario
     * @return User Información del usuario
     */
    function getUserInfo(address userAddress) public view returns (User memory) {
        uint256 userId = addressToUserId[userAddress];
        require(userId != 0, "User not found");
        return users[userId];
    }
    
    /**
     * @dev Función para verificar si una dirección es admin
     * @param userAddress Dirección a verificar
     * @return bool True si es admin
     */
    function isAdmin(address userAddress) public view returns (bool) {
        return userAddress == admin;
    }

    // ==================== TOKEN MANAGEMENT FUNCTIONS ====================
    
    /**
     * @dev Función para crear un nuevo token
     * @param name Nombre del producto/materia prima
     * @param totalSupply Cantidad total a crear
     * @param features JSON con características del producto
     * @param parentId ID del token padre (0 para materias primas)
     */
    function createToken(
        string memory name, 
        uint256 totalSupply, 
        string memory features, 
        uint256 parentId
    ) public onlyApprovedUser {
        require(totalSupply > 0, "Total supply must be greater than 0");
        require(bytes(name).length > 0, "Name cannot be empty");
        
        User memory user = users[addressToUserId[msg.sender]];
        
        // Validar parentId según el rol
        if (keccak256(bytes(user.role)) == keccak256(bytes("producer"))) {
            require(parentId == 0, "Producers can only create raw materials (parentId = 0)");
        } else if (
            keccak256(bytes(user.role)) == keccak256(bytes("factory")) ||
            keccak256(bytes(user.role)) == keccak256(bytes("retailer"))
        ) {
            require(parentId > 0 && parentId < nextTokenId, "Invalid parent token");
            // Verificar que el usuario tenga balance del token padre
            require(tokenBalances[parentId][msg.sender] > 0, "No balance of parent token");
        } else {
            revert("Consumers cannot create tokens");
        }
        
        uint256 tokenId = nextTokenId++;
        
        tokens[tokenId] = Token({
            id: tokenId,
            creator: msg.sender,
            name: name,
            totalSupply: totalSupply,
            features: features,
            parentId: parentId,
            dateCreated: block.timestamp
        });
        
        // Asignar todo el supply al creador
        tokenBalances[tokenId][msg.sender] = totalSupply;
        userTokens[msg.sender].push(tokenId);
        
        emit TokenCreated(tokenId, msg.sender, name, totalSupply);
    }
    
    /**
     * @dev Función para obtener información de un token
     * @param tokenId ID del token
     * @return Token Información del token
     */
    function getToken(uint256 tokenId) public view returns (Token memory) {
        require(tokenId > 0 && tokenId < nextTokenId, "Token does not exist");
        return tokens[tokenId];
    }
    
    /**
     * @dev Función para obtener el balance de un token para una dirección
     * @param tokenId ID del token
     * @param userAddress Dirección del usuario
     * @return uint256 Balance del token
     */
    function getTokenBalance(uint256 tokenId, address userAddress) public view returns (uint256) {
        return tokenBalances[tokenId][userAddress];
    }

    // ==================== TRANSFER FUNCTIONS ====================
    
    /**
     * @dev Función para transferir tokens a otro usuario
     * @param to Dirección del receptor
     * @param tokenId ID del token a transferir
     * @param amount Cantidad a transferir
     */
    function transfer(address to, uint256 tokenId, uint256 amount) public onlyApprovedUser {
        require(to != msg.sender, "Cannot transfer to yourself");
        require(amount > 0, "Amount must be greater than 0");
        require(tokenId > 0 && tokenId < nextTokenId, "Token does not exist");
        require(tokenBalances[tokenId][msg.sender] >= amount, "Insufficient balance");
        
        // Verificar que el receptor esté registrado y aprobado
        uint256 toUserId = addressToUserId[to];
        require(toUserId != 0, "Recipient not registered");
        require(users[toUserId].status == UserStatus.Approved, "Recipient not approved");
        
        // Validar transferencia según roles
        _validateTransferRoles(msg.sender, to);
        
        uint256 transferId = nextTransferId++;
        
        transfers[transferId] = Transfer({
            id: transferId,
            from: msg.sender,
            to: to,
            tokenId: tokenId,
            dateCreated: block.timestamp,
            amount: amount,
            status: TransferStatus.Pending
        });
        
        userTransfers[msg.sender].push(transferId);
        userTransfers[to].push(transferId);
        
        emit TransferRequested(transferId, msg.sender, to, tokenId, amount);
    }
    
    /**
     * @dev Función para aceptar una transferencia pendiente
     * @param transferId ID de la transferencia
     */
    function acceptTransfer(uint256 transferId) public {
        require(transferId > 0 && transferId < nextTransferId, "Transfer does not exist");
        
        Transfer storage transferObj = transfers[transferId];
        require(transferObj.to == msg.sender, "Only recipient can accept transfer");
        require(transferObj.status == TransferStatus.Pending, "Transfer not pending");
        
        // Verificar que el sender aún tenga balance suficiente
        require(
            tokenBalances[transferObj.tokenId][transferObj.from] >= transferObj.amount,
            "Sender has insufficient balance"
        );
        
        // Realizar la transferencia
        tokenBalances[transferObj.tokenId][transferObj.from] -= transferObj.amount;
        tokenBalances[transferObj.tokenId][transferObj.to] += transferObj.amount;
        
        // Si es la primera vez que el receptor tiene este token, agregarlo a su lista
        if (tokenBalances[transferObj.tokenId][transferObj.to] == transferObj.amount) {
            userTokens[transferObj.to].push(transferObj.tokenId);
        }
        
        transferObj.status = TransferStatus.Accepted;
        
        emit TransferAccepted(transferId);
    }
    
    /**
     * @dev Función para rechazar una transferencia pendiente
     * @param transferId ID de la transferencia
     */
    function rejectTransfer(uint256 transferId) public {
        require(transferId > 0 && transferId < nextTransferId, "Transfer does not exist");
        
        Transfer storage transferObj = transfers[transferId];
        require(transferObj.to == msg.sender, "Only recipient can reject transfer");
        require(transferObj.status == TransferStatus.Pending, "Transfer not pending");
        
        transferObj.status = TransferStatus.Rejected;
        
        emit TransferRejected(transferId);
    }
    
    /**
     * @dev Función para obtener información de una transferencia
     * @param transferId ID de la transferencia
     * @return Transfer Información de la transferencia
     */
    function getTransfer(uint256 transferId) public view returns (Transfer memory) {
        require(transferId > 0 && transferId < nextTransferId, "Transfer does not exist");
        return transfers[transferId];
    }

    // ==================== HELPER FUNCTIONS ====================
    
    /**
     * @dev Función para obtener todos los tokens de un usuario
     * @param userAddress Dirección del usuario
     * @return uint256[] Array de IDs de tokens
     */
    function getUserTokens(address userAddress) public view returns (uint256[] memory) {
        return userTokens[userAddress];
    }
    
    /**
     * @dev Función para obtener todas las transferencias de un usuario
     * @param userAddress Dirección del usuario
     * @return uint256[] Array de IDs de transferencias
     */
    function getUserTransfers(address userAddress) public view returns (uint256[] memory) {
        return userTransfers[userAddress];
    }
    
    /**
     * @dev Función interna para validar transferencias entre roles
     * @param from Dirección del sender
     * @param to Dirección del receptor
     */
    function _validateTransferRoles(address from, address to) internal view {
        User memory fromUser = users[addressToUserId[from]];
        User memory toUser = users[addressToUserId[to]];
        
        bytes32 fromRole = keccak256(bytes(fromUser.role));
        bytes32 toRole = keccak256(bytes(toUser.role));
        
        // Producer -> Factory
        if (fromRole == keccak256(bytes("producer"))) {
            require(toRole == keccak256(bytes("factory")), "Producer can only transfer to Factory");
        }
        // Factory -> Retailer
        else if (fromRole == keccak256(bytes("factory"))) {
            require(toRole == keccak256(bytes("retailer")), "Factory can only transfer to Retailer");
        }
        // Retailer -> Consumer
        else if (fromRole == keccak256(bytes("retailer"))) {
            require(toRole == keccak256(bytes("consumer")), "Retailer can only transfer to Consumer");
        }
        // Consumer no puede transferir
        else if (fromRole == keccak256(bytes("consumer"))) {
            revert("Consumer cannot transfer tokens");
        }
        else {
            revert("Invalid role for transfer");
        }
    }
    
    /**
     * @dev Función para obtener todos los usuarios (solo admin)
     * @return User[] Array de todos los usuarios
     */
    function getAllUsers() public view onlyAdmin returns (User[] memory) {
        User[] memory allUsers = new User[](nextUserId - 1);
        for (uint256 i = 1; i < nextUserId; i++) {
            allUsers[i - 1] = users[i];
        }
        return allUsers;
    }
    
    /**
     * @dev Función para obtener transferencias pendientes para un usuario
     * @param userAddress Dirección del usuario
     * @return uint256[] Array de IDs de transferencias pendientes
     */
    function getPendingTransfers(address userAddress) public view returns (uint256[] memory) {
        uint256[] memory userTransferIds = userTransfers[userAddress];
        uint256 pendingCount = 0;
        
        // Contar transferencias pendientes
        for (uint256 i = 0; i < userTransferIds.length; i++) {
            if (transfers[userTransferIds[i]].status == TransferStatus.Pending &&
                transfers[userTransferIds[i]].to == userAddress) {
                pendingCount++;
            }
        }
        
        // Crear array con transferencias pendientes
        uint256[] memory pendingTransfers = new uint256[](pendingCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < userTransferIds.length; i++) {
            if (transfers[userTransferIds[i]].status == TransferStatus.Pending &&
                transfers[userTransferIds[i]].to == userAddress) {
                pendingTransfers[index] = userTransferIds[i];
                index++;
            }
        }
        
        return pendingTransfers;
    }
}