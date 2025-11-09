const pool = require('../config/db');

exports.list = async (req, res) => {
  try {
    // Listagem para o cliente (só ativos)
    const [rows] = await pool.query('SELECT * FROM Produto WHERE ativo = TRUE');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao listar produtos' });
  }
};

exports.get = async (req, res) => {
  const id = req.params.id;
  try {
    const [rows] = await pool.query('SELECT * FROM Produto WHERE id_produto = ?', [id]);
    if (!rows.length) return res.status(404).json({ message: 'Produto não encontrado' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao buscar produto' });
  }
};

exports.create = async (req, res) => {
  const { nome, descricao, preco, estoque } = req.body;
  try {
    await pool.query('INSERT INTO Produto (nome, descricao, preco, estoque) VALUES (?,?,?,?)',
      [nome, descricao, preco, estoque]);
    res.status(201).json({ message: 'Produto criado!' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao criar produto' });
  }
};

exports.update = async (req, res) => {
  const id = req.params.id;
  // Este controlador espera todos os campos para evitar que campos não enviados sejam setados como NULL
  const { nome, descricao, preco, estoque, ativo } = req.body; 
  try {
    await pool.query(
      'UPDATE Produto SET nome=?, descricao=?, preco=?, estoque=?, ativo=? WHERE id_produto=?',
      [nome, descricao, preco, estoque, ativo, id]
    );
    res.json({ message: 'Produto atualizado!' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao alterar produto' });
  }
};

// NOVO: Função para Excluir
exports.delete = async (req, res) => {
  const id = req.params.id;
  try {
    await pool.query('DELETE FROM Produto WHERE id_produto = ?', [id]);
    res.json({ message: 'Produto excluído!' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao excluir produto' });
  }
};