# Deployment Guide

## Error: "could not decode result data"

This error occurs when the smart contract is not properly deployed or Anvil is not running.

## Solution Steps

### 1. Start Anvil (Local Blockchain)

Open a terminal and run:

```bash
cd sc
anvil
```

Keep this terminal open. Anvil should be running on `http://localhost:8545`

### 2. Deploy the Smart Contract

Open a **new terminal** and run:

```bash
cd sc
forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --broadcast
```

The private key used is the first account from Anvil (the admin account).

### 3. Update Contract Address

After deployment, you'll see output like:

```
== Logs ==
SupplyChain deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
Admin: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
```

Copy the contract address and update it in `web/src/contracts/config.ts`:

```typescript
export const CONTRACT_CONFIG = {
  address: "0x5FbDB2315678afecb367f032d93F642f64180aa3", // Your deployed address
  // ... rest of config
};
```

### 4. Start the Web Application

```bash
cd web
npm run dev
```

### 5. Connect MetaMask

1. Open MetaMask
2. Switch to "Localhost 8545" network (or add it if not present)
3. Import the admin account using this private key:
   ```
   0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   ```
4. Connect to the application

## Verify Contract is Deployed

You can verify the contract is deployed by running this in the terminal:

```bash
cast code 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 --rpc-url http://localhost:8545
```

If the contract is deployed, you'll see the bytecode. If not, you'll see `0x`.

## Common Issues

### Issue: "Contract not deployed" error in browser

**Solution:** 
- Make sure Anvil is running
- Redeploy the contract
- Update the contract address in config.ts
- Hard refresh the browser (Ctrl+Shift+R or Cmd+Shift+R)

### Issue: Transaction fails with "insufficient funds"

**Solution:** 
- Import one of the Anvil test accounts into MetaMask
- The accounts come pre-funded with 10,000 ETH

### Issue: Changes not reflecting in browser

**Solution:**
- Clear browser cache and local storage
- Hard refresh the page
- Disconnect and reconnect wallet

## Test Accounts (Anvil Default)

```
Admin:     0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Private:   0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

Account 1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
Private:   0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d

Account 2: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
Private:   0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
```
