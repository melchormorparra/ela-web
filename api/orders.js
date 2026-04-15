const { readData, saveData } = require('./utils');

module.exports = (req, res) => {
    if (req.method === 'POST') {
        const data = readData();
        const order = { ...req.body, id: Date.now(), date: new Date().toISOString() };
        data.orders.push(order);
        saveData(data);
        res.status(200).json({ success: true, order });
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
};
