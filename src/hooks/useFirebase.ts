import { useState, useCallback } from 'react';
import { firestore } from '../services/firebase';

export function useFirebase() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getUserData = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      const data = await firestore.getUserData(userId);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user data');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const savePlayer = useCallback(async (userId: string, playerName: string, data: any) => {
    try {
      setLoading(true);
      await firestore.savePlayer(userId, playerName, data);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save player');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const saveGame = useCallback(async (userId: string, playerName: string, gameData: any) => {
    try {
      setLoading(true);
      await firestore.saveGame(userId, playerName, gameData);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save game');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const getGames = useCallback(async (userId: string, playerName: string, limit?: number) => {
    try {
      setLoading(true);
      const games = await firestore.getGames(userId, playerName, limit);
      return games;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch games');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSubscription = useCallback(async (userId: string, subscriptionData: any) => {
    try {
      setLoading(true);
      await firestore.updateSubscription(userId, subscriptionData);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update subscription');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const saveTemplate = useCallback(async (userId: string, templateKey: string, templateData: any) => {
    try {
      setLoading(true);
      await firestore.saveTemplate(userId, templateKey, templateData);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save template');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const getPlayers = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      const players = await firestore.getPlayers(userId);
      return players;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch players');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getUserStats = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      const stats = await firestore.getUserStats(userId);
      return stats;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    getUserData,
    savePlayer,
    saveGame,
    getGames,
    updateSubscription,
    saveTemplate,
    getPlayers,
    getUserStats,
    loading,
    error,
    clearError: () => setError(null)
  };
}