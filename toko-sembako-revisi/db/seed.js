const { initDatabase } = require('./init');
const { query, queryInsert } = require('./config');

async function seedDatabase() {
    console.log('🌱 Seeding database with sample data...');

    // Seed Products
    const products = [
        { name: 'Beras Premium', price: 12000, unit: 'kg' },
        { name: 'Minyak Goreng', price: 15000, unit: 'liter' },
        { name: 'Telur Ayam', price: 25000, unit: 'kg' },
        { name: 'Gula Pasir', price: 14000, unit: 'kg' },
        { name: 'Tepung Terigu', price: 10000, unit: 'kg' },
        { name: 'Kecap Manis', price: 8000, unit: 'botol' },
        { name: 'Garam', price: 3000, unit: 'bungkus' },
        { name: 'Mie Instan', price: 3500, unit: 'bungkus' },
        { name: 'Susu UHT', price: 6000, unit: 'kotak' },
        { name: 'Mentega', price: 12000, unit: 'bungkus' }
    ];

    for (const product of products) {
        try {
            // Check if product exists
            const existing = await query('SELECT id FROM products WHERE name = ?', [product.name]);
            if (existing.length === 0) {
                await queryInsert(
                    'INSERT INTO products (name, price, unit) VALUES (?, ?, ?)',
                    [product.name, product.price, product.unit]
                );
                console.log(`  ✅ Added product: ${product.name}`);
            } else {
                console.log(`  ⏭️ Product exists: ${product.name}`);
            }
        } catch (err) {
            console.error(`  ❌ Error adding ${product.name}:`, err.message);
        }
    }

    // Seed Inventory (stock for each product)
    console.log('\n📦 Seeding inventory...');
    const allProducts = await query('SELECT id FROM products');

    for (const product of allProducts) {
        try {
            const existing = await query('SELECT product_id FROM inventory WHERE product_id = ?', [product.id]);
            if (existing.length === 0) {
                const randomStock = Math.floor(Math.random() * 100) + 50; // 50-150
                await queryInsert(
                    'INSERT INTO inventory (product_id, stock) VALUES (?, ?)',
                    [product.id, randomStock]
                );
                console.log(`  ✅ Added stock for product ${product.id}: ${randomStock} units`);
            } else {
                console.log(`  ⏭️ Inventory exists for product ${product.id}`);
            }
        } catch (err) {
            console.error(`  ❌ Error adding inventory for ${product.id}:`, err.message);
        }
    }

    console.log('\n✅ Database seeding complete!');
}

async function main() {
    try {
        // Wait a bit for database to be ready
        console.log('⏳ Waiting for database connection...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Initialize tables
        await initDatabase();

        // Seed data
        await seedDatabase();

        console.log('\n🎉 Setup complete! Services should now work correctly.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Setup failed:', err.message);
        process.exit(1);
    }
}

main();
