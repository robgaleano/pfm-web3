// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {SupplyChain} from "../src/SupplyChain.sol";

/**
 * @title Deploy
 * @dev Script para desplegar el contrato SupplyChain
 * @notice Este script despliega el contrato y muestra información importante
 */
contract Deploy is Script {
    SupplyChain public supplyChain;

    function setUp() public {}

    function run() public {
        // Obtener la private key del entorno o usar la primera account de Anvil
        uint256 deployerPrivateKey = vm.envOr(
            "PRIVATE_KEY", 
            uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80)
        );
        
        // Comenzar broadcasting de transacciones
        vm.startBroadcast(deployerPrivateKey);

        // Desplegar el contrato SupplyChain
        console.log("Deploying SupplyChain contract...");
        supplyChain = new SupplyChain();
        console.log("SupplyChain deployed to:", address(supplyChain));

        // Obtener la dirección del admin (quien desplegó el contrato)
        address admin = supplyChain.admin();
        console.log("Admin address:", admin);

        // Verificar que el contrato se desplegó correctamente
        require(admin != address(0), "Admin address should not be zero");
        console.log("Contract deployed successfully!");

        vm.stopBroadcast();

        // ============== INFORMACIÓN POST-DEPLOY ==============
        console.log("\n==================== DEPLOYMENT INFO ====================");
        console.log("Contract Address:", address(supplyChain));
        console.log("Admin Address:", admin);
        console.log("Network: Local Anvil (Chain ID: 31337)");
        console.log("RPC URL: http://localhost:8545");
        console.log("========================================================\n");

        // ============== CONFIGURACIÓN PARA FRONTEND ==============
        console.log("==================== FRONTEND SETUP ====================");
        console.log("Add this to your frontend configuration:");
        console.log("CONTRACT_ADDRESS =", address(supplyChain));
        console.log("ADMIN_ADDRESS =", admin);
        console.log("========================================================\n");

        // ============== ACCOUNTS DE PRUEBA ==============
        console.log("==================== TEST ACCOUNTS ====================");
        console.log("Use these Anvil accounts for testing:");
        console.log("Admin:    0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
        console.log("Producer: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8");
        console.log("Factory:  0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC");
        console.log("Retailer: 0x90F79bf6EB2c4f870365E785982E1f101E93b906");
        console.log("Consumer: 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65");
        console.log("========================================================\n");

        // ============== NEXT STEPS ==============
        console.log("==================== NEXT STEPS ====================");
        console.log("1. Copy the contract address to your frontend config");
        console.log("2. Make sure Anvil is running on http://localhost:8545");
        console.log("3. Configure MetaMask with Anvil network");
        console.log("4. Import the test accounts to MetaMask");
        console.log("5. Start your frontend with: npm run dev");
        console.log("========================================================");
    }

    /**
     * @dev Helper function para verificar el deployment
     */
    function verifyDeployment() public view returns (bool) {
        if (address(supplyChain) == address(0)) {
            return false;
        }
        
        // Verificar que el admin esté configurado correctamente
        address admin = supplyChain.admin();
        if (admin == address(0)) {
            return false;
        }

        // Verificar que los contadores estén inicializados correctamente
        if (supplyChain.nextTokenId() != 1) {
            return false;
        }
        
        if (supplyChain.nextTransferId() != 1) {
            return false;
        }
        
        if (supplyChain.nextUserId() != 1) {
            return false;
        }

        return true;
    }
}