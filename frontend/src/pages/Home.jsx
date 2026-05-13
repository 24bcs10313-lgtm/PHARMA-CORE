import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search } from 'lucide-react';

export default function Home({ addToCart }) {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // For local dev, hit backend on 5000
    axios.get('http://localhost:5000/api/medicines')
      .then(res => {
        setMedicines(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const filteredMedicines = medicines.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center justify-center text-center px-6 py-16 glass-panel relative overflow-hidden" style={{ minHeight: '350px', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.6)', backgroundColor: 'var(--surface)' }}>
        {/* Decorative background effects */}
        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 rounded-full filter blur-3xl opacity-30" style={{ backgroundColor: 'var(--primary)', zIndex: 0 }}></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-64 h-64 rounded-full filter blur-3xl opacity-30" style={{ backgroundColor: 'var(--secondary)', zIndex: 0 }}></div>

        <div style={{ zIndex: 10, position: 'relative' }}>
          <span className="btn-secondary mb-4 inline-block" style={{ fontSize: '0.875rem', padding: '0.4rem 1rem', borderRadius: '2rem', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: 'var(--secondary)' }}>
            ✨ Official PharmaCore Store
          </span>
          <h1 className="heading-1" style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1.2, marginBottom: '1rem', color: 'var(--text-main)' }}>
            Health Delivered to <br/>
            <span style={{ color: 'var(--primary)' }}>Your Doorstep</span>
          </h1>
          <p className="text-muted heading-3 mx-auto" style={{ maxWidth: '600px', lineHeight: 1.6, marginBottom: '2rem' }}>
            We provide 100% genuine medicines, supplements, and healthcare products with fast, reliable, and secure checkout.
          </p>
          
          <div className="flex items-center glass-panel shadow-lg mx-auto" style={{ padding: '0.5rem', width: '100%', maxWidth: '600px', backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '2px solid transparent', transition: 'all 0.3s' }} 
               onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
               onBlur={(e) => e.currentTarget.style.borderColor = 'transparent'}
          >
            <Search color="var(--text-muted)" style={{ margin: '0 0.5rem' }} />
            <input 
              type="text" 
              placeholder="Search for medicines, supplements, or categories..." 
              className="input-field" 
              style={{ border: 'none', boxShadow: 'none', backgroundColor: 'transparent', flex: 1, height: '40px', fontSize: '1rem' }}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          <p>Loading medicines...</p>
        ) : filteredMedicines.length > 0 ? (
          filteredMedicines.map(med => (
            <div key={med.id} className="glass-panel p-4 flex flex-col justify-between hover-scale">
              <div>
                <img src={med.image} alt={med.name} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
                <div className="mt-4 flex justify-between items-center">
                  <span className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>{med.category}</span>
                  {med.requiresPrescription === 1 && (
                    <span className="btn-danger" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>Rx Required</span>
                  )}
                </div>
                <h3 className="heading-3 mt-2" style={{ fontSize: '1.2rem' }}>{med.name}</h3>
                <p className="text-muted mt-2" style={{ fontSize: '0.875rem', height: '40px', overflow: 'hidden' }}>{med.description}</p>
              </div>
              <div className="mt-6 flex items-center justify-between">
                <span className="heading-2" style={{ margin: 0, color: 'var(--primary)' }}>₹{med.price.toFixed(2)}</span>
                <button className="btn btn-primary" onClick={() => addToCart(med)}>
                  <Plus size={16} /> Add
                </button>
              </div>
            </div>
          ))
        ) : (
          <p>No medicines found.</p>
        )}
      </div>
    </div>
  );
}
