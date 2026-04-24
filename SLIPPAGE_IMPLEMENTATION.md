# Slippage Implementation for 1inch Fusion Swaps

## Overview
Implemented proper slippage control for 1inch Fusion swaps. The slippage setting now affects the actual order execution, not just the UI display.

---

## How 1inch Fusion Handles Slippage

### Dutch Auction Mechanism
1inch Fusion uses a **Dutch Auction** instead of traditional AMM slippage:

```
Price starts high (auctionStartAmount) ──┐
                                          │ Decreases over time
Price ends low (auctionEndAmount) ───────┘
```

- **Auction Start Amount**: Best possible price (optimistic)
- **Auction End Amount**: Minimum acceptable price (includes slippage protection)
- **Auction Duration**: Time window for price to decrease (e.g., 180 seconds for "fast" preset)

### Slippage Parameter
When you pass `slippage: 0.5` (0.5%), the SDK adjusts:
- The `auctionEndAmount` to be 0.5% less than the expected output
- This ensures you won't receive less than (expected - slippage%)

---

## Implementation

### 1. Service Layer (`fusionSwapService.ts`)

#### Get Quote with Slippage
```typescript
async getQuote(params: {
  fromTokenAddress: string;
  toTokenAddress: string;
  amount: string;
  walletAddress: string;
  chainId: number;
  slippage?: number; // NEW: Optional slippage percentage
}) {
  const quoteParams: any = {
    fromTokenAddress: params.fromTokenAddress,
    toTokenAddress: params.toTokenAddress,
    amount: params.amount,
    walletAddress: params.walletAddress,
    source: "azabu-swap",
  };

  // Add slippage if provided
  if (params.slippage !== undefined) {
    quoteParams.slippage = params.slippage;
  }

  const quote = await sdk.getQuote(quoteParams);
  // ...
}
```

#### Create Order with Slippage
```typescript
async createOrder(params: {
  fromTokenAddress: string;
  toTokenAddress: string;
  amount: string;
  walletAddress: string;
  chainId: number;
  slippage?: number; // NEW: Optional slippage percentage
}) {
  const orderParams: any = {
    fromTokenAddress: params.fromTokenAddress,
    toTokenAddress: params.toTokenAddress,
    amount: params.amount,
    walletAddress: params.walletAddress,
    source: "azabu-swap",
  };

  // Add slippage if provided
  if (params.slippage !== undefined) {
    orderParams.slippage = params.slippage;
  }

  const preparedOrder = await sdk.createOrder(orderParams);
  // ...
}
```

---

### 2. API Routes

#### Quote API (`/api/swap/oneinch/quote/route.ts`)
```typescript
const { fromTokenAddress, toTokenAddress, amount, walletAddress, chainId, slippage } = body;

const quote = await fusionSwapService.getQuote({
  fromTokenAddress, 
  toTokenAddress, 
  amount, 
  walletAddress, 
  chainId: Number(chainId),
  slippage: slippage !== undefined ? Number(slippage) : undefined, // Pass slippage
});
```

#### Create Order API (`/api/swap/oneinch/create-order/route.ts`)
```typescript
const { fromTokenAddress, toTokenAddress, amount, walletAddress, chainId, slippage } = body;

const result = await fusionSwapService.createOrder({
  fromTokenAddress, 
  toTokenAddress, 
  amount, 
  walletAddress, 
  chainId: Number(chainId),
  slippage: slippage !== undefined ? Number(slippage) : undefined, // Pass slippage
});
```

---

### 3. Frontend (`EvmSwapContent.tsx`)

#### Pass Slippage to Quote
```typescript
const response = await fetch('/api/swap/oneinch/quote', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fromTokenAddress: fromToken.address,
    toTokenAddress: toToken.address,
    amount: toAtomicUnits(fromAmount, fromToken.decimals),
    walletAddress: evmAddress,
    chainId: chainConfig.chainId,
    slippage: slippage, // Pass current slippage setting
  })
});
```

#### Pass Slippage to Order Creation
```typescript
const orderCreationPromise = fetch('/api/swap/oneinch/create-order', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fromTokenAddress: fromToken.address,
    toTokenAddress: toToken.address,
    amount: atomicAmount,
    walletAddress: evmAddress,
    chainId: chainConfig.chainId,
    slippage: slippage, // Pass current slippage setting
  })
});
```

#### Re-fetch Quote on Slippage Change
```typescript
useEffect(() => {
  if (!fromAmount || parseFloat(fromAmount) <= 0 || !fromToken || !toToken) {
    setQuote(null); setToAmount(""); setQuoteError(null); return;
  }
  if (quoteTimer.current) clearTimeout(quoteTimer.current);
  quoteTimer.current = setTimeout(doFetchQuote, 300);
  return () => { if (quoteTimer.current) clearTimeout(quoteTimer.current); };
}, [fromAmount, fromToken, toToken, swapChain, slippage]); // Added slippage dependency
```

---

## User Flow

### 1. User Adjusts Slippage
```
User clicks slippage button → Selects 1.0% → State updates
```

### 2. Quote Re-fetches Automatically
```
Slippage change triggers useEffect → Debounced quote fetch → New quote with 1.0% slippage
```

### 3. Preview Shows Updated Values
```
Preview modal displays:
- Rate: 1 ETH = 2,500 USDC
- Min. received: 2,475 USDC (2,500 - 1%)
- Slippage: 1.0%
```

### 4. Order Created with Slippage
```
User confirms → Order created with slippage: 1.0% → auctionEndAmount adjusted accordingly
```

### 5. Order Execution
```
Auction runs → Resolvers compete → Fill happens at best price ≥ auctionEndAmount
```

---

## Slippage Presets

Current presets (defined in `swapConstants.ts`):
```typescript
export const SLIPPAGE_PRESETS = [0.1, 0.3, 0.5, 1.0, 2.0];
```

### Recommendations by Scenario

| Scenario | Recommended Slippage | Reason |
|----------|---------------------|--------|
| Stablecoins (USDC/USDT) | 0.1% - 0.3% | Very low volatility |
| Major pairs (ETH/USDC) | 0.3% - 0.5% | Moderate volatility |
| Altcoins | 0.5% - 1.0% | Higher volatility |
| Low liquidity | 1.0% - 2.0% | Price impact |
| High volatility | 2.0%+ | Rapid price changes |

---

## How Slippage Affects the Order

### Example: Swap 1 ETH for USDC with 0.5% slippage

#### Without Slippage Parameter
```
Expected output: 2,500 USDC
auctionStartAmount: 2,512.5 USDC (0.5% better)
auctionEndAmount: 2,487.5 USDC (0.5% worse)
```

#### With slippage: 0.5
```
Expected output: 2,500 USDC
auctionStartAmount: 2,512.5 USDC (0.5% better)
auctionEndAmount: 2,475 USDC (1% worse total)
                  ↑ Adjusted for user's slippage tolerance
```

### Protection Mechanism
```
If market price drops below auctionEndAmount:
  → Order won't fill
  → User protected from excessive slippage
  → Order expires after auction duration
```

---

## Testing

### Test Cases

1. **Default Slippage (0.5%)**
   - Create swap without changing slippage
   - Verify quote uses 0.5%
   - Verify order created with 0.5%

2. **Custom Slippage (1.0%)**
   - Change slippage to 1.0%
   - Verify quote re-fetches
   - Verify new quote reflects 1.0%
   - Verify order created with 1.0%

3. **Slippage Change During Swap**
   - Enter amount
   - Get quote
   - Change slippage
   - Verify quote updates
   - Verify "Min. received" updates in preview

4. **Low Slippage Rejection**
   - Set very low slippage (0.1%)
   - Try to swap volatile pair
   - Verify order may not fill if price moves

5. **High Slippage Acceptance**
   - Set high slippage (2.0%)
   - Swap volatile pair
   - Verify order fills even with price movement

---

## Debugging

### Check Slippage in Logs

#### Quote Request
```
📊 Getting quote on chain 1 slippage: 0.5
```

#### Order Creation
```
📝 Creating order on chain 1
   fromToken: 0x...
   toToken: 0x...
   amount (atomic): 1000000000000000000
   wallet: 0x...
   slippage: 0.5
```

### Verify in Network Tab
```json
// POST /api/swap/oneinch/quote
{
  "fromTokenAddress": "0x...",
  "toTokenAddress": "0x...",
  "amount": "1000000000000000000",
  "walletAddress": "0x...",
  "chainId": 1,
  "slippage": 0.5  // ← Should be present
}
```

---

## Common Issues

### Issue 1: Slippage Not Applied
**Symptom**: Order fails with "Price moved too much"
**Cause**: Slippage not passed to API
**Solution**: Verify slippage is in request body

### Issue 2: Quote Doesn't Update on Slippage Change
**Symptom**: Changing slippage doesn't update quote
**Cause**: Missing slippage in useEffect dependencies
**Solution**: Already fixed - slippage is now a dependency

### Issue 3: Wrong Slippage Format
**Symptom**: API error or unexpected behavior
**Cause**: Slippage sent as string instead of number
**Solution**: Use `Number(slippage)` in API routes

---

## API Contract

### Quote Request
```typescript
{
  fromTokenAddress: string;
  toTokenAddress: string;
  amount: string;
  walletAddress: string;
  chainId: number;
  slippage?: number; // Optional, percentage (e.g., 0.5 for 0.5%)
}
```

### Create Order Request
```typescript
{
  fromTokenAddress: string;
  toTokenAddress: string;
  amount: string;
  walletAddress: string;
  chainId: number;
  slippage?: number; // Optional, percentage (e.g., 0.5 for 0.5%)
}
```

---

## Summary

### What Changed
✅ Added slippage parameter to `getQuote()` method
✅ Added slippage parameter to `createOrder()` method
✅ Updated quote API to accept and pass slippage
✅ Updated create-order API to accept and pass slippage
✅ Frontend now passes slippage to both quote and order creation
✅ Quote re-fetches automatically when slippage changes

### What This Means
✅ User's slippage setting now **actually affects** the order
✅ `auctionEndAmount` is adjusted based on slippage tolerance
✅ Orders won't fill if price moves beyond slippage tolerance
✅ Better protection against unfavorable fills
✅ More predictable swap outcomes

### Before vs After

**Before**:
- Slippage only used for UI display
- Actual order used SDK's default slippage
- User's setting had no effect on execution

**After**:
- Slippage passed to 1inch SDK
- Order's `auctionEndAmount` adjusted accordingly
- User has full control over slippage tolerance
