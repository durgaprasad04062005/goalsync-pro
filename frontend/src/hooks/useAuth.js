import { useSelector, useDispatch } from 'react-redux';
import { logout, updateUser } from '../store/slices/authSlice';

const useAuth = () => {
  const dispatch = useDispatch();
  const { user, token, isAuthenticated, loading, error } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
  };

  const handleUpdateUser = (data) => {
    dispatch(updateUser(data));
  };

  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const isEmployee = user?.role === 'employee';
  const isManagerOrAdmin = isManager || isAdmin;

  const hasRole = (...roles) => roles.includes(user?.role);

  return {
    user,
    token,
    isAuthenticated,
    loading,
    error,
    isAdmin,
    isManager,
    isEmployee,
    isManagerOrAdmin,
    hasRole,
    logout: handleLogout,
    updateUser: handleUpdateUser,
  };
};

export default useAuth;
