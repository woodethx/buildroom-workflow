-- Buildroom Digital Workflow Database Schema

-- Users table for authentication and roles
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('staff', 'manager', 'admin')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders from WooCommerce
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    woo_order_id VARCHAR(100) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_department VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'ordered',
    priority INTEGER DEFAULT 0,
    assigned_to INTEGER REFERENCES users(id),
    order_date TIMESTAMP NOT NULL,
    delivery_method VARCHAR(50) CHECK (delivery_method IN ('delivery', 'shipping')),
    delivery_address TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System types (computers, monitors, etc.)
CREATE TABLE system_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    requires_imaging BOOLEAN DEFAULT false,
    default_checklist_template JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Individual systems within orders
CREATE TABLE systems (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    system_type_id INTEGER REFERENCES system_types(id),
    serial_number VARCHAR(100),
    asset_name VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending',
    assigned_to INTEGER REFERENCES users(id),
    queue_position INTEGER,
    skip_queue BOOLEAN DEFAULT false,
    agiloft_asset_id VARCHAR(100),
    inflow_item_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Checklist templates
CREATE TABLE checklist_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    system_type_id INTEGER REFERENCES system_types(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Checklist steps within templates
CREATE TABLE checklist_steps (
    id SERIAL PRIMARY KEY,
    template_id INTEGER REFERENCES checklist_templates(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    requires_qa BOOLEAN DEFAULT false,
    estimated_minutes INTEGER DEFAULT 5,
    step_weight DECIMAL(3,2) DEFAULT 1.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Actual checklist instances for each system
CREATE TABLE system_checklists (
    id SERIAL PRIMARY KEY,
    system_id INTEGER REFERENCES systems(id) ON DELETE CASCADE,
    template_id INTEGER REFERENCES checklist_templates(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tracking completion of checklist steps
CREATE TABLE checklist_completions (
    id SERIAL PRIMARY KEY,
    system_checklist_id INTEGER REFERENCES system_checklists(id) ON DELETE CASCADE,
    step_id INTEGER REFERENCES checklist_steps(id),
    completed_by INTEGER REFERENCES users(id),
    completed_at TIMESTAMP,
    qa_checked_by INTEGER REFERENCES users(id),
    qa_checked_at TIMESTAMP,
    notes TEXT,
    time_spent_minutes INTEGER,
    UNIQUE(system_checklist_id, step_id)
);

-- Activity log for tracking all actions
CREATE TABLE activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    order_id INTEGER REFERENCES orders(id),
    system_id INTEGER REFERENCES systems(id),
    action VARCHAR(100) NOT NULL,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance metrics aggregation
CREATE TABLE performance_metrics (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    metric_date DATE NOT NULL,
    orders_completed INTEGER DEFAULT 0,
    systems_completed INTEGER DEFAULT 0,
    total_steps_completed INTEGER DEFAULT 0,
    total_weight_completed DECIMAL(10,2) DEFAULT 0,
    avg_time_per_order DECIMAL(10,2),
    avg_time_per_system DECIMAL(10,2),
    UNIQUE(user_id, metric_date)
);

-- Inventory tracking for serial numbers
CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    system_type_id INTEGER REFERENCES system_types(id),
    serial_number VARCHAR(100) UNIQUE NOT NULL,
    received_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'available',
    assigned_to_system INTEGER REFERENCES systems(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Integration configurations
CREATE TABLE integrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL,
    config JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_assigned_to ON orders(assigned_to);
CREATE INDEX idx_systems_order_id ON systems(order_id);
CREATE INDEX idx_systems_status ON systems(status);
CREATE INDEX idx_checklist_completions_system ON checklist_completions(system_checklist_id);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_order ON activity_logs(order_id);
CREATE INDEX idx_performance_metrics_user_date ON performance_metrics(user_id, metric_date);
CREATE INDEX idx_inventory_serial ON inventory(serial_number);
CREATE INDEX idx_inventory_status ON inventory(status);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_systems_updated_at BEFORE UPDATE ON systems
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();