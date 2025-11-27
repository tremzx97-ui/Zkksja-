const express = require('express');
const cors = require('cors');
const fs = require('fs');
const app = express();

app.use(cors());
app.use(express.json());

// Banco simples em JSON
let users = JSON.parse(fs.readFileSync('users.json', 'utf-8'));

// Rota login
app.post('/login', (req, res) => {
    const { user, key } = req.body;

    const found = users.find(u => u.user === user && u.key === key);

    if (found) {
        res.json({ success: true, message: "Login autorizado!" });
    } else {
        res.json({ success: false, message: "Usuário ou key inválida!" });
    }
});

// Rota para listar usuários (exemplo)
app.get('/users', (req, res) => {
    res.json(users);
});

// Rota para gerar key
app.post('/generate', (req, res) => {
    const { user } = req.body;
    const newKey = Math.random().toString(36).substring(2, 10).toUpperCase();
    users.push({ user, key: newKey });
    fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
    res.json({ success: true, key: newKey });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
