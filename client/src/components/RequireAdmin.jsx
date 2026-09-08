import { useEffect, useRef } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import '../pages/Admin/Admin.css';

function RequireAdmin() {
  const { user, isAdmin, isLoading } = useAuth();
  const hasAlerted = useRef(false);

  useEffect(() => {
    if (isLoading || hasAlerted.current) return;
    if (!user || !isAdmin) {
      hasAlerted.current = true;
      alert('Admin 권한이 필요합니다.');
    }
  }, [user, isAdmin, isLoading]);

  if (isLoading) {
    return (
      <div className="admin-page admin-page--loading">
        <p>권한을 확인하는 중...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default RequireAdmin;
