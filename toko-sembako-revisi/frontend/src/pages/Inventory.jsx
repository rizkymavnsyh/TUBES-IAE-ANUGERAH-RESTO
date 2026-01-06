import "../styles/inventory.css";
import { useState } from "react";

export default function Inventory({
  inventory = [],    // ✅ TAMBAHAN INI
  setInventory
}) {

  const [qtyMap, setQtyMap] = useState({});

  const updateStock = (id, delta) => {
    const qty = Number(qtyMap[id] || 0);
    if (!qty) return;

    setInventory(inv =>
      inv.map(item =>
        item.id === id
          ? { ...item, stock: Math.max(0, item.stock + delta * qty) }
          : item
      )
    );

    setQtyMap(prev => ({ ...prev, [id]: "" }));
  };

  return (
    <div>
      <h1>Inventory</h1>

      <table className="inventory-table">
        <thead>
          <tr>
            <th align="left">Produk</th>
            <th align="center">Stok</th>
            <th align="center">Qty</th>
            <th align="center">Aksi</th>
          </tr>
        </thead>

        <tbody>
          {inventory.map(item => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td align="center">{item.stock}</td>
              <td align="center">
                <input
                  type="number"
                  value={qtyMap[item.id] || ""}
                  onChange={e =>
                    setQtyMap(prev => ({
                      ...prev,
                      [item.id]: e.target.value
                    }))
                  }
                  style={{ width: 60 }}
                />
              </td>
              <td align="center">
                <button onClick={() => updateStock(item.id, 1)}>+</button>
                <button
                  onClick={() => updateStock(item.id, -1)}
                  style={{ marginLeft: 8 }}
                >
                  −
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
