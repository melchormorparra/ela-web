const { readData } = require('./utils');

module.exports = (req, res) => {
    const data = readData();
    res.status(200).json(data.products.filter(p => p.active));
};
