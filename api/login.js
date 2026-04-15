const { readData } = require('./utils');

module.exports = (req, res) => {
    if (req.method === 'POST') {
        const { password } = req.body;
        const data = readData();
        if (password === data.admin.password) {
            res.status(200).json({ success: true, token: 'admin-token', user: { id: 0, name: 'Admin', email: data.admin.email, isAdmin: true } });
        } else {
            res.status(401).json({ error: 'Contraseña incorrecta' });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
};
