const pool = require('../config/db');

exports.createOrder = async (req, res) => {
  // body: { items: [{id_produto, quantidade}], endereco, metodoPagamento }
  const { items, endereco, metodoPagamento } = req.body;
  const id_cliente = req.user.id_cliente;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // calculate total and check stock
    let total = 0.0;
    for (const it of items) {
      const [prodRows] = await conn.query('SELECT preco, estoque, nome FROM Produto WHERE id_produto = ?', [it.id_produto]);
      if (!prodRows.length) throw new Error(`Produto ${it.id_produto} não encontrado`);
      const prod = prodRows[0];
      if (prod.estoque < it.quantidade) throw new Error(`Estoque insuficiente para ${prod.nome}`);
      total += parseFloat(prod.preco) * it.quantidade;
    }

    const [orderRes] = await conn.query('INSERT INTO Pedido (id_cliente, valor_total) VALUES (?, ?)', [id_cliente, total]);
    const id_pedido = orderRes.insertId;

    // insert items and decrement stock
    for (const it of items) {
      const [prodRows] = await conn.query('SELECT preco, estoque FROM Produto WHERE id_produto = ?', [it.id_produto]);
      const preco = prodRows[0].preco;
      await conn.query('INSERT INTO Item_Pedido (id_pedido, id_produto, quantidade, valor_unitario) VALUES (?,?,?,?)',
        [id_pedido, it.id_produto, it.quantidade, preco]);
      await conn.query('UPDATE Produto SET estoque = estoque - ? WHERE id_produto = ?', [it.quantidade, it.id_produto]);
    }

    // create pagamento (stub)
    await conn.query('INSERT INTO Pagamento (id_pedido, metodo, status, valor, data_pagamento) VALUES (?,?,?,?,NOW())',
      [id_pedido, metodoPagamento || 'Pix', 'Aprovado', total]);

    // create entrega
    await conn.query('INSERT INTO Entrega (id_pedido, endereco_entrega, status) VALUES (?,?,?)',
      [id_pedido, endereco, 'Aguardando']);

    await conn.commit();
    res.status(201).json({ id_pedido, valor_total: total });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(400).json({ message: err.message || 'Erro ao criar pedido' });
  } finally {
    conn.release();
  }
};

exports.getOrdersByUser = async (req, res) => {
  const id_cliente = req.user.id_cliente;
  try {
    const [orders] = await pool.query('SELECT * FROM Pedido WHERE id_cliente = ? ORDER BY data_pedido DESC', [id_cliente]);
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao listar pedidos' });
  }
};

exports.getOrderDetails = async (req, res) => {
  const id_pedido = req.params.id;
  try {
    const [orderRows] = await pool.query('SELECT * FROM Pedido WHERE id_pedido = ?', [id_pedido]);
    if (!orderRows.length) return res.status(404).json({ message: 'Pedido não encontrado' });

    const [items] = await pool.query('SELECT ip.*, p.nome FROM Item_Pedido ip JOIN Produto p ON ip.id_produto = p.id_produto WHERE id_pedido = ?', [id_pedido]);
    const [pag] = await pool.query('SELECT * FROM Pagamento WHERE id_pedido = ?', [id_pedido]);
    const [ent] = await pool.query('SELECT * FROM Entrega WHERE id_pedido = ?', [id_pedido]);

    res.json({ order: orderRows[0], items, pagamento: pag[0] || null, entrega: ent[0] || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao obter detalhes do pedido' });
  }
};

exports.updateStatus = async (req, res) => {
  const id_pedido = req.params.id;
  const { status } = req.body;

  try {
    await pool.query('UPDATE Pedido SET status=? WHERE id_pedido=?', [status, id_pedido]);
    res.json({ message: "Status do pedido atualizado!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao atualizar status" });
  }
};

exports.listAll = async (req, res) => {
  try {
    // CORREÇÃO AQUI: Query SQL alterada para fazer JOIN com a tabela Cliente
    const [rows] = await pool.query(`
      SELECT 
          p.*, 
          c.nome AS cliente, 
          c.endereco AS cliente_endereco
      FROM Pedido p
      JOIN Cliente c ON p.id_cliente = c.id_cliente
      ORDER BY p.id_pedido DESC
    `);
    
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao listar todos os pedidos' });
  }
};