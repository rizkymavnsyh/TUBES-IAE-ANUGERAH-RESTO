import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import {
  syncProducts,
  syncInventory,
  fetchOrdersAPI,
  createOrderAPI,
  cancelOrderAPI
} from "./api/graphqlSync";
import { loadFromGraphQL } from "./api/graphqlSync";

import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Inventory from "./pages/Inventory";
import Orders from "./pages/Orders";
import AuthModal from "./components/AuthModal";

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [authType, setAuthType] = useState(null);
  const [registeredUser, setRegisteredUser] = useState(null);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [alert, setAlert] = useState(null);

  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [orders, setOrders] = useState([]);

  // =============================
  // LOAD DATA DARI GRAPHQL
  // =============================
  const loadAll = async () => {
    const products = await syncProducts();
    setProducts(products);
    setInventory(await syncInventory(products));
    setOrders(await fetchOrdersAPI());
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    loadFromGraphQL();
  }, []);

  // =============================
  // AUTH
  // =============================
  const handleRegister = (data) => {
    setRegisteredUser(data);
    setAlert("Register berhasil! Silakan login.");
    setAuthType("login");
  };

  const handleLogin = (data) => {
    if (!registeredUser) {
      setAlert("Silakan register terlebih dahulu.");
      return;
    }

    if (
      data.email === registeredUser.email &&
      data.password === registeredUser.password
    ) {
      setLoggedInUser({ username: registeredUser.username });
      setAlert("Login berhasil!");
      setAuthType(null);
    } else {
      setAlert("Email atau password salah!");
    }
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    setSidebarOpen(false);
    setAlert("Logout berhasil");
  };

  // =============================
  // PRODUCT
  // =============================
  const addProduct = (product) => {
    setProducts(prev => [...prev, product]);
    loadFromGraphQL(); // refresh inventory juga
  };

  // =============================
  // SUBMIT ORDER
  // =============================
  const handleSubmitOrder = async (order) => {
    try {
      await createOrderAPI(
        order.items.map(i => ({
          productId: i.productId,
          qty: i.qty
        }))
      );

      await loadAll(); // 🔥 reload orders + inventory
      setAlert("Order berhasil disimpan");

    } catch (err) {
      setAlert("Order gagal: " + err.message);
    }
  };

/* ================= CANCEL ORDER ================= */
const handleCancelOrder = async (orderId) => {
  try {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    // rollback stok
    for (let item of order.items) {
      await fetch("http://localhost:5000/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `
            mutation {
              increaseStock(
                productId: "${item.productId}",
                qty: ${item.qty}
              ) {
                stock
              }
            }
          `
        })
      });
    }

    await cancelOrderAPI(orderId);
    await loadAll();

    setAlert("Order berhasil dibatalkan");

  } catch (err) {
    setAlert("Cancel gagal: " + err.message);
  }
};

  // =============================
  // DASHBOARD COUNT
  // =============================
  const productCount = products.length;

  const inventoryCount = inventory.reduce(
    (total, item) => total + item.stock,
    0
  );

  const orderCount = orders.filter(
    o => o.status === "CONFIRMED"
  ).length;

  // =============================
  // ALERT AUTO CLOSE
  // =============================
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  return (
    <>
      <Navbar
        toggleSidebar={() =>
          loggedInUser
            ? setSidebarOpen(!sidebarOpen)
            : setAlert("Silakan login terlebih dahulu")
        }
        openLogin={() => setAuthType("login")}
        openRegister={() => setAuthType("register")}
        username={loggedInUser?.username}
        logout={handleLogout}
      />

      {loggedInUser && <Sidebar isOpen={sidebarOpen} />}

      <main
        style={{
          marginTop: "64px",
          marginLeft: loggedInUser && sidebarOpen ? "180px" : "0",
          padding: "24px",
          transition: "margin-left 0.3s ease",
        }}
      >
        <Routes>
          <Route
            path="/"
            element={
              <Dashboard
                productCount={productCount}
                inventoryCount={inventoryCount}
                orderCount={orderCount}
              />
            }
          />

          <Route
            path="/products"
            element={
              <Products
                products={products}
                addProduct={addProduct}
              />
            }
          />

          <Route
            path="/inventory"
            element={
              <Inventory
                inventory={inventory}
                setInventory={setInventory}
              />
            }
          />

          <Route
            path="/orders"
            element={
              <Orders
                products={products}
                inventory={inventory}
                orders={orders}
                onSubmitOrder={handleSubmitOrder}
                onCancelOrder={handleCancelOrder}
              />
            }
          />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>

      {authType && (
        <AuthModal
          type={authType}
          onRegister={handleRegister}
          onLogin={handleLogin}
          close={() => setAuthType(null)}
        />
      )}

      {alert && (
        <div
          onClick={() => setAlert(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 3000,
          }}
        >
          <div
            style={{
              background: "white",
              padding: "20px 28px",
              borderRadius: 10,
              fontSize: 16,
              fontWeight: 500,
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            }}
          >
            {alert}
          </div>
        </div>
      )}
    </>
  );
}

export default App;
