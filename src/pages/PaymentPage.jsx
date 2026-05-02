/**
 * PaymentPage.jsx
 *
 * This page is AUTH-PROTECTED — only accessible after login.
 * The protection is handled by a <ProtectedRoute> wrapper in the router,
 * NOT here. Why? Because mixing business logic (payment) with access control
 * (auth) inside a single component makes both harder to test and understand.
 * Keep them separate: router handles WHO can enter, page handles WHAT they do.
 *
 * Form architecture: controlled components + Zod-inspired manual validation.
 * We don't use a library like React Hook Form to keep dependencies lean and
 * to demonstrate how validation actually works under the hood.
 *
 * Card formatting: we auto-format the card number as user types (XXXX XXXX XXXX XXXX)
 * This is a UX detail that significantly reduces input errors.
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const LockIcon    = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>;
const CheckCircle = () => <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>;

// ─── Formatters ───────────────────────────────────────────────────────────────
// These functions transform raw input into nicely-formatted display values.
// Keeping them pure (no side effects) makes them easy to test.

const formatCardNumber = (v) =>
  v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

const formatExpiry = (v) => {
  const digits = v.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
};

// ─── Validation rules ─────────────────────────────────────────────────────────
const validate = (fields) => {
  const errs = {};
  if (!fields.name.trim())           errs.name = 'Cardholder name is required';
  
  const cardDigits = fields.card.replace(/\s/g, '');
  if (cardDigits.length !== 16)      errs.card = 'Enter a valid 16-digit card number';
  
  const [mm, yy] = fields.expiry.split('/').map(Number);
  const now = new Date();
  const curYY = now.getFullYear() % 100;
  const curMM = now.getMonth() + 1;
  if (!mm || !yy || mm < 1 || mm > 12 || yy < curYY || (yy === curYY && mm < curMM))
    errs.expiry = 'Enter a valid expiry date (MM/YY)';
  
  if (!/^\d{3,4}$/.test(fields.cvv))  errs.cvv = 'CVV must be 3 or 4 digits';
  
  if (!fields.address.trim())         errs.address = 'Shipping address is required';
  if (!fields.city.trim())            errs.city = 'City is required';
  if (!fields.zip.trim())             errs.zip = 'ZIP code is required';

  return errs;
};

// ─── Order Success Screen ─────────────────────────────────────────────────────

function OrderSuccess({ orderId, onContinue }) {
  return (
    <div className="max-w-lg mx-auto text-center py-16 animate-scale-in">
      <div className="text-green-500 flex justify-center mb-6">
        <CheckCircle />
      </div>
      <h2 className="font-display text-3xl font-bold text-gray-900 mb-3">Order Confirmed!</h2>
      <p className="text-gray-500 font-body mb-2">
        Thank you for your order. We'll send a confirmation email shortly.
      </p>
      <p className="text-sm text-gray-400 font-body mb-8">
        Order ID: <span className="font-mono font-semibold text-gray-600">{orderId}</span>
      </p>
      <div className="space-y-3">
        <button
          onClick={onContinue}
          className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold
                     font-body rounded-xl transition-all shadow-glow text-sm"
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );
}

// ─── Input Field Component ─────────────────────────────────────────────────────

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 font-body mb-1.5">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500 font-body">{error}</p>}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PaymentPage() {
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim(),
    card: '',
    expiry: '',
    cvv: '',
    address: user?.address?.address ?? '',
    city: user?.address?.city ?? '',
    zip: user?.address?.postalCode ?? '',
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [processing, setProcessing] = useState(false);
  const [orderId, setOrderId] = useState(null);

  const TAX_RATE = 0.08;
  const FREE_SHIP = 50;
  const shipping = totalPrice >= FREE_SHIP ? 0 : 4.99;
  const tax = totalPrice * TAX_RATE;
  const grandTotal = totalPrice + tax + shipping;

  const set = (field) => (e) => {
    let val = e.target.value;
    if (field === 'card')   val = formatCardNumber(val);
    if (field === 'expiry') val = formatExpiry(val);
    if (field === 'cvv')    val = val.replace(/\D/g, '').slice(0, 4);
    setForm(p => ({ ...p, [field]: val }));
    // Re-validate on change if field was already touched
    if (touched[field]) {
      setErrors(validate({ ...form, [field]: val }));
    }
  };

  const blur = (field) => () => {
    setTouched(p => ({ ...p, [field]: true }));
    setErrors(validate(form));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const allTouched = Object.keys(form).reduce((a, k) => ({ ...a, [k]: true }), {});
    setTouched(allTouched);
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setProcessing(true);
    // Simulate payment processing — in a real app this calls your payments API
    await new Promise(r => setTimeout(r, 2000));
    
    // Generate a fake order ID
    const id = 'SN-' + Date.now().toString(36).toUpperCase();
    setOrderId(id);
    clearCart();
    setProcessing(false);
  };

  if (orderId) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <OrderSuccess orderId={orderId} onContinue={() => navigate('/')} />
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-24 text-center">
        <h2 className="font-display text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
        <Link to="/" className="inline-block px-6 py-3 bg-brand-500 text-white font-body 
                                 font-semibold rounded-xl hover:bg-brand-600 transition-colors">
          Back to Shopping
        </Link>
      </main>
    );
  }

  const inputClass = (field) =>
    `w-full px-4 py-3 rounded-xl border-2 font-body text-sm bg-gray-50 focus:bg-white
     focus:outline-none transition-all
     ${errors[field] && touched[field]
       ? 'border-red-400 focus:border-red-500'
       : 'border-gray-200 focus:border-brand-400'}`;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
      <h1 className="font-display text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── Payment Form ─────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} noValidate className="lg:col-span-2 space-y-8">
          
          {/* Card Information */}
          <section className="bg-white rounded-3xl border-2 border-gray-100 p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold font-body text-sm">1</span>
              </div>
              <h2 className="font-display text-xl font-bold text-gray-900">Payment Details</h2>
            </div>

            {/* Accepted cards */}
            <div className="flex gap-2">
              {['VISA', 'MC', 'AMEX', 'RuPay'].map(b => (
                <span key={b} className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-bold 
                                          font-mono rounded-lg border border-gray-200">
                  {b}
                </span>
              ))}
            </div>

            <Field label="Cardholder Name" error={touched.name && errors.name}>
              <input type="text" value={form.name} onChange={set('name')} onBlur={blur('name')}
                placeholder="Name as on card" className={inputClass('name')} />
            </Field>

            <Field label="Card Number" error={touched.card && errors.card}>
              <input type="text" value={form.card} onChange={set('card')} onBlur={blur('card')}
                placeholder="1234 5678 9012 3456" className={inputClass('card')}
                inputMode="numeric" maxLength={19} />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Expiry (MM/YY)" error={touched.expiry && errors.expiry}>
                <input type="text" value={form.expiry} onChange={set('expiry')} onBlur={blur('expiry')}
                  placeholder="MM/YY" className={inputClass('expiry')}
                  inputMode="numeric" maxLength={5} />
              </Field>
              <Field label="CVV" error={touched.cvv && errors.cvv}>
                <input type="password" value={form.cvv} onChange={set('cvv')} onBlur={blur('cvv')}
                  placeholder="•••" className={inputClass('cvv')}
                  inputMode="numeric" maxLength={4} />
              </Field>
            </div>

            {/* Security notice */}
            <div className="flex items-center gap-2 text-xs text-gray-500 font-body bg-green-50 
                            border border-green-200 rounded-xl px-4 py-3">
              <LockIcon />
              Your payment information is encrypted with 256-bit SSL encryption.
            </div>
          </section>

          {/* Shipping Address */}
          <section className="bg-white rounded-3xl border-2 border-gray-100 p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold font-body text-sm">2</span>
              </div>
              <h2 className="font-display text-xl font-bold text-gray-900">Shipping Address</h2>
            </div>

            <Field label="Street Address" error={touched.address && errors.address}>
              <input type="text" value={form.address} onChange={set('address')} onBlur={blur('address')}
                placeholder="123 Main St" className={inputClass('address')} />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="City" error={touched.city && errors.city}>
                <input type="text" value={form.city} onChange={set('city')} onBlur={blur('city')}
                  placeholder="City" className={inputClass('city')} />
              </Field>
              <Field label="ZIP / Postal Code" error={touched.zip && errors.zip}>
                <input type="text" value={form.zip} onChange={set('zip')} onBlur={blur('zip')}
                  placeholder="560001" className={inputClass('zip')} />
              </Field>
            </div>
          </section>

          {/* Submit button (mobile) */}
          <button
            type="submit"
            disabled={processing}
            className="lg:hidden w-full py-4 bg-brand-500 hover:bg-brand-600 text-white font-semibold
                       font-body rounded-xl transition-all shadow-glow flex items-center justify-center gap-2 text-sm
                       disabled:bg-brand-300"
          >
            {processing
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</>
              : <><LockIcon /> Place Order — ${grandTotal.toFixed(2)}</>
            }
          </button>
        </form>

        {/* ── Order Summary ─────────────────────────────────────────── */}
        <div className="lg:col-span-1">
          <div className="bg-white border-2 border-gray-100 rounded-3xl p-6 lg:sticky lg:top-32 space-y-5">
            <h2 className="font-display text-xl font-bold text-gray-900">Order Summary</h2>

            {/* Items list */}
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {items.map(item => (
                <div key={item.id} className="flex items-center gap-3">
                  <img src={item.thumbnail} alt={item.title}
                    className="w-12 h-12 object-contain bg-gray-50 rounded-xl p-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 font-body line-clamp-1">{item.title}</p>
                    <p className="text-xs text-gray-400 font-body">Qty: {item.quantity}</p>
                  </div>
                  <span className="text-sm font-bold text-gray-900 font-body flex-shrink-0">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t-2 border-gray-100 pt-4 space-y-2 text-sm font-body">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                {shipping === 0
                  ? <span className="text-green-600 font-semibold">FREE</span>
                  : <span>${shipping.toFixed(2)}</span>
                }
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax (8%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="border-t-2 border-gray-100 pt-2 flex justify-between font-bold text-base">
                <span className="text-gray-900">Total</span>
                <span className="font-display text-xl">${grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Desktop submit */}
            <button
              onClick={handleSubmit}
              disabled={processing}
              className="hidden lg:flex w-full py-4 bg-brand-500 hover:bg-brand-600 text-white font-semibold
                         font-body rounded-xl transition-all shadow-glow items-center justify-center gap-2 text-sm
                         disabled:bg-brand-300"
            >
              {processing
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</>
                : <><LockIcon /> Place Order</>
              }
            </button>

            <Link to="/cart" className="block text-center text-sm text-gray-400 hover:text-brand-500 
                                         font-body transition-colors">
              ← Back to Cart
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
