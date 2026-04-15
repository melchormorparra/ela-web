const { readData, saveData, authenticate } = require('../utils');

module.exports = (req, res) => {
    if (!authenticate(req)) {
        return res.status(401).json({ error: 'No autorizado' });
    }
    
    if (req.method === 'GET') {
        const data = readData();
        return res.status(200).json(data.blogPosts);
    }
    
    if (req.method === 'POST') {
        const data = readData();
        const post = { ...req.body, id: req.body.id || Date.now() };
        const index = data.blogPosts.findIndex(p => p.id === post.id);
        if (index >= 0) {
            data.blogPosts[index] = post;
        } else {
            data.blogPosts.push(post);
        }
        saveData(data);
        return res.status(200).json({ success: true, post });
    }
    
    res.status(405).json({ error: 'Method not allowed' });
};
