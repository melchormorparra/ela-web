const { readData, authenticate } = require('../utils');

module.exports = (req, res) => {
    if (!authenticate(req)) {
        return res.status(401).json({ error: 'No autorizado' });
    }
    const data = readData();
    res.status(200).json(data.orders);
};
