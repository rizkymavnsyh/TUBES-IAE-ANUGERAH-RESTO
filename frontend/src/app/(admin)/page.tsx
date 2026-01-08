'use client';

import { useQuery, gql } from '@apollo/client';
import { apolloClient, inventoryApolloClient } from '@/lib/apollo-client';

// GraphQL Queries
const GET_MENUS = gql`
  query GetMenus {
    menus {
      id
      name
      price
      category
      available
    }
  }
`;

const GET_ORDERS = gql`
  query GetOrders {
    orders {
      id
      orderId
      orderStatus
      total
      createdAt
    }
  }
`;

const GET_INVENTORY = gql`
  query GetIngredients {
    ingredients {
      id
      name
      currentStock
      minStockLevel
      status
    }
  }
`;

export default function DashboardPage() {
  const { data: menusData, loading: menusLoading, error: menusError } = useQuery(GET_MENUS, { client: apolloClient });
  const { data: ordersData, loading: ordersLoading, error: ordersError } = useQuery(GET_ORDERS, { client: apolloClient });
  const { data: inventoryData, loading: inventoryLoading, error: inventoryError } = useQuery(GET_INVENTORY, { client: inventoryApolloClient });

  // Calculate stats
  const totalMenus = menusData?.menus?.length || 0;
  const availableMenus = menusData?.menus?.filter((m: any) => m.available).length || 0;
  const totalOrders = ordersData?.orders?.length || 0;
  const pendingOrders = ordersData?.orders?.filter((o: any) => o.orderStatus === 'pending').length || 0;
  const lowStockItems = inventoryData?.ingredients?.filter((i: any) =>
    i.status !== 'inactive' && i.currentStock <= i.minStockLevel
  ).length || 0;
  const totalRevenue = ordersData?.orders?.reduce((sum: number, o: any) => {
    if (o.orderStatus === 'completed') return sum + (o.total || 0);
    return sum;
  }, 0) || 0;

  const isBackendConnected = !menusError || menusError.message !== 'Failed to fetch';

  const stats = [
    { label: 'Total Menu Items', value: totalMenus, color: 'bg-blue-500', icon: '🍽️' },
    { label: 'Available Items', value: availableMenus, color: 'bg-green-500', icon: '✅' },
    { label: 'Total Orders', value: totalOrders, color: 'bg-purple-500', icon: '📦' },
    { label: 'Pending Orders', value: pendingOrders, color: 'bg-orange-500', icon: '⏳' },
    { label: 'Low Stock Items', value: lowStockItems, color: 'bg-red-500', icon: '⚠️' },
    { label: 'Revenue', value: `Rp ${totalRevenue.toLocaleString('de-DE')}`, color: 'bg-emerald-500', icon: '💰' },
  ];

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500">Welcome to Anugerah Resto Management System</p>
      </div>

      {/* Connection Warning */}
      {!isBackendConnected && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <strong>⚠️ Backend tidak terhubung!</strong>
          <p className="text-sm mt-1">Jalankan: <code className="bg-red-100 px-2 py-0.5 rounded">docker-compose -f docker-compose-python.yml up -d</code></p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">
                  {menusLoading || ordersLoading || inventoryLoading ? '...' : stat.value}
                </p>
              </div>
              <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center text-2xl`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Recent Orders</h2>
          {ordersLoading ? (
            <div className="text-center py-8 text-slate-400">Loading...</div>
          ) : ordersData?.orders?.length > 0 ? (
            <div className="space-y-3">
              {ordersData.orders.slice(0, 5).map((order: any) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-700">Order #{order.id.slice(0, 8)}</p>
                    <p className="text-sm text-slate-500">
                      {new Date(order.createdAt).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${order.orderStatus === 'completed' ? 'bg-green-100 text-green-700' :
                      order.orderStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        order.orderStatus === 'preparing' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                      }`}>
                      {order.orderStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">No orders yet</div>
          )}
        </div>

        {/* Popular Menu Items */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Menu Items</h2>
          {menusLoading ? (
            <div className="text-center py-8 text-slate-400">Loading...</div>
          ) : menusData?.menus?.length > 0 ? (
            <div className="space-y-3">
              {menusData.menus.slice(0, 5).map((menu: any) => (
                <div key={menu.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-700">{menu.name}</p>
                    <p className="text-sm text-slate-500">{menu.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-slate-700">Rp {menu.price.toLocaleString('de-DE')}</p>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${menu.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                      {menu.available ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">No menu items yet</div>
          )}
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <h3 className="font-semibold text-amber-800 mb-3">⚠️ Low Stock Alert</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {inventoryData?.ingredients
              ?.filter((item: any) => item.status !== 'inactive' && item.currentStock <= item.minStockLevel)
              .slice(0, 6)
              .map((item: any) => (
                <div key={item.id} className="bg-white p-3 rounded-lg border border-amber-200">
                  <p className="font-medium text-slate-700">{item.name}</p>
                  <p className="text-sm text-red-600">
                    Stock: {item.currentStock} (Min: {item.minStockLevel})
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
