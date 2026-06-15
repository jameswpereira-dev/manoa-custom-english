import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getSubscription } from '../services/api';

const SubscriptionContext = createContext(null);

export function SubscriptionProvider({ children }) {
  const { user }                            = useAuth();
  const [subscription, setSubscription]     = useState(null);
  const [loading, setLoading]               = useState(true);

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getSubscription();
      setSubscription(data);
    } catch {
      setSubscription(null);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchSubscription(); }, [fetchSubscription]);

  return (
    <SubscriptionContext.Provider value={{ subscription, loading, refetch: fetchSubscription }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export const useSubscription = () => useContext(SubscriptionContext);
