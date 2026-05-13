import { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, User, MapPin, Image as ImageIcon, CheckCircle, XCircle, Truck } from 'lucide-react';

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', category: '', description: '', image: '', requiresPrescription: false });

  const fetchOrders = () => {
    axios.get('http://localhost:5000/api/orders')
      .then(res => {
        setOrders(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/medicines', {
        ...newProduct,
        price: parseFloat(newProduct.price)
      });
      alert("Product added successfully!");
      setShowAddProduct(false);
      setNewProduct({ name: '', price: '', category: '', description: '', image: '', requiresPrescription: false });
    } catch(err) {
      alert("Failed to add product");
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.patch(`http://localhost:5000/api/orders/${id}/status`, { status });
      fetchOrders();
    } catch (error) {
      console.error(error);
      alert('Failed to update status');
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Pending': return 'var(--primary)';
      case 'Approved': return 'var(--secondary)';
      case 'Shipped': return '#8B5CF6';
      case 'Rejected': return 'var(--danger)';
      default: return 'var(--text-muted)';
    }
  };

  if (loading) {
    return <div className="text-center p-8 heading-3 text-muted">Loading orders...</div>;
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="heading-1" style={{ marginBottom: 0 }}>Pharmacist Dashboard</h1>
          <p className="text-muted heading-3">Manage orders and prescriptions</p>
        </div>
        <div className="glass-panel p-4 flex gap-6 items-center">
          <div className="text-center">
            <span className="heading-2">{orders.length}</span>
            <span className="text-muted block" style={{ fontSize: '0.875rem' }}>Total Orders</span>
          </div>
          <div className="text-center">
            <span className="heading-2" style={{ color: 'var(--primary)' }}>{orders.filter(o => o.status === 'Pending').length}</span>
            <span className="text-muted block" style={{ fontSize: '0.875rem' }}>Pending</span>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAddProduct(!showAddProduct)}>
            {showAddProduct ? 'Cancel' : '+ Add Product'}
          </button>
        </div>
      </div>

      {showAddProduct && (
        <form className="glass-panel p-6 mb-8 animate-fade-in" onSubmit={handleAddProduct}>
          <h3 className="heading-3 mb-4">Add New Medicine</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input required type="text" placeholder="Medicine Name" className="input-field" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
            <input required type="number" step="0.01" placeholder="Price (₹)" className="input-field" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} />
            <input required type="text" placeholder="Category" className="input-field" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} />
            <input type="text" placeholder="Image URL (Leave empty for generic)" className="input-field" value={newProduct.image} onChange={e => setNewProduct({...newProduct, image: e.target.value})} />
            <textarea placeholder="Description" className="input-field md:col-span-2" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})}></textarea>
            <label className="flex items-center gap-2 text-muted">
              <input type="checkbox" checked={newProduct.requiresPrescription} onChange={e => setNewProduct({...newProduct, requiresPrescription: e.target.checked})} />
              Requires Prescription
            </label>
          </div>
          <button type="submit" className="btn btn-secondary mt-4">Save Product</button>
        </form>
      )}

      {orders.length === 0 ? (
        <p className="text-center p-8 glass-panel text-muted">No orders found.</p>
      ) : (
        <div className="flex flex-col gap-6">
          {orders.map(order => (
            <div key={order.id} className="glass-panel p-6" style={{ borderLeft: `4px solid ${getStatusColor(order.status)}` }}>
              <div className="flex justify-between items-start">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                  <div>
                    <h3 className="heading-3 mb-4 flex items-center gap-2"><Package size={20} /> Order #{order.id}</h3>
                    <p className="text-muted flex items-center gap-2 mt-2"><User size={16} /> {order.customerName} ({order.customerEmail})</p>
                    <p className="text-muted flex items-center gap-2 mt-2"><MapPin size={16} /> {order.customerAddress}</p>
                    <p className="heading-3 flex items-center gap-2 mt-4" style={{ color: 'var(--text-main)' }}>₹ {order.totalAmount.toFixed(2)}</p>

                    <div className="mt-4 p-4 glass-panel" style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                      <h4 className="heading-3 mb-2" style={{ fontSize: '0.875rem' }}>Items Ordered:</h4>
                      <ul className="text-muted list-disc ml-4" style={{ fontSize: '0.875rem' }}>
                        {order.items && order.items.map((item, idx) => (
                          <li key={idx}>{item.quantity}x {item.name} (₹{item.price.toFixed(2)})</li>
                        ))}
                        {(!order.items || order.items.length === 0) && <li>No items details</li>}
                      </ul>
                    </div>
                  </div>
                  
                  {order.prescriptionImage && (
                    <div className="p-4" style={{ backgroundColor: 'var(--background)', borderRadius: 'var(--radius-md)' }}>
                      <h4 className="heading-3" style={{ fontSize: '1rem', marginBottom: '1rem' }}><ImageIcon size={16} style={{ display: 'inline', verticalAlign: 'text-bottom' }} /> Prescription Uploaded</h4>
                      <a href={`http://localhost:5000${order.prescriptionImage}`} target="_blank" rel="noreferrer">
                        <img 
                          src={`http://localhost:5000${order.prescriptionImage}`} 
                          alt="Prescription" 
                          style={{ width: '100%', maxHeight: '150px', objectFit: 'cover', borderRadius: 'var(--radius-md)', cursor: 'zoom-in' }} 
                        />
                      </a>
                    </div>
                  )}
                </div>

                <div className="ml-6 flex flex-col gap-2 min-w-[150px]">
                  <span className="btn" style={{ backgroundColor: `${getStatusColor(order.status)}20`, color: getStatusColor(order.status), fontWeight: 600 }}>
                    Status: {order.status}
                  </span>
                  
                  {order.status === 'Pending' && (
                    <>
                      <button className="btn btn-secondary mt-4" onClick={() => updateStatus(order.id, 'Approved')}>
                        <CheckCircle size={16} /> Approve
                      </button>
                      <button className="btn btn-danger mt-2" onClick={() => updateStatus(order.id, 'Rejected')}>
                        <XCircle size={16} /> Reject
                      </button>
                    </>
                  )}
                  
                  {order.status === 'Approved' && (
                    <button className="btn mt-4" style={{ backgroundColor: '#8B5CF6', color: 'white' }} onClick={() => updateStatus(order.id, 'Shipped')}>
                      <Truck size={16} /> Mark Shipped
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
