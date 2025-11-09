const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const adminController = require('../controllers/adminController');

// Clientes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Administrador
router.post('/admin/login', adminController.login);

module.exports = router;