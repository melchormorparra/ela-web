const { readData, saveData, authenticate } = require('../utils');

module.exports = (req, res) => {
    if (!authenticate(req)) {
        return res.status(401).json({ error: 'No autorizado' });
    }
    
    if (req.method === 'GET') {
        const data = readData();
        return res.status(200).json(data.products);
    }
    
    if (req.method === 'POST') {
        const data = readData();
        const product = { ...req.body, id: req.body.id || Date.now() };
        const index = data.products.findIndex(p => p.id === product.id);
        if (index >= 0) {
            data.products[index] = product;
        } else {
            data.products.push(product);
        }
        saveData(data);
        return res.status(200).json({ success: true, product });
    }
    
    res.status(405).json({ error: 'Method not allowed' });
};
