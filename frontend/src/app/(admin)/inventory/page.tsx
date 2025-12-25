'use client';

import { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { inventoryApolloClient } from '@/lib/apollo-client';

const GET_INGREDIENTS = gql`
  query GetIngredients($category: String, $status: String) {
    ingredients(category: $category, status: $status) {
      id
      name
      unit
      category
      minStockLevel
      currentStock
      costPerUnit
      status
      supplier {
        id
        name
        contactPerson
        phone
      }
    }
  }
`;

const GET_TOKO_SEMBAKO_PRODUCTS = gql`
  query GetTokoSembakoProducts($category: String) {
    tokoSembakoProducts(category: $category) {
      id
      name
      category
      price
      unit
      available
      description
    }
  }
`;

const PURCHASE_FROM_TOKO_SEMBAKO = gql`
  mutation PurchaseFromTokoSembako($input: PurchaseFromTokoSembakoInput!) {
    purchaseFromTokoSembako(input: $input) {
      success
      message
      tokoSembakoOrder {
        id
        orderId
        status
        total
      }
      stockAdded
    }
  }
`;

export default function InventoryPage() {
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseItems, setPurchaseItems] = useState([{ productId: '', quantity: 1 }]);
  const [orderNumber, setOrderNumber] = useState('');

  const { data, loading, error, refetch } = useQuery(GET_INGREDIENTS, { 
    client: inventoryApolloClient 
  });

  const { data: productsData } = useQuery(GET_TOKO_SEMBAKO_PRODUCTS, { 
    client: inventoryApolloClient 
  });

  const [purchaseFromTokoSembako] = useMutation(PURCHASE_FROM_TOKO_SEMBAKO, { 
    client: inventoryApolloClient 
  });

  const isBackendConnected = !error || error.message !== 'Failed to fetch';

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validItems = purchaseItems.filter(item => item.productId && item.quantity > 0);
    if (validItems.length === 0) {
      alert('Pilih minimal satu produk');
      return;
    }

    try {
      const result = await purchaseFromTokoSembako({
        variables: {
          input: {
            orderNumber: orderNumber || `PO-${Date.now()}`,
            items: validItems,
            notes: null,
          },
        },
      });

      if (result.data?.purchaseFromTokoSembako?.success) {
        alert('Pembelian berhasil! Stock akan ditambahkan.');
        refetch();
        closePurchaseModal();
      } else {
        alert(result.data?.purchaseFromTokoSembako?.message || 'Pembelian gagal');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const closePurchaseModal = () => {
    setShowPurchaseModal(false);
    setPurchaseItems([{ productId: '', quantity: 1 }]);
    setOrderNumber('');
  };

  const addPurchaseItem = () => {
    setPurchaseItems([...purchaseItems, { productId: '', quantity: 1 }]);
  };

  const removePurchaseItem = (index: number) => {
    if (purchaseItems.length > 1) {
      setPurchaseItems(purchaseItems.filter((_, i) => i !== index));
    }
  };

  const lowStockIngredients = data?.ingredients?.filter(
    (i: any) => i.currentStock <= i.minStockLevel
  ) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-700';
      case 'OUT_OF_STOCK': return 'bg-red-100 text-red-700';
      case 'INACTIVE': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Inventory Management</h1>
          <p className="text-slate-500">Kelola stok bahan baku restoran</p>
        </div>
        <button
          onClick={() => setShowPurchaseModal(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          🛒 Beli dari Toko Sembako
        </button>
      </div>

      {/* Connection Warning */}
      {!isBackendConnected && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <strong>⚠️ Backend tidak terhubung!</strong>
          <p className="text-sm mt-1">Jalankan: <code className="bg-red-100 px-2 py-0.5 rounded">docker-compose -f docker-compose-python.yml up -d</code></p>
        </div>
      )}

      {/* Low Stock Alert */}
      {lowStockIngredients.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h3 className="font-semibold text-amber-800 mb-2">⚠️ Stok Rendah ({lowStockIngredients.length} item)</h3>
          <div className="flex flex-wrap gap-2">
            {lowStockIngredients.map((item: any) => (
              <span key={item.id} className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm">
                {item.name}: {item.currentStock} {item.unit} (Min: {item.minStockLevel})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Inventory Table */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : data?.ingredients?.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Nama Bahan</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Kategori</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Stok</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Min. Stok</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Harga/Unit</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Supplier</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.ingredients.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-800">{item.name}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {item.category || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${
                        item.currentStock <= item.minStockLevel ? 'text-red-600' : 'text-slate-700'
                      }`}>
                        {item.currentStock} {item.unit}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {item.minStockLevel} {item.unit}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      Rp {item.costPerUnit?.toLocaleString() || 0}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {item.supplier?.name || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-slate-200">
          <p className="text-4xl mb-2">📦</p>
          <p>Belum ada data bahan baku</p>
        </div>
      )}

      {/* Purchase from Toko Sembako Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-slate-800 mb-4">🛒 Beli dari Toko Sembako</h2>
              <form onSubmit={handlePurchase} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nomor PO</label>
                  <input
                    type="text"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    placeholder="Auto-generate jika kosong"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Produk</label>
                  {purchaseItems.map((item, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <select
                        value={item.productId}
                        onChange={(e) => {
                          const newItems = [...purchaseItems];
                          newItems[index].productId = e.target.value;
                          setPurchaseItems(newItems);
                        }}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg"
                      >
                        <option value="">Pilih Produk</option>
                        {productsData?.tokoSembakoProducts?.filter((p: any) => p.available).map((product: any) => (
                          <option key={product.id} value={product.id}>
                            {product.name} - Rp {product.price.toLocaleString()}/{product.unit}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => {
                          const newItems = [...purchaseItems];
                          newItems[index].quantity = parseFloat(e.target.value) || 1;
                          setPurchaseItems(newItems);
                        }}
                        className="w-24 px-3 py-2 border border-slate-300 rounded-lg"
                        min="1"
                        step="0.1"
                      />
                      <button
                        type="button"
                        onClick={() => removePurchaseItem(index)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addPurchaseItem}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    + Tambah Produk
                  </button>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closePurchaseModal}
                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Beli
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
