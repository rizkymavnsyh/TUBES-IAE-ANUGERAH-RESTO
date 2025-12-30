import { gql, useQuery } from "@apollo/client";

const GET_ORDERS = gql`
  query {
    getOrders {
      id
      restaurantId
      status
      total
      items {
        productId
        qty
        price
        subtotal
      }
    }
  }
`;

function App() {
  const { loading, error, data } = useQuery(GET_ORDERS);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div style={{ padding: 20 }}>
      <h1>Daftar Order</h1>

      {data.getOrders.map(order => (
        <div key={order.id} style={{ border: "1px solid #ccc", marginBottom: 10, padding: 10 }}>
          <p><b>Order ID:</b> {order.id}</p>
          <p><b>Restaurant:</b> {order.restaurantId}</p>
          <p><b>Status:</b> {order.status}</p>
          <p><b>Total:</b> {order.total}</p>
        </div>
      ))}
    </div>
  );
}

export default App;
