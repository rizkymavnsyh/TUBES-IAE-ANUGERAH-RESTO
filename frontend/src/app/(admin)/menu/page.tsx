'use client';

import { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { apolloClient } from '@/lib/apollo-client';

const GET_MENUS = gql`
  query GetMenus($category: String, $available: Boolean) {
    menus(category: $category, available: $available) {
      id
      menuId
      name
      description
      price
      category
      available
      image
      preparationTime
      ingredients {
        ingredientId
        ingredientName
        quantity
        unit
      }
    }
  }
`;

const GET_MENU_CATEGORIES = gql`
  query GetMenuCategories {
    menuCategories
  }
`;

const CREATE_MENU = gql`
  mutation CreateMenu($input: CreateMenuInput!) {
    createMenu(input: $input) {
      id
      menuId
      name
    }
  }
`;

const UPDATE_MENU = gql`
  mutation UpdateMenu($id: String!, $input: UpdateMenuInput!) {
    updateMenu(id: $id, input: $input) {
      id
      menuId
      name
    }
  }
`;

const DELETE_MENU = gql`
  mutation DeleteMenu($id: String!) {
    deleteMenu(id: $id)
  }
`;

interface Ingredient {
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: string;
}

export default function MenuPage() {
  const [showModal, setShowModal] = useState(false);
  const [editingMenu, setEditingMenu] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [formData, setFormData] = useState({
    menuId: '',
    name: '',
    description: '',
    price: '',
    category: '',
    image: '',
    preparationTime: '15',
    ingredients: [{ ingredientId: '', ingredientName: '', quantity: 0, unit: 'gram' }] as Ingredient[],
  });

  const { data, loading, error, refetch } = useQuery(GET_MENUS, {
    client: apolloClient,
    variables: {
      category: selectedCategory || undefined,
      available: showAvailableOnly || undefined,
    },
  });

  const { data: categoriesData } = useQuery(GET_MENU_CATEGORIES, { client: apolloClient });

  const [createMenu] = useMutation(CREATE_MENU, { client: apolloClient });
  const [updateMenu] = useMutation(UPDATE_MENU, { client: apolloClient });
  const [deleteMenu] = useMutation(DELETE_MENU, { client: apolloClient });

  const isBackendConnected = !error || error.message !== 'Failed to fetch';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filter out empty ingredients
    const validIngredients = formData.ingredients.filter(
      ing => ing.ingredientId && ing.ingredientName && ing.quantity > 0
    );

    try {
      if (editingMenu) {
        await updateMenu({
          variables: {
            id: editingMenu.id,
            input: {
              name: formData.name,
              description: formData.description || null,
              price: parseFloat(formData.price),
              category: formData.category,
              image: formData.image || null,
              preparationTime: parseInt(formData.preparationTime) || 15,
              ingredients: validIngredients.length > 0 ? validIngredients : undefined,
            },
          },
        });
      } else {
        // For create, ingredients is required
        if (validIngredients.length === 0) {
          alert('Minimal satu bahan harus diisi untuk membuat menu baru');
          return;
        }
        
        await createMenu({
          variables: {
            input: {
              menuId: formData.menuId,
              name: formData.name,
              description: formData.description || null,
              price: parseFloat(formData.price),
              category: formData.category,
              image: formData.image || null,
              preparationTime: parseInt(formData.preparationTime) || 15,
              ingredients: validIngredients,
            },
          },
        });
      }
      refetch();
      closeModal();
    } catch (err: any) {
      if (err.message === 'Failed to fetch') {
        alert('Error: Tidak dapat terhubung ke server. Pastikan backend sudah berjalan.');
      } else {
        alert(`Error: ${err.message}`);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus menu ini?')) return;
    try {
      await deleteMenu({ variables: { id } });
      refetch();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const openEditModal = (menu: any) => {
    setEditingMenu(menu);
    setFormData({
      menuId: menu.menuId,
      name: menu.name,
      description: menu.description || '',
      price: menu.price.toString(),
      category: menu.category,
      image: menu.image || '',
      preparationTime: (menu.preparationTime || 15).toString(),
      ingredients: menu.ingredients?.length > 0 
        ? menu.ingredients.map((ing: Ingredient) => ({
            ingredientId: ing.ingredientId,
            ingredientName: ing.ingredientName,
            quantity: ing.quantity,
            unit: ing.unit,
          }))
        : [{ ingredientId: '', ingredientName: '', quantity: 0, unit: 'gram' }],
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingMenu(null);
    setFormData({
      menuId: '',
      name: '',
      description: '',
      price: '',
      category: '',
      image: '',
      preparationTime: '15',
      ingredients: [{ ingredientId: '', ingredientName: '', quantity: 0, unit: 'gram' }],
    });
  };

  const addIngredient = () => {
    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, { ingredientId: '', ingredientName: '', quantity: 0, unit: 'gram' }],
    });
  };

  const removeIngredient = (index: number) => {
    if (formData.ingredients.length > 1) {
      setFormData({
        ...formData,
        ingredients: formData.ingredients.filter((_, i) => i !== index),
      });
    }
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: string | number) => {
    const newIngredients = [...formData.ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    setFormData({ ...formData, ingredients: newIngredients });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Menu Management</h1>
          <p className="text-slate-500">Kelola menu restoran</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          + Tambah Menu
        </button>
      </div>

      {/* Connection Warning */}
      {!isBackendConnected && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <strong>⚠️ Backend tidak terhubung!</strong>
          <p className="text-sm mt-1">Jalankan: <code className="bg-red-100 px-2 py-0.5 rounded">docker-compose -f docker-compose-python.yml up -d</code></p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-700"
        >
          <option value="">Semua Kategori</option>
          {categoriesData?.menuCategories?.map((cat: string) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showAvailableOnly}
            onChange={(e) => setShowAvailableOnly(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300"
          />
          <span className="text-slate-600">Hanya tersedia</span>
        </label>
      </div>

      {/* Menu Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : data?.menus?.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {data.menus.map((menu: any) => (
            <div key={menu.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-32 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-4xl">
                🍽️
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-slate-800">{menu.name}</h3>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                    menu.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {menu.available ? 'Available' : 'Unavailable'}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-1">{menu.category}</p>
                <p className="text-xs text-slate-400 mt-1">ID: {menu.menuId}</p>
                <p className="text-sm text-slate-500 mt-1 line-clamp-2">{menu.description}</p>
                <p className="font-bold text-blue-600 mt-2">Rp {menu.price.toLocaleString()}</p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => openEditModal(menu)}
                    className="flex-1 px-3 py-1.5 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(menu.id)}
                    className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-slate-400">
          <p className="text-4xl mb-2">🍽️</p>
          <p>Belum ada menu</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-slate-800 mb-4">
                {editingMenu ? 'Edit Menu' : 'Tambah Menu Baru'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {!editingMenu && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Menu ID *</label>
                    <input
                      type="text"
                      value={formData.menuId}
                      onChange={(e) => setFormData({ ...formData, menuId: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      placeholder="Contoh: MENU001"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nama Menu *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    placeholder="Contoh: Nasi Goreng Special"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={2}
                    placeholder="Deskripsi menu..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Harga (Rp) *</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      min="0"
                      placeholder="25000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Waktu Masak (menit)</label>
                    <input
                      type="number"
                      value={formData.preparationTime}
                      onChange={(e) => setFormData({ ...formData, preparationTime: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="1"
                      placeholder="15"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kategori *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Pilih Kategori</option>
                    <option value="Main Course">Main Course</option>
                    <option value="Appetizer">Appetizer</option>
                    <option value="Dessert">Dessert</option>
                    <option value="Beverage">Beverage</option>
                    <option value="Snack">Snack</option>
                  </select>
                </div>

                {/* Ingredients Section */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Bahan-bahan {!editingMenu && '*'}
                  </label>
                  <div className="space-y-2">
                    {formData.ingredients.map((ing, index) => (
                      <div key={index} className="flex gap-2 items-start">
                        <div className="flex-1 grid grid-cols-4 gap-2">
                          <input
                            type="text"
                            value={ing.ingredientId}
                            onChange={(e) => updateIngredient(index, 'ingredientId', e.target.value)}
                            className="px-2 py-1 text-sm border border-slate-300 rounded"
                            placeholder="ID Bahan"
                          />
                          <input
                            type="text"
                            value={ing.ingredientName}
                            onChange={(e) => updateIngredient(index, 'ingredientName', e.target.value)}
                            className="px-2 py-1 text-sm border border-slate-300 rounded"
                            placeholder="Nama Bahan"
                          />
                          <input
                            type="number"
                            value={ing.quantity || ''}
                            onChange={(e) => updateIngredient(index, 'quantity', parseFloat(e.target.value) || 0)}
                            className="px-2 py-1 text-sm border border-slate-300 rounded"
                            placeholder="Qty"
                            min="0"
                            step="0.1"
                          />
                          <select
                            value={ing.unit}
                            onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                            className="px-2 py-1 text-sm border border-slate-300 rounded"
                          >
                            <option value="gram">gram</option>
                            <option value="kg">kg</option>
                            <option value="ml">ml</option>
                            <option value="liter">liter</option>
                            <option value="pcs">pcs</option>
                            <option value="tbsp">tbsp</option>
                            <option value="tsp">tsp</option>
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeIngredient(index)}
                          className="px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addIngredient}
                    className="mt-2 text-sm text-blue-600 hover:underline"
                  >
                    + Tambah Bahan
                  </button>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingMenu ? 'Simpan' : 'Tambah'}
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
