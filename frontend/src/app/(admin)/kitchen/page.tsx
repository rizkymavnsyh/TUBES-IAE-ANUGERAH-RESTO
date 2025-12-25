'use client';

import { useQuery, useMutation, gql } from '@apollo/client';
import { useEffect } from 'react';
import { kitchenApolloClient } from '@/lib/apollo-client';

const GET_KITCHEN_ORDERS = gql`
  query GetKitchenOrders($status: String) {
    kitchenOrders(status: $status) {
      id
      orderId
      tableNumber
      status
      priority
      estimatedTime
      notes
      createdAt
      items {
        menuId
        name
        quantity
        specialInstructions
      }
      chef {
        id
        name
        specialization
        status
      }
    }
  }
`;

const GET_CHEFS = gql`
  query GetChefs {
    chefs {
      id
      name
      specialization
      status
      currentOrders
    }
  }
`;

const UPDATE_ORDER_STATUS = gql`
  mutation UpdateOrderStatus($id: String!, $status: String!) {
    updateOrderStatus(id: $id, status: $status) {
      id
      status
    }
  }
`;

const ASSIGN_CHEF = gql`
  mutation AssignChef($orderId: String!, $chefId: String!) {
    assignChef(orderId: $orderId, chefId: $chefId) {
      id
      chef {
        name
      }
    }
  }
`;

const COMPLETE_ORDER = gql`
  mutation CompleteOrder($orderId: String!) {
    completeOrder(orderId: $orderId) {
      id
      status
    }
  }
`;

export default function KitchenPage() {
  const { data: pendingData, loading: pendingLoading, error, refetch: refetchPending } = useQuery(GET_KITCHEN_ORDERS, {
    client: kitchenApolloClient,
    variables: { status: 'pending' },
    pollInterval: 5000,
    fetchPolicy: 'cache-and-network',
  });

  const { data: preparingData, loading: preparingLoading, refetch: refetchPreparing } = useQuery(GET_KITCHEN_ORDERS, {
    client: kitchenApolloClient,
    variables: { status: 'preparing' },
    pollInterval: 5000,
    fetchPolicy: 'cache-and-network',
  });

  const { data: chefsData, error: chefsError } = useQuery(GET_CHEFS, { 
    client: kitchenApolloClient,
  });

  useEffect(() => {
    if (error) {
      console.error('Error fetching pending orders:', error);
    }
  }, [error]);

  useEffect(() => {
    if (pendingData) {
      console.log('Pending orders data:', pendingData);
    }
  }, [pendingData]);

  useEffect(() => {
    if (preparingData) {
      console.log('Preparing orders data:', preparingData);
    }
  }, [preparingData]);

  useEffect(() => {
    if (chefsData) {
      console.log('Chefs data:', chefsData);
    }
    if (chefsError) {
      console.error('Error fetching chefs:', chefsError);
    }
  }, [chefsData, chefsError]);

  const [updateOrderStatus] = useMutation(UPDATE_ORDER_STATUS, { client: kitchenApolloClient });
  const [assignChef] = useMutation(ASSIGN_CHEF, { client: kitchenApolloClient });
  const [completeOrder] = useMutation(COMPLETE_ORDER, { client: kitchenApolloClient });

  const isBackendConnected = !error || error.message !== 'Failed to fetch';

  const handleAcceptOrder = async (orderId: string) => {
    try {
      await updateOrderStatus({ variables: { id: orderId, status: 'preparing' } });
      refetchPending();
      refetchPreparing();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleCompleteOrder = async (orderId: string) => {
    try {
      await completeOrder({ variables: { orderId } });
      refetchPreparing();
    } catch (err: any) {
      // Try alternative method
      try {
        await updateOrderStatus({ variables: { id: orderId, status: 'ready' } });
        refetchPreparing();
      } catch (err2: any) {
        alert(`Error: ${err2.message}`);
      }
    }
  };

  const handleAssignChef = async (orderId: string, chefId: string) => {
    try {
      await assignChef({ variables: { orderId, chefId } });
      refetchPreparing();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const getTimeSince = (dateString: string) => {
    const now = new Date();
    const created = new Date(dateString);
    const diff = Math.floor((now.getTime() - created.getTime()) / 1000 / 60);
    if (diff < 1) return 'Baru saja';
    if (diff < 60) return `${diff} menit lalu`;
    return `${Math.floor(diff / 60)} jam lalu`;
  };

  const getPriorityBadge = (priority: number) => {
    if (priority >= 3) return { color: 'bg-red-100 text-red-700', label: 'Urgent' };
    if (priority >= 2) return { color: 'bg-yellow-100 text-yellow-700', label: 'High' };
    return { color: 'bg-green-100 text-green-700', label: 'Normal' };
  };

  const availableChefs = chefsData?.chefs?.filter((c: any) => c.status === 'available' || c.status === 'AVAILABLE') || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Kitchen Display</h1>
        <p className="text-slate-500">Tampilan dapur untuk pesanan</p>
      </div>

      {/* Connection Warning */}
      {!isBackendConnected && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <strong>⚠️ Backend tidak terhubung!</strong>
          <p className="text-sm mt-1">Jalankan: <code className="bg-red-100 px-2 py-0.5 rounded">docker-compose -f docker-compose-python.yml up -d</code></p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <strong>⚠️ Error:</strong>
          <p className="text-sm mt-1">{error.message}</p>
          {error.graphQLErrors && error.graphQLErrors.length > 0 && (
            <ul className="text-xs mt-2 list-disc list-inside">
              {error.graphQLErrors.map((err: any, idx: number) => (
                <li key={idx}>{err.message}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-3xl font-bold text-yellow-700">{pendingData?.kitchenOrders?.length || 0}</p>
          <p className="text-sm text-yellow-600">Menunggu</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-3xl font-bold text-blue-700">{preparingData?.kitchenOrders?.length || 0}</p>
          <p className="text-sm text-blue-600">Sedang Diproses</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-3xl font-bold text-green-700">{availableChefs.length}</p>
          <p className="text-sm text-green-600">Chef Tersedia</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <p className="text-3xl font-bold text-purple-700">{chefsData?.chefs?.length || 0}</p>
          <p className="text-sm text-purple-600">Total Chef</p>
        </div>
      </div>

      {/* Chef List */}
      {chefsData?.chefs?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-800 mb-3">👨‍🍳 Status Chef</h3>
          <div className="flex flex-wrap gap-2">
            {chefsData.chefs.map((chef: any) => (
              <div 
                key={chef.id} 
                className={`px-3 py-2 rounded-lg text-sm ${
                  (chef.status === 'available' || chef.status === 'AVAILABLE')
                    ? 'bg-green-100 text-green-700' 
                    : (chef.status === 'busy' || chef.status === 'BUSY')
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                <span className="font-medium">{chef.name}</span>
                <span className="text-xs ml-1">({chef.specialization || 'General'})</span>
                <span className="block text-xs">{chef.currentOrders} orders</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Orders */}
        <div>
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></span>
            Pesanan Menunggu ({pendingData?.kitchenOrders?.length || 0})
          </h2>
          {pendingLoading ? (
            <div className="text-center py-8 text-slate-400">Loading...</div>
          ) : pendingData?.kitchenOrders?.length > 0 ? (
            <div className="space-y-3">
              {pendingData.kitchenOrders.map((order: any) => {
                const priority = getPriorityBadge(order.priority);
                return (
                  <div key={order.id} className="bg-white rounded-xl shadow-sm border border-yellow-200 p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-800">
                            {order.tableNumber ? `Meja ${order.tableNumber}` : 'Take Away'}
                          </h3>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${priority.color}`}>
                            {priority.label}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500">Order: {order.orderId}</p>
                        <p className="text-xs text-slate-400">{getTimeSince(order.createdAt)}</p>
                      </div>
                      <button
                        onClick={() => handleAcceptOrder(order.id)}
                        className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
                      >
                        Terima
                      </button>
                    </div>
                    <div className="space-y-1">
                      {order.items.map((item: any, idx: number) => (
                        <div key={idx} className="text-sm">
                          <span className="font-medium">{item.quantity}x</span> {item.name}
                          {item.specialInstructions && (
                            <span className="text-orange-600 ml-2 text-xs">📝 {item.specialInstructions}</span>
                          )}
                        </div>
                      ))}
                    </div>
                    {order.notes && (
                      <p className="mt-2 text-xs text-slate-500 bg-slate-50 p-2 rounded">📝 {order.notes}</p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl">
              Tidak ada pesanan menunggu
            </div>
          )}
        </div>

        {/* Preparing Orders */}
        <div>
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></span>
            Sedang Diproses ({preparingData?.kitchenOrders?.length || 0})
          </h2>
          {preparingLoading ? (
            <div className="text-center py-8 text-slate-400">Loading...</div>
          ) : preparingData?.kitchenOrders?.length > 0 ? (
            <div className="space-y-3">
              {preparingData.kitchenOrders.map((order: any) => (
                <div key={order.id} className="bg-white rounded-xl shadow-sm border border-blue-200 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-slate-800">
                        {order.tableNumber ? `Meja ${order.tableNumber}` : 'Take Away'}
                      </h3>
                      <p className="text-sm text-slate-500">Order: {order.orderId}</p>
                      <p className="text-xs text-slate-400">{getTimeSince(order.createdAt)}</p>
                      {order.chef && (
                        <p className="text-xs text-blue-600 mt-1">👨‍🍳 {order.chef.name}</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleCompleteOrder(order.orderId)}
                        className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700"
                      >
                        Siap Antar
                      </button>
                      {!order.chef && availableChefs.length > 0 && (
                        <select
                          onChange={(e) => e.target.value && handleAssignChef(order.orderId, e.target.value)}
                          className="text-xs px-2 py-1 border border-slate-300 rounded"
                          defaultValue=""
                        >
                          <option value="">Assign Chef</option>
                          {availableChefs.map((chef: any) => (
                            <option key={chef.id} value={chef.id}>{chef.name}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    {order.items.map((item: any, idx: number) => (
                      <div key={idx} className="text-sm flex items-center gap-2">
                        <input type="checkbox" className="w-4 h-4 rounded" />
                        <span className="font-medium">{item.quantity}x</span> {item.name}
                        {item.specialInstructions && (
                          <span className="text-orange-600 text-xs">📝 {item.specialInstructions}</span>
                        )}
                      </div>
                    ))}
                  </div>
                  {order.estimatedTime && (
                    <p className="mt-2 text-xs text-slate-500">⏱️ Est: {order.estimatedTime} menit</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl">
              Tidak ada pesanan diproses
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
