const { readData, hashPassword } = require('./utils');

module.exports = (req, res) => {
    if (req.method === 'POST') {
        const { email, password } = req.body;
        const data = readData();
        
        const user = data.users.find(u => u.email === email && u.password === hashPassword(password));
        
        if (user) {
            const { password: _, ...userWithoutPassword } = user;
            res.status(200).json({ success: true, user: userWithoutPassword });
        } else {
            res.status(401).json({ error: 'Email o contraseña incorrectos' });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
};
