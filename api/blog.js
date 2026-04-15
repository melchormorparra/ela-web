const { readData } = require('./utils');

module.exports = (req, res) => {
    const data = readData();
    res.status(200).json(data.blogPosts.filter(p => p.active));
};
