const pool = require('../config/db');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  const { email, senha } = req.body;

  try {
    const [rows] = await pool.query(
      'SELECT * FROM Administrador WHERE email = ?',
      [email]
    );

    if (!rows.length) {
      return res.status(400).json({ message: 'Administrador não encontrado' });
    }

    const admin = rows[0];

    // SENHA SEM BCRYPT ✅
    if (senha !== admin.senha) {
      return res.status(400).json({ message: 'Senha incorreta' });
    }

    const token = jwt.sign(
      {
        id_admin: admin.id_admin,
        email: admin.email,
        role: 'admin'
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.json({
      token,
      user: {
        nome: admin.nome,
        email: admin.email,
        role: 'admin'
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro ao realizar login administrador' });
  }
};
