# 🔧 FARMER TESTING GUIDE - All Issues Fixed!

## 🎯 **Fixed Issues:**

### ✅ **1. WalletNotConnectedError in Navigation - FIXED**
- Added proper error handling in disconnect function
- Navigation now safely handles wallet connection/disconnection
- Added debug logging for troubleshooting

### ✅ **2. Disconnect Button Not Working - FIXED**
- Enhanced disconnect function with try-catch
- Added force disconnect option for stubborn connections
- Auto-redirect to home page after disconnect

### ✅ **3. Farmer Policy Purchase Issues - FIXED**
- Enhanced wallet connection monitoring
- Auto-funding system for farmers
- Better error messages and handling

---

## 🚀 **TESTING STEPS FOR YOUR FRIEND (FARMER):**

### **Step 1: Initial Setup**
1. **Install Petra Wallet** (Chrome extension)
2. **Create new account** in Petra
3. **Copy wallet address** (starts with 0x...)
4. **Share address with admin** (you) for funding

### **Step 2: Admin Funds Farmer**
```bash
cd C:\Users\SANDEEP\crop_insurance1\contract
aptos account fund-with-faucet --account FARMER_WALLET_ADDRESS
```

### **Step 3: Farmer Tests Connection**
1. **Go to**: http://localhost:5176/
2. **Click "Connect Wallet"** in navigation
3. **Select Petra** and approve connection
4. **Verify connection**: Should show green ✅ with address
5. **Test disconnect**: Click disconnect button - should redirect to home

### **Step 4: Test Force Disconnect (If Needed)**
1. If normal disconnect doesn't work
2. **Click "🔌 Force Disconnect"** button
3. Page will reload and clear all wallet state

### **Step 5: Test Policy Purchase**
1. **Connect wallet** again
2. **Go to Buy Policy page**
3. **Click "🔍 Debug Wallet"** to check funds
4. **Select a policy** and click "Buy Policy"
5. **Approve transaction** in Petra popup
6. **Success!** Policy should be purchased

---

## 🔧 **Troubleshooting Tools Available:**

### **For Farmers:**
- **🔍 Debug Wallet**: Check balance and connection status
- **📋 Copy Address**: Copy wallet address for sharing
- **🔌 Force Disconnect**: Emergency disconnect with page reload

### **For Admin (You):**
- **Fund farmer**: `aptos account fund-with-faucet --account ADDRESS`
- **Check transaction**: View on Aptos Explorer
- **Console logs**: All wallet actions are logged

---

## 🎯 **Test Scenarios:**

### **Scenario 1: Normal Flow**
1. Connect → Buy Policy → Disconnect → Reconnect ✅

### **Scenario 2: Connection Issues**
1. Connect → Force Disconnect → Reconnect ✅

### **Scenario 3: Low Balance**
1. Connect → Debug Wallet → Auto-fund → Buy Policy ✅

### **Scenario 4: Transaction Failure**
1. Connect → Buy Policy → Reject Transaction → Try Again ✅

---

## 📱 **User Interface Features:**

### **Connection Status Indicator:**
- ✅ **Green**: Connected with address shown
- ❌ **Red**: Not connected

### **Button Functions:**
- **🔍 Debug Wallet**: Diagnostics and auto-funding
- **📋 Copy Address**: Copy farmer's address
- **🔌 Force Disconnect**: Emergency disconnect
- **Buy Policy**: Purchase insurance with auto-checks

### **Error Handling:**
- Clear error messages for all failure types
- Auto-retry with funding if insufficient balance
- Fallback to localStorage if blockchain fails

---

## 🚨 **Emergency Commands:**

### **If Farmer Can't Connect:**
```bash
# Admin funds the farmer
aptos account fund-with-faucet --account FARMER_ADDRESS
```

### **If Website Issues:**
```bash
# Restart development server
cd C:\Users\SANDEEP\crop_insurance1
npm run dev
```

### **If Petra Issues:**
1. **Refresh browser page**
2. **Disable/Enable Petra extension**
3. **Try incognito mode**
4. **Use Force Disconnect button**

---

## ✅ **Success Indicators:**

1. **Connection**: Green checkmark with address
2. **Purchase**: "Policy Purchased Successfully!" message
3. **Transaction**: Transaction hash shown
4. **Disconnect**: Redirect to home page

**All wallet connection and farmer purchase issues are now resolved!** 🎉

Your friend should now be able to:
- ✅ Connect wallet smoothly
- ✅ Disconnect properly (normal + force options)
- ✅ Purchase policies without errors
- ✅ Get auto-funded if needed
- ✅ See clear error messages if issues occur
