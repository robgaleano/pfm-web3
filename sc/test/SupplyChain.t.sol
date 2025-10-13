// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {SupplyChain} from "../src/SupplyChain.sol";

/**
 * @title SupplyChainTest
 * @dev Tests completos para el contrato SupplyChain
 * @notice Tests que validan toda la funcionalidad del sistema
 */
contract SupplyChainTest is Test {
    SupplyChain public supplyChain;
    
    // Direcciones de prueba
    address public admin;
    address public producer = address(0x1);
    address public factory = address(0x2);
    address public retailer = address(0x3);
    address public consumer = address(0x4);
    address public unauthorizedUser = address(0x5);

    function setUp() public {
        // Desplegar el contrato
        supplyChain = new SupplyChain();
        admin = supplyChain.admin();
        
        // Configurar balances para las cuentas de prueba
        vm.deal(admin, 100 ether);
        vm.deal(producer, 100 ether);
        vm.deal(factory, 100 ether);
        vm.deal(retailer, 100 ether);
        vm.deal(consumer, 100 ether);
        vm.deal(unauthorizedUser, 100 ether);
    }

    // ==================== TESTS DE SETUP ====================
    
    function testContractDeployment() public {
        assertEq(supplyChain.admin(), admin);
        assertEq(supplyChain.nextTokenId(), 1);
        assertEq(supplyChain.nextTransferId(), 1);
        assertEq(supplyChain.nextUserId(), 1);
    }

    function testIsAdmin() public {
        assertTrue(supplyChain.isAdmin(admin));
        assertFalse(supplyChain.isAdmin(producer));
        assertFalse(supplyChain.isAdmin(factory));
    }

    // ==================== TESTS DE GESTIÓN DE USUARIOS ====================
    
    function testUserRegistration() public {
        vm.prank(producer);
        supplyChain.requestUserRole("producer");
        
        SupplyChain.User memory user = supplyChain.getUserInfo(producer);
        assertEq(user.userAddress, producer);
        assertEq(user.role, "producer");
        assertTrue(user.status == SupplyChain.UserStatus.Pending);
    }

    function testUserRegistrationWithInvalidRole() public {
        vm.prank(producer);
        vm.expectRevert("Invalid role");
        supplyChain.requestUserRole("invalid_role");
    }

    function testCannotRegisterTwice() public {
        vm.prank(producer);
        supplyChain.requestUserRole("producer");
        
        vm.prank(producer);
        vm.expectRevert("User already registered");
        supplyChain.requestUserRole("producer");
    }

    function testAdminApproveUser() public {
        // Registrar usuario
        vm.prank(producer);
        supplyChain.requestUserRole("producer");
        
        // Admin aprueba usuario
        vm.prank(admin);
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Approved);
        
        SupplyChain.User memory user = supplyChain.getUserInfo(producer);
        assertTrue(user.status == SupplyChain.UserStatus.Approved);
    }

    function testAdminRejectUser() public {
        // Registrar usuario
        vm.prank(producer);
        supplyChain.requestUserRole("producer");
        
        // Admin rechaza usuario
        vm.prank(admin);
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Rejected);
        
        SupplyChain.User memory user = supplyChain.getUserInfo(producer);
        assertTrue(user.status == SupplyChain.UserStatus.Rejected);
    }

    function testOnlyAdminCanChangeStatus() public {
        vm.prank(producer);
        supplyChain.requestUserRole("producer");
        
        vm.prank(factory);
        vm.expectRevert("Only admin can perform this action");
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Approved);
    }

    function testGetUserInfoForNonExistentUser() public {
        vm.expectRevert("User not found");
        supplyChain.getUserInfo(unauthorizedUser);
    }

    // ==================== TESTS DE CREACIÓN DE TOKENS ====================
    
    function testCreateTokenByProducer() public {
        // Registrar y aprobar producer
        _registerAndApproveUser(producer, "producer");
        
        vm.prank(producer);
        supplyChain.createToken("Raw Material", 1000, "{\"type\":\"organic\"}", 0);
        
        SupplyChain.Token memory token = supplyChain.getToken(1);
        assertEq(token.id, 1);
        assertEq(token.creator, producer);
        assertEq(token.name, "Raw Material");
        assertEq(token.totalSupply, 1000);
        assertEq(token.parentId, 0);
        
        assertEq(supplyChain.getTokenBalance(1, producer), 1000);
    }

    function testCreateTokenByFactory() public {
        // Registrar usuarios
        _registerAndApproveUser(producer, "producer");
        _registerAndApproveUser(factory, "factory");
        
        // Producer crea materia prima
        vm.prank(producer);
        supplyChain.createToken("Raw Material", 1000, "{\"type\":\"organic\"}", 0);
        
        // Transferir a factory
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 500);
        
        vm.prank(factory);
        supplyChain.acceptTransfer(1);
        
        // Factory crea producto derivado
        vm.prank(factory);
        supplyChain.createToken("Processed Product", 100, "{\"processed\":true}", 1);
        
        SupplyChain.Token memory token = supplyChain.getToken(2);
        assertEq(token.parentId, 1);
        assertEq(token.creator, factory);
    }

    function testProducerCannotCreateWithParentId() public {
        _registerAndApproveUser(producer, "producer");
        
        vm.prank(producer);
        vm.expectRevert("Producers can only create raw materials (parentId = 0)");
        supplyChain.createToken("Invalid Token", 100, "{}", 1);
    }

    function testConsumerCannotCreateToken() public {
        _registerAndApproveUser(consumer, "consumer");
        
        vm.prank(consumer);
        vm.expectRevert("Consumers cannot create tokens");
        supplyChain.createToken("Invalid Token", 100, "{}", 0);
    }

    function testUnapprovedUserCannotCreateToken() public {
        vm.prank(producer);
        supplyChain.requestUserRole("producer");
        
        vm.prank(producer);
        vm.expectRevert("User not approved");
        supplyChain.createToken("Token", 100, "{}", 0);
    }

    function testCreateTokenWithZeroSupply() public {
        _registerAndApproveUser(producer, "producer");
        
        vm.prank(producer);
        vm.expectRevert("Total supply must be greater than 0");
        supplyChain.createToken("Token", 0, "{}", 0);
    }

    function testCreateTokenWithEmptyName() public {
        _registerAndApproveUser(producer, "producer");
        
        vm.prank(producer);
        vm.expectRevert("Name cannot be empty");
        supplyChain.createToken("", 100, "{}", 0);
    }

    // ==================== TESTS DE TRANSFERENCIAS ====================
    
    function testTransferFromProducerToFactory() public {
        _registerAndApproveUser(producer, "producer");
        _registerAndApproveUser(factory, "factory");
        
        // Producer crea token
        vm.prank(producer);
        supplyChain.createToken("Raw Material", 1000, "{}", 0);
        
        // Producer transfiere a factory
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 500);
        
        SupplyChain.Transfer memory transferObj = supplyChain.getTransfer(1);
        assertEq(transferObj.from, producer);
        assertEq(transferObj.to, factory);
        assertEq(transferObj.tokenId, 1);
        assertEq(transferObj.amount, 500);
        assertTrue(transferObj.status == SupplyChain.TransferStatus.Pending);
    }

    function testAcceptTransfer() public {
        _registerAndApproveUser(producer, "producer");
        _registerAndApproveUser(factory, "factory");
        
        vm.prank(producer);
        supplyChain.createToken("Raw Material", 1000, "{}", 0);
        
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 500);
        
        // Factory acepta transferencia
        vm.prank(factory);
        supplyChain.acceptTransfer(1);
        
        SupplyChain.Transfer memory transferObj = supplyChain.getTransfer(1);
        assertTrue(transferObj.status == SupplyChain.TransferStatus.Accepted);
        
        // Verificar balances
        assertEq(supplyChain.getTokenBalance(1, producer), 500);
        assertEq(supplyChain.getTokenBalance(1, factory), 500);
    }

    function testRejectTransfer() public {
        _registerAndApproveUser(producer, "producer");
        _registerAndApproveUser(factory, "factory");
        
        vm.prank(producer);
        supplyChain.createToken("Raw Material", 1000, "{}", 0);
        
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 500);
        
        // Factory rechaza transferencia
        vm.prank(factory);
        supplyChain.rejectTransfer(1);
        
        SupplyChain.Transfer memory transferObj = supplyChain.getTransfer(1);
        assertTrue(transferObj.status == SupplyChain.TransferStatus.Rejected);
        
        // Verificar que balances no cambiaron
        assertEq(supplyChain.getTokenBalance(1, producer), 1000);
        assertEq(supplyChain.getTokenBalance(1, factory), 0);
    }

    function testInvalidRoleTransfer() public {
        _registerAndApproveUser(producer, "producer");
        _registerAndApproveUser(consumer, "consumer");
        
        vm.prank(producer);
        supplyChain.createToken("Raw Material", 1000, "{}", 0);
        
        vm.prank(producer);
        vm.expectRevert("Producer can only transfer to Factory");
        supplyChain.transfer(consumer, 1, 500);
    }

    function testConsumerCannotTransfer() public {
        _setupCompleteFlow();
        
        vm.prank(consumer);
        vm.expectRevert("Consumer cannot transfer tokens");
        supplyChain.transfer(retailer, 3, 1); // Transferir solo 1 unidad (tiene 5 disponibles)
    }

    function testTransferInsufficientBalance() public {
        _registerAndApproveUser(producer, "producer");
        _registerAndApproveUser(factory, "factory");
        
        vm.prank(producer);
        supplyChain.createToken("Raw Material", 1000, "{}", 0);
        
        vm.prank(producer);
        vm.expectRevert("Insufficient balance");
        supplyChain.transfer(factory, 1, 1500);
    }

    function testTransferToSameAddress() public {
        _registerAndApproveUser(producer, "producer");
        
        vm.prank(producer);
        supplyChain.createToken("Raw Material", 1000, "{}", 0);
        
        vm.prank(producer);
        vm.expectRevert("Cannot transfer to yourself");
        supplyChain.transfer(producer, 1, 500);
    }

    function testTransferToUnregisteredUser() public {
        _registerAndApproveUser(producer, "producer");
        
        vm.prank(producer);
        supplyChain.createToken("Raw Material", 1000, "{}", 0);
        
        vm.prank(producer);
        vm.expectRevert("Recipient not registered");
        supplyChain.transfer(unauthorizedUser, 1, 500);
    }

    // ==================== TESTS DE CASOS EDGE ====================
    
    function testTransferNonExistentToken() public {
        _registerAndApproveUser(producer, "producer");
        _registerAndApproveUser(factory, "factory");
        
        vm.prank(producer);
        vm.expectRevert("Token does not exist");
        supplyChain.transfer(factory, 999, 100);
    }

    function testAcceptNonExistentTransfer() public {
        vm.prank(factory);
        vm.expectRevert("Transfer does not exist");
        supplyChain.acceptTransfer(999);
    }

    function testOnlyRecipientCanAcceptTransfer() public {
        _registerAndApproveUser(producer, "producer");
        _registerAndApproveUser(factory, "factory");
        
        vm.prank(producer);
        supplyChain.createToken("Raw Material", 1000, "{}", 0);
        
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 500);
        
        vm.prank(producer);
        vm.expectRevert("Only recipient can accept transfer");
        supplyChain.acceptTransfer(1);
    }

    // ==================== TESTS DE FLUJO COMPLETO ====================
    
    function testCompleteSupplyChainFlow() public {
        _setupCompleteFlow();
        
        // Verificar que el flujo completo funcionó
        assertEq(supplyChain.getTokenBalance(1, producer), 500); // Materia prima restante
        assertEq(supplyChain.getTokenBalance(1, factory), 500);  // Factory recibió materia prima
        assertEq(supplyChain.getTokenBalance(2, factory), 50);   // Producto procesado restante
        assertEq(supplyChain.getTokenBalance(2, retailer), 50);  // Retailer recibió producto
        assertEq(supplyChain.getTokenBalance(3, retailer), 5);   // Producto final restante
        assertEq(supplyChain.getTokenBalance(3, consumer), 5);   // Consumer recibió producto final
    }

    function testTraceabilityFlow() public {
        _setupCompleteFlow();
        
        // Verificar trazabilidad
        SupplyChain.Token memory rawMaterial = supplyChain.getToken(1);
        SupplyChain.Token memory processedProduct = supplyChain.getToken(2);
        SupplyChain.Token memory finalProduct = supplyChain.getToken(3);
        
        assertEq(rawMaterial.parentId, 0);
        assertEq(processedProduct.parentId, 1);
        assertEq(finalProduct.parentId, 2);
        
        assertEq(rawMaterial.creator, producer);
        assertEq(processedProduct.creator, factory);
        assertEq(finalProduct.creator, retailer);
    }

    // ==================== TESTS DE FUNCIONES AUXILIARES ====================
    
    function testGetUserTokens() public {
        _registerAndApproveUser(producer, "producer");
        
        vm.prank(producer);
        supplyChain.createToken("Token1", 1000, "{}", 0);
        
        vm.prank(producer);
        supplyChain.createToken("Token2", 500, "{}", 0);
        
        uint256[] memory userTokens = supplyChain.getUserTokens(producer);
        assertEq(userTokens.length, 2);
        assertEq(userTokens[0], 1);
        assertEq(userTokens[1], 2);
    }

    function testGetUserTransfers() public {
        _registerAndApproveUser(producer, "producer");
        _registerAndApproveUser(factory, "factory");
        
        vm.prank(producer);
        supplyChain.createToken("Raw Material", 1000, "{}", 0);
        
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 500);
        
        uint256[] memory producerTransfers = supplyChain.getUserTransfers(producer);
        uint256[] memory factoryTransfers = supplyChain.getUserTransfers(factory);
        
        assertEq(producerTransfers.length, 1);
        assertEq(factoryTransfers.length, 1);
        assertEq(producerTransfers[0], 1);
        assertEq(factoryTransfers[0], 1);
    }

    function testGetPendingTransfers() public {
        _registerAndApproveUser(producer, "producer");
        _registerAndApproveUser(factory, "factory");
        
        vm.prank(producer);
        supplyChain.createToken("Raw Material", 1000, "{}", 0);
        
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 500);
        
        uint256[] memory pendingTransfers = supplyChain.getPendingTransfers(factory);
        assertEq(pendingTransfers.length, 1);
        assertEq(pendingTransfers[0], 1);
        
        // Después de aceptar, no debería haber transferencias pendientes
        vm.prank(factory);
        supplyChain.acceptTransfer(1);
        
        pendingTransfers = supplyChain.getPendingTransfers(factory);
        assertEq(pendingTransfers.length, 0);
    }

    // ==================== HELPER FUNCTIONS ====================
    
    function _registerAndApproveUser(address user, string memory role) internal {
        vm.prank(user);
        supplyChain.requestUserRole(role);
        
        vm.prank(admin);
        supplyChain.changeStatusUser(user, SupplyChain.UserStatus.Approved);
    }
    
    function _setupCompleteFlow() internal {
        // Registrar todos los usuarios
        _registerAndApproveUser(producer, "producer");
        _registerAndApproveUser(factory, "factory");
        _registerAndApproveUser(retailer, "retailer");
        _registerAndApproveUser(consumer, "consumer");
        
        // 1. Producer crea materia prima
        vm.prank(producer);
        supplyChain.createToken("Raw Cotton", 1000, "{\"organic\":true}", 0);
        
        // 2. Producer → Factory
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 500);
        vm.prank(factory);
        supplyChain.acceptTransfer(1);
        
        // 3. Factory crea producto procesado
        vm.prank(factory);
        supplyChain.createToken("Cotton Fabric", 100, "{\"color\":\"white\"}", 1);
        
        // 4. Factory → Retailer
        vm.prank(factory);
        supplyChain.transfer(retailer, 2, 50);
        vm.prank(retailer);
        supplyChain.acceptTransfer(2);
        
        // 5. Retailer crea producto final
        vm.prank(retailer);
        supplyChain.createToken("Cotton T-Shirt", 10, "{\"size\":\"M\"}", 2);
        
        // 6. Retailer → Consumer
        vm.prank(retailer);
        supplyChain.transfer(consumer, 3, 5);
        vm.prank(consumer);
        supplyChain.acceptTransfer(3);
    }
}