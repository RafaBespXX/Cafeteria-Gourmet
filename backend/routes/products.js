const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const adminAuth = require('../middleware/admin');

router.get('/', productController.list);
router.get('/:id', productController.get);
router.post('/', adminAuth, productController.create);
router.put('/:id', adminAuth, productController.update);
// NOVO: Rota para Excluir
router.delete('/:id', adminAuth, productController.delete); 

module.exports = router;