'use client';

import { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { userApolloClient } from '@/lib/apollo-client';

const GET_STAFF = gql`
  query GetStaff($status: StaffStatus, $role: StaffRole) {
    staff(status: $status, role: $role) {
      id
      employeeId
      username
      name
      email
      phone
      role
      department
      status
      hireDate
      salary
    }
  }
`;

const GET_CUSTOMERS = gql`
  query GetCustomers($status: CustomerStatus) {
    customers(status: $status) {
      id
      customerId
      name
      email
      phone
      address
      registrationDate
      status
    }
  }
`;

const CREATE_STAFF = gql`
  mutation CreateStaff($input: CreateStaffInput!) {
    createStaff(input: $input) {
      id
      employeeId
      name
    }
  }
`;

const UPDATE_STAFF = gql`
  mutation UpdateStaff($id: ID!, $input: UpdateStaffInput!) {
    updateStaff(id: $id, input: $input) {
      id
      name
    }
  }
`;

const CREATE_CUSTOMER = gql`
  mutation CreateCustomer($input: CreateCustomerInput!) {
    createCustomer(input: $input) {
      id
      customerId
      name
    }
  }
`;

const UPDATE_CUSTOMER = gql`
  mutation UpdateCustomer($id: ID!, $input: UpdateCustomerInput!) {
    updateCustomer(id: $id, input: $input) {
      id
      name
    }
  }
`;

const DELETE_STAFF = gql`
  mutation DeleteStaff($id: ID!) {
    deleteStaff(id: $id)
  }
`;

const DELETE_CUSTOMER = gql`
  mutation DeleteCustomer($id: ID!) {
    deleteCustomer(id: $id)
  }
`;

type TabType = 'staff' | 'customers';
type ModalMode = 'create' | 'edit' | 'delete';

interface StaffData {
  id: string;
  employeeId: string;
  username: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  department?: string;
  status: string;
  hireDate?: string;
  salary?: number;
}

interface CustomerData {
  id: string;
  customerId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  registrationDate: string;
  status: string;
}

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState<TabType>('staff');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('create');
  const [selectedId, setSelectedId] = useState<string>('');
  const [staffFormData, setStaffFormData] = useState({
    employeeId: '',
    username: '',
    name: '',
    email: '',
    phone: '',
    role: 'waiter',
    department: '',
    password: '',
    salary: '',
  });
  const [customerFormData, setCustomerFormData] = useState({
    customerId: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
  });
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  const { data: staffData, loading: staffLoading, error: staffError, refetch: refetchStaff } = useQuery(GET_STAFF, {
    client: userApolloClient
  });

  const { data: customersData, loading: customersLoading, error: customersError, refetch: refetchCustomers } = useQuery(GET_CUSTOMERS, {
    client: userApolloClient
  });

  const [createStaff] = useMutation(CREATE_STAFF, { client: userApolloClient });
  const [updateStaff] = useMutation(UPDATE_STAFF, { client: userApolloClient });
  const [deleteStaff] = useMutation(DELETE_STAFF, { client: userApolloClient });
  const [createCustomer] = useMutation(CREATE_CUSTOMER, { client: userApolloClient });
  const [updateCustomer] = useMutation(UPDATE_CUSTOMER, { client: userApolloClient });
  const [deleteCustomer] = useMutation(DELETE_CUSTOMER, { client: userApolloClient });

  const isBackendConnected = !(staffError?.message === 'Failed to fetch' || customersError?.message === 'Failed to fetch');

  // Open modal for create
  const openCreateModal = () => {
    setModalMode('create');
    setSelectedId('');
    resetForms();
    setShowModal(true);
  };

  // Open modal for edit
  const openEditModal = (item: StaffData | CustomerData) => {
    setModalMode('edit');
    if (activeTab === 'staff') {
      const staff = item as StaffData;
      setSelectedId(staff.id);
      setStaffFormData({
        employeeId: staff.employeeId,
        username: staff.username || '',
        name: staff.name,
        email: staff.email || '',
        phone: staff.phone || '',
        role: staff.role.toLowerCase(),
        department: staff.department || '',
        password: '',
        salary: staff.salary?.toString() || '',
      });
    } else {
      const customer = item as CustomerData;
      setSelectedId(customer.id);
      setCustomerFormData({
        customerId: customer.customerId,
        name: customer.name,
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        dateOfBirth: '',
      });
    }
    setShowModal(true);
  };

  // Open delete confirmation
  const openDeleteModal = (item: StaffData | CustomerData) => {
    setModalMode('delete');
    setSelectedId(item.id);
    setDeleteConfirmName(item.name);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (activeTab === 'staff') {
        if (modalMode === 'create') {
          const createInput = {
            employeeId: staffFormData.employeeId,
            name: staffFormData.name,
            email: staffFormData.email || null,
            phone: staffFormData.phone || null,
            role: staffFormData.role,
            department: staffFormData.department || null,
            password: staffFormData.password || null,
            salary: staffFormData.salary ? parseFloat(staffFormData.salary) : null,
          };
          await createStaff({ variables: { input: createInput } });
        } else {
          // UpdateStaffInput only accepts: name, email, phone, role, department, status, salary
          const updateInput = {
            name: staffFormData.name,
            email: staffFormData.email || null,
            phone: staffFormData.phone || null,
            role: staffFormData.role,
            department: staffFormData.department || null,
            salary: staffFormData.salary ? parseFloat(staffFormData.salary) : null,
          };
          await updateStaff({ variables: { id: selectedId, input: updateInput } });
        }
        refetchStaff();
      } else {
        if (modalMode === 'create') {
          const createInput = {
            customerId: customerFormData.customerId,
            name: customerFormData.name,
            email: customerFormData.email || null,
            phone: customerFormData.phone || null,
            address: customerFormData.address || null,
            dateOfBirth: customerFormData.dateOfBirth || null,
          };
          await createCustomer({ variables: { input: createInput } });
        } else {
          // UpdateCustomerInput only accepts: name, email, phone, address, status
          const updateInput = {
            name: customerFormData.name,
            email: customerFormData.email || null,
            phone: customerFormData.phone || null,
            address: customerFormData.address || null,
          };
          await updateCustomer({ variables: { id: selectedId, input: updateInput } });
        }
        refetchCustomers();
      }
      closeModal();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleDelete = async () => {
    try {
      if (activeTab === 'staff') {
        await deleteStaff({ variables: { id: selectedId } });
        refetchStaff();
      } else {
        await deleteCustomer({ variables: { id: selectedId } });
        refetchCustomers();
      }
      closeModal();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const resetForms = () => {
    setStaffFormData({
      employeeId: '',
      username: '',
      name: '',
      email: '',
      phone: '',
      role: 'waiter',
      department: '',
      password: '',
      salary: '',
    });
    setCustomerFormData({
      customerId: '',
      name: '',
      email: '',
      phone: '',
      address: '',
      dateOfBirth: '',
    });
    setDeleteConfirmName('');
  };

  const closeModal = () => {
    setShowModal(false);
    resetForms();
  };

  const getRoleColor = (role: string) => {
    const roleUpper = role.toUpperCase();
    switch (roleUpper) {
      case 'ADMIN': return 'bg-purple-100 text-purple-700';
      case 'MANAGER': return 'bg-blue-100 text-blue-700';
      case 'CHEF': return 'bg-orange-100 text-orange-700';
      case 'WAITER': return 'bg-green-100 text-green-700';
      case 'CASHIER': return 'bg-teal-100 text-teal-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const loading = activeTab === 'staff' ? staffLoading : customersLoading;
  const data = activeTab === 'staff' ? staffData?.staff : customersData?.customers;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
          <p className="text-slate-500">Kelola staff dan pelanggan (CRUD lengkap)</p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah {activeTab === 'staff' ? 'Staff' : 'Pelanggan'}
        </button>
      </div>

      {/* Connection Warning */}
      {!isBackendConnected && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <strong>⚠️ Backend tidak terhubung!</strong>
          <p className="text-sm mt-1">Jalankan: <code className="bg-red-100 px-2 py-0.5 rounded">docker-compose -f docker-compose-python.yml up -d</code></p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('staff')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'staff'
            ? 'bg-blue-600 text-white'
            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
        >
          👨‍💼 Staff ({staffData?.staff?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('customers')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'customers'
            ? 'bg-blue-600 text-white'
            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
        >
          👥 Pelanggan ({customersData?.customers?.length || 0})
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : data?.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeTab === 'staff' ? (
            staffData?.staff?.map((user: StaffData) => (
              <div key={user.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow group">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-xl">
                    👨‍💼
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                      {user.role.toUpperCase()}
                    </span>
                    {/* Action buttons */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <button
                        onClick={() => openEditModal(user)}
                        className="p-1.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => openDeleteModal(user)}
                        className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                        title="Hapus"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                <h3 className="font-semibold text-slate-800">{user.name}</h3>
                <p className="text-sm text-slate-500">@{user.username || user.employeeId}</p>
                <p className="text-sm text-slate-500">{user.email || '-'}</p>
                <p className="text-sm text-slate-500">{user.phone || '-'}</p>
                <div className="mt-2 pt-2 border-t border-slate-100">
                  <p className="text-xs text-slate-400">Employee ID: {user.employeeId}</p>
                  <p className="text-xs text-slate-400">Department: {user.department || '-'}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                    {user.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            customersData?.customers?.map((customer: CustomerData) => (
              <div key={customer.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow group">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-xl">
                    👤
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${customer.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                      {customer.status}
                    </span>
                    {/* Action buttons */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <button
                        onClick={() => openEditModal(customer)}
                        className="p-1.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => openDeleteModal(customer)}
                        className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                        title="Hapus"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                <h3 className="font-semibold text-slate-800">{customer.name}</h3>
                <p className="text-sm text-slate-500">{customer.email || '-'}</p>
                <p className="text-sm text-slate-500">{customer.phone || '-'}</p>
                <div className="mt-2 pt-2 border-t border-slate-100">
                  <p className="text-xs text-slate-400">Customer ID: {customer.customerId}</p>
                  <p className="text-xs text-slate-400">Registered: {new Date(customer.registrationDate).toLocaleDateString('id-ID')}</p>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-slate-200">
          <p className="text-4xl mb-2">{activeTab === 'staff' ? '👨‍💼' : '👤'}</p>
          <p>Belum ada {activeTab === 'staff' ? 'staff' : 'pelanggan'}</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {modalMode === 'delete' ? (
                // Delete Confirmation
                <>
                  <h2 className="text-xl font-bold text-slate-800 mb-4">
                    Konfirmasi Hapus
                  </h2>
                  <div className="text-center py-4">
                    <div className="w-16 h-16 bg-red-100 rounded-full mx-auto flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </div>
                    <p className="text-slate-600">
                      Apakah Anda yakin ingin menghapus <strong>{deleteConfirmName}</strong>?
                    </p>
                    <p className="text-sm text-slate-400 mt-2">
                      Tindakan ini tidak dapat dibatalkan.
                    </p>
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
                      type="button"
                      onClick={handleDelete}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Hapus
                    </button>
                  </div>
                </>
              ) : (
                // Create/Edit Form
                <>
                  <h2 className="text-xl font-bold text-slate-800 mb-4">
                    {modalMode === 'create' ? 'Tambah' : 'Edit'} {activeTab === 'staff' ? 'Staff' : 'Pelanggan'}
                  </h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {activeTab === 'staff' ? (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Employee ID *</label>
                            <input
                              type="text"
                              value={staffFormData.employeeId}
                              onChange={(e) => setStaffFormData({ ...staffFormData, employeeId: e.target.value })}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                              required
                              placeholder="EMP001"
                              disabled={modalMode === 'edit'}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Username {modalMode === 'create' && '*'}</label>
                            <input
                              type="text"
                              value={staffFormData.username}
                              onChange={(e) => setStaffFormData({ ...staffFormData, username: e.target.value })}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                              required={modalMode === 'create'}
                              placeholder="johndoe"
                              disabled={modalMode === 'edit'}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Nama *</label>
                          <input
                            type="text"
                            value={staffFormData.name}
                            onChange={(e) => setStaffFormData({ ...staffFormData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                            <input
                              type="email"
                              value={staffFormData.email}
                              onChange={(e) => setStaffFormData({ ...staffFormData, email: e.target.value })}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                            <input
                              type="text"
                              value={staffFormData.phone}
                              onChange={(e) => setStaffFormData({ ...staffFormData, phone: e.target.value })}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Role *</label>
                          <select
                            value={staffFormData.role}
                            onChange={(e) => setStaffFormData({ ...staffFormData, role: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                            required
                          >
                            <option value="waiter">Waiter</option>
                            <option value="chef">Chef</option>
                            <option value="cashier">Cashier</option>
                            <option value="manager">Manager</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                            <input
                              type="text"
                              value={staffFormData.department}
                              onChange={(e) => setStaffFormData({ ...staffFormData, department: e.target.value })}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                              placeholder="Kitchen"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Salary</label>
                            <input
                              type="number"
                              value={staffFormData.salary}
                              onChange={(e) => setStaffFormData({ ...staffFormData, salary: e.target.value })}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                              placeholder="5000000"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Password {modalMode === 'edit' && '(kosongkan jika tidak diubah)'}
                          </label>
                          <input
                            type="password"
                            value={staffFormData.password}
                            onChange={(e) => setStaffFormData({ ...staffFormData, password: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Customer ID *</label>
                          <input
                            type="text"
                            value={customerFormData.customerId}
                            onChange={(e) => setCustomerFormData({ ...customerFormData, customerId: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                            required
                            placeholder="CUST001"
                            disabled={modalMode === 'edit'}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Nama *</label>
                          <input
                            type="text"
                            value={customerFormData.name}
                            onChange={(e) => setCustomerFormData({ ...customerFormData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                            <input
                              type="email"
                              value={customerFormData.email}
                              onChange={(e) => setCustomerFormData({ ...customerFormData, email: e.target.value })}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                            <input
                              type="text"
                              value={customerFormData.phone}
                              onChange={(e) => setCustomerFormData({ ...customerFormData, phone: e.target.value })}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Alamat</label>
                          <textarea
                            value={customerFormData.address}
                            onChange={(e) => setCustomerFormData({ ...customerFormData, address: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                            rows={2}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Lahir</label>
                          <input
                            type="date"
                            value={customerFormData.dateOfBirth}
                            onChange={(e) => setCustomerFormData({ ...customerFormData, dateOfBirth: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                          />
                        </div>
                      </>
                    )}

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
                        {modalMode === 'create' ? 'Tambah' : 'Simpan'}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
