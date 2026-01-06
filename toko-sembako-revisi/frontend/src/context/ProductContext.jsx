import { createContext, useEffect, useState } from "react";
import { fetchProducts } from "../api/graphql";

export const ProductContext = createContext();

export function ProductProvider({ children }) {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchProducts().then(data => setProducts(data.getProducts));
  }, []);

  return (
    <ProductContext.Provider value={{ products }}>
      {children}
    </ProductContext.Provider>
  );
}
