const { readData } = require('./utils');

module.exports = (req, res) => {
    const data = readData();
    const config = { ...data.config };
    delete config.stripeSecretKey;
    res.status(200).json(config);
};
