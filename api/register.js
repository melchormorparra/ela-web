const { readData, saveData, hashPassword } = require('./utils');

module.exports = (req, res) => {
    if (req.method === 'POST') {
        const { name, email, password, phone } = req.body;
        const data = readData();
        
        if (data.users.find(u => u.email === email)) {
            return res.status(400).json({ error: 'Este email ya está registrado' });
        }
        
        const user = {
            id: Date.now(),
            name,
            email,
            password: hashPassword(password),
            phone: phone || '',
            createdAt: new Date().toISOString()
        };
        
        data.users.push(user);
        saveData(data);
        
        const { password: _, ...userWithoutPassword } = user;
        res.status(200).json({ success: true, user: userWithoutPassword });
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
};
