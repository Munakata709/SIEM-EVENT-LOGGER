const express = require('express');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
});

app.get('/api/items', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM items ORDER BY timestamp');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/items/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM items WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: `No item found with id ${req.params.id}` });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});
app.post('/api/items', async (req, res) => {
  const { source_ip, destination_ip, event_type, severity, status, description } = req.body;

  if (!source_ip || !event_type) {
    return res.status(400).json({ error: 'Fields "source_ip" and "event_type" are required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO items (source_ip, destination_ip, event_type, severity, status, description)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        source_ip,
        destination_ip || null,
        event_type,
        severity || 'low',
        status || 'open',
        description || ''
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});



app.put('/api/items/:id', async (req, res) => {
  try {
    const existing = await pool.query('SELECT * FROM items WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: `No item found with id ${req.params.id}` });
    }

    const current = existing.rows[0];
    const { source_ip, destination_ip, event_type, severity, status, description } = req.body;

    const updated = {
      source_ip: source_ip !== undefined ? source_ip : current.source_ip,
      destination_ip: destination_ip !== undefined ? destination_ip : current.destination_ip,
      event_type: event_type !== undefined ? event_type : current.event_type,
      severity: severity !== undefined ? severity : current.severity,
      status: status !== undefined ? status : current.status,
      description: description !== undefined ? description : current.description
    };

    const result = await pool.query(
      `UPDATE items
       SET source_ip = $1, destination_ip = $2, event_type = $3, severity = $4, status = $5, description = $6
       WHERE id = $7
       RETURNING *`,
      [updated.source_ip, updated.destination_ip, updated.event_type, updated.severity, updated.status, updated.description, req.params.id]
    );

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.delete('/api/items/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM items WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: `No item found with id ${req.params.id}` });
    }
    res.status(200).json({ message: 'Item deleted', item: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`SIEM Event Log API running on http://localhost:${PORT}`);
});