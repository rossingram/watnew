# Stripe Setup Guide

Watnew uses Stripe for subscription billing at $99/month. Follow these steps to set up payments.

## 1. Create a Stripe Account

1. Sign up at https://stripe.com
2. Complete account verification
3. Access the Dashboard

## 2. Get Your API Keys

1. Go to **Developers** → **API keys** in Stripe Dashboard
2. Copy your **Publishable key** (starts with `pk_test_` or `pk_live_`)
3. Copy your **Secret key** (starts with `sk_test_` or `sk_live_`)
4. Add them to `server/.env`:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

## 3. Set Up Webhooks

Webhooks allow Stripe to notify your server about subscription events (payments, cancellations, etc.).

### For Local Development:

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login: `stripe login`
3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:5001/api/webhooks/stripe
   ```
4. Copy the webhook signing secret (starts with `whsec_`) and add to `.env`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### For Production:

1. Go to **Developers** → **Webhooks** in Stripe Dashboard
2. Click **Add endpoint**
3. Endpoint URL: `https://your-domain.com/api/webhooks/stripe`
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the **Signing secret** and add to your production `.env`

## 4. Test the Integration

1. Use Stripe test cards: https://stripe.com/docs/testing
2. Test card: `4242 4242 4242 4242`
3. Any future expiry date, any CVC
4. Test the full flow: signup → checkout → subscription activation

## 5. Go Live

When ready for production:
1. Switch to **Live mode** in Stripe Dashboard
2. Get your live API keys
3. Update `.env` with live keys
4. Set up production webhook endpoint
5. Test with real payment methods

## Important Notes

- **Test mode**: Use test keys (`sk_test_`, `pk_test_`) for development
- **Webhook security**: Always verify webhook signatures using `STRIPE_WEBHOOK_SECRET`
- **Subscription price**: Currently set to $99/month (9900 cents) in the code
- **Billing portal**: Users can manage subscriptions through Stripe's hosted billing portal

## Troubleshooting

- **Webhook not working**: Check that the webhook secret matches and the endpoint is accessible
- **Subscription not activating**: Check server logs for webhook processing errors
- **Payment fails**: Verify Stripe keys are correct and account is activated