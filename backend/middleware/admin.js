const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token não fornecido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.role || decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Acesso negado: somente administrador' });
    }

    req.admin = decoded;
    next();

  } catch (error) {
    return res.status(401).json({ message: 'Token inválido' });
  }
};
