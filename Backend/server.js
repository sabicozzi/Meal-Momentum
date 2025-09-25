require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const planRoutes = require('./routes/planRoutes');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

// Routes
app.use('/api/plans', planRoutes);

// Stripe checkout
app.post('/api/create-checkout-session', async (req, res) => {
  const { plan } = req.body;
  const prices = { monthly: 999, "3-month": 2500, "6-month": 4599, "12-month": 8000 };

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'gbp',
          product_data: { name: `Meal Momentum - ${plan}` },
          unit_amount: prices[plan]
        },
        quantity: 1
      }],
      mode: 'payment',
      success_url: 'https://yourfrontend.vercel.app/success',
      cancel_url: 'https://yourfrontend.vercel.app/cancel'
    });
    res.json({ id: session.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
