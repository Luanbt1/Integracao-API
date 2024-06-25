const jwt = require('jsonwebtoken');

// Middleware de autenticação
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization').replace('Bearer ', '');

  if (!token) {
    return res.status(401).send('Acesso negado. Nenhum token fornecido.');
  }

  try {
    const decoded = jwt.verify(token, 'secretkey'); // Use a mesma chave secreta usada na geração do token
    req.user = decoded;
    next();
  } catch (err) {
    res.status(400).send('Token inválido.');
  }
};

module.exports = authMiddleware;
