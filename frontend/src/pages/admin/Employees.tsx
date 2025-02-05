import React, { useState, useEffect } from 'react';
import Layout from '../../components/shared/Layout';
import { User as UserIcon, UserPlus, Edit, Trash2, X, Search, Eye, EyeOff } from 'lucide-react';
import { useStore } from '../../store';
import type { User, EmployeeFormData } from '../../types';

const initialFormData: EmployeeFormData = {
  name: '',
  email: '',
  password: '',
  department: '',
  position: '',
  startDate: new Date().toISOString().split('T')[0]
};

const departments = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Product'];

// Format date to show only day, month, and year
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export default function Employees() {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<EmployeeFormData>(initialFormData);
  const [showPassword, setShowPassword] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  const user = useStore((state) => state.user);
  const employees = useStore((state) => state.employees) || [];
  const addEmployee = useStore((state) => state.addEmployee);
  const updateEmployee = useStore((state) => state.updateEmployee);
  const deleteEmployee = useStore((state) => state.deleteEmployee);
  const calculateEmployeeProgress = useStore((state) => state.calculateEmployeeProgress);
  const initializeStore = useStore((state) => state.initializeStore);
  const setEmployees = useStore((state) => state.setEmployees);

  useEffect(() => {
    const loadData = async () => {
      if (!user || user.role !== 'admin') return;
      
      if (isLoading) {
        try {
          setError('');
          console.log('Loading employee data...');
          await initializeStore();
          console.log('Current employees:', employees);
          setIsLoading(false);
        } catch (error) {
          console.error('Error loading employees:', error);
          setError('Failed to load employees. Please try refreshing the page.');
          setEmployees([]); // Ensure employees is at least an empty array
          setIsLoading(false);
        }
      }
    };

    loadData();
  }, [user]);

  const filteredEmployees = React.useMemo(() => {
    if (!employees) return [];
    if (!searchTerm) return employees;
    
    return employees.filter(emp => 
      (emp.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.department || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    try {
      if (!formData.name || !formData.email || !formData.department || !formData.position) {
        throw new Error('Please fill in all required fields');
      }

      if (!editingId && !formData.password) {
        throw new Error('Password is required for new employees');
      }

      const startDate = formData.startDate ? new Date(formData.startDate).toISOString() : new Date().toISOString();
      
      const cleanData = {
        ...formData,
        startDate
      };

      console.log('Submitting employee data:', cleanData);

      if (editingId) {
        console.log('Updating employee:', editingId);
        const { password, ...updateData } = cleanData;
        await updateEmployee(editingId, updateData);
      } else {
        console.log('Adding new employee');
        await addEmployee(cleanData);
      }

      // Reset form and modal state
      setShowModal(false);
      setFormData(initialFormData);
      setEditingId(null);
      setShowPassword(false);
      
      // Reload the data
      try {
        await initializeStore();
        setIsLoading(false);
      } catch (error) {
        console.error('Error reloading data:', error);
        setError('Employee saved but failed to refresh the list. Please reload the page.');
        setEmployees([]); // Ensure employees is at least an empty array
      }
      
    } catch (err) {
      console.error('Error submitting employee:', err);
      setError(err instanceof Error ? err.message : 'Failed to save employee');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (employee: User) => {
    setFormData({
      name: employee.name,
      email: employee.email,
      password: '',
      department: employee.department,
      position: employee.position,
      startDate: employee.startDate
    });
    setEditingId(employee.id);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    try {
      console.log('Deleting employee:', id);
      await deleteEmployee(id);
      setShowDeleteConfirm(null);
      
      // Load the updated data
      try {
        await initializeStore();
        console.log('Data reloaded successfully after deletion');
      } catch (error) {
        console.error('Error reloading data after deletion:', error);
        setError('Employee deleted but failed to refresh the list. Please reload the page.');
      }
    } catch (err) {
      console.error('Error deleting employee:', err);
      setError('Failed to delete employee');
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <Layout>
        <div className="pt-8 text-center text-red-600">
          You do not have permission to access this page.
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="pt-8">
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <button
            onClick={() => {
              setShowModal(true);
              setFormData(initialFormData);
              setEditingId(null);
              setError('');
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <UserPlus className="w-5 h-5" />
            Add Employee
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading employees...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Badges
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <UserIcon className="w-5 h-5 text-gray-500" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                          <div className="text-sm text-gray-500">{employee.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{employee.department}</div>
                      <div className="text-xs text-gray-500">{employee.position}</div>
                      <div className="text-xs text-gray-400">{formatDate(employee.startDate)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full"
                          style={{ width: `${calculateEmployeeProgress(employee.id)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-500 mt-1">
                        {calculateEmployeeProgress(employee.id)}% Complete
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex -space-x-2">
                        {employee.badges.map((badge) => (
                          <div
                            key={badge.id}
                            className="w-8 h-8 rounded-full border-2 border-white overflow-hidden"
                            title={badge.name}
                          >
                            <img
                              src={badge.image}
                              alt={badge.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(employee)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(employee.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Employee Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingId ? 'Edit Employee' : 'Add Employee'}
              </h2>
              <button onClick={() => {
                setShowModal(false);
                setFormData(initialFormData);
                setShowPassword(false);
                setError('');
              }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <div className="relative mt-1">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 pr-10"
                    required={!editingId}
                    placeholder={editingId ? "Leave blank to keep current password" : ""}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Department</label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Position</label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                <input
                  type="date"
                  value={formData.startDate.split('T')[0]}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setFormData(initialFormData);
                    setShowPassword(false);
                    setError('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : editingId ? 'Update' : 'Add'} Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this employee? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}