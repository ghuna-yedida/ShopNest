/**
 * AuthContext.jsx
 * 
 * WHY a Context for auth?
 * Authentication state (who is logged in) needs to be accessible from 
 * ANYWHERE in the component tree — the Navbar needs it to show/hide "Login",
 * the checkout flow needs it to gate the order, the profile page needs it.
 * 
 * Without Context, you'd have to "prop-drill" the user object through every 
 * intermediate component, even ones that don't use it. Context solves this 
 * by creating a global "broadcast" channel.
 * 
 * Architecture: Provider → wraps the app, Consumer → any child reads with useAuth()
 */

import { createContext, useContext, useState, useEffect } from 'react';

// Step 1: Create the context object (just a container)
const AuthContext = createContext(null);

// Step 2: Build the Provider — this is what wraps your app
export function AuthProvider({ children }) {
  // WHY localStorage? So login persists across browser refreshes.
  // Without this, every page refresh would log you out.
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('shopnest_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sync user state to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('shopnest_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('shopnest_user');
    }
  }, [user]);

  /**
   * login() — calls DummyJSON's auth endpoint.
   * DummyJSON returns a JWT token + user info on success,
   * or throws an error if credentials don't match.
   * 
   * WHY async/await instead of .then()? 
   * Async/await reads linearly like synchronous code, making error 
   * handling with try/catch much cleaner than chained .catch() blocks.
   */
  const login = async (username, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('https://dummyjson.com/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, expiresInMins: 60 }),
      });

      const data = await res.json();

      if (!res.ok) {
        // DummyJSON returns { message: "..." } on auth failure
        throw new Error(data.message || 'Invalid credentials');
      }

      setUser(data);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      // WHY finally? This runs whether success OR failure,
      // ensuring the loading spinner always disappears.
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setError(null);
  };

  // Step 3: Expose only what consumers need
  const value = {
    user,
    isLoading,
    error,
    login,
    logout,
    isAuthenticated: !!user,  // convenient boolean derived from user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth() — custom hook for consuming the context.
 * WHY a custom hook instead of useContext(AuthContext) directly?
 * 1. It throws a helpful error if used outside the Provider
 * 2. It's shorter and more expressive at call sites
 * 3. You can add logging/debugging logic here in one place
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
