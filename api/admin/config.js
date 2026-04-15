const { readData, saveData, authenticate } = require('../utils');

module.exports = (req, res) => {
    if (!authenticate(req)) {
        return res.status(401).json({ error: 'No autorizado' });
    }
    
    if (req.method === 'GET') {
        const data = readData();
        return res.status(200).json(data.config);
    }
    
    if (req.method === 'POST') {
        const data = readData();
        data.config = { ...data.config, ...req.body };
        saveData(data);
        return res.status(200).json({ success: true, config: data.config });
    }
    
    res.status(405).json({ error: 'Method not allowed' });
};
