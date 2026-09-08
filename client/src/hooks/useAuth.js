import { useCallback, useEffect, useState } from 'react';
import { getCurrentUser } from '../api/authApi';
import { getToken, removeToken } from '../utils/authStorage';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = getToken();

    if (!token) {
      setUser(null);
      setIsLoading(false);
      return null;
    }

    try {
      const result = await getCurrentUser(token);
      setUser(result.data);
      return result.data;
    } catch {
      removeToken();
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const logout = useCallback(() => {
    removeToken();
    setUser(null);
  }, []);

  return {
    user,
    isAdmin: user?.user_type === 'admin',
    isLoggedIn: !!user,
    isLoading,
    logout,
    refreshUser,
  };
}
