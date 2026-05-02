/**
 * ProtectedRoute.jsx
 *
 * This is a "Route Guard" — a Higher-Order Component pattern commonly used
 * with React Router to protect certain routes from unauthenticated access.
 *
 * HOW IT WORKS:
 * Instead of placing auth checks inside PaymentPage, we wrap it in the router:
 *   <Route path="/payment" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
 *
 * When React Router renders /payment, it actually renders ProtectedRoute FIRST,
 * which either:
 *   A) Renders <PaymentPage /> if the user is authenticated, OR
 *   B) Redirects to /login (saving the original path in location state)
 *
 * WHY save location state?
 * After login, we read `location.state.from` to redirect back to /payment.
 * Without this, the user would land on the homepage after login, and they'd
 * have to find the payment page again — terrible UX.
 *
 * WHY not just check in PaymentPage directly?
 * You could, but then every protected page would repeat the same logic.
 * ProtectedRoute is a reusable wrapper — add it once around any route you want to guard.
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to login, but remember where the user was trying to go
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
