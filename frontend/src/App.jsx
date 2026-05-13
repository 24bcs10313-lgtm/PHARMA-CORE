import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate
} from 'react-router-dom';
import { ShoppingCart, LayoutDashboard, Pill } from 'lucide-react';
import Home from './pages/Home';
import Cart from './pages/Cart';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import { useState, useEffect } from 'react';
import axios from 'axios';

// A simple global state for the cart using React Context or just passing props
export default function App() {
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);
  const addToCart = (medicine) => {
    setCart((prev) => {
      const existing = prev.find(item => item.id === medicine.id);
      if (existing) {
        return prev.map(item => item.id === medicine.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...medicine, quantity: 1 }];
    });
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => setCart([]);

  return (
    <Router>
      <Navbar cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)} user={user} setUser={setUser} />
      <main className="container mt-8 animate-fade-in">
        <Routes>
          <Route path="/" element={<Home addToCart={addToCart} />} />
          <Route path="/cart" element={<Cart cart={cart} removeFromCart={removeFromCart} clearCart={clearCart} user={user} />} />
          <Route path="/admin" element={user?.isAdmin === 1 ? <AdminDashboard /> : <div className="text-center p-12 heading-2">Access Denied</div>} />
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
      </main>
    </Router>
  );
}

function Navbar({ cartCount, user, setUser }) {
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    window.location.href = '/login';
  };
  return (
    <nav className="glass-panel" style={{ borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0, position: 'sticky', top: 0, zIndex: 100 }}>
      <div className="container flex items-center justify-between" style={{ padding: '1rem' }}>
        <Link to="/" className="flex items-center gap-2 hover-scale">
          <Pill color="var(--primary)" size={28} />
          <span className="heading-3" style={{ margin: 0 }}>PharmaCore</span>
        </Link>
        <div className="flex gap-6 items-center">
          {user?.isAdmin === 1 && (
            <Link to="/admin" className="flex items-center gap-2 text-muted hover-scale">
              <LayoutDashboard size={20} />
              <span style={{ fontWeight: 500 }}>Dashboard</span>
            </Link>
          )}
          <Link to="/cart" className="flex items-center gap-2 text-muted hover-scale" style={{ position: 'relative' }}>
            <ShoppingCart size={20} />
            <span style={{ fontWeight: 500 }}>Cart</span>
            {cartCount > 0 && (
              <span className="btn-primary" style={{ padding: '0.1rem 0.4rem', borderRadius: '50%', fontSize: '0.75rem', position: 'absolute', top: '-10px', right: '-15px' }}>
                {cartCount}
              </span>
            )}
          </Link>
          
          {user ? (
            <div className="flex items-center gap-4 ml-2 pl-4" style={{ borderLeft: '1px solid var(--border)' }}>
              <span className="text-sm font-medium">Hello, {user.name.split(' ')[0]}</span>
              <button onClick={handleLogout} className="text-sm text-red-500 hover:underline">Logout</button>
            </div>
          ) : (
            <div className="flex items-center gap-4 ml-2 pl-4" style={{ borderLeft: '1px solid var(--border)' }}>
              <Link to="/login" className="text-sm font-medium hover:text-primary">Log In</Link>
              <Link to="/signup" className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.875rem' }}>Sign Up</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
