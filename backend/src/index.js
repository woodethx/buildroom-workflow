// Buildroom Digital Workflow - Backend Server
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/orders');
const systemRoutes = require('./routes/systems');
const checklistRoutes = require('./routes/checklists');
const userRoutes = require('./routes/users');
const analyticsRoutes = require('./routes/analytics');
const integrationRoutes = require('./routes/integrations');

// Import middleware
const { authenticate } = require('./middleware/auth');
const { errorHandler } = require('./middleware/errorHandler');

// Import database connection
const { sequelize } = require('./config/database');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Buildroom Digital Workflow API',
      version: '1.0.0',
      description: 'API for managing IT hardware procurement and configuration workflow',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./routes/*.js'], // Path to the API routes
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// API Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes (require authentication)
app.use('/api/orders', authenticate, orderRoutes);
app.use('/api/systems', authenticate, systemRoutes);
app.use('/api/checklists', authenticate, checklistRoutes);
app.use('/api/users', authenticate, userRoutes);
app.use('/api/analytics', authenticate, analyticsRoutes);
app.use('/api/integrations', authenticate, integrationRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Sync database models (only in development)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('✅ Database models synchronized.');
    }

    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📚 API Documentation available at http://localhost:${PORT}/api/docs`);
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  await sequelize.close();
  process.exit(0);
});

// Start the server
startServer();