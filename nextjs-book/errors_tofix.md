# Errors to Fix

## High Priority

### 1. Stripe Webhook Not Updating Organization Records
**Issue**: Billing events are created correctly, but the Stripe webhook handlers are not updating the organization table with subscription details.

**Evidence**: 
- Billing events table shows correct subscription tier (e.g., PRO)
- Organization table still has old values (max_seats: 5 instead of 500)
- stripe_subscription_id remains null even after checkout
- No active subscriptions visible in Stripe dashboard despite checkout completion

**Root Cause**: The `handleCheckoutCompleted` function in `/src/app/api/stripe/webhook/route.ts` is likely:
- Not receiving webhook events from Stripe (webhook endpoint may not be configured)
- Failing to update the organization table
- Having metadata/organizationId mismatch issues
- Webhook may not be firing due to Stripe dashboard configuration

**Current Workaround**: Auto-sync on dashboard load using billing events data (implemented)

**Proper Fix Needed**:
1. Verify Stripe webhook endpoint is properly configured in Stripe dashboard
2. Check webhook URL points to correct endpoint: `/api/stripe/webhook`
3. Add detailed logging to webhook handlers
4. Ensure organizationId metadata is correctly passed through checkout
5. Test webhook locally with Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
6. Fix any database update errors in webhook handlers
7. Verify webhook secret is correctly configured

**Files to investigate**:
- `/src/app/api/stripe/webhook/route.ts` - Main webhook handler
- `/src/app/api/stripe/create-checkout-session/route.ts` - Checkout session creation
- Stripe dashboard webhook configuration
- Environment variables: `STRIPE_WEBHOOK_SECRET`

**Test Steps**:
1. Complete a test checkout
2. Check if webhook is called (add logging)
3. Verify organization table gets updated
4. Confirm subscription appears in Stripe dashboard

---

## Medium Priority

### 2. Dark Mode Theme System Removal
**Status**: Mostly completed, but may have residual references

**Files that had theme system removed**:
- ThemeProvider, ThemeScript components
- Dark mode classes throughout org/* pages
- Theme toggle functionality

**Potential issues**: Some components may still reference theme utilities or have leftover dark mode classes.

---

## Low Priority

### 3. Supabase Realtime Warnings
**Issue**: Console shows repeated warnings about websocket-factory dependencies
**Impact**: Non-breaking, but clutters console output
**Fix**: May need to configure Supabase client to disable realtime if not needed

---

## Completed

### ✅ Subscription Tier Simplification
- Reduced from 3 tiers (STARTER/PRO/ENTERPRISE) to 2 tiers (STARTER/PRO)
- Updated pricing: STARTER $29/month (25 seats), PRO $99/month (500 seats)
- Removed all Enterprise references from codebase

### ✅ Auto-sync Implementation
- Added automatic billing event sync on dashboard load
- Prevents users from needing to manually click sync buttons
- Falls back gracefully if sync fails