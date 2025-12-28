import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Order } from '../types';
import { Check, Clock, Package, Loader, AlertCircle, CreditCard, Banknote } from 'lucide-react';

export default function OwnerDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;

      const result = await api.getAllOrders(user.email);

      if (result.success && result.orders) {
        setOrders(result.orders);
      } else {
        setError(result.error || 'Failed to load orders');
      }

      setLoading(false);
    };

    fetchOrders();
  }, [user]);

  const handleStatusUpdate = async (orderId: string, newStatus: 'ACCEPTED' | 'READY' | 'COMPLETED') => {
    if (!user) return;

    setUpdatingId(orderId);
    const result = await api.updateOrderStatus(orderId, newStatus, user.email);

    if (result.success && result.order) {
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
    } else {
      setError(result.error || 'Failed to update order status');
    }

    setUpdatingId(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-700 border border-green-300';
      case 'READY':
        return 'bg-blue-100 text-blue-700 border border-blue-300';
      case 'ACCEPTED':
        return 'bg-yellow-100 text-yellow-700 border border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-700 border border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Check className="w-5 h-5" />;
      case 'READY':
        return <Package className="w-5 h-5" />;
      case 'ACCEPTED':
        return <Clock className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getPaymentMethodLabel = (method?: string) => {
    switch (method) {
      case 'PHONEPE':
        return 'PhonePe';
      case 'GPAY':
        return 'Google Pay';
      case 'UPI':
        return 'UPI';
      case 'CASH':
        return 'Cash';
      default:
        return method || 'N/A';
    }
  };

  const getPaymentStatusColor = (status?: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-700';
      case 'CASH':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getPendingCount = () => orders.filter((o) => o.status === 'pending').length;
  const getAcceptedCount = () => orders.filter((o) => o.status === 'ACCEPTED').length;
  const getReadyCount = () => orders.filter((o) => o.status === 'READY').length;
  const getCompletedCount = () => orders.filter((o) => o.status === 'COMPLETED').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Owner Dashboard</h1>
          <p className="text-slate-600">Manage all student orders</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-slate-600 font-medium">Pending Orders</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{getPendingCount()}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-slate-600 font-medium">Accepted Orders</p>
            <p className="text-3xl font-bold text-yellow-600 mt-2">{getAcceptedCount()}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-slate-600 font-medium">Ready Orders</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{getReadyCount()}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-slate-600 font-medium">Completed Orders</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{getCompletedCount()}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Order ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Student Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Items</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Total</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Payment</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Time</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center text-slate-600">
                      No orders yet
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-slate-50 transition">
                      <td className="px-4 py-4 text-sm font-mono text-slate-900">{order.id.slice(0, 8)}</td>
                      <td className="px-4 py-4 text-sm text-slate-700">{order.payment_data?.studentName || 'N/A'}</td>
                      <td className="px-4 py-4 text-sm text-slate-700">{order.payment_data?.studentEmail || 'N/A'}</td>
                      <td className="px-4 py-4 text-sm text-slate-700">
                        <div className="max-w-xs">
                          {Array.isArray(order.items) &&
                            order.items.map((item, idx) => (
                              <div key={idx} className="text-xs">
                                {item.name} x {item.quantity}
                              </div>
                            ))}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm font-semibold text-slate-900">
                        ₹{parseFloat(String(order.total)).toFixed(2)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1 text-xs">
                            {order.payment_method === 'CASH' ? (
                              <Banknote className="w-3 h-3" />
                            ) : (
                              <CreditCard className="w-3 h-3" />
                            )}
                            <span>{getPaymentMethodLabel(order.payment_method)}</span>
                          </div>
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getPaymentStatusColor(order.payment_status)}`}>
                            {order.payment_status === 'PAID' ? 'Paid' : order.payment_status === 'CASH' ? 'Pay at Pickup' : order.payment_status || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          <span className="capitalize">{order.status}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">
                        {new Date(order.created_at).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          {order.status === 'pending' && (
                            <button
                              onClick={() => handleStatusUpdate(order.id, 'ACCEPTED')}
                              disabled={updatingId === order.id}
                              className="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded text-sm font-medium hover:bg-yellow-200 transition disabled:opacity-50"
                            >
                              {updatingId === order.id ? (
                                <Loader className="w-4 h-4 animate-spin" />
                              ) : (
                                'Accept'
                              )}
                            </button>
                          )}
                          {order.status === 'ACCEPTED' && (
                            <button
                              onClick={() => handleStatusUpdate(order.id, 'READY')}
                              disabled={updatingId === order.id}
                              className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded text-sm font-medium hover:bg-blue-200 transition disabled:opacity-50"
                            >
                              {updatingId === order.id ? (
                                <Loader className="w-4 h-4 animate-spin" />
                              ) : (
                                'Mark Ready'
                              )}
                            </button>
                          )}
                          {order.status === 'READY' && (
                            <button
                              onClick={() => handleStatusUpdate(order.id, 'COMPLETED')}
                              disabled={updatingId === order.id}
                              className="px-3 py-1.5 bg-green-100 text-green-700 rounded text-sm font-medium hover:bg-green-200 transition disabled:opacity-50"
                            >
                              {updatingId === order.id ? (
                                <Loader className="w-4 h-4 animate-spin" />
                              ) : (
                                'Complete'
                              )}
                            </button>
                          )}
                          {order.status === 'COMPLETED' && (
                            <span className="px-3 py-1.5 text-sm font-medium text-slate-500">Completed</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
