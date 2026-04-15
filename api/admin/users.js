const { readData, authenticate } = require('../utils');

module.exports = (req, res) => {
    if (!authenticate(req)) {
        return res.status(401).json({ error: 'No autorizado' });
    }
    const data = readData();
    const usersWithoutPasswords = data.users.map(u => {
        const { password, ...user } = u;
        return user;
    });
    res.status(200).json(usersWithoutPasswords);
};
