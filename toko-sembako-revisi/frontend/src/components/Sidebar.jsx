import { NavLink } from "react-router-dom";
import "../styles/sidebar.css";

export default function Sidebar({ isOpen }) {
  return (
    <aside className={`sidebar ${!isOpen ? "closed" : ""}`}>

      <NavLink
        to="/inventory"
        className={({ isActive }) =>
          isActive ? "menu active" : "menu"
        }
      >
        Inventory
      </NavLink>

      <NavLink
        to="/orders"
        className={({ isActive }) =>
          isActive ? "menu active" : "menu"
        }
      >
        Orders
      </NavLink>

      <NavLink
        to="/products"
        className={({ isActive }) =>
          isActive ? "menu active" : "menu"
        }
      >
        Products
      </NavLink>

    </aside>
  );
}
