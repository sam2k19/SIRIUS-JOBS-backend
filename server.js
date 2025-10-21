require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initModels, sequelize } = require('./src/models');
const authRoutes = require('./src/routes/auth');
const jobRoutes = require('./src/routes/jobs');
const app = express();
const path = require('path');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// serve uploaded files in development
app.use('/uploads', express.static(path.join(__dirname, process.env.UPLOAD_DIR || 'uploads')));

// mount routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);

// webhook endpoint for payments (Paystack/Flutterwave)
const paymentRoutes = require('./src/routes/payments');
app.use('/api/payments', paymentRoutes);

// admin & verification
const adminRoutes = require('./src/routes/admin');
app.use('/api/admin', adminRoutes);

// health check
app.get('/health', (req, res) => res.json({ ok: true }));

// start
const PORT = process.env.PORT || 4000;
initModels().then(() => {
  app.listen(PORT, () => {
    console.log(`Sirius backend running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to init DB', err);
});

