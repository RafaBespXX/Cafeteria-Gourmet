const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/admin');

router.post('/', auth, orderController.createOrder);
router.get('/', auth, orderController.getOrdersByUser);
router.get('/:id', auth, orderController.getOrderDetails);
router.put('/:id/status', adminAuth, orderController.updateStatus);
router.get('/admin/all', adminAuth, orderController.listAll);

module.exports = router;
