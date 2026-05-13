import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { UserPlus } from 'lucide-react';

export default function Signup() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', address: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post('http://localhost:5000/api/auth/register', formData);
      // Auto login after signup
      const loginRes = await axios.post('http://localhost:5000/api/auth/login', { email: formData.email, password: formData.password });
      localStorage.setItem('token', loginRes.data.token);
      localStorage.setItem('user', JSON.stringify(loginRes.data.user));
      
      // Reload page to set state at App level easily
      window.location.href = '/'; 
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center py-12 animate-fade-in">
      <div className="glass-panel p-8 w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="p-3 bg-secondary bg-opacity-10 rounded-full mb-4">
            <UserPlus size={32} color="var(--secondary)" />
          </div>
          <h2 className="heading-2">Create Account</h2>
          <p className="text-muted">Join PharmaCore today</p>
        </div>

        {error && <div className="p-3 mb-4 text-sm text-red-500 bg-red-100 rounded-md border border-red-200">{error}</div>}

        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Full Name</label>
            <input required type="text" className="input-field w-full" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Email Address</label>
            <input required type="email" className="input-field w-full" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Password</label>
            <input required type="password" className="input-field w-full" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Delivery Address</label>
            <textarea required className="input-field w-full" rows="2" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}></textarea>
          </div>
          
          <button type="submit" className="btn btn-secondary w-full mt-2" disabled={loading}>
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-muted">
          Already have an account? <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
