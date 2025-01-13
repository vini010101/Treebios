const express = require('express');
const { db } = require('../data/database');
const router = express.Router();

router.get('/stats', (req, res) => {
  const stats = {};
  
  db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
    stats.totalUsers = row.count;

    const today = new Date().toISOString().split('T')[0];
    db.get(
      'SELECT COUNT(*) as count FROM access_logs WHERE date(accessed_at) = ?',
      [today],
      (err, row) => {
        if (err) {
          return res.status(500).json({ error: 'Erro ao buscar estatísticas' });
        }
        stats.todayAccess = row.count;

        // Get total reports
        db.get('SELECT COUNT(*) as count FROM reports', (err, row) => {
          if (err) {
            return res.status(500).json({ error: 'Erro ao buscar estatísticas' });
          }
          stats.totalReports = row.count;
          res.json(stats);
        });
      }
    );
  });
});

router.get('/access-history', (req, res) => {
  const { days = 7 } = req.query;
  
  db.all(`
    SELECT 
      date(accessed_at) as date,
      COUNT(*) as count
    FROM access_logs
    WHERE accessed_at >= date('now', '-${days} days')
    GROUP BY date(accessed_at)
    ORDER BY date(accessed_at)
  `, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar histórico de acessos' });
    }
    res.json(rows);
  });
});

router.get('/recent-reports', (req, res) => {
  db.all(`
    SELECT 
      r.id,
      r.patient_name,
      r.exam_date,
      u.name as created_by,
      r.created_at
    FROM reports r
    JOIN users u ON r.user_id = u.id
    ORDER BY r.created_at DESC
    LIMIT 10
  `, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar relatórios recentes' });
    }
    res.json(rows);
  });
});

router.post('/', async (req, res) => {
  const { user_id, patient_name, exam_date, results } = req.body;

  if (!user_id || !patient_name || !exam_date || !results) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
  }

  try {
      db.run(
          'INSERT INTO reports (user_id, patient_name, exam_date, results) VALUES (?, ?, ?, ?)',
          [user_id, patient_name, exam_date, results],
          function(err) {
              if (err) {
                  console.error('Erro ao salvar relatório:', err);
                  return res.status(500).json({ error: 'Erro ao salvar relatório' });
              }

              res.status(201).json({
                  id: this.lastID,
                  user_id,
                  patient_name,
                  exam_date,
                  created_at: new Date().toISOString()
              });
          }
      );
  } catch (error) {
      console.error('Erro:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;