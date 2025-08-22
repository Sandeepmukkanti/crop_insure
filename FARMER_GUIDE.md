# 🌾 Farmer Guide - How to Buy Crop Insurance

## 📋 Prerequisites for Farmers

### 1. **Install Petra Wallet**
- Download Petra wallet extension for Chrome/Firefox
- Create a new wallet account
- **IMPORTANT**: Save your seed phrase securely

### 2. **Get Your Wallet Address**
- Open Petra wallet
- Copy your wallet address (starts with 0x...)
- Share this address with the admin for funding

## 🚀 Step-by-Step Purchase Guide

### **Step 1: Fund Your Wallet**
The admin can fund your wallet using this command:
```bash
node fund-farmer.js
# Enter your wallet address when prompted
```

**OR** Admin can use CLI directly:
```bash
cd contract
aptos account fund-with-faucet --account YOUR_WALLET_ADDRESS
```

### **Step 2: Connect to Application**
1. Go to: http://localhost:5175/
2. Click "Connect Wallet" 
3. Select Petra wallet
4. Approve the connection

### **Step 3: Verify Connection**
- You should see: ✅ Connected: 0x1234...abcd
- Click "🔍 Debug Wallet" to check your balance
- If balance is low, click "Debug Wallet" for auto-funding

### **Step 4: Browse Insurance Policies**
- View available crop insurance templates
- Check coverage amounts, premiums, and duration
- Each policy shows:
  - 🌱 Crop Type (Rice, Wheat, Corn, etc.)
  - 💰 Coverage Amount 
  - 💵 Premium Cost
  - 📅 Duration

### **Step 5: Purchase Policy**
1. Choose a policy template
2. Click "Buy Policy" button
3. **Petra wallet will popup** - Approve the transaction
4. Wait for confirmation
5. ✅ Success! Your policy is now active

## 🔧 Troubleshooting

### ❌ "WalletNotConnectedError"
**Solution**: 
1. Refresh the page
2. Reconnect your Petra wallet
3. Make sure Petra extension is enabled

### ❌ "Insufficient Balance"
**Solutions**:
1. Click "🔍 Debug Wallet" for auto-funding
2. Ask admin to fund your wallet
3. Check if you have at least 0.01 APT

### ❌ "Transaction Failed"
**Solutions**:
1. Check internet connection
2. Try transaction again
3. Increase gas limit in Petra settings
4. Contact admin for help

### ❌ "Policy Already Purchased"
**Info**: You can only buy one policy per template. This prevents duplicate purchases.

## 📱 Farmer Dashboard Features

### **Current Features**:
- ✅ View all available policies
- ✅ Purchase insurance policies
- ✅ See policy details
- ✅ Connection status indicator
- ✅ Auto-funding capability
- ✅ Transaction error handling

### **After Purchase**:
- Policy is stored on Aptos blockchain
- You can view your policies in the dashboard
- Submit claims when needed
- Track claim status

## 💡 Tips for Farmers

1. **Always check your wallet connection** before purchasing
2. **Keep some APT balance** for future transactions
3. **Save your transaction hashes** for records
4. **Contact admin** if you face any issues
5. **Read policy terms** before purchasing

## 🆘 Emergency Contacts

If you face any issues:
1. **Check console logs** (F12 in browser)
2. **Click Debug Wallet** for diagnosis
3. **Contact the admin** with:
   - Your wallet address
   - Error message screenshots
   - Transaction hashes (if any)

---

## 🎯 Quick Start for Your Friend

1. **Install Petra wallet**
2. **Create account** and get address
3. **Share address** with you (admin)
4. **You fund their wallet**: `aptos account fund-with-faucet --account THEIR_ADDRESS`
5. **They visit**: http://localhost:5175/
6. **Connect wallet** and **buy policies**! 🎉
