const express = require('express');
const { db } = require('../data/database');
const router = express.Router();
const bcrypt = require('bcrypt');

router.get('/', (req, res) => {
  db.all(
    `SELECT u.id, u.name, u.email, u.type,
            (SELECT accessed_at 
             FROM access_logs 
             WHERE user_id = u.id 
             ORDER BY accessed_at DESC 
             LIMIT 1) as last_access
     FROM users u`,
    (err, users) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao buscar usuários' });
      }
      res.json(users);
    }
  );
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  db.get(
    'SELECT id, name, email, type, created_at FROM users WHERE id = ?',
    [id],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao buscar usuário' });
      }
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }
      res.json(user);
    }
  );
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, email, type } = req.body;

  db.run(
    'UPDATE users SET name = ?, email = ?, type = ? WHERE id = ?',
    [name, email, type, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Erro ao atualizar usuário' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }
      res.json({ id, name, email, type });
    }
  );
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Erro ao excluir usuário' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    res.json({ message: 'Usuário excluído com sucesso' });
  });
});

router.post('/', async (req, res) => {
    const { name, email, password, type = 'user' } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ 
            error: 'Nome, email e senha são obrigatórios' 
        });
    }

    try {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        db.get('SELECT id FROM users WHERE email = ?', [email], (err, user) => {
            if (err) {
                console.error('Erro na consulta:', err);
                return res.status(500).json({ error: 'Erro interno do servidor' });
            }

            if (user) {
                return res.status(400).json({ error: 'Email já cadastrado' });
            }

            db.run(
                'INSERT INTO users (name, email, password, type) VALUES (?, ?, ?, ?)',
                [name, email, hashedPassword, type],
                function(err) {
                    if (err) {
                        console.error('Erro ao inserir:', err);
                        return res.status(500).json({ error: 'Erro ao criar usuário' });
                    }

                    res.status(201).json({
                        id: this.lastID,
                        name,
                        email,
                        type
                    });
                }
            );
        });
    } catch (error) {
        console.error('Erro:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

module.exports = router;