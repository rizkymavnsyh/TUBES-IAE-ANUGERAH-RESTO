import "../styles/dashboard.css";

const Dashboard = ({ productCount, inventoryCount, orderCount }) => {
  return (
    <div className="dashboard">
      <h1>Selamat datang di sistem Toko Sembako</h1>

      <div className="cards">
        <div className="card">
          <h3>Total Products</h3>
          <p>{productCount}</p>
        </div>

        <div className="card">
          <h3>Total Stock</h3>
          <p>{inventoryCount}</p>
        </div>

        <div className="card">
          <h3>Total Orders</h3>
          <p>{orderCount}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
