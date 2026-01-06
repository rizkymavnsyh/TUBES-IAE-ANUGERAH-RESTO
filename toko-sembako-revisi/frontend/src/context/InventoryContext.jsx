import { createContext, useContext, useEffect, useState } from "react";
import { ProductContext } from "./ProductContext";
import { fetchInventory } from "../api/graphql";

export const InventoryContext = createContext();

export function InventoryProvider({ children }) {
  const { products } = useContext(ProductContext);
  const [inventory, setInventory] = useState([]);

  useEffect(() => {
    async function load() {
      const data = await Promise.all(
        products.map(async p => {
          const inv = await fetchInventory(p.id);
          return {
            productId: p.id,
            name: p.name,
            stock: inv?.getInventory?.stock || 0
          };
        })
      );
      setInventory(data);
    }

    if (products.length) load();
  }, [products]);

  return (
    <InventoryContext.Provider value={{ inventory }}>
      {children}
    </InventoryContext.Provider>
  );
}
