import { useState } from "react";
import "../styles/authModal.css";

function AuthModal({ type, close, onRegister, onLogin }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = () => {
    if (type === "register") {
      onRegister({ username, email, password });
    } else {
      onLogin({ email, password });
    }
  };

  return (
    <div className="modal-backdrop" onClick={close}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{type === "login" ? "Login" : "Register"}</h2>

        {type === "register" && (
          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        )}

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={handleSubmit}>
          {type === "login" ? "Login" : "Register"}
        </button>
      </div>
    </div>
  );
}

export default AuthModal;
