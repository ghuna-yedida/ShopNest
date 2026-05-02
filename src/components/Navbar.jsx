/**
 * Navbar.jsx
 *
 * Architecture decisions explained:
 * 
 * 1. CONTROLLED SEARCH INPUT: The search value lives in the Navbar's local state,
 *    but when the user submits, it's lifted up via onSearch() prop or navigation.
 *    We navigate to /?search=query so the URL IS the search state — refreshing 
 *    the page preserves the search, and the back button works correctly.
 *
 * 2. CATEGORY DROPDOWN: Fetched from DummyJSON once, cached by useCategories().
 *    Rendered as a mega-menu on desktop, accordion on mobile.
 *
 * 3. STICKY + BLUR: position:sticky keeps the nav visible as you scroll.
 *    backdrop-blur gives the frosted glass effect without fully hiding the page.
 */

import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useCategories } from '../hooks/useProducts';

// Icons as inline SVG components — no icon library dependency needed
const SearchIcon   = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>;
const CartIcon     = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>;
const UserIcon     = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>;
const MenuIcon     = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>;
const CloseIcon    = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>;
const ChevronDown  = () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7"/></svg>;
const LogoutIcon   = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>;

// Curated category display config — maps DummyJSON slugs to friendly names + emojis
const CATEGORY_META = {
  'smartphones':          { label: 'Smartphones',     emoji: '📱', group: 'Electronics' },
  'laptops':              { label: 'Laptops',          emoji: '💻', group: 'Electronics' },
  'tablets':              { label: 'Tablets',          emoji: '📲', group: 'Electronics' },
  'mobile-accessories':   { label: 'Accessories',      emoji: '🎧', group: 'Electronics' },
  'womens-dresses':       { label: 'Dresses',          emoji: '👗', group: 'Women' },
  'womens-shoes':         { label: 'Shoes',            emoji: '👠', group: 'Women' },
  'womens-bags':          { label: 'Bags',             emoji: '👜', group: 'Women' },
  'womens-jewellery':     { label: 'Jewellery',        emoji: '💍', group: 'Women' },
  'womens-watches':       { label: 'Watches',          emoji: '⌚', group: 'Women' },
  'mens-shirts':          { label: 'Shirts',           emoji: '👔', group: 'Men' },
  'mens-shoes':           { label: 'Shoes',            emoji: '👟', group: 'Men' },
  'mens-watches':         { label: 'Watches',          emoji: '🕐', group: 'Men' },
  'fragrances':           { label: 'Fragrances',       emoji: '🌸', group: 'Beauty' },
  'skin-care':            { label: 'Skin Care',        emoji: '✨', group: 'Beauty' },
  'furniture':            { label: 'Furniture',        emoji: '🛋️', group: 'Home' },
  'home-decoration':      { label: 'Decoration',       emoji: '🏺', group: 'Home' },
  'kitchen-accessories':  { label: 'Kitchen',          emoji: '🍳', group: 'Home' },
  'groceries':            { label: 'Groceries',        emoji: '🥬', group: 'Home' },
  'sports-accessories':   { label: 'Sports',           emoji: '⚽', group: 'More' },
  'sunglasses':           { label: 'Sunglasses',       emoji: '🕶️', group: 'More' },
  'tops':                 { label: 'Tops',             emoji: '👕', group: 'More' },
  'vehicle':              { label: 'Vehicles',         emoji: '🚗', group: 'More' },
};

const NAV_GROUPS = ['Electronics', 'Women', 'Men', 'Beauty', 'Home', 'More'];

export default function Navbar() {
  const [search, setSearch]         = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState(null);  // which dropdown is open
  const [scrolled, setScrolled]     = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const { totalItems } = useCart();
  const { categories } = useCategories();
  const dropdownRef = useRef(null);
  const userMenuRef = useRef(null);

  // Pre-parse categories into groups for the mega-menu
  const grouped = categories.reduce((acc, cat) => {
    const meta = CATEGORY_META[cat.slug];
    if (!meta) return acc;
    if (!acc[meta.group]) acc[meta.group] = [];
    acc[meta.group].push({ ...cat, ...meta });
    return acc;
  }, {});

  // Shrink/style the navbar on scroll — classic UX pattern
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close dropdowns when clicking outside — critical for accessibility
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setActiveGroup(null);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); setActiveGroup(null); }, [location]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/?search=${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-md py-2'
          : 'bg-white py-3'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          
          {/* ── Top Bar ─────────────────────────────────────────────── */}
          <div className="flex items-center gap-4 lg:gap-8">
            
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 flex-shrink-0 group">
              <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center shadow-glow group-hover:scale-105 transition-transform">
                <span className="text-white font-display font-bold text-sm">S</span>
              </div>
              <span className="font-display font-bold text-xl text-gray-900">
                Shop<span className="text-brand-500">Nest</span>
              </span>
            </Link>

            {/* Search Bar — hidden on mobile (shown in mobile menu) */}
            <form onSubmit={handleSearch} className="hidden sm:flex flex-1 max-w-lg">
              <div className="relative w-full group">
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search for products, brands..."
                  className="w-full pl-4 pr-12 py-2.5 rounded-xl border-2 border-gray-200 
                             focus:border-brand-400 focus:outline-none focus:ring-0
                             bg-gray-50 focus:bg-white font-body text-sm text-gray-800
                             placeholder:text-gray-400 transition-all duration-200"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 
                             w-8 h-8 flex items-center justify-center
                             bg-brand-500 hover:bg-brand-600 text-white 
                             rounded-lg transition-colors"
                >
                  <SearchIcon />
                </button>
              </div>
            </form>

            {/* Right actions */}
            <div className="flex items-center gap-2 ml-auto">
              
              {/* User menu */}
              <div ref={userMenuRef} className="relative">
                {isAuthenticated ? (
                  <button
                    onClick={() => setUserMenuOpen(p => !p)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl 
                               hover:bg-gray-100 transition-colors text-gray-700"
                  >
                    <img
                      src={user?.image || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.firstName}`}
                      alt="avatar"
                      className="w-7 h-7 rounded-full object-cover border-2 border-brand-200"
                    />
                    <span className="hidden md:block text-sm font-medium font-body">
                      {user?.firstName}
                    </span>
                  </button>
                ) : (
                  <Link
                    to="/login"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl
                               hover:bg-gray-100 transition-colors text-gray-700 text-sm font-medium font-body"
                  >
                    <UserIcon /><span className="hidden sm:block">Login</span>
                  </Link>
                )}

                {/* User dropdown */}
                {userMenuOpen && isAuthenticated && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-card-hover border border-gray-100 animate-slide-down overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-50">
                      <p className="text-sm font-semibold text-gray-900 font-body">{user?.firstName} {user?.lastName}</p>
                      <p className="text-xs text-gray-500 font-body truncate">{user?.email}</p>
                    </div>
                    <div className="p-2">
                      <button
                        onClick={() => { logout(); setUserMenuOpen(false); navigate('/'); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 
                                   hover:bg-red-50 rounded-lg transition-colors font-body"
                      >
                        <LogoutIcon /> Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Cart button with badge */}
              <Link
                to="/cart"
                className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl
                           hover:bg-gray-100 transition-colors text-gray-700"
              >
                <CartIcon />
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-brand-500 text-white 
                                   text-[10px] font-bold font-body rounded-full flex items-center 
                                   justify-center animate-bounce-soft">
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                )}
                <span className="hidden sm:block text-sm font-medium font-body">Cart</span>
              </Link>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen(p => !p)}
                className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-700"
                aria-label="Toggle menu"
              >
                {mobileOpen ? <CloseIcon /> : <MenuIcon />}
              </button>
            </div>
          </div>

          {/* ── Category Nav Bar (desktop) ──────────────────────────── */}
          <nav ref={dropdownRef} className="hidden lg:flex items-center gap-1 mt-2 pt-2 border-t border-gray-100">
            <Link
              to="/"
              className="px-3 py-1.5 text-sm font-medium font-body text-gray-700 
                         hover:text-brand-500 hover:bg-brand-50 rounded-lg transition-colors"
            >
              All Products
            </Link>
            {NAV_GROUPS.map(group => (
              <div key={group} className="relative">
                <button
                  onMouseEnter={() => setActiveGroup(group)}
                  onMouseLeave={() => setActiveGroup(null)}
                  onClick={() => setActiveGroup(g => g === group ? null : group)}
                  className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium font-body 
                              rounded-lg transition-colors ${
                    activeGroup === group
                      ? 'text-brand-500 bg-brand-50'
                      : 'text-gray-700 hover:text-brand-500 hover:bg-brand-50'
                  }`}
                >
                  {group} <ChevronDown />
                </button>

                {/* Dropdown panel */}
                {activeGroup === group && grouped[group] && (
                  <div
                    onMouseEnter={() => setActiveGroup(group)}
                    onMouseLeave={() => setActiveGroup(null)}
                    className="absolute top-full left-0 mt-1 bg-white rounded-2xl shadow-card-hover 
                               border border-gray-100 p-3 min-w-[200px] animate-fade-in z-50"
                  >
                    {(grouped[group] || []).map(cat => (
                      <Link
                        key={cat.slug}
                        to={`/category/${cat.slug}`}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl 
                                   hover:bg-brand-50 hover:text-brand-600 transition-colors group"
                      >
                        <span className="text-lg">{cat.emoji}</span>
                        <span className="text-sm font-body text-gray-700 group-hover:text-brand-600">
                          {cat.label}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>
      </header>

      {/* ── Mobile Menu Overlay ──────────────────────────────────────── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <div className="absolute top-0 left-0 bottom-0 w-80 bg-white shadow-2xl animate-slide-up overflow-y-auto">
            <div className="p-5 pt-20">
              {/* Mobile search */}
              <form onSubmit={handleSearch} className="mb-6">
                <div className="relative">
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search products..."
                    className="w-full pl-4 pr-12 py-3 rounded-xl border-2 border-gray-200 
                               focus:border-brand-400 focus:outline-none bg-gray-50 
                               font-body text-sm"
                  />
                  <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                    <SearchIcon />
                  </button>
                </div>
              </form>

              {/* Mobile categories */}
              <p className="text-xs font-bold tracking-widest text-gray-400 mb-3 font-body uppercase">
                Categories
              </p>
              {NAV_GROUPS.map(group => (
                <div key={group} className="mb-2">
                  <button
                    onClick={() => setActiveGroup(g => g === group ? null : group)}
                    className="w-full flex items-center justify-between px-3 py-2.5 
                               rounded-xl text-sm font-semibold font-body text-gray-800 
                               hover:bg-gray-50 transition-colors"
                  >
                    {group}
                    <span className={`transition-transform ${activeGroup === group ? 'rotate-180' : ''}`}>
                      <ChevronDown />
                    </span>
                  </button>
                  {activeGroup === group && (
                    <div className="ml-3 mt-1 space-y-0.5 animate-fade-in">
                      {(grouped[group] || []).map(cat => (
                        <Link
                          key={cat.slug}
                          to={`/category/${cat.slug}`}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg 
                                     text-sm font-body text-gray-600 hover:text-brand-500 
                                     hover:bg-brand-50 transition-colors"
                        >
                          <span>{cat.emoji}</span> {cat.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Spacer — pushes content below the fixed navbar */}
      <div className="h-[110px] lg:h-[120px]" />
    </>
  );
}
