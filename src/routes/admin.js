const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const { Verification, User, Transaction, Subscription } = require('../models');

// middleware: must be admin
async function requireAdmin(req, res, next) {
  await authenticate(req, res, async () => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'admin only' });
    next();
  });
}

router.get('/verifications', requireAdmin, async (req, res) => {
  const v = await Verification.findAll({ order: [['createdAt','DESC']] });
  res.json(v);
});

router.post('/verifications/:id/approve', requireAdmin, async (req, res) => {
  const v = await Verification.findByPk(req.params.id);
  if (!v) return res.status(404).json({ error: 'not found' });
  v.result = 'verified';
  await v.save();
  const user = await User.findByPk(v.userId);
  if (user) {
    user.verified = true;
    user.verificationStatus = 'verified';
    await user.save();
  }
  res.json({ ok: true, v });
});

router.post('/verifications/:id/reject', requireAdmin, async (req, res) => {
  const v = await Verification.findByPk(req.params.id);
  if (!v) return res.status(404).json({ error: 'not found' });
  v.result = 'failed';
  await v.save();
  const user = await User.findByPk(v.userId);
  if (user) {
    user.verified = false;
    user.verificationStatus = 'failed';
    await user.save();
  }
  res.json({ ok: true, v });
});

router.get('/transactions', requireAdmin, async (req, res) => {
  const tx = await Transaction.findAll({ order: [['createdAt','DESC']] });
  res.json(tx);
});

module.exports = router;

