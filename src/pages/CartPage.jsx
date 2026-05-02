/**
 * CartPage.jsx
 *
 * The cart page is a read-modify UI — users see their selections and
 * can change them before committing to a purchase.
 *
 * KEY LOGIC DECISIONS:
 *
 * 1. "Proceed to Checkout" guards against unauthenticated users.
 *    If the user is not logged in, clicking checkout redirects them to 
 *    /login with `state: { from: '/payment' }` so after login they land 
 *    on the payment page, not the home page. This is graceful auth flow.
 *
 * 2. Order summary is always visible on desktop (sticky right column).
 *    On mobile it stacks below the items. This mirrors Amazon/Flipkart UX
 *    where the price summary is always in sight.
 *
 * 3. We show a "continue shopping" CTA on the empty state — never a dead end.
 */

import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const TrashIcon  = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>;
const CartIcon   = () => <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>;
const LockIcon   = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>;

function CartItemRow({ item }) {
  const { updateQuantity, removeFromCart } = useCart();
  const originalPrice = item.price / (1 - item.discountPercentage / 100);

  return (
    <div className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-gray-100
                    hover:border-brand-200 transition-all duration-200 animate-fade-in group">
      
      {/* Thumbnail */}
      <Link to={`/product/${item.id}`} className="flex-shrink-0">
        <img
          src={item.thumbnail}
          alt={item.title}
          className="w-20 h-20 sm:w-24 sm:h-24 object-contain bg-gray-50 rounded-xl p-2
                     group-hover:scale-105 transition-transform"
        />
      </Link>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <span className="text-xs text-brand-500 font-bold font-body uppercase tracking-wide">
          {item.category}
        </span>
        <Link to={`/product/${item.id}`}>
          <h3 className="font-body font-semibold text-gray-900 text-sm sm:text-base mt-0.5 
                         hover:text-brand-600 transition-colors line-clamp-2">
            {item.title}
          </h3>
        </Link>
        {item.brand && (
          <p className="text-xs text-gray-400 font-body mt-0.5">{item.brand}</p>
        )}

        {/* Price + Qty row */}
        <div className="flex items-center justify-between mt-3 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-lg text-gray-900">
              ${(item.price * item.quantity).toFixed(2)}
            </span>
            {item.discountPercentage > 5 && (
              <span className="text-xs text-gray-400 line-through font-body">
                ${(originalPrice * item.quantity).toFixed(2)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Quantity stepper */}
            <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 transition-colors font-bold"
              >
                −
              </button>
              <span className="px-3 py-1.5 text-gray-900 font-semibold font-body text-sm 
                               min-w-[2.5rem] text-center">
                {item.quantity}
              </span>
              <button
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 transition-colors font-bold"
              >
                +
              </button>
            </div>

            {/* Remove button */}
            <button
              onClick={() => removeFromCart(item.id)}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 
                         rounded-xl transition-all"
              title="Remove item"
            >
              <TrashIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderSummary({ items, totalPrice, onCheckout }) {
  const TAX_RATE    = 0.08;   // 8% tax
  const FREE_SHIP   = 50;     // Free shipping above $50
  const SHIP_COST   = 4.99;

  const tax      = totalPrice * TAX_RATE;
  const shipping = totalPrice >= FREE_SHIP ? 0 : SHIP_COST;
  const grandTotal = totalPrice + tax + shipping;

  return (
    <div className="bg-white border-2 border-gray-100 rounded-3xl p-6 lg:sticky lg:top-32 space-y-4">
      <h2 className="font-display text-xl font-bold text-gray-900">Order Summary</h2>

      <div className="space-y-3 text-sm font-body">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
          <span className="font-semibold text-gray-900">${totalPrice.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Shipping</span>
          {shipping === 0
            ? <span className="text-green-600 font-semibold">FREE</span>
            : <span className="font-semibold text-gray-900">${shipping.toFixed(2)}</span>
          }
        </div>
        {shipping > 0 && (
          <p className="text-xs text-brand-600 bg-brand-50 rounded-lg px-3 py-2">
            💡 Add ${(FREE_SHIP - totalPrice).toFixed(2)} more for free shipping!
          </p>
        )}
        <div className="flex justify-between text-gray-600">
          <span>Tax (8%)</span>
          <span className="font-semibold text-gray-900">${tax.toFixed(2)}</span>
        </div>
        <div className="border-t-2 border-gray-100 pt-3 flex justify-between">
          <span className="font-bold text-gray-900 text-base">Total</span>
          <span className="font-display font-bold text-xl text-gray-900">${grandTotal.toFixed(2)}</span>
        </div>
      </div>

      <button
        onClick={onCheckout}
        className="w-full py-4 bg-brand-500 hover:bg-brand-600 text-white font-semibold 
                   font-body rounded-xl transition-all shadow-glow hover:shadow-none
                   flex items-center justify-center gap-2 text-sm"
      >
        <LockIcon /> Secure Checkout
      </button>

      <div className="flex items-center justify-center gap-4 text-xs text-gray-400 font-body">
        <span>🔒 SSL Secure</span>
        <span>↩️ Easy Returns</span>
        <span>✓ Verified</span>
      </div>
    </div>
  );
}

export default function CartPage() {
  const { items, totalPrice, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (!isAuthenticated) {
      // Route to login, preserving intended destination
      navigate('/login', { state: { from: { pathname: '/payment' } } });
    } else {
      navigate('/payment');
    }
  };

  if (items.length === 0) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-24 text-center animate-fade-in">
        <div className="max-w-md mx-auto">
          <div className="text-gray-200 flex justify-center mb-6">
            <CartIcon />
          </div>
          <h2 className="font-display text-3xl font-bold text-gray-900 mb-3">Your cart is empty</h2>
          <p className="text-gray-500 font-body mb-8">
            Looks like you haven't added anything yet. Discover products you'll love!
          </p>
          <Link
            to="/"
            className="inline-block px-8 py-3.5 bg-brand-500 hover:bg-brand-600 text-white 
                       font-semibold font-body rounded-xl transition-all shadow-glow"
          >
            Start Shopping
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl font-bold text-gray-900">
          Your Cart
          <span className="ml-3 text-lg text-gray-400 font-body font-normal">
            ({items.length} item{items.length > 1 ? 's' : ''})
          </span>
        </h1>
        <button
          onClick={clearCart}
          className="text-sm text-red-400 hover:text-red-600 font-body hover:underline transition-colors"
        >
          Clear all
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map(item => (
            <CartItemRow key={item.id} item={item} />
          ))}
          <div className="pt-2">
            <Link
              to="/"
              className="text-sm text-brand-500 hover:text-brand-600 font-body font-semibold
                         flex items-center gap-1 transition-colors"
            >
              ← Continue Shopping
            </Link>
          </div>
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <OrderSummary
            items={items}
            totalPrice={totalPrice}
            onCheckout={handleCheckout}
          />
        </div>
      </div>
    </main>
  );
}
