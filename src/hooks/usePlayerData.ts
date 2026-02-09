import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { firestore } from '../services/firebase';

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
  currentBalance?: number; // Tillagd för att hålla reda på saldot
}

export function usePlayerData() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (!user) {
      throw new Error('User must be logged in');
    }

    setLoading(true);
    setError(null);

    try {
      // 1. STÄDA DATAN
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

      // 2. HÄMTA NUVARANDE SPELARDATA (för att få existerande saldo)
      const allPlayers = await firestore.getPlayers(user.uid);
      const currentPlayerData = allPlayers.find((p: any) => p.name === playerName);
      
      // Hämta gammalt saldo eller starta på 0
      const oldBalance = currentPlayerData?.currentBalance || 0;
      
      // Räkna ut det nya saldot (Gammalt saldo + matchens totala poäng)
      const newBalance = oldBalance + totalPoints;

      // 3. SPARA TILL FIRESTORE
      // Spara/Uppdatera spelarobjektet med det nya saldot
      await firestore.savePlayer(user.uid, playerName, {
        name: playerName,
        lastGameDate: gameRecord.date,
        currentBalance: newBalance, // Här sparas det automatiserade saldot
        lastTeam: gameData.team.trim()
      });

      // Spara själva match-loggen
      await firestore.saveGame(user.uid, playerName, gameRecord);

      // Uppdatera användarens globala bonus (om den är negativ, enligt din befintliga logik)
      if (currentBonus < 0) {
        const userData = await firestore.getUserData(user.uid);
        const carriedOverBonus = (userData?.carriedOverBonus || 0) + currentBonus;
        
        await firestore.updateUserData(user.uid, {
          carriedOverBonus
        });
      }

      return { success: true, gameRecord, newBalance };
    } catch (err) {
      console.error("Save game failed:", err);
      setError(err instanceof Error ? err.message : 'Failed to save game');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

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
            // currentBalance följer med här automatiskt från savePlayer ovan
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

  // Resten av funktionerna (getPlayerHistory, deletePlayer, getPlayerStats) förblir oförändrade
  const getPlayerHistory = useCallback(async (playerName: string, limit?: number) => {
    if (!user) return [];
    try {
      setLoading(true);
      const games = await firestore.getGames(user.uid, playerName, limit);
      return games;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch player history');
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

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

  const getPlayerStats = useCallback(async (playerName: string) => {
    if (!user) return null;
    try {
      const games = (await getPlayerHistory(playerName, 1000)) as GameRecord[];
      if (games.length === 0) return null;
      const totalPoints = games.reduce((sum, game) => sum + (game.points || 0), 0);
      const avgPoints = totalPoints / games.length;
      const bestGame = games.reduce((best, game) => 
        (game.points || 0) > (best.points || 0) ? game : best
      );
      const worstGame = games.reduce((worst, game) => 
        (game.points || 0) < (worst.points || 0) ? game : worst
      );
      const actionCounts: Record<string, number> = {};
      games.forEach(game => {
        Object.entries(game.counts || {}).forEach(([action, count]) => {
          const countVal = count as number; 
          actionCounts[action] = (actionCounts[action] || 0) + countVal;
        });
      });
      const sortedActions = Object.entries(actionCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
      return {
        totalGames: games.length,
        totalPoints,
        avgPoints: Number(avgPoints.toFixed(2)),
        bestGame,
        worstGame,
        recentGames: games.slice(0, 10),
        topActions: sortedActions
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate stats');
      return null;
    }
  }, [user, getPlayerHistory]);

  return {
    saveGame,
    getPlayers,
    getPlayerHistory,
    deletePlayer,
    getPlayerStats,
    loading,
    error,
    clearError: () => setError(null)
  };
}