const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('./')); // Tudo na mesma pasta

const usersFile = path.join(__dirname, 'users.json');

// Funções auxiliares
function readJSON(file) {
    if(!fs.existsSync(file)) return [];
    return JSON.parse(fs.readFileSync(file));
}

function writeJSON(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function generateKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let key = '';
    for(let i=0;i<16;i++) key += chars.charAt(Math.floor(Math.random()*chars.length));
    return key;
}

// Rotas HTML
app.get('/', (req,res)=>{
    res.sendFile(path.join(__dirname,'index.html'));
});

// Rotas Admin
app.post('/admin/generate-key', (req,res)=>{
    const { username, days } = req.body;
    const users = readJSON(usersFile);
    const user = { username, key: generateKey(), hwid: null, banned:false, expires: Date.now() + (days*24*60*60*1000) };
    users.push(user);
    writeJSON(usersFile, users);
    res.json({success:true, user});
});

app.post('/admin/delete-key', (req,res)=>{
    const { username } = req.body;
    let users = readJSON(usersFile);
    users = users.filter(u=> u.username !== username);
    writeJSON(usersFile, users);
    res.json({success:true, message:'Key deletada'});
});

app.get('/admin/stats', (req,res)=>{
    const users = readJSON(usersFile);
    res.json({count: users.length, users});
});

app.get('/admin/logs', (req,res)=>{
    // Para simplificar, logs = users.json
    const users = readJSON(usersFile);
    res.json(users);
});

app.post('/admin/reset-hwid', (req, res) => {
    const { username } = req.body;
    const users = readJSON(usersFile);
    const user = users.find(u => u.username === username);
    if(!user) return res.status(404).json({success:false, message:'Usuário não encontrado'});
    user.hwid = null;
    writeJSON(usersFile, users);
    res.json({success:true, message:`HWID de ${username} resetado`});
});

app.post('/admin/ban', (req, res) => {
    const { username } = req.body;
    const users = readJSON(usersFile);
    const user = users.find(u => u.username === username);
    if(!user) return res.status(404).json({success:false, message:'Usuário não encontrado'});
    user.banned = true;
    writeJSON(usersFile, users);
    res.json({success:true, message:`Usuário ${username} banido`});
});

// Rota mod
app.post('/bind-hwid', (req,res)=>{
    const { username, hwid } = req.body;
    const users = readJSON(usersFile);
    const user = users.find(u=> u.username === username);
    if(!user) return res.status(404).json({success:false, message:'Usuário não encontrado'});
    if(user.banned) return res.status(403).json({success:false, message:'Usuário banido'});
    user.hwid = hwid;
    writeJSON(usersFile, users);
    res.json({success:true, message:`HWID vinculado a ${username}`});
});

app.post('/check-key', (req,res)=>{
    const { username, key, hwid } = req.body;
    const users = readJSON(usersFile);
    const user = users.find(u=> u.username === username && u.key === key);
    if(!user) return res.status(403).json({success:false, message:'Key inválida'});
    if(user.banned) return res.status(403).json({success:false, message:'Usuário banido'});
    if(user.hwid && user.hwid !== hwid) return res.status(403).json({success:false, message:'HWID incorreto'});
    if(Date.now() > user.expires) return res.status(403).json({success:false, message:'Licença expirada'});
    res.json({success:true, message:'Key válida'});
});

app.listen(PORT, ()=> console.log(`Server rodando na porta ${PORT}`));
