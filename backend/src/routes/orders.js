const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authorize } = require('../middleware/auth');
const orderController = require('../controllers/orderController');

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get all orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ordered, in_progress, qa_review, ready_to_deliver, complete]
 *         description: Filter by order status
 *       - in: query
 *         name: assigned_to
 *         schema:
 *           type: integer
 *         description: Filter by assigned user ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in order ID, customer name, or department
 *     responses:
 *       200:
 *         description: List of orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 */
router.get('/', orderController.getOrders);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       404:
 *         description: Order not found
 */
router.get('/:id', orderController.getOrderById);

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order (usually from WooCommerce webhook)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - woo_order_id
 *               - customer_name
 *               - customer_email
 *               - order_date
 *             properties:
 *               woo_order_id:
 *                 type: string
 *               customer_name:
 *                 type: string
 *               customer_email:
 *                 type: string
 *               customer_department:
 *                 type: string
 *               order_date:
 *                 type: string
 *                 format: date-time
 *               delivery_method:
 *                 type: string
 *                 enum: [delivery, shipping]
 *               delivery_address:
 *                 type: string
 *               systems:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Invalid input
 */
router.post('/',
  [
    body('woo_order_id').notEmpty().trim(),
    body('customer_name').notEmpty().trim(),
    body('customer_email').isEmail(),
    body('order_date').isISO8601(),
    body('delivery_method').isIn(['delivery', 'shipping']),
  ],
  orderController.createOrder
);

/**
 * @swagger
 * /api/orders/{id}/status:
 *   patch:
 *     summary: Update order status
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ordered, in_progress, qa_review, ready_to_deliver, complete]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       400:
 *         description: Invalid status transition
 */
router.patch('/:id/status',
  [
    body('status').isIn(['ordered', 'in_progress', 'qa_review', 'ready_to_deliver', 'complete']),
  ],
  orderController.updateOrderStatus
);

/**
 * @swagger
 * /api/orders/{id}/assign:
 *   patch:
 *     summary: Assign order to a user
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *             properties:
 *               user_id:
 *                 type: integer
 *                 description: User ID to assign the order to
 *     responses:
 *       200:
 *         description: Order assigned successfully
 *       403:
 *         description: Not authorized (managers only)
 */
router.patch('/:id/assign',
  authorize(['manager', 'admin']),
  [
    body('user_id').isInt({ min: 1 }),
  ],
  orderController.assignOrder
);

/**
 * @swagger
 * /api/orders/{id}/priority:
 *   patch:
 *     summary: Update order priority
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - priority
 *             properties:
 *               priority:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 5
 *                 description: Priority level (0 = normal, 5 = highest)
 *     responses:
 *       200:
 *         description: Priority updated successfully
 */
router.patch('/:id/priority',
  authorize(['manager', 'admin']),
  [
    body('priority').isInt({ min: 0, max: 5 }),
  ],
  orderController.updatePriority
);

/**
 * @swagger
 * /api/orders/{id}/systems:
 *   get:
 *     summary: Get all systems for an order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of systems
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/System'
 */
router.get('/:id/systems', orderController.getOrderSystems);

/**
 * @swagger
 * /api/orders/{id}/complete:
 *   post:
 *     summary: Mark order as complete with final details
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tracking_number:
 *                 type: string
 *                 description: For shipping orders
 *               delivery_confirmation:
 *                 type: string
 *                 description: For delivery orders
 *               final_notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order completed successfully
 *       400:
 *         description: Cannot complete - systems not finished
 */
router.post('/:id/complete', orderController.completeOrder);

/**
 * @swagger
 * /api/orders/bulk-assign:
 *   post:
 *     summary: Bulk assign multiple orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - order_ids
 *               - user_id
 *             properties:
 *               order_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *               user_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Orders assigned successfully
 */
router.post('/bulk-assign',
  authorize(['manager', 'admin']),
  [
    body('order_ids').isArray({ min: 1 }),
    body('order_ids.*').isInt(),
    body('user_id').isInt({ min: 1 }),
  ],
  orderController.bulkAssignOrders
);

// Middleware to handle validation errors
router.use((req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
});

module.exports = router;