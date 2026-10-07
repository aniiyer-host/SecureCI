const express = require('express');
const app = express();
const port = 3001;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// In-memory demo data
let tasks = [
  { id: 1, title: 'Complete security audit', description: 'Review latest security findings', status: 'completed', assignee: 'john.doe', createdAt: '2026-09-20' },
  { id: 2, title: 'Update employee handbook', description: 'Add new remote work policies', status: 'pending', assignee: 'jane.smith', createdAt: '2026-09-21' },
  { id: 3, title: 'Fix login page vulnerability', description: 'Address potential XSS in login form', status: 'in-progress', assignee: 'bob.wilson', createdAt: '2026-09-22' }
];

let users = [
  { id: 1, name: 'John Doe', email: 'john.doe@company.com', department: 'Engineering', role: 'Developer' },
  { id: 2, name: 'Jane Smith', email: 'jane.smith@company.com', department: 'HR', role: 'Manager' },
  { id: 3, name: 'Bob Wilson', email: 'bob.wilson@company.com', department: 'Security', role: 'Analyst' },
  { id: 4, name: 'Alice Brown', email: 'alice.brown@company.com', department: 'Marketing', role: 'Coordinator' }
];

let profile = {
  id: 1,
  name: 'John Doe',
  email: 'john.doe@company.com',
  department: 'Engineering',
  role: 'Developer',
  employeeId: 'EMP001',
  hireDate: '2023-01-15'
};

// Health endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// API Routes
app.get('/api/tasks', (req, res) => {
  res.json(tasks);
});

app.get('/api/tasks/:id', (req, res) => {
  const task = tasks.find(t => t.id === parseInt(req.params.id));
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

app.post('/api/tasks', (req, res) => {
  const { title, description, assignee } = req.body;
  if (!title || !description || !assignee) {
    return res.status(400).json({ error: 'Title, description, and assignee are required' });
  }

  const newTask = {
    id: tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1,
    title,
    description,
    status: 'pending',
    assignee,
    createdAt: new Date().toISOString().split('T')[0]
  };

  tasks.push(newTask);
  res.status(201).json(newTask);
});

app.put('/api/tasks/:id', (req, res) => {
  const task = tasks.find(t => t.id === parseInt(req.params.id));
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const { title, description, status, assignee } = req.body;
  if (title !== undefined) task.title = title;
  if (description !== undefined) task.description = description;
  if (status !== undefined) task.status = status;
  if (assignee !== undefined) task.assignee = assignee;

  res.json(task);
});

app.delete('/api/tasks/:id', (req, res) => {
  const index = tasks.findIndex(t => t.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Task not found' });

  tasks.splice(index, 1);
  res.json({ message: 'Task deleted successfully' });
});

app.get('/api/users', (req, res) => {
  res.json(users);
});

app.get('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

app.get('/api/profile', (req, res) => {
  res.json(profile);
});

app.put('/api/profile', (req, res) => {
  const { name, email, department } = req.body;
  if (name) profile.name = name;
  if (email) profile.email = email;
  if (department) profile.department = department;

  res.json(profile);
});

app.get('/api/search', (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Query parameter q is required' });

  const results = {
    tasks: tasks.filter(t =>
      t.title.toLowerCase().includes(q.toLowerCase()) ||
      t.description.toLowerCase().includes(q.toLowerCase())
    ),
    users: users.filter(u =>
      u.name.toLowerCase().includes(q.toLowerCase()) ||
      u.email.toLowerCase().includes(q.toLowerCase()) ||
      u.department.toLowerCase().includes(q.toLowerCase())
    )
  };

  res.json(results);
});

// Serve HTML pages
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/dashboard', (req, res) => {
  res.sendFile(__dirname + '/public/dashboard.html');
});

app.get('/tasks', (req, res) => {
  res.sendFile(__dirname + '/public/tasks.html');
});

app.get('/users', (req, res) => {
  res.sendFile(__dirname + '/public/users.html');
});

app.get('/profile', (req, res) => {
  res.sendFile(__dirname + '/public/profile.html');
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`Target application listening at http://0.0.0.0:${port}`);
});

module.exports = app;