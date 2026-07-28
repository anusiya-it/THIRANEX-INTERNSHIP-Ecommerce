import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [user, setUser] = useState(null); // Tracks logged-in user details
  const [emailInput, setEmailInput] = useState('');
  const [message, setMessage] = useState('');

  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [orders, setOrders] = useState([]);

  // Admin form state
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newStock, setNewStock] = useState('');
  const [newCategory, setNewCategory] = useState('Electronics');

  const fetchProducts = () => {
    fetch('http://127.0.0.1:5000/products')
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error('Error fetching products:', err));
  };

  const fetchOrders = () => {
    fetch('http://127.0.0.1:5000/orders')
      .then(res => res.json())
      .then(data => setOrders(data))
      .catch(err => console.error('Error fetching orders:', err));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // --- LOGIN HANDLER ---
  const handleLogin = (e) => {
    e.preventDefault();
    fetch('http://127.0.0.1:5000/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailInput })
    })
      .then(res => res.json())
      .then(data => {
        if (data.user_id) {
          setUser(data); // Save user session
          setMessage(`Welcome back, ${data.name} (${data.role})!`);
          if (data.role === 'admin') fetchOrders();
        } else {
          setMessage(data.error || 'Login failed');
        }
      })
      .catch(err => setMessage('Network error during login'));
  };

  const handleLogout = () => {
    setUser(null);
    setEmailInput('');
    setMessage('Logged out successfully.');
  };

  // --- CART & CHECKOUT ---
  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setMessage(`Added ${product.name} to cart!`);
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    cart.forEach(item => {
      fetch('http://127.0.0.1:5000/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.user_id, product_id: item.id, quantity: item.quantity }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.order_id) {
            setMessage('Checkout successful!');
            setCart([]);
            if (user.role === 'admin') fetchOrders();
          }
        });
    });
  };

  // --- ADMIN ADD PRODUCT ---
  const handleAddProduct = (e) => {
    e.preventDefault();
    fetch('http://127.0.0.1:5000/add-product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, price: parseFloat(newPrice), stock: parseInt(newStock), category: newCategory }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.product_id) {
          setMessage('Product added successfully!');
          setNewName(''); setNewPrice(''); setNewStock('');
          fetchProducts();
        }
      });
  };

  const filteredProducts = selectedCategory === 'All' ? products : products.filter(p => p.category === selectedCategory);
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // 1. IF NOT LOGGED IN, SHOW LOGIN SCREEN
  if (!user) {
    return (
      <div style={{ maxWidth: '400px', margin: '100px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', fontFamily: 'Arial' }}>
        <h2>🔐 User Login</h2>
        {message && <p style={{ color: 'red', fontWeight: 'bold' }}>{message}</p>}
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '15px' }}>
            <label>Enter Registered Email:</label><br />
            <input 
              type="email" 
              value={emailInput} 
              onChange={e => setEmailInput(e.target.value)} 
              placeholder="e.g., admin@store.com or user@store.com" 
              required 
              style={{ width: '100%', padding: '8px', marginTop: '5px' }} 
            />
          </div>
          <button type="submit" style={{ background: 'blue', color: 'white', border: 'none', padding: '10px', width: '100%', borderRadius: '4px', cursor: 'pointer' }}>
            Login
          </button>
        </form>
        <p style={{ fontSize: '12px', color: '#666', marginTop: '15px' }}>
          *Note: Make sure you have added an account via your database or `/add-user` endpoint first (e.g., test with an admin email).
        </p>
      </div>
    );
  }

  // 2. LOGGED IN DASHBOARD
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #ccc', paddingBottom: '10px' }}>
        <h1>🛒 E-Commerce Store ({user.role.toUpperCase()} PORTAL)</h1>
        <div>
          <span style={{ marginRight: '15px', fontWeight: 'bold' }}>Hello, {user.name}</span>
          <button onClick={handleLogout} style={{ background: 'red', color: 'white', border: 'none', padding: '6px 12px', cursor: 'pointer', borderRadius: '4px' }}>
            Logout
          </button>
        </div>
      </div>

      {message && <div style={{ padding: '10px', background: '#e2f0cb', margin: '20px 0', borderRadius: '5px', color: '#2b542c', fontWeight: 'bold' }}>{message}</div>}

      {/* REGULAR USER VIEW */}
      {user.role === 'user' && (
        <div style={{ display: 'flex', gap: '30px' }}>
          <div style={{ flex: 2 }}>
            <h2>Product Catalog</h2>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              {['All', 'Electronics', 'Fashion', 'Home'].map(cat => (
                <button key={cat} onClick={() => setSelectedCategory(cat)} style={{ padding: '6px 12px', background: selectedCategory === cat ? '#333' : '#eee', color: selectedCategory === cat ? '#fff' : '#000', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  {cat}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              {filteredProducts.map(product => (
                <div key={product.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', width: '180px' }}>
                  <span style={{ fontSize: '10px', background: '#e0e0e0', padding: '2px 6px', borderRadius: '4px' }}>{product.category}</span>
                  <h3>{product.name}</h3>
                  <p style={{ color: 'green', fontWeight: 'bold' }}>₹{product.price}</p>
                  <button onClick={() => addToCart(product)} style={{ background: 'blue', color: 'white', border: 'none', padding: '6px 10px', cursor: 'pointer', borderRadius: '4px', width: '100%' }}>Add to Cart</button>
                </div>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, background: '#f9f9f9', padding: '15px', borderRadius: '8px', border: '1px solid #ddd', height: 'fit-content' }}>
            <h3>🛍️ Cart</h3>
            {cart.length === 0 ? <p>Cart is empty.</p> : (
              <div>
                {cart.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span>{item.name} (x{item.quantity})</span>
                    <span>₹{item.price * item.quantity}</span>
                  </div>
                ))}
                <h4>Total: ₹{totalPrice}</h4>
                <button onClick={handleCheckout} style={{ background: 'green', color: 'white', border: 'none', padding: '10px', width: '100%', borderRadius: '4px', cursor: 'pointer' }}>Checkout</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADMIN VIEW */}
      {user.role === 'admin' && (
        <div>
          <h2 style={{ color: 'purple' }}>Admin Management Panel</h2>
          <form onSubmit={handleAddProduct} style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '30px' }}>
            <h3>Add Product</h3>
            <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Product Name" required style={{ width: '100%', padding: '8px', marginBottom: '10px' }} />
            <input type="number" step="0.01" value={newPrice} onChange={e => setNewPrice(e.target.value)} placeholder="Price" required style={{ width: '100%', padding: '8px', marginBottom: '10px' }} />
            <input type="number" value={newStock} onChange={e => setNewStock(e.target.value)} placeholder="Stock" required style={{ width: '100%', padding: '8px', marginBottom: '10px' }} />
            <select value={newCategory} onChange={e => setNewCategory(e.target.value)} style={{ width: '100%', padding: '8px', marginBottom: '10px' }}>
              <option value="Electronics">Electronics</option>
              <option value="Fashion">Fashion</option>
              <option value="Home">Home</option>
            </select>
            <button type="submit" style={{ background: 'purple', color: 'white', border: 'none', padding: '10px', width: '100%', borderRadius: '4px' }}>Add Product</button>
          </form>

          <h3>Customer Orders Tracking</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
            <thead>
              <tr style={{ background: '#eee' }}>
                <th style={{ padding: '8px', border: '1px solid #ddd' }}>ID</th>
                <th style={{ padding: '8px', border: '1px solid #ddd' }}>User</th>
                <th style={{ padding: '8px', border: '1px solid #ddd' }}>Product</th>
                <th style={{ padding: '8px', border: '1px solid #ddd' }}>Qty</th>
                <th style={{ padding: '8px', border: '1px solid #ddd' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id}>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{o.id}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{o.user_id}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{o.product_id}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{o.quantity}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', color: 'orange' }}>{o.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;