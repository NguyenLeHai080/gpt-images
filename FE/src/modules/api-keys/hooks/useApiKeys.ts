import { useState, useEffect } from 'react';
import { apiKeysApi } from '../api';
import type { ApiKeyItem } from '../types';

export const useApiKeys = () => {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiKeysApi.getKeys().then(res => {
      if (res.data) setKeys(res.data);
      setIsLoading(false);
    });
  }, []);

  return { keys, isLoading };
};
