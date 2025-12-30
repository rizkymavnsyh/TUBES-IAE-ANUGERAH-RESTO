import { useEffect, useState } from "react";
import { fetchProducts } from "../api/graphql";

export default function Products() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchProducts().then(setProducts);
  }, []);

  return (
    <div>
      <h2>Product List</h2>

      <ul>
        {products.map(p => (
          <li key={p.id}>
            {p.name} — Rp{p.price} / {p.unit}
          </li>
        ))}
      </ul>
    </div>
  );
}
