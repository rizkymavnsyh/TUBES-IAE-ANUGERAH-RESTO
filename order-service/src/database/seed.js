const db = require('./connection');
require('dotenv').config();

async function seed() {
  try {
    console.log('🔄 Seeding Order Service database...');

    // Clear existing data
    await db.execute('DELETE FROM menus');

    // Insert sample menu items
    const menuItems = [
      {
        menu_id: 'MENU001',
        name: 'Nasi Goreng Spesial',
        description: 'Nasi goreng dengan telur, ayam, dan kerupuk',
        category: 'Main Course',
        price: 25000,
        ingredients: JSON.stringify([
          { ingredientId: '1', ingredientName: 'Beras', quantity: 0.2, unit: 'kg' },
          { ingredientId: '2', ingredientName: 'Ayam', quantity: 0.1, unit: 'kg' },
          { ingredientId: '7', ingredientName: 'Telur', quantity: 1, unit: 'butir' }
        ]),
        available: true,
        preparation_time: 15,
        tags: JSON.stringify(['popular', 'spicy'])
      },
      {
        menu_id: 'MENU002',
        name: 'Ayam Goreng Kremes',
        description: 'Ayam goreng krispi dengan kremes renyah',
        category: 'Main Course',
        price: 35000,
        ingredients: JSON.stringify([
          { ingredientId: '2', ingredientName: 'Ayam', quantity: 0.3, unit: 'kg' },
          { ingredientId: '6', ingredientName: 'Minyak Goreng', quantity: 0.1, unit: 'liter' }
        ]),
        available: true,
        preparation_time: 20,
        tags: JSON.stringify(['popular', 'fried'])
      },
      {
        menu_id: 'MENU003',
        name: 'Ikan Bakar',
        description: 'Ikan segar dibakar dengan bumbu khas',
        category: 'Main Course',
        price: 40000,
        ingredients: JSON.stringify([
          { ingredientId: '3', ingredientName: 'Ikan', quantity: 0.3, unit: 'kg' },
          { ingredientId: '5', ingredientName: 'Bumbu Dasar', quantity: 1, unit: 'pack' }
        ]),
        available: true,
        preparation_time: 25,
        tags: JSON.stringify(['grilled', 'fresh'])
      },
      {
        menu_id: 'MENU004',
        name: 'Gado-Gado',
        description: 'Sayuran segar dengan bumbu kacang',
        category: 'Appetizer',
        price: 20000,
        ingredients: JSON.stringify([
          { ingredientId: '4', ingredientName: 'Sayuran Mix', quantity: 0.2, unit: 'kg' },
          { ingredientId: '8', ingredientName: 'Tahu', quantity: 2, unit: 'potong' }
        ]),
        available: true,
        preparation_time: 10,
        tags: JSON.stringify(['vegetarian', 'healthy'])
      },
      {
        menu_id: 'MENU005',
        name: 'Es Jeruk',
        description: 'Minuman jeruk segar',
        category: 'Beverage',
        price: 8000,
        ingredients: JSON.stringify([]),
        available: true,
        preparation_time: 5,
        tags: JSON.stringify(['cold', 'refreshing'])
      },
      {
        menu_id: 'MENU006',
        name: 'Es Teh Manis',
        description: 'Teh manis dingin',
        category: 'Beverage',
        price: 5000,
        ingredients: JSON.stringify([]),
        available: true,
        preparation_time: 3,
        tags: JSON.stringify(['cold', 'sweet'])
      }
    ];

    for (const menu of menuItems) {
      await db.execute(`
        INSERT INTO menus (menu_id, name, description, category, price, ingredients, available, preparation_time, tags)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        menu.menu_id,
        menu.name,
        menu.description,
        menu.category,
        menu.price,
        menu.ingredients,
        menu.available,
        menu.preparation_time,
        menu.tags
      ]);
    }

    console.log('✅ Order Service seeding completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

seed();
