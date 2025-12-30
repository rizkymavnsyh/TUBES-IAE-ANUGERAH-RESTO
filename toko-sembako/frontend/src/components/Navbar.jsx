import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav style={styles.nav}>
      <h3>Toko Sembako</h3>
      <div style={styles.menu}>
        <Link to="/">Home</Link>
        <Link to="/products">Products</Link>
        <Link to="/inventory">Inventory</Link>
        <Link to="/orders">Orders</Link>
        <Link to="/login">Login</Link>
        <Link to="/register">Register</Link>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px 20px",
    background: "#2563eb",
    color: "white"
  },
  menu: {
    display: "flex",
    gap: "15px"
  }
};
