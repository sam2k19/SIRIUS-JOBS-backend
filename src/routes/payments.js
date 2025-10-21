const express = require('express');
const router = express.Router();
const { Transaction, Subscription, User } = require('../models');
const authenticate = require('../middleware/authenticate');
const bodyParser = require('body-parser');

// endpoint to create a subscription intent (frontend should call payment gateway)
router.post('/subscribe', authenticate, async (req, res) => {
  const { plan } = req.body; // '1m' | '6m' | '12m'
  const pricing = { '1m': 1000, '6m': 6000, '12m': 10000 };
  const amount = pricing[plan];
  if (!amount) return res.status(400).json({ error: 'invalid plan' });
  // create pending subscription record
  const sub = await Subscription.create({ userId: req.user.id, plan, amount, status: 'pending' });
  // Return info for frontend to call Paystack/Flutterwave
  res.json({ subscriptionId: sub.id, amount });
});

// webhook endpoint (Paystack/Flutterwave) — add this URL to payment gateway dashboard
router.post('/webhook', bodyParser.raw({ type: '*/*' }), async (req, res) => {
  // NOTE: In a real implementation, check signature header from gateway to verify.
  // Here we parse JSON and update transactions/subscriptions.
  try {
    let payload;
    try { payload = JSON.parse(req.body.toString()); } catch(e) { payload = req.body; }

    // adapt to gateway payload. This is a minimal example for Paystack.
    // Example (Paystack): payload.data.reference, payload.data.amount, payload.event = 'charge.success'
    if (payload.event === 'charge.success' || (payload.data && payload.status === 'success') || payload.event === 'transaction.success') {
      const ref = payload.data ? payload.data.reference : (payload.reference || null);
      const amount = payload.data ? payload.data.amount : (payload.amount || 0);
      // find pending transaction and subscription by reference if you stored it.
      // For simplicity, mark any pending subscription for user as active if amount matches.
      // This is stub logic — adapt to your flow.
      // Example: find subscription by .reference or provided metadata
      // For now, we respond ok.
      console.log('Payment webhook received', payload.event || payload);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('webhook error', err);
    res.status(500).json({ ok: false });
  }
});

module.exports = router;

