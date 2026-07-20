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
app.post('/api/resources', (req, res) => {
  const { source_ip, destination_ip, event_type, severity, status, description } = req.body;

  if (!source_ip || !event_type) {
    return res.status(400).json({ error: 'Fields "source_ip" and "event_type" are required' });
  }

  const newLog = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    source_ip,
    destination_ip: destination_ip || null,
    event_type,
    severity: severity || 'low',
    status: status || 'open',
    description: description || ''
  };

  logs.push(newLog);
  res.status(201).json(newLog);
});

app.put('/api/resources/:id', (req, res) => {
  const log = logs.find(l => l.id === req.params.id);
  if (!log) {
    return res.status(404).json({ error: `No resource found with id ${req.params.id}` });
  }

  const { source_ip, destination_ip, event_type, severity, status, description } = req.body;
  if (source_ip !== undefined) log.source_ip = source_ip;
  if (destination_ip !== undefined) log.destination_ip = destination_ip;
  if (event_type !== undefined) log.event_type = event_type;
  if (severity !== undefined) log.severity = severity;
  if (status !== undefined) log.status = status;
  if (description !== undefined) log.description = description;

  res.status(200).json(log);
});

app.delete('/api/resources/:id', (req, res) => {
  const index = logs.findIndex(l => l.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: `No resource found with id ${req.params.id}` });
  }

  const [deleted] = logs.splice(index, 1);
  res.status(200).json({ message: 'Resource deleted', resource: deleted });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`SIEM Event Log API running on http://localhost:${PORT}`);
});