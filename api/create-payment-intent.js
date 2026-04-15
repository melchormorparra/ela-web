const { readData, saveData } = require('../utils');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    const { amount } = req.body;
    const data = readData();
    
    if (!data.config.stripeSecretKey) {
        return res.status(500).json({ error: 'Stripe no está configurado' });
    }
    
    try {
        const stripe = require('stripe')(data.config.stripeSecretKey);
        
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: 'eur',
            automatic_payment_methods: { enabled: true }
        });
        
        res.status(200).json({ clientSecret: paymentIntent.client_secret });
    } catch (err) {
        console.error('Stripe error:', err);
        res.status(500).json({ error: err.message });
    }
};
