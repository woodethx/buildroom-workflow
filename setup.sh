#!/bin/bash

# Buildroom Digital Workflow Setup Script

echo "🚀 Setting up Buildroom Digital Workflow..."

# Create all necessary directories
echo "📁 Creating directory structure..."
mkdir -p backend/src/{controllers,models,routes,services,middleware,integrations,config}
mkdir -p frontend/src/{components,pages,services,hooks,store}
mkdir -p database/{migrations,schemas}
mkdir -p docs scripts nginx .github/workflows

# Create README.md
echo "📝 Creating README.md..."
cat > README.md << 'EOF'
# Buildroom Digital Workflow

A comprehensive digital workflow management system for TechBuy's IT hardware procurement and configuration process at AgriLife.

## 🎯 Project Overview

This system replaces paper-based checklists and manual tracking with a digital Kanban board, automated workflows, and real-time analytics for managing IT hardware orders across ~5000 AgriLife employees in Texas.

## 🚀 Quick Start

1. Clone the repository
2. Copy environment files: `cp backend/.env.example backend/.env`
3. Install dependencies: `cd backend && npm install && cd ../frontend && npm install`
4. Start with Docker: `docker-compose up`

See full documentation in the README for detailed setup instructions.
EOF

# Create .gitignore
echo "📝 Creating .gitignore..."
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Production builds
build/
dist/

# Database
*.sqlite
*.sqlite3

# Logs
logs/
*.log

# OS files
.DS_Store
Thumbs.db

# IDE files
.vscode/
.idea/
*.swp
*.swo

# Test coverage
coverage/
.nyc_output/

# Docker
docker-compose.override.yml
EOF

# Create backend package.json
echo "📦 Creating backend/package.json..."
cat > backend/package.json << 'EOF'
{
  "name": "buildroom-workflow-backend",
  "version": "1.0.0",
  "description": "Backend API for Buildroom Digital Workflow System",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "test": "jest",
    "lint": "eslint src/"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "dotenv": "^16.3.1",
    "pg": "^8.11.3",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "jest": "^29.6.4",
    "eslint": "^8.48.0"
  }
}
EOF

# Create frontend package.json
echo "📦 Creating frontend/package.json..."
cat > frontend/package.json << 'EOF'
{
  "name": "buildroom-workflow-frontend",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "@mui/material": "^5.14.0",
    "@emotion/react": "^11.11.0",
    "@emotion/styled": "^11.11.0",
    "axios": "^1.5.0",
    "react-router-dom": "^6.15.0"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "browserslist": {
    "production": [">0.2%", "not dead", "not op_mini all"],
    "development": ["last 1 chrome version", "last 1 firefox version", "last 1 safari version"]
  }
}
EOF

# Create basic backend server
echo "🖥️  Creating backend/src/index.js..."
cat > backend/src/index.js << 'EOF'
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Basic route
app.get('/api', (req, res) => {
  res.json({ message: 'Buildroom Workflow API' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
EOF

# Create docker-compose.yml
echo "🐳 Creating docker-compose.yml..."
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: buildroom_db
      POSTGRES_USER: buildroom_user
      POSTGRES_PASSWORD: changeme
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
EOF

# Create environment files
echo "🔐 Creating environment files..."
cat > backend/.env.example << 'EOF'
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://buildroom_user:changeme@localhost:5432/buildroom_db
JWT_SECRET=your-secret-key-here
EOF

cat > frontend/.env.example << 'EOF'
REACT_APP_API_URL=http://localhost:3001/api
EOF

# Create basic frontend App.js
echo "⚛️  Creating frontend/src/App.js..."
mkdir -p frontend/src
cat > frontend/src/App.js << 'EOF'
import React from 'react';

function App() {
  return (
    <div className="App">
      <h1>Buildroom Digital Workflow</h1>
      <p>Coming soon...</p>
    </div>
  );
}

export default App;
EOF

# Create frontend index.js
cat > frontend/src/index.js << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOF

# Create frontend public/index.html
mkdir -p frontend/public
cat > frontend/public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Buildroom Digital Workflow</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>
EOF

# Create GitHub Actions workflow
echo "🔄 Creating GitHub Actions workflow..."
cat > .github/workflows/ci.yml << 'EOF'
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
    - name: Install backend dependencies
      working-directory: ./backend
      run: npm install
    - name: Install frontend dependencies  
      working-directory: ./frontend
      run: npm install
EOF

# Create database schema file
echo "🗄️  Creating database schema..."
cat > database/schemas/initial-schema.sql << 'EOF'
-- Buildroom Digital Workflow Database Schema

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    woo_order_id VARCHAR(100) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ordered',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
EOF

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. cd into your project directory"
echo "2. git init (if not already initialized)"
echo "3. git add ."
echo "4. git commit -m 'Initial project setup'"
echo "5. git push origin main"
echo ""
echo "To start development:"
echo "1. cd backend && npm install"
echo "2. cd ../frontend && npm install"
echo "3. Copy .env files: cp backend/.env.example backend/.env"
echo "4. docker-compose up (for database)"
echo "5. Start backend: cd backend && npm run dev"
echo "6. Start frontend: cd frontend && npm start"