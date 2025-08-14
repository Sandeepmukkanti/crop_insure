#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Deploying Crop Insurance Contract with Your Admin Address...\n');

console.log('📋 Instructions:');
console.log('1. Make sure your Petra wallet is connected');
console.log('2. Export your private key from Petra wallet');
console.log('3. Run: aptos init --profile petra_admin --private-key YOUR_PRIVATE_KEY');
console.log('4. Run: aptos move publish --profile petra_admin --assume-yes\n');

console.log('🔑 Your Admin Address: 0x43661a8960ff2e47316e1782036be6d44a904f04d9075ed3e7e0797ed68138fa');
console.log('📦 Module Name: crop_insurance_final_v2');

console.log('\n📝 Manual Steps:');
console.log('1. Open Petra wallet extension');
console.log('2. Go to Settings > Export Private Key');
console.log('3. Copy the private key (starts with 0x...)');
console.log('4. Run the commands above with your private key');

console.log('\n🎯 After deployment, your wallet will have admin access to create policy templates!');
