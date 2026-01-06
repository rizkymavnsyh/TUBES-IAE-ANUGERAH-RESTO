import { FaBars, FaUserCircle } from "react-icons/fa";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/navbar.css";

function Navbar({
  toggleSidebar,
  openLogin,
  openRegister,
  username,
  logout,
}) {
  const [openProfile, setOpenProfile] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpenProfile(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <FaBars className="icon" onClick={toggleSidebar} />
        <h2
          style={{ cursor: "pointer" }}
          onClick={() => navigate("/dashboard")}
        >
          Toko Sembako
        </h2>
      </div>

      <div className="navbar-right" ref={ref}>
        {/* 🔥 PROFILE MENU */}
        <div
          className="profile-menu"
          onClick={() => setOpenProfile(!openProfile)}
        >
          {username && <span className="username">{username}</span>}
          <FaUserCircle className="user-icon" />
        </div>

        {openProfile && (
          <div className="user-dropdown">
            {!username ? (
              <>
                <button onClick={openLogin}>Login</button>
                <button onClick={openRegister}>Register</button>
              </>
            ) : (
              <button onClick={logout}>Logout</button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
