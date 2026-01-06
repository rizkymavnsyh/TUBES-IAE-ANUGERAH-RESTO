const { initDatabase } = require('./init');
const { query, queryInsert, dbConfig } = require('./config');

async function seedDatabase(isStandalone = false) {
    if (isStandalone) {
        console.log('🌱 Seeding database manually...');
        // Initialize if standalone
        await initDatabase();
    } else {
        console.log('🌱 Auto-seeding database...');
    }

    // Comprehensive Product List for Resto Needs
    const products = [
        // Bahan Pokok
        { name: 'Beras Premium', price: 13000, unit: 'kg', category: 'Sembako' },
        { name: 'Minyak Goreng', price: 16000, unit: 'liter', category: 'Sembako' },
        { name: 'Telur Ayam', price: 26000, unit: 'kg', category: 'Sembako' },
        { name: 'Gula Pasir', price: 14500, unit: 'kg', category: 'Sembako' },
        { name: 'Tepung Terigu', price: 11000, unit: 'kg', category: 'Sembako' },

        // Sayuran
        { name: 'Bawang Merah', price: 35000, unit: 'kg', category: 'Sayuran' },
        { name: 'Bawang Putih', price: 30000, unit: 'kg', category: 'Sayuran' },
        { name: 'Cabai Merah', price: 50000, unit: 'kg', category: 'Sayuran' },
        { name: 'Tomat', price: 15000, unit: 'kg', category: 'Sayuran' },
        { name: 'Wortel', price: 12000, unit: 'kg', category: 'Sayuran' },
        { name: 'Kentang', price: 18000, unit: 'kg', category: 'Sayuran' },

        // Daging & Protein
        { name: 'Daging Sapi', price: 120000, unit: 'kg', category: 'Daging' },
        { name: 'Daging Ayam', price: 38000, unit: 'kg', category: 'Daging' },
        { name: 'Ikan Lele', price: 25000, unit: 'kg', category: 'Ikan' },

        // Bumbu & Lainnya
        { name: 'Kecap Manis', price: 9000, unit: 'botol', category: 'Bumbu' },
        { name: 'Garam', price: 3000, unit: 'bungkus', category: 'Bumbu' },
        { name: 'Merica Bubuk', price: 1000, unit: 'sachet', category: 'Bumbu' }
    ];

    for (const product of products) {
        try {
            // Check if product exists
            const existing = await query('SELECT id FROM products WHERE name = ?', [product.name]);
            if (existing.length === 0) {
                // Determine category description or default
                const description = `Stok segar untuk ${product.name} kategori ${product.category}`;

                await queryInsert(
                    'INSERT INTO products (name, price, unit, description, category) VALUES (?, ?, ?, ?, ?)',
                    [product.name, product.price, product.unit, description, product.category]
                );
                console.log(`  ✅ Added product: ${product.name}`);
            } else {
                // Update existing product to ensure category/description is set
                const description = `Stok segar untuk ${product.name} kategori ${product.category}`;
                await queryInsert(
                    'UPDATE products SET category = ?, description = ? WHERE name = ?',
                    [product.category, description, product.name]
                );
                console.log(`  🔄 Updated product: ${product.name}`);
            }
        } catch (err) {
            console.error(`  ❌ Error adding ${product.name}:`, err.message);
        }
    }

    // Seed Inventory (stock for each product)
    console.log('📦 Updating inventory stocks...');
    const allProducts = await query('SELECT id FROM products');

    for (const product of allProducts) {
        try {
            const existing = await query('SELECT product_id FROM inventory WHERE product_id = ?', [product.id]);
            const randomStock = Math.floor(Math.random() * 100) + 50; // 50-150

            if (existing.length === 0) {
                await queryInsert(
                    'INSERT INTO inventory (product_id, stock) VALUES (?, ?)',
                    [product.id, randomStock]
                );
                console.log(`  ✅ Initialized stock for product ${product.id}: ${randomStock} units`);
            } else {
                // Ensure stock is not zero (restock if empty)
                const current = existing[0];
                // Note: current.stock might be accessible depending on driver, assuming standard select
                // Better query again or just update if we want to force restock. 
                // Let's just update stock if it's low or randomly add some for simulation
                // await query('UPDATE inventory SET stock = stock + 10 WHERE product_id = ?', [product.id]);
            }
        } catch (err) {
            console.error(`  ❌ Error adding inventory for ${product.id}:`, err.message);
        }
    }

    console.log('✅ Database seeding complete!');
    if (isStandalone) {
        process.exit(0);
    }
}

// Allow running directly: node db/seed.js
if (require.main === module) {
    seedDatabase(true).catch(err => {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    });
}

module.exports = { seedDatabase };
