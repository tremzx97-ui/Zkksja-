const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// --- Funções auxiliares para arquivos JSON ---
function readJSON(file) {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJSON(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// --- Rotas ---

// Login Admin
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const users = readJSON('./users.json');
    const user = users.find(u => u.username === username && u.password === password);
    if (user) return res.json({ success: true, role: user.role });
    res.json({ success: false, message: 'Credenciais inválidas' });
});

// Gerar Key
app.post('/generate-key', (req, res) => {
    const { expirationDays } = req.body;
    const keys = readJSON('./keys.json');
    const newKey = {
        id: uuidv4(),
        key: uuidv4().split('-')[0].toUpperCase(),
        hwid: null,
        createdAt: Date.now(),
        expiresAt: Date.now() + (expirationDays * 24 * 60 * 60 * 1000),
        banned: false
    };
    keys.push(newKey);
    writeJSON('./keys.json', keys);
    res.json({ success: true, key: newKey });
});

// Excluir Key
app.post('/delete-key', (req, res) => {
    const { key } = req.body;
    let keys = readJSON('./keys.json');
    keys = keys.filter(k => k.key !== key);
    writeJSON('./keys.json', keys);
    res.json({ success: true });
});

// Reset HWID
app.post('/reset-hwid', (req, res) => {
    const { key } = req.body;
    const keys = readJSON('./keys.json');
    const k = keys.find(k => k.key === key);
    if (!k) return res.json({ success: false, message: 'Key não encontrada' });
    k.hwid = null;
    writeJSON('./keys.json', keys);
    res.json({ success: true });
});

// Ban / Desban
app.post('/ban-key', (req, res) => {
    const { key, ban } = req.body; // ban = true/false
    const keys = readJSON('./keys.json');
    const k = keys.find(k => k.key === key);
    if (!k) return res.json({ success: false, message: 'Key não encontrada' });
    k.banned = ban;
    writeJSON('./keys.json', keys);
    res.json({ success: true });
});

// Listar keys
app.get('/keys', (req, res) => {
    const keys = readJSON('./keys.json');
    res.json(keys);
});

// Logs
app.post('/log', (req, res) => {
    const { action, admin } = req.body;
    const logs = readJSON('./logs.json');
    logs.push({ action, admin, timestamp: Date.now() });
    writeJSON('./logs.json', logs);
    res.json({ success: true });
});

// Painel estatísticas simples
app.get('/stats', (req, res) => {
    const keys = readJSON('./keys.json');
    const totalKeys = keys.length;
    const bannedKeys = keys.filter(k => k.banned).length;
    res.json({ totalKeys, bannedKeys });
});

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));