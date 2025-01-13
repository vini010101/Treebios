const express = require('express');
const bcrypt = require('bcrypt');
const { db } = require('../data/database');
const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    db.run('INSERT INTO access_logs (user_id) VALUES (?)', [user.id]);

    const { password: _, ...userData } = user;
    res.json(userData);
  });
});

module.exports = router;