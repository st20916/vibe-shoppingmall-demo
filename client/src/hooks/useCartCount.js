import { useCallback, useEffect, useState } from 'react';
import { getCart } from '../api/cartApi';
import { getToken } from '../utils/authStorage';

export function useCartCount(enabled = true) {
  const [count, setCount] = useState(0);

  const refreshCount = useCallback(async () => {
    if (!enabled || !getToken()) {
      setCount(0);
      return 0;
    }

    try {
      const result = await getCart();
      const nextCount = result.data?.totalItems || 0;
      setCount(nextCount);
      return nextCount;
    } catch {
      setCount(0);
      return 0;
    }
  }, [enabled]);

  useEffect(() => {
    refreshCount();
  }, [refreshCount]);

  useEffect(() => {
    if (!enabled) return undefined;

    const handleCartUpdated = () => {
      refreshCount();
    };

    window.addEventListener('cart-updated', handleCartUpdated);
    return () => window.removeEventListener('cart-updated', handleCartUpdated);
  }, [enabled, refreshCount]);

  return { count, refreshCount };
}
