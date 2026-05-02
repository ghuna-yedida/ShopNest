/**
 * ProductDetailPage.jsx
 *
 * This page demonstrates a classic pattern: the "product page state machine".
 * The page has multiple sub-states — loading, error, success — and the UI 
 * renders completely differently for each. We model these explicitly rather
 * than using booleans that can get out of sync.
 *
 * WHY a local quantity state here instead of only in CartContext?
 * The quantity selector on the product page is "intent" — what the user 
 * WANTS to add. The cart quantity is the "committed" state — what they've 
 * actually added. Keeping them separate lets us show "Add 3 to Cart" 
 * without affecting the actual cart until the user confirms.
 */

import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useProduct } from '../hooks/useProducts';
import { useCart } from '../context/CartContext';

const BackIcon  = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>;
const CartIcon  = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>;
const CheckIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>;
const StarFull  = () => <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>;

function SkeletonDetail() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-pulse">
      <div className="bg-gray-200 rounded-3xl h-[400px]" />
      <div className="space-y-4 pt-4">
        <div className="h-4 bg-gray-200 rounded w-1/4" />
        <div className="h-8 bg-gray-200 rounded w-3/4" />
        <div className="h-6 bg-gray-200 rounded w-1/3" />
        <div className="h-20 bg-gray-200 rounded" />
        <div className="h-12 bg-gray-200 rounded-xl" />
      </div>
    </div>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const { product, loading, error } = useProduct(id);
  const { addToCart, isInCart, getItemQty } = useCart();
  const navigate = useNavigate();

  const [activeImage, setActiveImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [addedFeedback, setAddedFeedback] = useState(false);

  const inCart = product ? isInCart(product.id) : false;
  const cartQty = product ? getItemQty(product.id) : 0;

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, qty);
    // Visual feedback — show a checkmark for 2 seconds, then reset
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2000);
  };

  if (loading) return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
      <div className="h-10 bg-gray-200 rounded w-32 mb-8 animate-pulse" />
      <SkeletonDetail />
    </main>
  );

  if (error || !product) return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-24 text-center">
      <span className="text-6xl">😕</span>
      <h2 className="font-display text-2xl font-bold text-gray-800 mt-4">Product not found</h2>
      <Link to="/" className="mt-6 inline-block px-6 py-3 bg-brand-500 text-white font-body 
                               font-semibold rounded-xl hover:bg-brand-600 transition-colors">
        Back to Home
      </Link>
    </main>
  );

  const images = product.images?.length ? product.images : [product.thumbnail];
  const originalPrice = product.price / (1 - product.discountPercentage / 100);
  const savings = originalPrice - product.price;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
      
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm font-body text-gray-500 mb-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 hover:text-brand-500 transition-colors">
          <BackIcon /> Back
        </button>
        <span>/</span>
        <Link to="/" className="hover:text-brand-500 transition-colors">Home</Link>
        <span>/</span>
        <Link to={`/category/${product.category}`} className="hover:text-brand-500 capitalize transition-colors">
          {product.category}
        </Link>
        <span>/</span>
        <span className="text-gray-800 font-medium truncate max-w-[200px]">{product.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 animate-fade-in">

        {/* ── Image Gallery ──────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Main image */}
          <div className="bg-gray-50 rounded-3xl overflow-hidden aspect-square flex items-center justify-center
                          border-2 border-gray-100 relative">
            <img
              src={images[activeImage]}
              alt={product.title}
              className="w-full h-full object-contain p-8 transition-all duration-300"
            />
            {product.discountPercentage > 5 && (
              <div className="absolute top-4 left-4 bg-brand-500 text-white text-sm font-bold
                              font-body px-3 py-1.5 rounded-full shadow-glow">
                -{Math.round(product.discountPercentage)}% OFF
              </div>
            )}
          </div>
          
          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all
                    ${activeImage === i
                      ? 'border-brand-400 shadow-glow scale-105'
                      : 'border-gray-200 hover:border-brand-300'
                    }`}
                >
                  <img src={img} alt="" className="w-full h-full object-contain bg-gray-50 p-1" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Product Info ───────────────────────────────────────────── */}
        <div className="space-y-5">
          {/* Brand + Category */}
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-brand-50 text-brand-600 text-xs font-bold font-body 
                             rounded-full uppercase tracking-wide">
              {product.category}
            </span>
            {product.brand && (
              <span className="text-sm text-gray-500 font-body">{product.brand}</span>
            )}
          </div>

          <h1 className="font-display text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
            {product.title}
          </h1>

          {/* Rating + Reviews */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-0.5">
              {[1,2,3,4,5].map(n => (
                <span key={n} className={n <= Math.round(product.rating) ? 'text-amber-400' : 'text-gray-200'}>
                  <StarFull />
                </span>
              ))}
            </div>
            <span className="text-sm text-gray-600 font-body font-semibold">{product.rating}</span>
            <span className="text-sm text-gray-400 font-body">({product.reviews?.length ?? 0} reviews)</span>
          </div>

          {/* Price block */}
          <div className="bg-gray-50 rounded-2xl p-5 space-y-1">
            <div className="flex items-end gap-3">
              <span className="font-display text-4xl font-black text-gray-900">
                ${product.price.toFixed(2)}
              </span>
              {product.discountPercentage > 5 && (
                <span className="text-lg text-gray-400 line-through font-body mb-1">
                  ${originalPrice.toFixed(2)}
                </span>
              )}
            </div>
            {product.discountPercentage > 5 && (
              <p className="text-sm text-green-600 font-semibold font-body">
                You save ${savings.toFixed(2)} ({Math.round(product.discountPercentage)}% off)
              </p>
            )}
          </div>

          <p className="text-gray-600 font-body text-sm leading-relaxed">{product.description}</p>

          {/* Stock status */}
          <div className="flex items-center gap-2 text-sm font-body">
            <span className={`w-2 h-2 rounded-full ${product.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className={product.stock > 0 ? 'text-green-700' : 'text-red-600'}>
              {product.stock > 0
                ? product.stock < 10 ? `Only ${product.stock} left in stock!` : 'In Stock'
                : 'Out of Stock'}
            </span>
          </div>

          {/* Cart already has it */}
          {inCart && cartQty > 0 && (
            <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 
                            rounded-xl text-sm text-green-700 font-body">
              <CheckIcon />
              {cartQty} item{cartQty > 1 ? 's' : ''} already in your cart
            </div>
          )}

          {/* Quantity + Add to Cart */}
          <div className="flex items-stretch gap-3">
            {/* Quantity stepper */}
            <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setQty(q => Math.max(1, q - 1))}
                className="px-4 py-3 text-gray-600 hover:bg-gray-100 transition-colors font-bold text-lg"
              >
                −
              </button>
              <span className="px-4 py-3 text-gray-900 font-semibold font-body min-w-[3rem] text-center">
                {qty}
              </span>
              <button
                onClick={() => setQty(q => Math.min(product.stock, q + 1))}
                className="px-4 py-3 text-gray-600 hover:bg-gray-100 transition-colors font-bold text-lg"
              >
                +
              </button>
            </div>

            {/* Add to cart button */}
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl
                          font-semibold font-body text-sm transition-all duration-300
                          ${addedFeedback
                            ? 'bg-green-500 text-white'
                            : product.stock === 0
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : 'bg-brand-500 hover:bg-brand-600 text-white shadow-glow hover:shadow-none'
                          }`}
            >
              {addedFeedback ? <><CheckIcon /> Added!</> : <><CartIcon /> Add to Cart</>}
            </button>
          </div>

          {/* Buy Now shortcut */}
          <button
            onClick={() => { addToCart(product, qty); navigate('/cart'); }}
            disabled={product.stock === 0}
            className="w-full py-3.5 border-2 border-gray-300 hover:border-brand-400 
                       text-gray-800 hover:text-brand-600 font-semibold font-body text-sm 
                       rounded-xl transition-all"
          >
            Buy Now
          </button>

          {/* Tags */}
          {product.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.tags.map(tag => (
                <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-body rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      {product.reviews?.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {product.reviews.map((review, i) => (
              <div key={i} className="bg-white border-2 border-gray-100 rounded-2xl p-5 
                                      hover:border-brand-200 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(n => (
                      <span key={n} className={n <= review.rating ? 'text-amber-400' : 'text-gray-200'}>
                        <StarFull />
                      </span>
                    ))}
                  </div>
                  <span className="text-xs text-gray-400 font-body">
                    {new Date(review.date).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-700 font-body leading-relaxed mb-3">
                  "{review.comment}"
                </p>
                <p className="text-xs font-semibold text-gray-500 font-body">— {review.reviewerName}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
