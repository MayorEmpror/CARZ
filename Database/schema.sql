-- ============================================
-- USERS
-- ============================================

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('customer','owner')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- CARS
-- ============================================

CREATE TABLE cars (
    car_id SERIAL PRIMARY KEY,

    owner_id INT NOT NULL,

    make VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    year INT,

    body_type VARCHAR(30),
    fuel_type VARCHAR(30),
    transmission VARCHAR(20),

    price DECIMAL(12,2) NOT NULL,

    status VARCHAR(20)
        CHECK(status IN ('available','rented','sold'))
        DEFAULT 'available',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (owner_id)
        REFERENCES users(user_id)
);

-- ============================================
-- CAR PERFORMANCE
-- ============================================

CREATE TABLE car_performance (

    performance_id SERIAL PRIMARY KEY,

    car_id INT UNIQUE NOT NULL,

    mileage DECIMAL(6,2),

    top_speed INT,

    acceleration_0_100 DECIMAL(4,2),

    engine_power INT,

    torque INT,

    fuel_efficiency DECIMAL(5,2),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (car_id)
        REFERENCES cars(car_id)
);

-- ============================================
-- RENTALS
-- ============================================

CREATE TABLE rentals (

    rental_id SERIAL PRIMARY KEY,

    customer_id INT NOT NULL,

    car_id INT NOT NULL,

    start_date DATE NOT NULL,

    end_date DATE NOT NULL,

    total_amount DECIMAL(12,2),

    status VARCHAR(20)
        CHECK(status IN ('active','completed','cancelled'))
        DEFAULT 'active',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (customer_id)
        REFERENCES users(user_id),

    FOREIGN KEY (car_id)
        REFERENCES cars(car_id)
);

-- ============================================
-- PURCHASES
-- ============================================

CREATE TABLE purchases (

    purchase_id SERIAL PRIMARY KEY,

    customer_id INT NOT NULL,

    car_id INT UNIQUE NOT NULL,

    purchase_date DATE NOT NULL,

    purchase_price DECIMAL(12,2) NOT NULL,

    status VARCHAR(20)
        CHECK(status IN ('pending','completed','cancelled'))
        DEFAULT 'pending',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (customer_id)
        REFERENCES users(user_id),

    FOREIGN KEY (car_id)
        REFERENCES cars(car_id)
);

-- ============================================
-- PAYMENTS
-- ============================================

CREATE TABLE payments (

    payment_id SERIAL PRIMARY KEY,

    rental_id INT,

    purchase_id INT,

    amount DECIMAL(12,2) NOT NULL,

    payment_method VARCHAR(30),

    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    status VARCHAR(20)
        CHECK(status IN ('pending','paid','failed'))
        DEFAULT 'pending',

    transaction_ref VARCHAR(100) UNIQUE,

    FOREIGN KEY (rental_id)
        REFERENCES rentals(rental_id),

    FOREIGN KEY (purchase_id)
        REFERENCES purchases(purchase_id),

    CHECK (
        (rental_id IS NOT NULL AND purchase_id IS NULL)
        OR
        (rental_id IS NULL AND purchase_id IS NOT NULL)
    )
);