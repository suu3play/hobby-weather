import { useEffect, useState } from 'react';
import { db } from '../data/database';
import { databaseService } from '../services/database.service';

export const useDatabase = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        await db.open();
        await db.initializeDefaultData();
        await db.clearExpiredCache();
        setIsInitialized(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Database initialization failed');
      }
    };

    initializeDatabase();

    return () => {
      db.close();
    };
  }, []);

  return { isInitialized, error, databaseService };
};