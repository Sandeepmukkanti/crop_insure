// Admin API for creating policy templates on behalf of users
const { execSync } = require('child_process');
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Your wallet address - granted admin privileges
const AUTHORIZED_WALLET = "0x43661a8960ff2e47316e1782036be6d44a904f04d9075ed3e7e0797ed68138fa";
const MODULE_ADDRESS = "0xc2cfcb9a1855d38256bb59a8f94cc12d3f6d58679e703636868d8b07d426ab90";
const MODULE_NAME = "crop_insurance_v3";

app.post('/api/admin/create-template', async (req, res) => {
  try {
    const { walletAddress, templateData } = req.body;
    
    // Check if the wallet is authorized
    if (walletAddress.toLowerCase() !== AUTHORIZED_WALLET.toLowerCase()) {
      return res.status(403).json({ 
        error: 'Access denied. Only authorized admin can create templates.' 
      });
    }

    const { name, crop_type, coverage_amount, premium, duration_days } = templateData;

    // Execute the CLI command to create template
    const command = `aptos move run --function-id "${MODULE_ADDRESS}::${MODULE_NAME}::create_policy_template" --args string:"${name}" string:"${crop_type}" u64:${coverage_amount} u64:${premium} u64:${duration_days} --profile default --assume-yes`;
    
    console.log('Executing:', command);
    const result = execSync(command, { encoding: 'utf8' });
    
    res.json({ 
      success: true, 
      message: 'Template created successfully!',
      result: JSON.parse(result)
    });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ 
      error: 'Failed to create template', 
      details: error.message 
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'Admin API is running' });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Admin API running on http://localhost:${PORT}`);
  console.log(`✅ Authorized wallet: ${AUTHORIZED_WALLET}`);
});
