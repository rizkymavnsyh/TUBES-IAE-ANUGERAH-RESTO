import { useState } from "react";
import "../styles/products.css";
import { createOrderAPI } from "../api/graphqlSync"; // ✅ TAMBAH INI

export default function Products({ products, addProduct }) {
  const [form, setForm] = useState({
    name: "",
    price: "",
    unit: "",
  });

  // ✅ HARUS ASYNC
  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.unit) return;

    try {
      const newProduct = await createOrderAPI({
        name: form.name,
        price: Number(form.price),
        unit: form.unit,
      });

      addProduct(newProduct);
      setForm({ name: "", price: "", unit: "" });

    } catch (err) {
      alert("Gagal menambah produk: " + err.message);
    }
  };

  return (
    <div>
      <h1>Products</h1>

      <div className="product-form-card">
        <form onSubmit={submit} className="product-form">
          <input
            placeholder="Nama produk"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
          />
          <input
            type="number"
            placeholder="Harga"
            value={form.price}
            onChange={e => setForm({ ...form, price: e.target.value })}
          />
          <input
            placeholder="Satuan"
            value={form.unit}
            onChange={e => setForm({ ...form, unit: e.target.value })}
          />
          <button type="submit">Tambah</button>
        </form>
      </div>

      <p>Product List</p>
      <table className="product-table">
        <thead>
          <tr>
            <th align="left">Nama</th>
            <th align="center">Harga</th>
            <th align="center">Satuan</th>
          </tr>
        </thead>
        <tbody>
          {products.map(p => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td align="center">Rp{p.price}</td>
              <td align="center">{p.unit}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
