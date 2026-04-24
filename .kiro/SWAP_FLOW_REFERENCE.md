# Swap Flow - Quick Reference

## Complete Swap Execution Flow

```
User Interface (EvmSwapContent.tsx)
    ↓
1. User connects wallet
    ↓
2. User selects from/to tokens
    ↓
3. User enters amount
    ↓
4. Quote fetched automatically (debounced 600ms)
    ├─→ POST /api/swap/oneinch/quote
    ├─→ Service: fusionSwapService.getQuote()
    ├─→ SDK: sdk.getQuote(params)
    └─→ Response: quoteId, presets, amounts
    ↓
5. User clicks "Swap" button
    ↓
6. Check if on correct chain
    ├─→ If not: switchToChainById()
    └─→ If yes: continue
    ↓
7. Check allowance
    ├─→ POST /api/swap/oneinch/allowance
    ├─→ Service: fusionSwapService.checkAllowance()
    ├─→ Contract call: token.allowance()
    └─→ Response: needsApproval, currentAllowance
    ↓
8. Create order
    ├─→ POST /api/swap/oneinch/create-order
    ├─→ Service: fusionSwapService.createOrder()
    ├─→ SDK: sdk.createOrder(params)
    └─→ Response: order object, quoteId
    ↓
9. Sign order (in wallet)
    ├─→ User confirms in wallet
    └─→ Signature obtained
    ↓
10. Submit order
    ├─→ POST /api/swap/oneinch/submit-order
    ├─→ Service: fusionSwapService.submitOrder()
    ├─→ SDK: sdk.submitOrder(order, quoteId)
    └─→ Response: orderHash
    ↓
11. Poll order status (every 3 seconds, max 120 attempts = 6 minutes)
    ├─→ GET /api/swap/oneinch/order-status?orderHash=0x...
    ├─→ Service: fusionSwapService.getOrderStatus()
    ├─→ SDK: sdk.getOrderStatus(orderHash)
    ├─→ Check: status === OrderStatus.Filled?
    ├─→ If yes: Order complete ✅
    ├─→ If expired/cancelled: Error ❌
    └─→ If pending: Wait 3s, retry
    ↓
12. Show success view
    ├─→ Display from/to amounts
    ├─→ Show transaction link
    └─→ Offer "New Swap" button
```

---

## API Endpoint Sequence

### Step 1: Get Quote
```
POST /api/swap/oneinch/quote
Input:  fromTokenAddress, toTokenAddress, amount, walletAddress
Output: quoteId, presets, recommendedPreset, auctionStartAmount, auctionEndAmount
```

### Step 2: Check Allowance
```
POST /api/swap/oneinch/allowance
Input:  tokenAddress, walletAddress, amount
Output: needsApproval, currentAllowance
```

### Step 3: Create Order
```
POST /api/swap/oneinch/create-order
Input:  fromTokenAddress, toTokenAddress, amount, walletAddress, quoteId
Output: order, quoteId
```

### Step 4: Submit Order
```
POST /api/swap/oneinch/submit-order
Input:  order, quoteId
Output: orderHash, status
```

### Step 5: Poll Status (Repeat)
```
GET /api/swap/oneinch/order-status?orderHash=0x...
Output: status, fills, isCompleted, isExpired, isCancelled
```

---

## Error Handling

### Quote Errors
- Missing parameters → 400 Bad Request
- SDK initialization failed → 500 Server Error
- Network error → 500 Server Error

### Allowance Errors
- Token contract call failed → 500 Server Error
- Invalid token address → 500 Server Error

### Order Creation Errors
- Invalid parameters → 400 Bad Request
- SDK error → 500 Server Error

### Order Submission Errors
- Invalid order object → 400 Bad Request
- SDK error → 500 Server Error

### Status Polling Errors
- Invalid orderHash → 400 Bad Request
- SDK error → 500 Server Error
- Timeout after 6 minutes → Error message

---

## Frontend State Management

### Main States
- `stage`: "idle" | "switching" | "signing" | "approving" | "done" | "error"
- `quote`: Quote object or null
- `fromToken`, `toToken`: Selected tokens
- `fromAmount`, `toAmount`: User input and calculated output
- `balances`: Token balances for connected wallet
- `txHash`: Order hash when submitted

### Loading States
- `quoting`: Quote API in progress
- `loadingTokens`: Token list loading
- `loadingBal`: Balance fetching

### Error States
- `quoteError`: Quote fetch error message
- `swapError`: Swap execution error message

---

## Key Constants

### Tokens
- USDC (Arbitrum): `0xaf88d065e77c8cC2239327C5EDb3A432268e5831`
- UNI (Arbitrum): `0xFa7F8980b0f1E64A2062791cc3b0871572f1F7f0`
- Native ETH: `0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE`

### Contracts
- PERMIT2: `0x000000000022D473030F116dDEE9F6B43aC78BA3`
- 1inch Router v6: `0x111111125421ca6dc452d289314280a0f8842a65`

### Chains
- Ethereum: Chain ID 1
- Arbitrum: Chain ID 42161

---

## Debugging Tips

### Enable Logging
All service methods log to console:
- `🔧 Initializing Fusion SDK...`
- `📊 Getting quote...`
- `📝 Creating order...`
- `🚀 Submitting order...`
- `⏳ Checking order status...`
- `🔐 Checking allowance...`

### Check Environment Variables
```bash
echo $DEV_PORTAL_API_TOKEN
echo $NODE_URL
```

### Test Quote Endpoint
```bash
curl -X POST http://localhost:3000/api/swap/oneinch/quote \
  -H "Content-Type: application/json" \
  -d '{
    "fromTokenAddress": "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    "toTokenAddress": "0xFa7F8980b0f1E64A2062791cc3b0871572f1F7f0",
    "amount": "1000000",
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f42bE"
  }'
```

### Monitor Browser Console
- Check for network errors
- Look for state changes
- Verify wallet connection

### Check Network Tab
- Verify API requests are being sent
- Check response status codes
- Look for BigInt serialization in responses

---

## Performance Notes

- Quote fetching: ~600ms debounce
- Status polling: 3 second intervals
- Max polling attempts: 120 (6 minutes total)
- Token list: Cached per chain
- Balance fetching: Parallel requests with Promise.allSettled

---

## Security Considerations

✅ **Implemented:**
- No private keys in frontend
- User wallet signs orders
- Allowance checking before swap
- Proper error messages (no sensitive data)
- Environment variables for secrets

⚠️ **Best Practices:**
- Always verify chain before swap
- Check token addresses before swap
- Validate amounts are reasonable
- Monitor for unusual activity
- Keep API keys secure
