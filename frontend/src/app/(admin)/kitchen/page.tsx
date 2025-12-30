'use client';

import { useQuery, useMutation, gql } from '@apollo/client';
import { useEffect, useState } from 'react';
import { kitchenApolloClient } from '@/lib/apollo-client';

const GET_PENDING_ORDERS = gql`
  query GetPendingOrders {
    pendingOrders {
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

const GET_PREPARING_ORDERS = gql`
  query GetPreparingOrders {
    preparingOrders {
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
  mutation UpdateOrderStatus($id: ID!, $status: OrderStatus!) {
    updateOrderStatus(id: $id, status: $status) {
      id
      status
    }
  }
`;

const ASSIGN_CHEF = gql`
  mutation AssignChef($orderId: ID!, $chefId: ID!) {
    assignChef(orderId: $orderId, chefId: $chefId) {
      id
      chef {
        name
      }
    }
  }
`;

const COMPLETE_ORDER = gql`
  mutation CompleteOrder($orderId: ID!) {
    completeOrder(orderId: $orderId) {
      id
      status
    }
  }
`;

const UPDATE_KITCHEN_ORDER = gql`
  mutation UpdateKitchenOrder($id: ID!, $input: UpdateKitchenOrderInput!) {
    updateKitchenOrder(id: $id, input: $input) {
      id
      notes
      priority
      estimatedTime
    }
  }
`;

export default function KitchenPage() {
  const [checkedItems, setCheckedItems] = useState<{ [key: string]: boolean[] }>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: pendingData, loading: pendingLoading, error, refetch: refetchPending } = useQuery(GET_PENDING_ORDERS, {
    client: kitchenApolloClient,
    pollInterval: 5000,
    fetchPolicy: 'cache-and-network',
  });

  const { data: preparingData, loading: preparingLoading, refetch: refetchPreparing } = useQuery(GET_PREPARING_ORDERS, {
    client: kitchenApolloClient,
    pollInterval: 5000,
    fetchPolicy: 'cache-and-network',
  });

  const { data: chefsData, error: chefsError, refetch: refetchChefs } = useQuery(GET_CHEFS, {
    client: kitchenApolloClient,
    pollInterval: 5000,
    fetchPolicy: 'cache-and-network',
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
  const [updateKitchenOrder] = useMutation(UPDATE_KITCHEN_ORDER, { client: kitchenApolloClient });

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    notes: '',
    priority: 0,
    estimatedTime: 15,
  });

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
      refetchChefs(); // Update chef status immediately
    } catch (err: any) {
      console.error('Error completing order:', err.message);
      // Silently fail - order may already be completed
    }
  };

  const handleAssignChef = async (orderId: string, chefId: string) => {
    try {
      await assignChef({ variables: { orderId, chefId } });
      refetchPreparing();
      refetchChefs(); // Update chef status immediately
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleEditOrder = (order: any) => {
    setEditingOrder(order);
    setEditFormData({
      notes: order.notes || '',
      priority: order.priority || 0,
      estimatedTime: order.estimatedTime || 15,
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingOrder) return;
    try {
      await updateKitchenOrder({
        variables: {
          id: editingOrder.id,
          input: {
            notes: editFormData.notes || null,
            priority: editFormData.priority,
            estimatedTime: editFormData.estimatedTime,
          },
        },
      });
      setShowEditModal(false);
      setEditingOrder(null);
      refetchPending();
      refetchPreparing();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const getTimeSince = (dateString: string) => {
    if (!mounted) return '-';
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

  // Detect order category based on item names
  const getOrderCategory = (items: any[]) => {
    const itemNames = items.map(i => i.name?.toLowerCase() || '').join(' ');

    // Check for category keywords
    if (itemNames.includes('appetizer') || itemNames.includes('salad') || itemNames.includes('soup') || itemNames.includes('starter')) {
      return 'Appetizer';
    }
    if (itemNames.includes('dessert') || itemNames.includes('cake') || itemNames.includes('ice cream') || itemNames.includes('pudding') || itemNames.includes('sweet')) {
      return 'Dessert';
    }
    if (itemNames.includes('grill') || itemNames.includes('bbq') || itemNames.includes('steak') || itemNames.includes('ribs') || itemNames.includes('satay') || itemNames.includes('sate')) {
      return 'Grill & BBQ';
    }
    if (itemNames.includes('drink') || itemNames.includes('juice') || itemNames.includes('coffee') || itemNames.includes('tea') || itemNames.includes('beverage')) {
      return 'Beverages';
    }
    // Default to Main Course
    return 'Main Course';
  };

  // Get chefs that can handle this order based on specialization
  const getAvailableChefsForOrder = (order: any) => {
    const orderCategory = getOrderCategory(order.items || []);
    return (chefsData?.chefs || []).filter((c: any) => {
      const isAvailable = c.status === 'available' || c.status === 'AVAILABLE' || c.status === 'busy' || c.status === 'BUSY';
      const specialization = c.specialization?.toLowerCase() || '';
      const orderCatLower = orderCategory.toLowerCase();

      // Match if specialization contains the category or vice versa
      // Also allow "General" chefs to handle any order
      const canHandle = specialization.includes(orderCatLower) ||
        orderCatLower.includes(specialization.split(' ')[0]) ||
        specialization.includes('general') ||
        specialization === 'all';

      return isAvailable && canHandle;
    });
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
          <p className="text-3xl font-bold text-yellow-700">{pendingData?.pendingOrders?.length || 0}</p>
          <p className="text-sm text-yellow-600">Menunggu</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-3xl font-bold text-blue-700">{preparingData?.preparingOrders?.length || 0}</p>
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
                className={`px-3 py-2 rounded-lg text-sm ${(chef.status === 'available' || chef.status === 'AVAILABLE')
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
            Pesanan Menunggu ({pendingData?.pendingOrders?.length || 0})
          </h2>
          {pendingLoading ? (
            <div className="text-center py-8 text-slate-400">Loading...</div>
          ) : pendingData?.pendingOrders?.length > 0 ? (
            <div className="space-y-3">
              {pendingData.pendingOrders.map((order: any) => {
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
                        <p className="text-xs text-blue-600 font-medium">🍽️ {getOrderCategory(order.items || [])}</p>
                        <p className="text-xs text-slate-400">{getTimeSince(order.createdAt)}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditOrder(order)}
                          className="px-3 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleAcceptOrder(order.id)}
                          className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
                        >
                          Terima
                        </button>
                      </div>
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
            Sedang Diproses ({preparingData?.preparingOrders?.length || 0})
          </h2>
          {preparingLoading ? (
            <div className="text-center py-8 text-slate-400">Loading...</div>
          ) : preparingData?.preparingOrders?.length > 0 ? (
            <div className="space-y-3">
              {preparingData.preparingOrders.map((order: any) => {
                const chefsForThisOrder = getAvailableChefsForOrder(order);
                const orderCategory = getOrderCategory(order.items || []);
                return (
                  <div key={order.id} className="bg-white rounded-xl shadow-sm border border-blue-200 p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-slate-800">
                          {order.tableNumber ? `Meja ${order.tableNumber}` : 'Take Away'}
                        </h3>
                        <p className="text-sm text-slate-500">Order: {order.orderId}</p>
                        <p className="text-xs text-blue-600 font-medium">🍽️ {orderCategory}</p>
                        <p className="text-xs text-slate-400">{getTimeSince(order.createdAt)}</p>
                        {order.chef && (
                          <p className="text-xs text-green-600 mt-1">👨‍🍳 {order.chef.name} ({order.chef.specialization})</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleEditOrder(order)}
                          className="px-3 py-1 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleCompleteOrder(order.id)}
                          disabled={!order.chef}
                          className={`px-4 py-2 text-white text-sm font-medium rounded-lg ${order.chef ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-400 cursor-not-allowed'}`}
                          title={!order.chef ? 'Assign chef terlebih dahulu' : 'Tandai pesanan siap antar'}
                        >
                          Siap Antar
                        </button>
                        {!order.chef && (
                          chefsForThisOrder.length > 0 ? (
                            <select
                              onChange={(e) => e.target.value && handleAssignChef(order.id, e.target.value)}
                              className="text-xs px-2 py-1 border border-slate-300 rounded"
                              defaultValue=""
                            >
                              <option value="">Assign Chef ({orderCategory})</option>
                              {chefsForThisOrder.map((chef: any) => (
                                <option key={chef.id} value={chef.id}>
                                  {chef.name} ({chef.currentOrders} orders)
                                </option>
                              ))}
                            </select>
                          ) : (
                            <p className="text-xs text-red-500">❌ Tidak ada chef {orderCategory}</p>
                          )
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      {order.items.map((item: any, idx: number) => (
                        <div key={idx} className="text-sm flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded accent-green-600"
                            checked={checkedItems[order.id]?.[idx] || false}
                            onChange={() => {
                              setCheckedItems(prev => ({
                                ...prev,
                                [order.id]: {
                                  ...(prev[order.id] || {}),
                                  [idx]: !prev[order.id]?.[idx]
                                }
                              }));
                            }}
                          />
                          <span className={`font-medium ${checkedItems[order.id]?.[idx] ? 'line-through text-gray-400' : ''}`}>{item.quantity}x</span>
                          <span className={checkedItems[order.id]?.[idx] ? 'line-through text-gray-400' : ''}>{item.name}</span>
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
                );
              })
              }
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl">
              Tidak ada pesanan diproses
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {
        showEditModal && editingOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-md">
              <div className="p-6">
                <h2 className="text-xl font-bold text-slate-800 mb-4">
                  Edit Order #{editingOrder.orderId}
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                    <select
                      value={editFormData.priority}
                      onChange={(e) => setEditFormData({ ...editFormData, priority: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    >
                      <option value={0}>Normal</option>
                      <option value={1}>Low</option>
                      <option value={2}>High</option>
                      <option value={3}>Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Estimated Time (menit)</label>
                    <input
                      type="number"
                      value={editFormData.estimatedTime}
                      onChange={(e) => setEditFormData({ ...editFormData, estimatedTime: parseInt(e.target.value) || 15 })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      min="1"
                      max="120"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Catatan</label>
                    <textarea
                      value={editFormData.notes}
                      onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      rows={3}
                      placeholder="Catatan untuk dapur..."
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => { setShowEditModal(false); setEditingOrder(null); }}
                      className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Simpan
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
