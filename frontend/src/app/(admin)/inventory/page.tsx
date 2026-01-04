'use client';

import { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { inventoryApolloClient } from '@/lib/apollo-client';

const GET_INGREDIENTS = gql`
  query GetIngredients($category: String, $status: IngredientStatus) {
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

const CREATE_INGREDIENT = gql`
  mutation CreateIngredient($input: CreateIngredientInput!) {
    createIngredient(input: $input) {
      id
      name
      unit
      category
      minStockLevel
      currentStock
      costPerUnit
      status
    }
  }
`;

const UPDATE_INGREDIENT = gql`
  mutation UpdateIngredient($id: ID!, $input: UpdateIngredientInput!) {
    updateIngredient(id: $id, input: $input) {
      id
      name
      unit
      category
      minStockLevel
      currentStock
      costPerUnit
      status
    }
  }
`;

export default function InventoryPage() {
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Purchase State
  const [purchaseItems, setPurchaseItems] = useState<{ productId: string, quantity: string | number }[]>([{ productId: '', quantity: '' }]);
  const [orderNumber, setOrderNumber] = useState('');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    unit: 'kg',
    minStockLevel: 0,
    currentStock: 0,
    costPerUnit: 0
  });

  const { data, loading, error, refetch } = useQuery(GET_INGREDIENTS, {
    client: inventoryApolloClient,
    fetchPolicy: 'network-only' // Ensure fresh data
  });

  const { data: productsData } = useQuery(GET_TOKO_SEMBAKO_PRODUCTS, {
    client: inventoryApolloClient
  });

  const [purchaseFromTokoSembako] = useMutation(PURCHASE_FROM_TOKO_SEMBAKO, {
    client: inventoryApolloClient
  });

  const [createIngredient] = useMutation(CREATE_INGREDIENT, {
    client: inventoryApolloClient
  });

  const [updateIngredient] = useMutation(UPDATE_INGREDIENT, {
    client: inventoryApolloClient
  });

  const isBackendConnected = !error || error.message !== 'Failed to fetch';

  // Purchase Handlers
  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();

    // Convert quantity strings to numbers and filter valid items
    const validItems = purchaseItems
      .filter(item => item.productId && Number(item.quantity) > 0)
      .map(item => ({
        productId: item.productId,
        quantity: Number(item.quantity)
      }));

    if (validItems.length === 0) {
      alert('Pilih minimal satu produk dengan jumlah lebih dari 0');
      return;
    }

    setIsPurchasing(true);
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

      // Check for GraphQL errors in result
      if (result.errors && result.errors.length > 0) {
        const errorMsg = result.errors.map((e: any) => e.message).join(', ');
        console.error('GraphQL errors:', result.errors);
        alert(`Error GraphQL: ${errorMsg}`);
        setIsPurchasing(false);
        return;
      }

      if (result.data?.purchaseFromTokoSembako?.success) {
        alert(`✅ Pembelian berhasil!\n\nOrder ID: ${result.data.purchaseFromTokoSembako.tokoSembakoOrder?.orderId || 'N/A'}\nTotal: Rp ${result.data.purchaseFromTokoSembako.tokoSembakoOrder?.total?.toLocaleString('id-ID') || 0}`);
        refetch();
        closePurchaseModal();
      } else {
        alert(`❌ Pembelian gagal: ${result.data?.purchaseFromTokoSembako?.message || 'Unknown error'}`);
      }
    } catch (err: any) {
      console.error('Purchase error:', err);
      // Extract more detailed error message
      let errorMessage = err.message || 'Unknown error';
      if (err.graphQLErrors && err.graphQLErrors.length > 0) {
        errorMessage = err.graphQLErrors.map((e: any) => e.message).join(', ');
      }
      if (err.networkError) {
        errorMessage = `Network error: ${err.networkError.message || err.networkError.statusCode}`;
      }
      alert(`❌ Error: ${errorMessage}`);
    } finally {
      setIsPurchasing(false);
    }
  };

  const closePurchaseModal = () => {
    setShowPurchaseModal(false);
    setPurchaseItems([{ productId: '', quantity: '' }]);
    setOrderNumber('');
  };

  const addPurchaseItem = () => {
    setPurchaseItems([...purchaseItems, { productId: '', quantity: '' }]);
  };

  const removePurchaseItem = (index: number) => {
    if (purchaseItems.length > 1) {
      setPurchaseItems(purchaseItems.filter((_, i) => i !== index));
    }
  };

  // CRUD Handlers
  const handleOpenCreate = () => {
    setIsEditing(false);
    setSelectedItem(null);
    setFormData({
      name: '',
      category: 'Ingredient',
      unit: 'kg',
      minStockLevel: 5,
      currentStock: 0,
      costPerUnit: 0
    });
    setShowFormModal(true);
  };

  const handleOpenEdit = (item: any) => {
    setIsEditing(true);
    setSelectedItem(item);
    setFormData({
      name: item.name,
      category: item.category || 'Ingredient',
      unit: item.unit,
      minStockLevel: item.minStockLevel,
      currentStock: item.currentStock,
      costPerUnit: item.costPerUnit
    });
    setShowFormModal(true);
  };

  const closeFormModal = () => {
    setShowFormModal(false);
    setSelectedItem(null);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus "${name}"? Data akan dinonaktifkan.`)) return;

    try {
      await updateIngredient({
        variables: {
          id,
          input: { status: 'INACTIVE' }
        }
      });
      alert('✅ Data berhasil dihapus (nonaktif)');
      refetch();
    } catch (err: any) {
      console.error('Delete error:', err);
      alert(`❌ Gagal menghapus: ${err.message}`);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isEditing && selectedItem) {
        // Update
        await updateIngredient({
          variables: {
            id: selectedItem.id,
            input: {
              name: formData.name,
              category: formData.category,
              unit: formData.unit,
              minStockLevel: Number(formData.minStockLevel),
              // currentStock usually updated via addStock/reduceStock, but allows editing here if needed or separate
              // Note: schema allows updating currentStock in UpdateIngredientInput if we want
              // Let's allow updating everything for flexibility
              costPerUnit: Number(formData.costPerUnit)
            }
          }
        });
        alert('✅ Data berhasil diperbarui');
      } else {
        // Create
        await createIngredient({
          variables: {
            input: {
              name: formData.name,
              category: formData.category,
              unit: formData.unit,
              minStockLevel: Number(formData.minStockLevel),
              currentStock: Number(formData.currentStock), // Allow setting initial stock
              costPerUnit: Number(formData.costPerUnit)
            }
          }
        });
        alert('✅ Data berhasil ditambahkan');
      }
      refetch();
      closeFormModal();
    } catch (err: any) {
      console.error('Form submit error:', err);
      alert(`❌ Gagal menyimpan: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper for status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'INACTIVE': return 'bg-slate-100 text-slate-800';
      case 'OUT_OF_STOCK': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const lowStockIngredients = data?.ingredients?.filter(
    (i: any) => i.currentStock <= i.minStockLevel && i.status === 'ACTIVE'
  ) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Inventory Management</h1>
          <p className="text-slate-500">Kelola stok bahan baku restoran</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span className="text-xl">+</span> Tambah Bahan
          </button>
          <button
            onClick={() => setShowPurchaseModal(true)}
            disabled={!isBackendConnected}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isBackendConnected
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
          >
            <span className="text-xl">🛒</span> Beli dari Toko Sembako
          </button>
        </div>
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
      ) : error ? (
        <div className="text-center py-12 bg-red-50 rounded-xl border border-red-200">
          <p className="text-4xl mb-2">⚠️</p>
          <p className="text-red-600 font-medium">Error loading ingredients</p>
          <p className="text-red-500 text-sm mt-1">{error.message}</p>
          <button
            onClick={() => refetch()}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Coba Lagi
          </button>
        </div>
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
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Aksi</th>
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
                      <span className={`font-medium ${item.currentStock <= item.minStockLevel ? 'text-red-600' : 'text-slate-700'
                        }`}>
                        {item.currentStock} {item.unit}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {item.minStockLevel} {item.unit}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      Rp {item.costPerUnit?.toLocaleString('de-DE') || 0}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {item.supplier?.name || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.name)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          🗑️
                        </button>
                      </div>
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
          <p className="text-sm mt-2 text-slate-300">Beli dari Toko Sembako untuk menambah stok</p>
          <button
            onClick={() => refetch()}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Refresh Data
          </button>
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
                            {product.name} - Rp {product.price.toLocaleString('de-DE')}/{product.unit}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => {
                          const newItems = [...purchaseItems];
                          newItems[index].quantity = e.target.value;
                          setPurchaseItems(newItems);
                        }}
                        onBlur={(e) => {
                          // Set minimum value on blur if empty or 0
                          const newItems = [...purchaseItems];
                          const val = parseFloat(e.target.value);
                          if (isNaN(val) || val <= 0) {
                            newItems[index].quantity = '';
                          }
                          setPurchaseItems(newItems);
                        }}
                        placeholder="Qty"
                        className="w-24 px-3 py-2 border border-slate-300 rounded-lg"
                        min="0.1"
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
                    disabled={isPurchasing}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed"
                  >
                    {isPurchasing ? 'Memproses...' : 'Beli'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Ingredient Modal */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg flex flex-col shadow-xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  {isEditing ? 'Edit Bahan Baku' : 'Tambah Bahan Baku'}
                </h2>
              </div>
              <button
                onClick={closeFormModal}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Nama Bahan</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Kategori</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="Vegetable">Sayuran</option>
                    <option value="Meat">Daging</option>
                    <option value="Spice">Bumbu</option>
                    <option value="Dry">Bahan Kering</option>
                    <option value="Other">Lainnya</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Satuan</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Min. Stock Alert</label>
                  <input
                    type="number"
                    value={formData.minStockLevel}
                    onChange={(e) => setFormData({ ...formData, minStockLevel: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    {isEditing ? 'Stok Saat Ini (Adjust)' : 'Stok Awal'}
                  </label>
                  <input
                    type="number"
                    value={formData.currentStock}
                    onChange={(e) => setFormData({ ...formData, currentStock: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                    min="0"
                    disabled={isEditing} // Biasanya stok diupdate via Opname/Purchase, tapi bisa di-enable kalau mau manual adjust
                    title={isEditing ? "Gunakan fitur Stock Opname untuk mengubah stok" : ""}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Harga Per Unit (Estimasi)</label>
                <input
                  type="number"
                  value={formData.costPerUnit}
                  onChange={(e) => setFormData({ ...formData, costPerUnit: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  min="0"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeFormModal}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                >
                  {isSubmitting ? 'Menyimpan...' : (isEditing ? 'Simpan Perubahan' : 'Tambah Bahan')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

