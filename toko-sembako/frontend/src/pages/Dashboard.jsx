import { Link } from "react-router-dom";

export default function Dashboard() {
  return (
    <div>
      <h2>Dashboard</h2>
      <ul>
        <li><Link to="/products">Products</Link></li>
        <li><Link to="/inventory">Inventory</Link></li>
        <li><Link to="/orders">Orders</Link></li>
      </ul>
    </div>
  );
}
