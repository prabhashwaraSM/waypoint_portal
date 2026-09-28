import React, { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import PageHeader from "../components/PageHeader";

export default function PlaceOrderPage({ profile }) {
  const [targetDate, setTargetDate] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(profile.products[0]?.id || "");
  const [cart, setCart] = useState(() => {
    const first = profile.products[0];
    return first ? [{ ...first, qty: profile.key === "fresh" ? 10 : 2 }] : [];
  });
  const [submitted, setSubmitted] = useState(false);

  const total = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.qty, 0), [cart]);

  const addProduct = () => {
    const product = profile.products.find((item) => item.id === selectedProduct);
    if (!product) return;
    setSubmitted(false);
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) return current.map((item) => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      return [...current, { ...product, qty: 1 }];
    });
  };

  const changeQty = (id, delta) => {
    setSubmitted(false);
    setCart((current) => current
      .map((item) => item.id === id ? { ...item, qty: Math.max(0, item.qty + delta) } : item)
      .filter((item) => item.qty > 0));
  };

  const submitOrder = () => {
    if (!cart.length || !targetDate) return;
    setSubmitted(true);
  };

  return (
    <>
      <PageHeader
        eyebrow={profile.brand.toUpperCase() + " • ORDERING"}
        title="Place Order"
        description={"Create a whole store order for " + profile.outlet + ". The dispatcher will plan the vehicle and trip after the order cutoff."}
      />

      {profile.key === "fresh" && (
        <div className="store-warning-banner">
          <AlertTriangle size={18} />
          <div><b>Previous chilled order was deferred</b><span>Fleet capacity caused a deferral. The next available run will be shown once the dispatcher replans it.</span></div>
        </div>
      )}

      <section className="store-order-layout">
        <div className="store-panel">
          <div className="store-panel-head"><div><h2>Order requirements</h2><p>Select products and quantities for the next delivery.</p></div></div>
          <div className="store-order-form">
            <div className="store-cutoff-card">
              <Clock3 size={18} />
              <div><b>Next-day order cutoff: 4:00 PM</b><span>{profile.service}</span></div>
            </div>

            <label className="store-field">
              <span>Target delivery date</span>
              <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
            </label>

            <div className="store-product-picker">
              <label className="store-field">
                <span>Product</span>
                <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)}>
                  {profile.products.map((product) => <option key={product.id} value={product.id}>{product.name} • {product.category}</option>)}
                </select>
              </label>
              <button className="store-primary-btn" onClick={addProduct}><Plus size={16} /> Add item</button>
            </div>

            <div className="store-rule-note">
              <AlertTriangle size={16} />
              <span><b>Operational note</b>{profile.vehicleNote}</span>
            </div>
          </div>
        </div>

        <aside className="store-panel store-order-summary">
          <div className="store-panel-head"><div><h2>Order summary</h2><p>{cart.length} item lines selected</p></div><ShoppingCart size={18} /></div>
          <div className="store-cart-list">
            {cart.map((item) => (
              <article key={item.id}>
                <div><b>{item.name}</b><small>{item.category} • Rs. {item.price.toLocaleString()}</small></div>
                <div className="store-qty-control">
                  <button onClick={() => changeQty(item.id, -1)}><Minus size={14} /></button>
                  <b>{item.qty}</b>
                  <button onClick={() => changeQty(item.id, 1)}><Plus size={14} /></button>
                </div>
                <strong>Rs. {(item.price * item.qty).toLocaleString()}</strong>
                <button className="store-remove-btn" onClick={() => setCart((current) => current.filter((row) => row.id !== item.id))}><Trash2 size={15} /></button>
              </article>
            ))}
          </div>

          <div className="store-total-row"><span>Estimated total</span><b>Rs. {total.toLocaleString()}</b></div>
          <button className="store-primary-btn store-submit-order" onClick={submitOrder} disabled={!cart.length || !targetDate}>
            <CheckCircle2 size={17} /> Submit store order
          </button>

          {submitted && <div className="store-success-note"><CheckCircle2 size={16} /> Order submitted to Dispatcher planning queue.</div>}
        </aside>
      </section>
    </>
  );
}
