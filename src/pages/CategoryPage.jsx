/**
 * CategoryPage.jsx
 *
 * WHY a separate CategoryPage instead of handling /category/:slug in HomePage?
 *
 * The URL parameter `:slug` is a path parameter (not a query param), so it
 * lives in `useParams()`. If we put this inside HomePage, we'd need to check
 * BOTH `useParams()` and `useSearchParams()` to know the active filter.
 *
 * Having a dedicated page component keeps each component's responsibility
 * clear: HomePage = home + search, CategoryPage = category browsing.
 * Both delegate to the same product card and hook — no duplication.
 */

import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useProducts } from "../hooks/useProducts";
import { useCart } from "../context/CartContext";

const PAGE_SIZE = 20;

// Reuse the ProductCard logic inline (import from HomePage would create circular dep)
function ProductCard({ product }) {
  const { addToCart, isInCart } = useCart();
  const inCart = isInCart(product.id);
  const originalPrice = product.price / (1 - product.discountPercentage / 100);

  return (
    <div
      className="group bg-white rounded-2xl overflow-hidden border border-gray-100
                    hover:border-brand-200 shadow-card hover:shadow-card-hover
                    transition-all duration-300 flex flex-col animate-fade-in"
    >
      <Link
        to={`/product/${product.id}`}
        className="block overflow-hidden relative bg-gray-50"
      >
        <img
          src={product.thumbnail}
          alt={product.title}
          loading="lazy"
          className="w-full h-48 object-contain p-4 group-hover:scale-105 transition-transform duration-500"
        />
        {product.discountPercentage > 5 && (
          <span
            className="absolute top-3 left-3 bg-brand-500 text-white text-xs font-bold 
                           font-body px-2 py-1 rounded-full"
          >
            -{Math.round(product.discountPercentage)}%
          </span>
        )}
      </Link>
      <div className="p-4 flex flex-col flex-1">
        <span className="text-xs text-brand-500 font-semibold font-body uppercase tracking-wide mb-1">
          {product.brand || product.category}
        </span>
        <Link to={`/product/${product.id}`}>
          <h3
            className="font-body font-semibold text-gray-900 text-sm leading-snug mb-1
                         hover:text-brand-600 transition-colors line-clamp-2"
          >
            {product.title}
          </h3>
        </Link>
        <div className="flex items-center gap-2 mt-auto pt-3">
          <span className="font-display font-bold text-lg text-gray-900">
            ${product.price.toFixed(2)}
          </span>
          {product.discountPercentage > 5 && (
            <span className="text-sm text-gray-400 line-through font-body">
              ${originalPrice.toFixed(2)}
            </span>
          )}
        </div>
        <button
          onClick={() => addToCart(product)}
          className={`mt-2 w-full py-2.5 rounded-xl text-sm font-semibold font-body transition-all
            ${
              inCart
                ? "bg-green-50 text-green-700 border-2 border-green-200"
                : "bg-brand-500 hover:bg-brand-600 text-white"
            }`}
        >
          {inCart ? "✓ In Cart" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
      <div className="bg-gray-200 h-48" />
      <div className="p-4 space-y-2">
        <div className="h-3 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-10 bg-gray-200 rounded-xl mt-3" />
      </div>
    </div>
  );
}

export default function CategoryPage() {
  const { slug } = useParams();
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState("");

  const { products, total, loading } = useProducts({
    category: slug,
    limit: PAGE_SIZE,
    skip: page * PAGE_SIZE,
  });

  const sorted = [...products].sort((a, b) => {
    if (sort === "price-asc") return a.price - b.price;
    if (sort === "price-desc") return b.price - a.price;
    if (sort === "rating") return b.rating - a.rating;
    return 0;
  });

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const title = slug.replace(/-/g, " ");

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
      {/* Breadcrumb */}
      <nav className="text-sm font-body text-gray-500 mb-6">
        <Link to="/" className="hover:text-brand-500 transition-colors">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-medium capitalize">{title}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-900 capitalize">
            {title}
          </h1>
          {!loading && (
            <p className="text-sm text-gray-500 font-body mt-1">
              {total} products
            </p>
          )}
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="text-sm border-2 border-gray-200 rounded-xl px-3 py-2.5 font-body
                     focus:border-brand-400 focus:outline-none bg-white text-gray-700"
        >
          <option value="">Sort: Relevance</option>
          <option value="price-asc">Price: Low → High</option>
          <option value="price-desc">Price: High → Low</option>
          <option value="rating">Best Rated</option>
        </select>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} />)
          : sorted.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>

      {/* Empty state */}
      {!loading && sorted.length === 0 && (
        <div className="text-center py-20">
          <span className="text-5xl">📦</span>
          <h3 className="font-display text-xl font-bold text-gray-800 mt-4">
            No products in this category
          </h3>
          <Link
            to="/"
            className="mt-4 inline-block text-brand-500 hover:underline font-body"
          >
            Browse all products
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
          <span className="text-sm text-gray-600 font-body px-4">
            Page {page + 1} of {totalPages}
          </span>
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
