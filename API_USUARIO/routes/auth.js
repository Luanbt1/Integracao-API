const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController'); // Certifique-se de que o caminho está correto

router.post('/register', authController.register);
router.post('/login', authController.login);

// Rota GET para listar todos os usuários
router.get('/users', authController.listUsers);

// Rota PUT para atualizar um usuário
router.put('/users/:username', authController.updateUser);

// Rota DELETE para deletar um usuário
router.delete('/users/:username', authController.deleteUser);

module.exports = router;
