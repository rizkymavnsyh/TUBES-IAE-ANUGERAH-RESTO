'use client';

import { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { apolloClient } from '@/lib/apollo-client';

const GET_ORDERS = gql`
  query GetOrders($status: OrderStatus) {
    orders(status: $status) {
      id
      orderId
      tableNumber
      customerId
      orderStatus
      paymentStatus
      paymentMethod
      subtotal
      tax
      total
      notes
      createdAt
      items {
        menuId
        name
        quantity
        price
        specialInstructions
      }
    }
  }
`;

const CREATE_ORDER = gql`
  mutation CreateOrder($input: CreateOrderInput!) {
    createOrder(input: $input) {
      order {
        id
        orderId
        total
      }
      message
    }
  }
`;

const UPDATE_ORDER_STATUS = gql`
  mutation UpdateOrderStatus($orderId: String!, $status: OrderStatus!) {
    updateOrderStatus(orderId: $orderId, status: $status) {
      id
      orderId
      orderStatus
    }
  }
`;

const GET_MENUS = gql`
  query GetMenus {
    menus(available: true) {
      id
      menuId
      name
      price
    }
  }
`;

interface OrderItem {
  menuId: string;
  name: string;
  quantity: number;
  price: number;
  specialInstructions: string;
}

export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    customerId: '',
    tableNumber: '',
    paymentMethod: 'cash',
    notes: '',
    items: [{ menuId: '', name: '', quantity: 1, price: 0, specialInstructions: '' }] as OrderItem[],
  });

  const { data, loading, error, refetch } = useQuery(GET_ORDERS, {
    client: apolloClient,
    variables: { status: statusFilter || undefined },
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });

  const { data: menusData } = useQuery(GET_MENUS, { client: apolloClient });

  const [createOrder] = useMutation(CREATE_ORDER, { client: apolloClient });
  const [updateOrderStatus] = useMutation(UPDATE_ORDER_STATUS, {
    client: apolloClient,
    update: (cache, { data }) => {
      if (data?.updateOrderStatus) {
        // Invalidate and refetch
        cache.evict({ fieldName: 'orders' });
        cache.gc();
      }
    },
  });

  const isBackendConnected = !error || error.message !== 'Failed to fetch';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Filter valid items
    const validItems = formData.items.filter(item => item.menuId && item.name && item.quantity > 0 && item.price > 0);

    if (validItems.length === 0) {
      alert('Minimal satu item harus dipilih');
      return;
    }

    try {
      // Generate unique order ID
      const orderId = `ORD-${Date.now()}`;

      await createOrder({
        variables: {
          input: {
            orderId: orderId,
            customerId: formData.customerId || null,
            tableNumber: formData.tableNumber || null,
            paymentMethod: formData.paymentMethod,
            notes: formData.notes || null,
            items: validItems.map(item => ({
              menuId: item.menuId,
              name: item.name,
              quantity: item.quantity,
              price: item.price,
              specialInstructions: item.specialInstructions || null,
            })),
          },
        },
      });
      refetch();
      closeModal();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      console.log('Updating order status:', orderId, newStatus);
      await updateOrderStatus({
        variables: { orderId: orderId, status: newStatus },
      });
      // Force refetch with network-only to ensure fresh data
      await refetch({ status: statusFilter || undefined });
    } catch (err: any) {
      console.error('Error updating order status:', err);
      alert(`Error: ${err.message || 'Gagal mengupdate status order'}`);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({
      customerId: '',
      tableNumber: '',
      paymentMethod: 'cash',
      notes: '',
      items: [{ menuId: '', name: '', quantity: 1, price: 0, specialInstructions: '' }],
    });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { menuId: '', name: '', quantity: 1, price: 0, specialInstructions: '' }]
    });
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData({ ...formData, items: formData.items.filter((_, i) => i !== index) });
    }
  };

  const handleMenuSelect = (index: number, menuId: string) => {
    const selectedMenu = menusData?.menus?.find((m: any) => m.menuId === menuId);
    if (selectedMenu) {
      const newItems = [...formData.items];
      newItems[index] = {
        ...newItems[index],
        menuId: selectedMenu.menuId,
        name: selectedMenu.name,
        price: selectedMenu.price,
      };
      setFormData({ ...formData, items: newItems });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'confirmed': return 'bg-blue-100 text-blue-700';
      case 'preparing': return 'bg-purple-100 text-purple-700';
      case 'ready': return 'bg-indigo-100 text-indigo-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Orders Management</h1>
          <p className="text-slate-500">Kelola pesanan restoran</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          + Buat Pesanan
        </button>
      </div>

      {/* Connection Warning */}
      {!isBackendConnected && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <strong>⚠️ Backend tidak terhubung!</strong>
          <p className="text-sm mt-1">Jalankan: <code className="bg-red-100 px-2 py-0.5 rounded">docker-compose -f docker-compose-python.yml up -d</code></p>
        </div>
      )}

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2">
        {['', 'pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === status
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
          >
            {status || 'Semua'}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : data?.orders?.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {data.orders.map((order: any) => (
            <div key={order.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow relative">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-slate-800">Order #{order.orderId}</h3>
                  <p className="text-sm text-slate-500">
                    {order.tableNumber ? `Meja ${order.tableNumber}` : 'Take Away'}
                    {order.customerId && ` • Customer: ${order.customerId}`}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.orderStatus)}`}>
                  {order.orderStatus}
                </span>
              </div>

              <div className="space-y-2 mb-3">
                {order.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-slate-600">{item.quantity}x {item.name}</span>
                    <span className="text-slate-700">Rp {(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div>
                  <span className="font-bold text-slate-800">Rp {order.total.toLocaleString()}</span>
                  <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                    {order.paymentStatus}
                  </span>
                </div>
                <div className="flex gap-2 flex-shrink-0" style={{ position: 'relative', zIndex: 50 }}>
                  {(() => {
                    const status = order.orderStatus?.toLowerCase() || order.orderStatus;
                    const buttons = [];

                    if (status === 'pending') {
                      buttons.push(
                        <button
                          key="konfirmasi"
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            console.log('Button clicked for order:', order.orderId);
                            handleStatusUpdate(order.orderId, 'confirmed');
                          }}
                          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors cursor-pointer active:scale-95"
                          style={{ position: 'relative', zIndex: 50, pointerEvents: 'auto' }}
                        >
                          Konfirmasi
                        </button>
                      );
                    }

                    if (status === 'confirmed') {
                      buttons.push(
                        <button
                          key="proses"
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            console.log('Button clicked for order:', order.orderId);
                            handleStatusUpdate(order.orderId, 'preparing');
                          }}
                          className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors cursor-pointer active:scale-95"
                          style={{ position: 'relative', zIndex: 50, pointerEvents: 'auto' }}
                        >
                          Proses
                        </button>
                      );
                    }

                    if (status === 'preparing') {
                      buttons.push(
                        <button
                          key="siap"
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            console.log('Button clicked for order:', order.orderId);
                            handleStatusUpdate(order.orderId, 'ready');
                          }}
                          className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors cursor-pointer active:scale-95"
                          style={{ position: 'relative', zIndex: 50, pointerEvents: 'auto' }}
                        >
                          Siap
                        </button>
                      );
                    }

                    if (status === 'ready') {
                      buttons.push(
                        <button
                          key="selesai"
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            console.log('Button clicked for order:', order.orderId);
                            handleStatusUpdate(order.orderId, 'completed');
                          }}
                          className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors cursor-pointer active:scale-95"
                          style={{ position: 'relative', zIndex: 50, pointerEvents: 'auto' }}
                        >
                          Selesai
                        </button>
                      );
                    }

                    if (['pending', 'confirmed'].includes(status)) {
                      buttons.push(
                        <button
                          key="batal"
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            console.log('Button clicked for order:', order.orderId);
                            handleStatusUpdate(order.orderId, 'cancelled');
                          }}
                          className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors cursor-pointer active:scale-95"
                          style={{ position: 'relative', zIndex: 50, pointerEvents: 'auto' }}
                        >
                          Batal
                        </button>
                      );
                    }

                    return buttons;
                  })()}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-slate-400">
          <p className="text-4xl mb-2">📦</p>
          <p>Belum ada pesanan</p>
        </div>
      )}

      {/* Create Order Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-slate-800 mb-4">Buat Pesanan Baru</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">No. Meja</label>
                    <input
                      type="text"
                      value={formData.tableNumber}
                      onChange={(e) => setFormData({ ...formData, tableNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      placeholder="T01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Customer ID</label>
                    <input
                      type="text"
                      value={formData.customerId}
                      onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      placeholder="Opsional"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Metode Pembayaran *</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    required
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="digital_wallet">QRIS / Transfer</option>
                    <option value="loyalty_points">Loyalty Points</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Menu Items *</label>
                  {formData.items.map((item, index) => (
                    <div key={index} className="flex gap-2 mb-2 items-start">
                      <div className="flex-1 space-y-2">
                        <select
                          value={item.menuId}
                          onChange={(e) => handleMenuSelect(index, e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                        >
                          <option value="">Pilih Menu</option>
                          {menusData?.menus?.map((m: any) => (
                            <option key={m.menuId} value={m.menuId}>
                              {m.name} - Rp {m.price.toLocaleString()}
                            </option>
                          ))}
                        </select>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => {
                              const newItems = [...formData.items];
                              newItems[index].quantity = parseInt(e.target.value) || 1;
                              setFormData({ ...formData, items: newItems });
                            }}
                            className="w-20 px-2 py-1 border border-slate-300 rounded text-sm"
                            min="1"
                            placeholder="Qty"
                          />
                          <input
                            type="text"
                            value={item.specialInstructions}
                            onChange={(e) => {
                              const newItems = [...formData.items];
                              newItems[index].specialInstructions = e.target.value;
                              setFormData({ ...formData, items: newItems });
                            }}
                            className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm"
                            placeholder="Catatan khusus"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addItem}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    + Tambah Item
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Catatan</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    rows={2}
                    placeholder="Catatan pesanan..."
                  />
                </div>

                {/* Total Preview */}
                <div className="bg-slate-50 p-3 rounded-lg">
                  <div className="flex justify-between font-semibold">
                    <span>Subtotal:</span>
                    <span>Rp {calculateTotal().toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Buat Pesanan
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
