import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import "./App.css";
import TaglineSection from "./TaglineSection";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8000",
});

function App() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    id: "",
    name: "",
    description: "",
    price: "",
    quantity: "",
  });
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");
  const [sortField, setSortField] = useState("id");
  const [sortDirection, setSortDirection] = useState("asc");

  // Auto-dismiss messages after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Fetch all products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/products");
      console.log("=== API Response Debug ===");
      console.log("Full Response:", res);
      console.log("res.data:", res.data);
      console.log("Type of res.data:", typeof res.data);
      console.log("Is Array:", Array.isArray(res.data));
      console.log("res.data keys:", Object.keys(res.data || {}));

      let data = [];
      if (Array.isArray(res.data)) {
        data = res.data;
      } else if (res.data && typeof res.data === 'object' && res.data.data && Array.isArray(res.data.data)) {
        data = res.data.data;
      }

      console.log("Final data to set:", data);
      setProducts(data);
      setError("");
    } catch (err) {
      console.error("API Error:", err);
      setError("Failed to fetch products");
      setProducts([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    // Inline initial fetch to avoid referencing external deps
    const run = async () => {
      setLoading(true);
      try {
        const res = await api.get("/products");
        console.log("=== Initial Fetch Debug ===");
        console.log("Full Response:", res);
        console.log("res.data:", res.data);
        console.log("Type of res.data:", typeof res.data);
        console.log("Is Array:", Array.isArray(res.data));

        let data = [];
        if (Array.isArray(res.data)) {
          data = res.data;
        } else if (res.data && typeof res.data === 'object' && res.data.data && Array.isArray(res.data.data)) {
          data = res.data.data;
        }

        console.log("Final data to set:", data);
        setProducts(data);
        setError("");
      } catch (err) {
        console.error("Initial Fetch Error:", err);
        setError("Failed to fetch products");
        setProducts([]);
      }
      setLoading(false);
    };
    run();
  }, []);

  // Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Derived list with filter and sorting
  const filteredProducts = useMemo(() => {
    try {
      // Ensure products is an array - extra defensive
      if (!products || typeof products !== 'object' || !Array.isArray(products)) {
        return [];
      }

      let filtered = [...products]; // Create a copy to avoid mutations

      // Apply filter
      const q = filter.trim().toLowerCase();
      if (q) {
        filtered = filtered.filter((p) =>
          String(p?.id || '').includes(q) ||
          String(p?.name || '').toLowerCase().includes(q) ||
          String(p?.description || '').toLowerCase().includes(q)
        );
      }

      // Apply sorting - with safety checks
      if (!Array.isArray(filtered)) {
        return [];
      }

      return filtered.sort((a, b) => {
        try {
          let aVal = a?.[sortField];
          let bVal = b?.[sortField];

          // Handle numeric fields
          if (sortField === "id" || sortField === "price" || sortField === "quantity") {
            aVal = Number(aVal) || 0;
            bVal = Number(bVal) || 0;
          } else {
            // Handle string fields
            aVal = String(aVal || '').toLowerCase();
            bVal = String(bVal || '').toLowerCase();
          }

          if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
          if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
          return 0;
        } catch (e) {
          console.error('Sort error:', e);
          return 0;
        }
      });
    } catch (e) {
      console.error('FilteredProducts error:', e);
      return [];
    }
  }, [products, filter, sortField, sortDirection]);

  // Handle form input
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Reset form
  const resetForm = () => {
    setForm({ id: "", name: "", description: "", price: "", quantity: "" });
    setEditId(null);
  };

  // Create or update product
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    try {
      if (editId) {
        await api.put(`/products/${editId}`, {
          ...form,
          id: Number(form.id),
          price: Number(form.price),
          quantity: Number(form.quantity),
        });
        setMessage("Product updated successfully");
      } else {
        await api.post("/products/", {
          ...form,
          id: Number(form.id),
          price: Number(form.price),
          quantity: Number(form.quantity),
        });
        setMessage("Product created successfully");
      }
      resetForm();
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.detail || "Operation failed");
    }
    setLoading(false);
  };

  // Edit product
  const handleEdit = (product) => {
    setForm({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      quantity: product.quantity,
    });
    setEditId(product.id);
    setMessage("");
    setError("");
  };

  // Delete product
  const handleDelete = async (id) => {
    const ok = window.confirm("Delete this product?");
    if (!ok) return;
    setLoading(true);
    setMessage("");
    setError("");
    try {
      await api.delete(`/products/${id}`);
      setMessage("Product deleted successfully");
      fetchProducts();
    } catch (err) {
      setError("Delete failed");
    }
    setLoading(false);
  };

  const currency = (n) =>
    typeof n === "number" ? n.toFixed(2) : Number(n || 0).toFixed(2);

  return (
    <div className="app-bg">
      <header className="topbar">
        <div className="brand">
          <span className="brand-badge">📦</span>
          <h1>Products Dashboard</h1>
        </div>
        <div className="top-actions">
          <button className="btn btn-light" onClick={fetchProducts} disabled={loading}>
            Refresh
          </button>
        </div>
      </header>

      <div className="container">
        <div className="stats">
          <div className="chip">Total: {products.length}</div>
          <div className="search">
            <input
              type="text"
              placeholder="Search by id, name or description..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
        </div>

        <div className="content-grid">
          <div className="card form-card">
            <h2>{editId ? "Edit Product" : "Add Product"}</h2>
            <form onSubmit={handleSubmit} className="product-form">
              <input
                type="number"
                name="id"
                placeholder="ID"
                value={form.id}
                onChange={handleChange}
                required
                disabled={!!editId}
              />
              <input
                type="text"
                name="name"
                placeholder="Name"
                value={form.name}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="description"
                placeholder="Description"
                value={form.description}
                onChange={handleChange}
                required
              />
              <input
                type="number"
                name="price"
                placeholder="Price"
                value={form.price}
                onChange={handleChange}
                required
                step="0.01"
              />
              <input
                type="number"
                name="quantity"
                placeholder="Quantity"
                value={form.quantity}
                onChange={handleChange}
                required
              />
              <div className="form-actions">
                <button className="btn" type="submit" disabled={loading}>
                  {editId ? "Update" : "Add"}
                </button>
                {editId && (
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() => {
                      resetForm();
                      setMessage("");
                      setError("");
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
            {message && <div className="success-msg">{message}</div>}
            {error && <div className="error-msg">{error}</div>}
          </div>
          
          <TaglineSection />

          <div className="card list-card">
            <h2>Products</h2>
            {loading ? (
              <div className="loader">Loading...</div>
            ) : (
              <div className="scroll-x">
                <table className="product-table">
                  <thead>
                    <tr>
                      <th 
                        className={`sortable ${sortField === 'id' ? `sort-${sortDirection}` : ''}`}
                        onClick={() => handleSort('id')}
                      >
                        ID
                      </th>
                      <th 
                        className={`sortable ${sortField === 'name' ? `sort-${sortDirection}` : ''}`}
                        onClick={() => handleSort('name')}
                      >
                        Name
                      </th>
                      <th>Description</th>
                      <th 
                        className={`sortable ${sortField === 'price' ? `sort-${sortDirection}` : ''}`}
                        onClick={() => handleSort('price')}
                      >
                        Price
                      </th>
                      <th 
                        className={`sortable ${sortField === 'quantity' ? `sort-${sortDirection}` : ''}`}
                        onClick={() => handleSort('quantity')}
                      >
                        Quantity
                      </th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((p) => (
                      <tr key={p.id}>
                        <td>{p.id}</td>
                        <td className="name-cell">{p.name}</td>
                        <td className="desc-cell" title={p.description}>{p.description}</td>
                        <td className="price-cell">${currency(p.price)}</td>
                        <td>
                          <span className="qty-badge">{p.quantity}</span>
                        </td>
                        <td>
                          <div className="row-actions">
                            <button className="btn btn-edit" onClick={() => handleEdit(p)}>
                              Edit
                            </button>
                            <button className="btn btn-delete" onClick={() => handleDelete(p.id)}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredProducts.length === 0 && (
                      <tr>
                        <td colSpan={6} className="empty">
                          No products found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
