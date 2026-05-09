/**
 * App.jsx — The Application Shell
 *
 * This is the "composition root" of your app — where all the pieces plug together.
 *
 * PROVIDER NESTING ORDER matters:
 * AuthProvider must wrap CartProvider because CartProvider might eventually
 * need to know the user (e.g., sync cart with a user account). More importantly,
 * both wrap the Router, which means all route components can access both contexts.
 *
 * LAYOUT PATTERN:
 * The Navbar + Footer are rendered OUTSIDE the <Routes> but INSIDE the providers.
 * This means they're always visible, regardless of which route is active.
 * The <Routes> block renders only the matching page component.
 *
 * SCROLL TO TOP:
 * React Router v6 does NOT scroll to top on route change by default.
 * The ScrollToTop component fixes this — it listens for pathname changes
 * and imperatively scrolls to the top.
 */

import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";

import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CategoryPage from "./pages/CategoryPage";
import CartPage from "./pages/CartPage";
import PaymentPage from "./pages/PaymentPage";

// WHY a component instead of useEffect in App?
// useEffect at the App level runs after every render, which is wasteful.
// ScrollToTop is a tiny component that only mounts once per route change
// and imperatively scrolls — no re-render needed.
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null; // renders nothing — pure side-effect component
}

// The Layout wraps all "normal" pages with Navbar + Footer.
// LoginPage SKIPS this wrapper (it has its own full-screen layout).
function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 font-body">
      <Navbar />
      {children}
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <ScrollToTop />
          <Routes>
            {/* 
              Login has its own full-screen dark layout — no Navbar/Footer.
              WHY? Login pages are a "transition moment" — you want the user
              focused on signing in, not distracted by navigation.
            */}
            <Route path="/login" element={<LoginPage />} />

            {/* All other pages share the Layout shell */}
            <Route
              path="/"
              element={
                <Layout>
                  <HomePage />
                </Layout>
              }
            />

            <Route
              path="/product/:id"
              element={
                <Layout>
                  <ProductDetailPage />
                </Layout>
              }
            />

            <Route
              path="/category/:slug"
              element={
                <Layout>
                  <CategoryPage />
                </Layout>
              }
            />

            {/* Cart is PUBLIC — you can browse your cart without logging in */}
            <Route
              path="/cart"
              element={
                <Layout>
                  <CartPage />
                </Layout>
              }
            />

            {/* 
              Payment is PROTECTED — you must be logged in to order.
              The ProtectedRoute wrapper intercepts unauthenticated access
              and redirects to /login, saving the current path for post-login redirect.
            */}
            <Route
              path="/payment"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PaymentPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Catch-all 404 */}
            <Route
              path="*"
              element={
                <Layout>
                  <div className="max-w-7xl mx-auto px-4 py-24 text-center">
                    <span className="text-7xl">🪴</span>
                    <h2 className="font-display text-3xl font-bold text-gray-900 mt-6">
                      Page not found
                    </h2>
                    <p className="text-gray-500 font-body mt-2 mb-6">
                      This nest is empty.
                    </p>
                    <a
                      href="/"
                      className="px-6 py-3 bg-brand-500 text-white font-semibold font-body 
                                        rounded-xl hover:bg-brand-600 transition-colors"
                    >
                      Back to Home
                    </a>
                  </div>
                </Layout>
              }
            />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
