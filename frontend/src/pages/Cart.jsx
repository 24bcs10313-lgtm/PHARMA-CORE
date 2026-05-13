import { useState } from 'react';
import axios from 'axios';
import { Trash2, ShoppingBag, Upload } from 'lucide-react';

export default function Cart({ cart, removeFromCart, clearCart, user }) {
  const [customerName, setCustomerName] = useState(user ? user.name : '');
  const [customerEmail, setCustomerEmail] = useState(user ? user.email : '');
  const [customerAddress, setCustomerAddress] = useState(user ? user.address : '');
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const requiresPrescription = cart.some(item => item.requiresPrescription === 1);

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (requiresPrescription && !prescription) {
      alert("A prescription image is required for some of the items in your cart.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('customerName', customerName);
    formData.append('customerEmail', customerEmail);
    formData.append('customerAddress', customerAddress);
    formData.append('totalAmount', totalAmount);
    formData.append('cartItems', JSON.stringify(cart));
    if (prescription) {
      formData.append('prescription', prescription);
    }

    try {
      await axios.post('http://localhost:5000/api/orders', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess(true);
      clearCart();
    } catch (error) {
      console.error(error);
      alert("Failed to place order.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="glass-panel p-8 text-center animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <ShoppingBag size={48} color="var(--secondary)" style={{ margin: '0 auto' }} />
        <h2 className="heading-2 mt-4 text-secondary">Order Placed Successfully!</h2>
        <p className="text-muted mt-2">Thank you for shopping with PharmaCore. Your order is being processed.</p>
        <button className="btn btn-primary mt-6" onClick={() => window.location.href = '/'}>Continue Shopping</button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
      <div>
        <h2 className="heading-2">Your Cart</h2>
        {cart.length === 0 ? (
          <p className="text-muted mt-4">Your cart is currently empty.</p>
        ) : (
          <div className="flex flex-col gap-4 mt-6">
            {cart.map(item => (
              <div key={item.id} className="glass-panel p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img src={item.image} alt={item.name} style={{ width: '60px', height: '60px', borderRadius: 'var(--radius-md)', objectFit: 'cover' }} />
                  <div>
                    <h4 className="heading-3" style={{ fontSize: '1rem', margin: 0 }}>{item.name}</h4>
                    <span className="text-muted" style={{ fontSize: '0.875rem' }}>Qty: {item.quantity} x ₹{item.price.toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="heading-3" style={{ margin: 0 }}>₹{(item.price * item.quantity).toFixed(2)}</span>
                  <button onClick={() => removeFromCart(item.id)} className="btn btn-outline" style={{ border: 'none', color: 'var(--danger)' }}>
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
            <div className="glass-panel p-4 mt-4 flex justify-between items-center bg-primary" style={{ backgroundColor: 'var(--primary)', color: 'white' }}>
              <span className="heading-2" style={{ margin: 0, color: 'white' }}>Total</span>
              <span className="heading-2" style={{ margin: 0, color: 'white' }}>₹{totalAmount.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      {cart.length > 0 && (
        <div>
          <h2 className="heading-2">Checkout Details</h2>
          
          {!user ? (
            <div className="glass-panel p-6 mt-6 flex flex-col items-center text-center animate-fade-in" style={{ borderColor: 'var(--primary)' }}>
              <h3 className="heading-3 mb-2">Login Required</h3>
              <p className="text-muted mb-6">You must be logged in to securely place an order, guarantee authenticity, and track your delivery.</p>
              <a href="/login" className="btn btn-primary px-8">Log In to Checkout</a>
            </div>
          ) : (
            <form className="glass-panel p-6 mt-6 flex flex-col gap-4" onSubmit={handleCheckout}>
              <div>
                <label className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block' }}>Full Name</label>
                <input required type="text" className="input-field" value={customerName} onChange={e => setCustomerName(e.target.value)} />
              </div>
              <div>
                <label className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block' }}>Email</label>
                <input required type="email" className="input-field" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} disabled />
              </div>
              <div>
                <label className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block' }}>Delivery Address</label>
                <textarea required className="input-field" rows="3" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)}></textarea>
              </div>
              
              {requiresPrescription && (
                <div className="p-4 mt-2" style={{ border: '1px dashed var(--danger)', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(239, 68, 68, 0.05)' }}>
                  <h4 className="heading-3" style={{ color: 'var(--danger)', fontSize: '1rem' }}>Prescription Required</h4>
                  <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>One or more items in your cart require a valid prescription.</p>
                  <div className="btn btn-outline" style={{ position: 'relative', overflow: 'hidden', width: '100%' }}>
                    <Upload size={18} /> {prescription ? prescription.name : 'Upload Prescription Image'}
                    <input type="file" required={requiresPrescription} accept="image/*" onChange={e => setPrescription(e.target.files[0])} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
                  </div>
                </div>
              )}

              <button type="submit" className="btn btn-primary mt-4" style={{ padding: '1rem' }} disabled={loading}>
                {loading ? 'Processing...' : 'Place Order Securely'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
