const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');

const app = express();
const PORT = 3000;

// Configurações iniciais
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
  secret: 'chave-secreta',
  resave: false,
  saveUninitialized: true
}));

// Página de login
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// Login
app.post('/login', (req, res) => {
  console.log('Tentativa de login recebida');
  const { email, senha } = req.body;

  const usersPath = path.join(__dirname, 'data', 'users.json');
  if (!fs.existsSync(usersPath)) return res.send('Arquivo de usuários não encontrado.');

  const users = JSON.parse(fs.readFileSync(usersPath));
  const usuario = users.find(u => u.email === email && u.senha === senha);

  if (usuario) {
    req.session.usuario = usuario;
    if (usuario.tipo === 'admin') {
      res.redirect('/admin');
    } else {
      res.redirect('/usuario');
    }
  } else {
    res.send('Usuário ou senha inválidos');
  }
});

// Painel admin
app.get('/admin', (req, res) => {
  if (req.session.usuario && req.session.usuario.tipo === 'admin') {
    res.send(`
      <h2>Bem-vindo, Admin!</h2>
      <ul>
        <li><a href="/admin/usuarios/cadastrar">Cadastrar novo usuário</a></li>
        <li><a href="/admin/equipamentos/cadastrar">Cadastrar equipamento</a></li>
      </ul>
      <a href="/logout">Sair</a>
    `);
  } else {
    res.redirect('/');
  }
});

// Página usuário comum
app.get('/usuario', (req, res) => {
  if (req.session.usuario && req.session.usuario.tipo === 'usuario') {
    res.send('<h2>Bem-vindo, Usuário!</h2><a href="/logout">Sair</a>');
  } else {
    res.redirect('/');
  }
});

// Formulário de cadastro de usuário (apenas admin)
app.get('/admin/usuarios/cadastrar', (req, res) => {
  if (req.session.usuario && req.session.usuario.tipo === 'admin') {
    res.sendFile(path.join(__dirname, 'views', 'cadastrar_usuario.html'));
  } else {
    res.redirect('/');
  }
});

// Cadastro de novo usuário
app.post('/admin/usuarios/cadastrar', (req, res) => {
  if (req.session.usuario && req.session.usuario.tipo === 'admin') {
    const { nome, email, senha, tipo } = req.body;

    const usersPath = path.join(__dirname, 'data', 'users.json');
    const users = fs.existsSync(usersPath) ? JSON.parse(fs.readFileSync(usersPath)) : [];

    const emailExiste = users.find(u => u.email === email);
    if (emailExiste) {
      return res.send('<h3>Este e-mail já está cadastrado.</h3><a href="/admin/usuarios/cadastrar">Voltar</a>');
    }

    users.push({ nome, email, senha, tipo });
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
    res.send('<h3>Usuário cadastrado com sucesso!</h3><a href="/admin">Voltar ao painel</a>');
  } else {
    res.redirect('/');
  }
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

app.get('/admin/equipamentos/cadastrar', (req, res) => {
  if (req.session.usuario && req.session.usuario.tipo === 'admin') {
    res.sendFile(path.join(__dirname, 'views', 'cadastrar_equipamento.html'));
  } else {
    res.redirect('/');
  }
});
app.post('/admin/equipamentos/cadastrar', (req, res) => {
  if (req.session.usuario && req.session.usuario.tipo === 'admin') {
    const { nome, categoria, descricao, quantidade } = req.body;

    const equipamentosPath = path.join(__dirname, 'data', 'equipamentos.json');
    const equipamentos = fs.existsSync(equipamentosPath) ? JSON.parse(fs.readFileSync(equipamentosPath)) : [];

    // Cria um objeto de equipamento
    const novoEquipamento = {
      id: Date.now(),
      nome,
      categoria,
      descricao,
      quantidade: parseInt(quantidade),
      disponivel: parseInt(quantidade)
    };

    equipamentos.push(novoEquipamento);
    fs.writeFileSync(equipamentosPath, JSON.stringify(equipamentos, null, 2));
    res.send('<h3>Equipamento cadastrado com sucesso!</h3><a href="/admin">Voltar ao painel</a>');
  } else {
    res.redirect('/');
  }
});
