import { useState } from "react";
import "../styles/orders.css";

const Orders = ({
  products = [],
  inventory = [],
  orders = [],
  onSubmitOrder,
  onCancelOrder,
}) => {

  /* ========================
     HELPER STOCK
  ======================== */
  const getStock = (productId) => {
    const item = inventory.find(i => i.id === productId);
    return item ? item.stock : 0;
  };

  /* ========================
     HELPER ORDER
  ======================== */
  const getProductName = (productId) => {
    const product = products.find(p => p.id === productId);
    return product ? product.name : `Produk ${productId}`;
  };

  /* ========================
     STATE
  ======================== */
  const [cartItems, setCartItems] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [qty, setQty] = useState("");

  const selectedProduct = products.find(p => p.id === selectedProductId);
  const isOutOfStock =
    selectedProduct && getStock(selectedProductId) === 0;

  /* ========================
     ADD TO CART
  ======================== */
  const addToCart = () => {
    if (!selectedProductId || !qty) return;

    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    const quantity = Number(qty);

    if (getStock(product.id) === 0) {
      alert("Stok produk habis");
      return;
    }

    const existing = cartItems.find(i => i.productId === product.id);
    const currentQty = existing ? existing.qty : 0;

    if (quantity + currentQty > getStock(product.id)) {
      alert(`Stok tidak mencukupi. Stok: ${getStock(product.id)}`);
      return;
    }

    setCartItems(prev => {
      if (existing) {
        return prev.map(i =>
          i.productId === product.id
            ? {
                ...i,
                qty: i.qty + quantity,
                subtotal: (i.qty + quantity) * i.price,
              }
            : i
        );
      }

      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          qty: quantity,
          subtotal: product.price * quantity,
        },
      ];
    });

    setSelectedProductId("");
    setQty("");
  };

  /* ========================
     SUBMIT ORDER
  ======================== */
  const submitOrder = () => {
    if (cartItems.length === 0) return;

    onSubmitOrder({ items: cartItems });
    setCartItems([]);
  };

  /* ========================
     CANCEL ORDER
  ======================== */
  const cancelOrder = (orderId) => {
    if (!window.confirm("Yakin mau membatalkan order ini?")) return;
    onCancelOrder(orderId);
  };

  /* ========================
     RENDER
  ======================== */
  return (
    <div className="orders">
      <h1>Orders</h1>

      <div className="order-form-card">
        <select
          value={selectedProductId}
          onChange={e => setSelectedProductId(e.target.value)}
        >
          <option value="">Pilih Produk</option>
          {products.map(p => (
            <option
              key={p.id}
              value={p.id}
              disabled={getStock(p.id) === 0}
            >
              {p.name} {getStock(p.id) === 0 ? "(Stok Habis)" : ""}
            </option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Qty"
          min="1"
          value={qty}
          onChange={e => setQty(e.target.value)}
        />

        <button
          onClick={addToCart}
          disabled={!selectedProductId || !qty || isOutOfStock}
        >
          Tambah Produk
        </button>

        <button
          onClick={submitOrder}
          disabled={cartItems.length === 0}
        >
          Simpan Order
        </button>
      </div>

      {cartItems.length > 0 && (
        <div className="cart-card">
          <p>Keranjang</p>
          <div className="cart-list">
            {cartItems.map(item => (
              <div key={item.productId} className="cart-item">
                <div className="cart-item-name">{item.name}</div>
                <div>Qty: {item.qty}</div>
                <div>
                  Rp{item.price} × {item.qty} = Rp{item.subtotal}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="order-title">Daftar Transaksi Penjualan</p>

      <table className="orders-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Tanggal</th>
            <th>Produk</th>
            <th>Total Item</th>
            <th>Total Harga</th>
            <th>Status</th>
            <th>Aksi</th>
          </tr>
        </thead>

        <tbody>
          {orders.length === 0 ? (
            <tr>
              <td colSpan="7" className="empty">
                Belum ada transaksi
              </td>
            </tr>
          ) : (
            orders.map(order => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>
                  {order.createdAt
                    ? new Date(order.createdAt).toLocaleDateString("id-ID")
                    : "-"}
                </td>
                <td>
                  {order.items.map((i, idx) => (
                    <div key={idx}>
                      {getProductName(i.productId)} ({i.qty})
                    </div>
                  ))}
                </td>
                <td>
                  {order.items.reduce((s, i) => s + i.qty, 0)}
                </td>
                <td>Rp{order.total}</td>
                <td>{order.status}</td>
                <td>
                  {order.status === "CONFIRMED" ? (
                    <button onClick={() => cancelOrder(order.id)}>
                      Cancel
                    </button>
                  ) : "-"}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Orders;
