const express = require('express');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

//Hard coded logs
let logs = [
  {
    id: crypto.randomUUID(),
    timestamp: '2026-07-10T14:22:31.000Z',
    source_ip: '203.0.113.45',
    destination_ip: '10.0.1.12',
    event_type: 'brute_force',
    severity: 'high',
    status: 'open',
    description: '12 failed SSH login attempts within 60 seconds'
  },
  {
    id: crypto.randomUUID(),
    timestamp: '2026-07-10T15:03:07.000Z',
    source_ip: '198.51.100.9',
    destination_ip: '10.0.1.4',
    event_type: 'port_scan',
    severity: 'medium',
    status: 'investigating',
    description: 'Sequential TCP SYN scan across ports 1-1024'
  },
  {
    id: crypto.randomUUID(),
    timestamp: '2026-07-10T16:47:52.000Z',
    source_ip: '192.0.2.77',
    destination_ip: '10.0.1.30',
    event_type: 'malware_detected',
    severity: 'critical',
    status: 'resolved',
    description: 'Trojan signature match on uploaded file, quarantined'
  }
];

app.use(express.json());

app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
});

app.get('/api/resources', (req, res) => {
  res.status(200).json(logs);
});

app.get('/api/resources/:id', (req, res) => {
  const log = logs.find(l => l.id === req.params.id);
  if (!log) {
    return res.status(404).json({ error: `No resource found with id ${req.params.id}` });
  }
  res.status(200).json(log);
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