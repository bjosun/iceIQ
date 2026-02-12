import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
// Importera firestore-objektet och din Cloud Function för Stripe
import { firestore, deleteUserStripeAccount } from '../services/firebase'; 

interface GameRecord {
  id?: string;
  date: string;
  team: string;
  points: number;
  bonus: number;
  counts: Record<string, number>;
  softSkillCounts?: Record<string, number>;
  template: string;
}

interface Player {
  id: string;
  name: string;
  lastGameDate?: string;
  gameCount?: number;
  currentBalance?: number; 
}

export function usePlayerData() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. SPARA MATCH
  const saveGame = useCallback(async (
    playerName: string,
    gameData: { 
      date: string; 
      team: string; 
      points?: number; 
      softSkillCounts?: Record<string, number> 
    },
    template: string,
    counts: Record<string, number>,
    bonusFactor: number
  ) => {
    if (!user) throw new Error('User must be logged in');
    setLoading(true);
    setError(null);

    try {
      const cleanCounts: Record<string, number> = {};
      Object.entries(counts).forEach(([key, count]) => {
        try {
          const nameObj = JSON.parse(key);
          const dbKey = nameObj.en || nameObj.sv; 
          cleanCounts[dbKey] = count;
        } catch (e) {
          cleanCounts[key] = count;
        }
      });

      const totalPoints = gameData.points || 0;
      const currentBonus = totalPoints * bonusFactor;

      const gameRecord: GameRecord = {
        date: gameData.date || new Date().toISOString().split('T')[0],
        team: gameData.team.trim(),
        points: totalPoints,
        bonus: currentBonus,
        counts: cleanCounts,
        template,
        ...(gameData.softSkillCounts && { softSkillCounts: gameData.softSkillCounts })
      };

      const allPlayers = await firestore.getPlayers(user.uid);
      const currentPlayerData = allPlayers.find((p: any) => p.name === playerName);
      const oldBalance = currentPlayerData?.currentBalance || 0;
      const newBalance = oldBalance + totalPoints;

      await firestore.savePlayer(user.uid, playerName, {
        name: playerName,
        lastGameDate: gameRecord.date,
        currentBalance: newBalance,
        lastTeam: gameData.team.trim()
      });

      await firestore.saveGame(user.uid, playerName, gameRecord);

      if (currentBonus < 0) {
        const userData = await firestore.getUserData(user.uid);
        const carriedOverBonus = (userData?.carriedOverBonus || 0) + currentBonus;
        await firestore.updateUserData(user.uid, { carriedOverBonus });
      }

      return { success: true, gameRecord, newBalance };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save game');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 2. HÄMTA SPELARE
  const getPlayers = useCallback(async (): Promise<Player[]> => {
    if (!user) return [];
    try {
      setLoading(true);
      const players = await firestore.getPlayers(user.uid);
      const playersWithStats = await Promise.all(
        players.map(async (player: any) => {
          const games = await firestore.getGames(user.uid, player.name, 1000);
          return {
            ...player,
            gameCount: games.length,
            currentBalance: player.currentBalance || 0 
          };
        })
      );
      return playersWithStats;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch players');
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 3. HÄMTA HISTORIK
  const getPlayerHistory = useCallback(async (playerName: string, limit?: number) => {
    if (!user) return [];
    try {
      setLoading(true);
      return await firestore.getGames(user.uid, playerName, limit);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch player history');
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 4. RADERA SPELARE
  const deletePlayer = useCallback(async (playerName: string) => {
    if (!user) return;
    try {
      setLoading(true);
      await firestore.deletePlayer(user.uid, playerName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete player');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 5. UPPDATERA SALDO
  const updatePlayerBalance = useCallback(async (playerName: string, newBalance: number) => {
    if (!user) return;
    try {
      setLoading(true);
      await firestore.savePlayer(user.uid, playerName, {
        name: playerName,
        currentBalance: newBalance
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update balance');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 6. TOTAL STÄDNING (GDPR / RADERA KONTO)
  const deleteUserData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      // STEG A: Stoppa/Radera Stripe-konto via Cloud Function
      try {
        await deleteUserStripeAccount(); 
      } catch (stripeErr) {
        console.warn("Stripe cleanup skipped or failed:", stripeErr);
      }

      // STEG B: Hämta alla spelare för att kunna loopa igenom deras matcher
      const players = await firestore.getPlayers(user.uid);
      
      for (const player of players) {
        // Hämta alla matcher för denna spelare
        const games = await firestore.getGames(user.uid, player.name, 1000);
        
        // Radera varje match i sub-collection
        for (const game of games) {
          await (firestore as any).deleteGame(user.uid, player.name, game.id);
        }
        
        // Radera själva spelaren
        await firestore.deletePlayer(user.uid, player.name);
      }
      
      // STEG C: Radera användarens huvuddokument (med inställningar/mallar)
      await (firestore as any).deleteUserRoot(user.uid); 

    } catch (err) {
      console.error("Firestore cleanup failed:", err);
      setError("Failed to clean up data.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 7. STATISTIK
  const getPlayerStats = useCallback(async (playerName: string) => {
    if (!user) return null;
    try {
      const games = (await getPlayerHistory(playerName, 1000)) as GameRecord[];
      if (games.length === 0) return null;
      
      const totalPoints = games.reduce((sum, game) => sum + (game.points || 0), 0);
      const avgPoints = totalPoints / games.length;
      
      const actionCounts: Record<string, number> = {};
      games.forEach(game => {
        Object.entries(game.counts || {}).forEach(([action, count]) => {
          actionCounts[action] = (actionCounts[action] || 0) + (count as number);
        });
      });

      return {
        totalGames: games.length,
        totalPoints,
        avgPoints: Number(avgPoints.toFixed(2)),
        recentGames: games.slice(0, 10),
        topActions: Object.entries(actionCounts).sort((a, b) => b[1] - a[1]).slice(0, 10)
      };
    } catch (err) {
      return null;
    }
  }, [user, getPlayerHistory]);

  return {
    saveGame,
    getPlayers,
    getPlayerHistory,
    deletePlayer,
    getPlayerStats,
    updatePlayerBalance,
    deleteUserData,
    loading,
    error,
    clearError: () => setError(null)
  };
}