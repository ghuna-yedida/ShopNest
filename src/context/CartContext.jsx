/**
 * CartContext.jsx
 *
 * WHY separate the cart into its own context instead of putting it in AuthContext?
 * Single Responsibility Principle (SRP): each context should manage ONE concern.
 * Auth manages "who you are", Cart manages "what you want to buy".
 * Mixing them creates a god-object that's hard to test, debug, and maintain.
 * 
 * Cart Logic Summary:
 *  - Items are stored as { ...product, quantity }
 *  - Adding an existing item increments its quantity
 *  - Removing decrements; if quantity hits 0, item is removed entirely
 *  - Cart persists in localStorage so it survives page refreshes
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('shopnest_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Persist cart to localStorage on every change
  useEffect(() => {
    localStorage.setItem('shopnest_cart', JSON.stringify(items));
  }, [items]);

  /**
   * addToCart — useCallback prevents recreation on every render.
   * WHY does that matter? If this function is passed as a prop to a 
   * child wrapped in React.memo, a stable reference means the child 
   * won't re-render unnecessarily.
   */
  const addToCart = useCallback((product, qty = 1) => {
    setItems(prev => {
      const exists = prev.find(i => i.id === product.id);
      if (exists) {
        // Item already in cart → just bump the quantity
        return prev.map(i =>
          i.id === product.id ? { ...i, quantity: i.quantity + qty } : i
        );
      }
      // New item → append with initial quantity
      return [...prev, { ...product, quantity: qty }];
    });
  }, []);

  const removeFromCart = useCallback((productId) => {
    setItems(prev => prev.filter(i => i.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId, qty) => {
    if (qty < 1) {
      removeFromCart(productId);
      return;
    }
    setItems(prev =>
      prev.map(i => i.id === productId ? { ...i, quantity: qty } : i)
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => setItems([]), []);

  /**
   * Derived values — computed from state, not stored separately.
   * WHY not store totals in state? Because they'd get out of sync.
   * Derived values are always consistent because they recompute from 
   * the single source of truth (items array) on every render.
   */
  const totalItems  = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice  = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  const isInCart    = (id) => items.some(i => i.id === id);
  const getItemQty  = (id) => items.find(i => i.id === id)?.quantity ?? 0;

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice,
      isInCart,
      getItemQty,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
