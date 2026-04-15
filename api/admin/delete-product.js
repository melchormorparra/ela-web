const { readData, saveData } = require('../utils');

module.exports = (req, res) => {
    const id = parseInt(req.query.id);
    const data = readData();
    data.products = data.products.filter(p => p.id !== id);
    saveData(data);
    res.status(200).json({ success: true });
};
