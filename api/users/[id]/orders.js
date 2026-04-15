const { readData, authenticate } = require('../../utils');

module.exports = (req, res) => {
    const userId = parseInt(req.query.userId);
    if (!userId) {
        return res.status(400).json({ error: 'User ID required' });
    }
    const data = readData();
    const userOrders = data.orders.filter(o => o.userId === userId);
    res.status(200).json(userOrders);
};
