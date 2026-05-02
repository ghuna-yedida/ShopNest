# ShopNest — E-Commerce App

A full-featured, production-grade e-commerce frontend built with **Vite + React 18 + Tailwind CSS**,  
powered by the [DummyJSON API](https://dummyjson.com).

---

## 🚀 Quick Start

```bash
# 1. Navigate into the project
cd shopnest

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173)

---

## 🔐 Demo Login Credentials (DummyJSON)

| Username   | Password        |
|------------|-----------------|
| `emilys`   | `emilyspass`    |
| `michaelw` | `michaelwpass`  |

---

## 📁 Project Structure

```
src/
├── context/
│   ├── AuthContext.jsx     # Authentication state (login/logout/persist)
│   └── CartContext.jsx     # Shopping cart logic (add/remove/qty/totals)
├── hooks/
│   └── useProducts.js      # Data fetching with caching + abort support
├── components/
│   ├── Navbar.jsx          # Responsive navbar + category mega-menu
│   ├── Footer.jsx          # Footer with links
│   └── ProtectedRoute.jsx  # Auth guard wrapper for protected pages
└── pages/
    ├── LoginPage.jsx        # Auth form (DummyJSON /auth/login)
    ├── HomePage.jsx         # Hero + product grid + search/sort/pagination
    ├── CategoryPage.jsx     # Category-filtered product grid
    ├── ProductDetailPage.jsx # Image gallery + reviews + add to cart
    ├── CartPage.jsx         # Cart management + order summary
    └── PaymentPage.jsx      # Checkout form + order confirmation
```

---

## 🏗️ Architecture Decisions

**URL-driven state** — Search queries and active category live in the URL (`?search=shoes`), not React state. This means the back button, page refresh, and URL sharing all work correctly.

**Context separation** — `AuthContext` manages identity, `CartContext` manages the cart. Mixing them would create a "god object" that's hard to test. Each context has exactly one responsibility.

**In-memory API caching** — `useProducts.js` caches every API response in a module-level object. Navigating back to a page you've already visited feels instant — no re-fetching.

**ProtectedRoute pattern** — The `/payment` route is wrapped in `<ProtectedRoute>`, which redirects unauthenticated users to `/login` while saving the intended destination. After login, users are returned to `/payment` automatically.

**Derived cart values** — `totalItems` and `totalPrice` are computed from the `items` array on every render, not stored in state. This ensures they're always in sync and never stale.

---

## 🛒 Cart Logic

- Adding an item that already exists in the cart **increments its quantity** (no duplicates).
- The quantity stepper on the cart page allows increment/decrement, with removal when qty reaches 0.
- Cart persists in `localStorage` across browser refreshes.
- Clicking "Proceed to Checkout" while logged out redirects to `/login`, then returns to `/payment` after successful authentication.

---

## 💅 Design System

| Token | Value |
|-------|-------|
| Primary color | `#f97316` (Orange 500) |
| Display font | Playfair Display (serif) |
| Body font | DM Sans (humanist sans) |
| Border radius | `rounded-xl` (12px) / `rounded-2xl` (16px) / `rounded-3xl` (24px) |

---

## 📦 Tech Stack

- **Vite 5** — Ultra-fast dev server and build tool
- **React 18** — UI library with concurrent features
- **React Router v6** — Client-side routing
- **Tailwind CSS v3** — Utility-first styling
- **DummyJSON API** — Mock e-commerce REST API
