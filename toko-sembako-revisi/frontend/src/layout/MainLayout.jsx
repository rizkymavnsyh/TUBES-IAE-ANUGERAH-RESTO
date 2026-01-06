import { useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} />

      <main
        style={{
          marginTop: "var(--navbar-height)",
          marginLeft: sidebarOpen ? "240px" : "0",
          padding: "24px",
          transition: "0.3s",
        }}
      >
        {children}
      </main>
    </>
  );
};

export default MainLayout;
