-- Create suppliers table
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    business_name VARCHAR(255),
    ruc VARCHAR(11),
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create purchase_orders table
CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) NOT NULL UNIQUE,
    supplier_id UUID REFERENCES suppliers(id),
    order_date DATE NOT NULL,
    expected_delivery_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    subtotal NUMERIC(10, 2) NOT NULL,
    tax_amount NUMERIC(10, 2) NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    received_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create purchase_order_items table
CREATE TABLE purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    total_price NUMERIC(10, 2) NOT NULL,
    received_quantity INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add new modules
INSERT INTO modules (name, description, path, icon, is_active, sort_order) VALUES
('suppliers', 'Gestión de Proveedores', '/suppliers', 'truck', true, 3),
('purchase_orders', 'Gestión de Órdenes de Compra', '/purchase-orders', 'shopping-cart', true, 4);

-- Add new permissions
INSERT INTO permissions (name, description, module_id, action, is_active) VALUES
('suppliers_create', 'Crear proveedores', (SELECT id FROM modules WHERE name = 'suppliers'), 'create', true),
('suppliers_read', 'Leer proveedores', (SELECT id FROM modules WHERE name = 'suppliers'), 'read', true),
('suppliers_update', 'Actualizar proveedores', (SELECT id FROM modules WHERE name = 'suppliers'), 'update', true),
('suppliers_delete', 'Eliminar proveedores', (SELECT id FROM modules WHERE name = 'suppliers'), 'delete', true),
('purchase_orders_create', 'Crear órdenes de compra', (SELECT id FROM modules WHERE name = 'purchase_orders'), 'create', true),
('purchase_orders_read', 'Leer órdenes de compra', (SELECT id FROM modules WHERE name = 'purchase_orders'), 'read', true),
('purchase_orders_update', 'Actualizar órdenes de compra', (SELECT id FROM modules WHERE name = 'purchase_orders'), 'update', true),
('purchase_orders_delete', 'Eliminar órdenes de compra', (SELECT id FROM modules WHERE name = 'purchase_orders'), 'delete', true);

-- Assign permissions to admin role
INSERT INTO role_permissions (role_id, permission_id, granted)
SELECT
    (SELECT id FROM roles WHERE name = 'super-admin'),
    p.id,
    true
FROM
    permissions p
WHERE
    p.name IN (
        'suppliers_create',
        'suppliers_read',
        'suppliers_update',
        'suppliers_delete',
        'purchase_orders_create',
        'purchase_orders_read',
        'purchase_orders_update',
        'purchase_orders_delete'
    );
