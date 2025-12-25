ALTER TABLE orders MODIFY COLUMN payment_method ENUM('cash', 'card', 'digital_wallet', 'loyalty_points', 'qris', 'transfer') DEFAULT 'cash';


