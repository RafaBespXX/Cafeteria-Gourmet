const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const saltRounds = 10;

// Registrar novo cliente
exports.register = async (req, res) => {
  // O frontend envia nome, email, senha, endereco
  const { nome, email, senha, endereco } = req.body; 
  try {
    const [rows] = await pool.query('SELECT id_cliente FROM Cliente WHERE email = ?', [email]);
    if (rows.length) return res.status(400).json({ message: 'E-mail já cadastrado' });

    const hashed = await bcrypt.hash(senha, saltRounds);
    
    // Certifique-se de que a query e os parâmetros correspondem à sua tabela 'Cliente'
    const [result] = await pool.query(
      'INSERT INTO Cliente (nome, email, senha, endereco) VALUES (?,?,?,?)',
      [nome, email, hashed, endereco] 
    );
    
    res.status(201).json({ id_cliente: result.insertId, nome, email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro no registro' });
  }
};

// Login de cliente (Versão Estável)
exports.login = async (req, res) => {
  const { email, senha } = req.body;
  try {
    const [rows] = await pool.query('SELECT * FROM Cliente WHERE email = ?', [email]);
    if (!rows.length) return res.status(400).json({ message: 'Credenciais inválidas' });
    const user = rows[0];
    const match = await bcrypt.compare(senha, user.senha);
    if (!match) return res.status(400).json({ message: 'Credenciais inválidas' });

    // Versão Estável: Apenas id_cliente no token
    const token = jwt.sign(
      { id_cliente: user.id_cliente }, 
      process.env.JWT_SECRET || 'secretkey',
      { expiresIn: '1h' }
    );

    // Versão Estável: Apenas o token na resposta
    res.json({ token }); 
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro no login' });
  }
};

// Login de administrador
exports.adminLogin = async (req, res) => {
  const { email, senha } = req.body;
  try {
    const [rows] = await pool.query('SELECT * FROM Admin WHERE email = ?', [email]);
    if (!rows.length) return res.status(400).json({ message: 'Credenciais inválidas' });
    const admin = rows[0];
    const match = await bcrypt.compare(senha, admin.senha);
    if (!match) return res.status(400).json({ message: 'Credenciais inválidas' });

    const token = jwt.sign(
      { id_admin: admin.id_admin, is_admin: true },
      process.env.JWT_SECRET || 'secretkey',
      { expiresIn: '1h' }
    );

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro no login de administrador' });
  }
};