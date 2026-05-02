/**
 * useProducts.js — Custom hook for fetching from DummyJSON
 *
 * WHY abstract API calls into a custom hook?
 * Without this, every component would repeat the same fetch/loading/error 
 * pattern. A custom hook centralizes the logic so:
 *  1. Components stay focused on rendering, not data fetching
 *  2. You change the API endpoint in ONE place if it ever changes
 *  3. Loading and error states are handled consistently everywhere
 *
 * This is the "separation of concerns" principle applied to React.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

const BASE = 'https://dummyjson.com';

// Simple in-memory cache — avoids re-fetching data we already have.
// WHY not useState? The cache should survive component unmounts and remounts.
// A module-level object persists for the lifetime of the page.
const cache = {};

function useFetch(url) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // useRef stores a value that doesn't trigger re-renders.
  // We use it to prevent setting state on an unmounted component 
  // (which would cause a React memory leak warning).
  const abortRef = useRef(null);

  useEffect(() => {
    if (!url) return;

    // Return cached data immediately — no spinner needed!
    if (cache[url]) {
      setData(cache[url]);
      setLoading(false);
      return;
    }

    // AbortController lets us cancel in-flight requests.
    // WHY? If the user navigates away while a request is running,
    // we shouldn't update state on the now-unmounted component.
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);

    fetch(url, { signal: abortRef.current.signal })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(d => {
        cache[url] = d;
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          setError(err.message);
          setLoading(false);
        }
      });

    // Cleanup: cancel the request if the component unmounts
    return () => abortRef.current?.abort();
  }, [url]);

  return { data, loading, error };
}

// ─── Public API of this module ────────────────────────────────────────────────

export function useProducts({ category = '', search = '', limit = 20, skip = 0 } = {}) {
  let url;
  if (search)        url = `${BASE}/products/search?q=${encodeURIComponent(search)}&limit=${limit}&skip=${skip}`;
  else if (category) url = `${BASE}/products/category/${encodeURIComponent(category)}?limit=${limit}&skip=${skip}`;
  else               url = `${BASE}/products?limit=${limit}&skip=${skip}`;

  const { data, loading, error } = useFetch(url);
  return {
    products: data?.products ?? [],
    total:    data?.total    ?? 0,
    loading,
    error,
  };
}

export function useProduct(id) {
  const { data, loading, error } = useFetch(id ? `${BASE}/products/${id}` : null);
  return { product: data, loading, error };
}

export function useCategories() {
  // DummyJSON returns an array of category objects: [{ slug, name, url }, ...]
  const { data, loading, error } = useFetch(`${BASE}/products/categories`);
  return { categories: data ?? [], loading, error };
}
