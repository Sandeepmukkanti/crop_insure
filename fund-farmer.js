#!/usr/bin/env node

/**
 * Farmer Wallet Funding Script
 * Use this to fund any farmer's wallet with test APT tokens
 */

const { exec } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function fundWallet(address) {
  return new Promise((resolve, reject) => {
    const command = `aptos account fund-with-faucet --account ${address}`;
    console.log(`🏦 Funding wallet: ${address}`);
    
    exec(command, { cwd: './contract' }, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Error: ${error.message}`);
        reject(error);
        return;
      }
      
      if (stderr) {
        console.error(`⚠️  Warning: ${stderr}`);
      }
      
      console.log(`✅ Success: ${stdout}`);
      resolve(stdout);
    });
  });
}

async function main() {
  console.log('🌾 Crop Insurance - Farmer Wallet Funding Tool');
  console.log('===============================================');
  
  rl.question('Enter farmer wallet address (0x...): ', async (address) => {
    if (!address.startsWith('0x')) {
      console.log('❌ Invalid address format. Address should start with 0x');
      rl.close();
      return;
    }
    
    try {
      await fundWallet(address);
      console.log('🎉 Farmer wallet funded successfully!');
      console.log('💡 The farmer can now purchase insurance policies.');
    } catch (error) {
      console.log('❌ Failed to fund wallet:', error.message);
    }
    
    rl.close();
  });
}

if (require.main === module) {
  main();
}

module.exports = { fundWallet };
