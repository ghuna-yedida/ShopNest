/**
 * User.jsx
 *
 * A reusable component for displaying user information.
 * Shows the current authenticated user's profile details.
 */

import { useAuth } from "../context/AuthContext";

export default function User() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Please log in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-card p-6 max-w-md mx-auto">
      <div className="flex flex-col items-center text-center">
        <img
          src={
            user.image ||
            `https://api.dicebear.com/7.x/initials/svg?seed=${user.firstName}`
          }
          alt="User avatar"
          className="w-20 h-20 rounded-full object-cover border-4 border-brand-100 mb-4"
        />
        <h2 className="text-xl font-semibold text-gray-900 font-body mb-1">
          {user.firstName} {user.lastName}
        </h2>
        <p className="text-sm text-gray-600 font-body mb-2">{user.email}</p>
        <p className="text-xs text-gray-500 font-body">@{user.username}</p>
      </div>
    </div>
  );
}
