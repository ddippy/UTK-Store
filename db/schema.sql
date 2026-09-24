CREATE TABLE
    categories (
        category_id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE
    );

CREATE TABLE
    products (
        product_id SERIAL PRIMARY KEY,
        code VARCHAR(30) NOT NULL UNIQUE,
        name VARCHAR(150) NOT NULL,
        category_id INTEGER NOT NULL,
        price NUMERIC(10, 2) NOT NULL,
        description TEXT,
        image_path VARCHAR(255),
        status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
        FOREIGN KEY (category_id) REFERENCES categories (category_id)
    );

CREATE TABLE
    product_variants (
        variant_id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL,
        size VARCHAR(20),
        color VARCHAR(50),
        stock INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (product_id) REFERENCES products (product_id)
    );

CREATE TABLE
    orders (
        order_id SERIAL PRIMARY KEY,
        customer_name VARCHAR(150) NOT NULL,
        student_id VARCHAR(30) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        total_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
        status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

CREATE TABLE
    order_items (
        order_item_id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL,
        variant_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        price NUMERIC(10, 2) NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders (order_id),
        FOREIGN KEY (variant_id) REFERENCES product_variants (variant_id)
    );