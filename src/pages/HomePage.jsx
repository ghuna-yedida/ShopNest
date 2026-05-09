/**
 * HomePage.jsx
 *
 * Architecture: URL-driven state.
 * The search query and selected category live in the URL (?search=shoes),
 * NOT in React state. This means:
 *  - Refreshing the page preserves the filter
 *  - Sharing the URL shows the same results
 *  - The back button undoes the search
 *
 * This is a core principle of web apps: URL = application state for navigable features.
 *
 * Product Card micro-decisions:
 *  - Skeleton loaders (not a spinner) prevent layout shift — content loads in-place
 *  - Image lazy loading with IntersectionObserver (browser native) = no JS library needed
 *  - Discount badge computed from price + discountPercentage (DummyJSON provides both)
 */

import { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useProducts } from "../hooks/useProducts";
import { useCart } from "../context/CartContext";

// ─── Sub-components ──────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-green-500 rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
      <div className="bg-gray-200 h-52 w-full" />
      <div className="p-4 space-y-2">
        <div className="h-3 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-10 bg-gray-200 rounded-xl mt-3" />
      </div>
    </div>
  );
}

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          className={`w-3 h-3 ${n <= Math.round(rating) ? "text-amber-400" : "text-gray-200"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-xs text-gray-500 ml-1 font-body">({rating})</span>
    </div>
  );
}

function ProductCard({ product }) {
  const { addToCart, isInCart } = useCart();
  const inCart = isInCart(product.id);

  // Calculate original price before discount
  const originalPrice = product.price / (1 - product.discountPercentage / 100);

  return (
    <div
      className="group bg-green-200 rounded-2xl overflow-hidden border border-gray-100
                    hover:border-brand-200 shadow-card hover:shadow-card-hover
                    transition-all duration-300 animate-fade-in flex flex-col"
    >
      {/* Product image with hover zoom */}
      <Link
        to={`/product/${product.id}`}
        className="block overflow-hidden relative bg-gray-50"
      >
        <img
          src={product.thumbnail}
          alt={product.title}
          loading="lazy"
          className="w-full h-52 object-contain p-4 group-hover:scale-105 transition-transform duration-500"
        />
        {/* Discount badge */}
        {product.discountPercentage > 5 && (
          <span
            className="absolute top-3 left-3 bg-brand-500 text-white text-xs font-bold
                           font-body px-2 py-1 rounded-full shadow"
          >
            -{Math.round(product.discountPercentage)}%
          </span>
        )}
        {/* Stock badge */}
        {product.stock < 10 && (
          <span
            className="absolute top-3 right-3 bg-red-500 text-white text-xs font-body
                           px-2 py-1 rounded-full"
          >
            Only {product.stock} left
          </span>
        )}
      </Link>

      <div className="p-4 flex flex-col flex-1">
        {/* Category */}
        <span className="text-xs text-brand-500 font-semibold font-body uppercase tracking-wide mb-1">
          {product.category}
        </span>

        {/* Title */}
        <Link to={`/product/${product.id}`}>
          <h3
            className="font-body font-semibold text-gray-900 text-sm leading-snug mb-2
                         hover:text-brand-600 transition-colors line-clamp-2"
          >
            {product.title}
          </h3>
        </Link>

        <StarRating rating={product.rating} />

        {/* Price row */}
        <div className="flex items-center gap-2 mt-2 mb-3">
          <span className="font-display font-bold text-lg text-gray-900">
            ${product.price.toFixed(2)}
          </span>
          {product.discountPercentage > 5 && (
            <span className="text-sm text-gray-400 line-through font-body">
              ${originalPrice.toFixed(2)}
            </span>
          )}
        </div>

        {/* Add to cart — flex-1 + mt-auto pins this to bottom */}
        <button
          onClick={() => addToCart(product)}
          className={`mt-auto w-full py-2.5 rounded-xl text-sm font-semibold font-body
                      transition-all duration-200
                      ${
                        inCart
                          ? "bg-green-50 text-green-700 border-2 border-green-200 hover:bg-green-100"
                          : "bg-brand-500 hover:bg-brand-600 text-white shadow-sm hover:shadow-glow"
                      }`}
        >
          {inCart ? "✓ Added to Cart" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}

// ─── Hero Banner ─────────────────────────────────────────────────────────────

function HeroBanner() {
  const navigate = useNavigate();
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 min-h-[360px] flex items-center mb-10">
      {/* Decorative orbs */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/15 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" />
      <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-brand-600/10 rounded-full blur-3xl translate-y-1/2" />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            "radial-gradient(circle, white 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative z-10 px-8 md:px-16 py-12 max-w-2xl">
        <p className="text-brand-400 text-sm font-semibold font-body uppercase tracking-widest mb-3">
          ✦ New Arrivals 202
        </p>
        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-4">
          Find What
          <br />
          <span className="text-brand-400">You Love</span>
        </h1>
        <p className="text-gray-400 font-body text-base md:text-lg mb-8 max-w-md leading-relaxed">
          From cutting-edge electronics to timeless fashion — everything curated
          just for you.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate("/?category=smartphones")}
            className="px-6 py-3 bg-brand-500 hover:bg-brand-400 text-white font-semibold
                       font-body rounded-xl transition-all shadow-glow hover:shadow-none text-sm"
          >
            Shop Now →
          </button>
          <button
            onClick={() => navigate("/?search=top picks")}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold
                       font-body rounded-xl transition-all backdrop-blur-sm border border-white/20 text-sm"
          >
            View Deals
          </button>
        </div>
      </div>

      {/* Right side floating stats */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-4">
        {[
          { label: "Products", value: "10K+" },
          { label: "Brands", value: "500+" },
          { label: "Reviews", value: "4.8★" },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white/5 backdrop-blur-sm border border-white/10 
                                        rounded-2xl px-6 py-4 text-center"
          >
            <p className="font-display font-bold text-2xl text-white">
              {s.value}
            </p>
            <p className="text-gray-400 text-xs font-body mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Sort/Filter Bar ──────────────────────────────────────────────────────────

function FilterBar({ sortBy, onSort, total, query }) {
  const SORT_OPTIONS = [
    { value: "", label: "Relevance" },
    { value: "price-asc", label: "Price: Low → High" },
    { value: "price-desc", label: "Price: High → Low" },
    { value: "rating", label: "Best Rated" },
  ];
  return (
    <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
      <p className="text-sm text-gray-600 font-body">
        {query ? (
          <>
            <span className="font-semibold text-gray-900">{total}</span> results
            for "{query}"
          </>
        ) : (
          <>
            <span className="font-semibold text-gray-900">{total}</span>{" "}
            products
          </>
        )}
      </p>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500 font-body">
          Sort By Category:
        </span>
        <select
          value={sortBy}
          onChange={(e) => onSort(e.target.value)}
          className="text-sm border-2 border-gray-200 rounded-xl px-3 py-2 font-body
                     focus:border-brand-400 focus:outline-none bg-white text-gray-700"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 24;

export default function HomePage() {
  const [searchParams] = useSearchParams();
  const [sortBy, setSortBy] = useState("");
  const [page, setPage] = useState(0);

  const searchQuery = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";

  // Reset to page 0 whenever filters change
  useEffect(() => {
    setPage(0);
  }, [searchQuery, category]);

  const { products, total, loading } = useProducts({
    search: searchQuery,
    category: category,
    limit: PAGE_SIZE,
    skip: page * PAGE_SIZE,
  });

  // Client-side sort — WHY not server-side?
  // DummyJSON doesn't support sorting by rating or price in URL params,
  // so we sort the current page's results in-memory after fetching.
  const sorted = [...products].sort((a, b) => {
    if (sortBy === "price-asc") return a.price - b.price;
    if (sortBy === "price-desc") return b.price - a.price;
    if (sortBy === "rating") return b.rating - a.rating;
    return 0; // default: keep API order
  });

  const showHero = !searchQuery && !category;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
      {showHero && <HeroBanner />}

      {/* Page title for category/search views */}
      {(searchQuery || category) && (
        <div className="mb-6 animate-fade-in">
          <h2 className="font-display text-2xl font-bold text-gray-900 capitalize">
            {searchQuery ? `"${searchQuery}"` : category.replace(/-/g, " ")}
          </h2>
        </div>
      )}

      {!showHero && (
        <FilterBar
          sortBy={sortBy}
          onSort={setSortBy}
          total={total}
          query={searchQuery}
        />
      )}

      {/* Category quick links (only on homepage) */}
      {showHero && (
        <section className="mb-10">
          <h2 className="font-display text-2xl font-bold text-gray-900 mb-5">
            Shop by Category
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {[
              { label: "Electronics", emoji: "💻", slug: "smartphones" },
              { label: "Women", emoji: "👗", slug: "womens-dresses" },
              { label: "Men", emoji: "👔", slug: "mens-shirts" },
              { label: "Beauty", emoji: "✨", slug: "skin-care" },
              { label: "Home & Kitchen", emoji: "🏺", slug: "furniture" },
              { label: "Sports", emoji: "⚽", slug: "sports-accessories" },
            ].map((c) => (
              <Link
                key={c.slug}
                to={`/category/${c.slug}`}
                className="flex flex-col items-center justify-center gap-2 p-4 bg-white 
                           rounded-2xl border-2 border-gray-100 hover:border-brand-300
                           hover:bg-brand-50 transition-all group shadow-sm hover:shadow-card"
              >
                <span className="text-3xl group-hover:scale-110 transition-transform">
                  {c.emoji}
                </span>
                <span className="text-xs font-semibold font-body text-gray-700 group-hover:text-brand-600 text-center">
                  {c.label}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Section heading for homepage products */}
      {showHero && (
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-2xl font-bold text-gray-900">
            Featured Products
          </h2>
          <FilterBar
            sortBy={sortBy}
            onSort={setSortBy}
            total={total}
            query=""
          />
        </div>
      )}

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          : sorted.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>

      {/* Empty state */}
      {!loading && sorted.length === 0 && (
        <div className="text-center py-24 animate-fade-in">
          <span className="text-6xl">🔍</span>
          <h3 className="font-display text-2xl font-bold text-gray-800 mt-4">
            No products found
          </h3>
          <p className="text-gray-500 font-body mt-2">
            Try a different search term or browse categories
          </p>
          <Link
            to="/"
            className="mt-6 inline-block px-6 py-3 bg-brand-500 text-white 
                                   font-semibold font-body rounded-xl hover:bg-brand-600 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-10">
          <button
            onClick={() => {
              setPage((p) => Math.max(0, p - 1));
              window.scrollTo(0, 0);
            }}
            disabled={page === 0}
            className="px-4 py-2 rounded-xl border-2 border-gray-200 text-sm font-body
                       disabled:opacity-40 hover:border-brand-400 hover:text-brand-500 transition-colors"
          >
            ← Prev
          </button>
          {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
            const p = Math.max(0, Math.min(page - 2, totalPages - 5)) + i;
            return (
              <button
                key={p}
                onClick={() => {
                  setPage(p);
                  window.scrollTo(0, 0);
                }}
                className={`w-10 h-10 rounded-xl text-sm font-semibold font-body transition-colors
                  ${
                    page === p
                      ? "bg-brand-500 text-white shadow-glow"
                      : "border-2 border-gray-200 text-gray-700 hover:border-brand-400"
                  }`}
              >
                {p + 1}
              </button>
            );
          })}
          <button
            onClick={() => {
              setPage((p) => Math.min(totalPages - 1, p + 1));
              window.scrollTo(0, 0);
            }}
            disabled={page >= totalPages - 1}
            className="px-4 py-2 rounded-xl border-2 border-gray-200 text-sm font-body
                       disabled:opacity-40 hover:border-brand-400 hover:text-brand-500 transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </main>
  );
}
