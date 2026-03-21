import { useEffect, useState } from 'react';
import { db } from '../data/database';
import { databaseService } from '../services/database.service';

export const useDatabase = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialize = async () => {
    setError(null);
    setIsInitialized(false);
    try {
      await db.open();
      await db.initializeDefaultData();
      await db.clearExpiredCache();
      setIsInitialized(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Database initialization failed');
    }
  };

  useEffect(() => {
    let initialized = false;

    const init = async () => {
      setError(null);
      setIsInitialized(false);
      try {
        await db.open();
        await db.initializeDefaultData();
        await db.clearExpiredCache();
        initialized = true;
        setIsInitialized(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Database initialization failed');
      }
    };

    init();

    return () => {
      if (initialized) {
        db.close();
      }
    };
  }, []);

  return { isInitialized, error, databaseService, retry: initialize };
};