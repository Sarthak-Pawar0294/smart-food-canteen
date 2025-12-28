import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Order, Receipt as ReceiptType, CartItem, PaymentMethod } from '../types';
import { Clock, CheckCircle, Package, CreditCard, Banknote, Eye, X } from 'lucide-react';
import Receipt from '../components/Receipt';

export default function OrderHistory() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptType | null>(null);

  const buildReceiptFromOrder = (order: Order): ReceiptType => {
    const paymentTime = order.payment_time || order.created_at;
    const validTillTime = order.valid_till_time || new Date(new Date(order.created_at).getTime() + 2 * 60 * 60 * 1000).toISOString();
    
    return {
      studentName: user?.full_name || 'Student',
      studentEmail: user?.email || '',
      orderId: order.id,
      items: order.items as CartItem[],
      totalAmount: parseFloat(String(order.total)),
      paymentMethod: (order.payment_method || 'CASH') as PaymentMethod,
      paymentStatus: order.payment_status === 'PAID' ? 'SUCCESS' : 'PENDING',
      paymentTime: paymentTime,
      validTillTime: validTillTime,
      orderStatus: order.status,
    };
  };

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;

      const result = await api.getOrders(user.id);

      if (result.success && result.orders) {
        setOrders(result.orders);
      } else {
        setError(result.error || 'Failed to load orders');
      }

      setLoading(false);
    };

    fetchOrders();
  }, [user]);

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'ready':
        return <Package className="w-5 h-5 text-blue-600" />;
      case 'accepted':
        return <Clock className="w-5 h-5 text-orange-600" />;
      default:
        return <Package className="w-5 h-5 text-slate-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'ready':
        return 'bg-blue-100 text-blue-700';
      case 'accepted':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-slate-100 text-slate-700';
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
        return 'Cash at Canteen';
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

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">No orders yet</h2>
          <p className="text-slate-600">Start ordering to see your history</p>
        </div>
      </div>
    );
  }

  if (selectedReceipt) {
    return (
      <>
        <Receipt receipt={selectedReceipt} onClose={() => setSelectedReceipt(null)} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Order History</h1>

        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-slate-500">
                    {new Date(order.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Order ID: {order.id.slice(0, 8)}</p>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${getStatusColor(order.status)}`}>
                  {getStatusIcon(order.status)}
                  <span className="text-sm font-medium capitalize">{order.status}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mb-4">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100">
                  {order.payment_method === 'CASH' ? (
                    <Banknote className="w-4 h-4 text-slate-600" />
                  ) : (
                    <CreditCard className="w-4 h-4 text-slate-600" />
                  )}
                  <span className="text-sm text-slate-700">{getPaymentMethodLabel(order.payment_method)}</span>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${getPaymentStatusColor(order.payment_status)}`}>
                  <span className="text-sm font-medium">
                    {order.payment_status === 'PAID' ? 'Paid Online' : order.payment_status === 'CASH' ? 'Pay at Pickup' : order.payment_status || 'N/A'}
                  </span>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium text-slate-900 mb-3">Items</h3>
                <div className="space-y-2">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-slate-700">
                        {item.name} x {item.quantity}
                      </span>
                      <span className="text-slate-900 font-medium">
                        ₹{item.price * item.quantity}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t mt-3 pt-3">
                  <div className="flex justify-between text-lg font-bold text-slate-900">
                    <span>Total</span>
                    <span>₹{parseFloat(String(order.total)).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {order.payment_status === 'PAID' && (
                <button
                  onClick={() => setSelectedReceipt(buildReceiptFromOrder(order))}
                  className="w-full mt-4 flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  <Eye className="w-4 h-4" />
                  View Receipt
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
