import sys
import os
import asyncio
import json
import aiomysql
from dotenv import load_dotenv

load_dotenv()

async def seed():
    """Seed database with sample data"""
    try:
        print("🔄 Seeding Order Service (Python) database...")
        
        conn = await aiomysql.connect(
            host=os.getenv("DB_HOST", "localhost"),
            port=int(os.getenv("DB_PORT", 3306)),
            user=os.getenv("DB_USER", "order_user"),
            password=os.getenv("DB_PASSWORD", "order_pass"),
            db=os.getenv("DB_NAME", "order_db")
        )
        
        async with conn.cursor() as cur:
            # Clear existing data
            await cur.execute("DELETE FROM menus")
            
            # Insert sample menu items
            menu_items = [
                {
                    "menu_id": "MENU001",
                    "name": "Nasi Goreng Spesial",
                    "description": "Nasi goreng dengan telur, ayam, dan kerupuk",
                    "category": "Main Course",
                    "price": 25000,
                    "ingredients": json.dumps([
                        {"ingredientId": "1", "ingredientName": "Beras", "quantity": 0.2, "unit": "kg"},
                        {"ingredientId": "2", "ingredientName": "Ayam", "quantity": 0.1, "unit": "kg"},
                        {"ingredientId": "7", "ingredientName": "Telur", "quantity": 1, "unit": "butir"}
                    ]),
                    "available": True,
                    "preparation_time": 15,
                    "tags": json.dumps(["popular", "spicy"])
                },
                {
                    "menu_id": "MENU002",
                    "name": "Ayam Goreng Kremes",
                    "description": "Ayam goreng krispi dengan kremes renyah",
                    "category": "Main Course",
                    "price": 35000,
                    "ingredients": json.dumps([
                        {"ingredientId": "2", "ingredientName": "Ayam", "quantity": 0.3, "unit": "kg"},
                        {"ingredientId": "6", "ingredientName": "Minyak Goreng", "quantity": 0.1, "unit": "liter"}
                    ]),
                    "available": True,
                    "preparation_time": 20,
                    "tags": json.dumps(["popular", "fried"])
                },
                {
                    "menu_id": "MENU003",
                    "name": "Ikan Bakar",
                    "description": "Ikan segar dibakar dengan bumbu khas",
                    "category": "Main Course",
                    "price": 40000,
                    "ingredients": json.dumps([
                        {"ingredientId": "3", "ingredientName": "Ikan", "quantity": 0.3, "unit": "kg"},
                        {"ingredientId": "5", "ingredientName": "Bumbu Dasar", "quantity": 1, "unit": "pack"}
                    ]),
                    "available": True,
                    "preparation_time": 25,
                    "tags": json.dumps(["grilled", "fresh"])
                },
                {
                    "menu_id": "MENU004",
                    "name": "Gado-Gado",
                    "description": "Sayuran segar dengan bumbu kacang",
                    "category": "Appetizer",
                    "price": 20000,
                    "ingredients": json.dumps([
                        {"ingredientId": "4", "ingredientName": "Sayuran Mix", "quantity": 0.2, "unit": "kg"},
                        {"ingredientId": "8", "ingredientName": "Tahu", "quantity": 2, "unit": "potong"}
                    ]),
                    "available": True,
                    "preparation_time": 10,
                    "tags": json.dumps(["vegetarian", "healthy"])
                },
                {
                    "menu_id": "MENU005",
                    "name": "Es Jeruk",
                    "description": "Minuman jeruk segar",
                    "category": "Beverage",
                    "price": 8000,
                    "ingredients": json.dumps([]),
                    "available": True,
                    "preparation_time": 5,
                    "tags": json.dumps(["cold", "refreshing"])
                },
                {
                    "menu_id": "MENU006",
                    "name": "Es Teh Manis",
                    "description": "Teh manis dingin",
                    "category": "Beverage",
                    "price": 5000,
                    "ingredients": json.dumps([]),
                    "available": True,
                    "preparation_time": 3,
                    "tags": json.dumps(["cold", "sweet"])
                }
            ]
            
            for menu in menu_items:
                await cur.execute("""
                    INSERT INTO menus (menu_id, name, description, category, price, ingredients, available, preparation_time, tags)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    menu["menu_id"],
                    menu["name"],
                    menu["description"],
                    menu["category"],
                    menu["price"],
                    menu["ingredients"],
                    menu["available"],
                    menu["preparation_time"],
                    menu["tags"]
                ))
        
        conn.close()
        print("✅ Order Service (Python) seeding completed")
        sys.exit(0)
    except Exception as error:
        print(f"❌ Seeding error: {error}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(seed())
