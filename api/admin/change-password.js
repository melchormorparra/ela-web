const { readData, saveData, authenticate } = require('../utils');

module.exports = (req, res) => {
    if (!authenticate(req)) {
        return res.status(401).json({ error: 'No autorizado' });
    }
    if (req.method === 'POST') {
        const { newPassword } = req.body;
        const data = readData();
        data.admin.password = newPassword;
        saveData(data);
        res.status(200).json({ success: true });
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
};
