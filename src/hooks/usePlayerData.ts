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
      // 1. STÄDA DATAN (Fixar problemet med JSON-nycklar)
      const cleanCounts: Record<string, number> = {};
      let calculatedPoints = 0;

      // Vi måste hämta poängvärdet för varje action. 
      // Eftersom vi inte har tillgång till currentTemplate här inne direkt, 
      // måste vi antingen skicka med det eller göra en kvalificerad gissning.
      // För att lösa spar-problemet nu, städar vi bara nycklarna.
      
      Object.entries(counts).forEach(([key, count]) => {
        try {
          // Försök parsa nyckeln (eftersom den ser ut som '{"sv":"Mål"...}')
          const nameObj = JSON.parse(key);
          
          // Använd det engelska namnet som nyckel i databasen (mycket renare)
          const dbKey = nameObj.en || nameObj.sv; 
          cleanCounts[dbKey] = count;

          // TODO: Här borde du egentligen slå upp poängen från mallen.
          // Just nu sätter du poäng * 1 vilket kanske inte stämmer?
          // calculatedPoints += count * (action.points || 1); 
          
        } catch (e) {
          // Om nyckeln inte var JSON (gammal data?), spara som den är
          cleanCounts[key] = count;
        }
      });

      // OBS: Du räknade poäng manuellt i din förra kod (count * 1). 
      // Du bör se till att gameData.points som skickas in är korrekt uträknat 
      // från komponenten (SummarySection) innan det skickas hit.
      // Vi använder gameData.points om det finns, annars default.
      const totalPoints = gameData.points || 0;
      const currentBonus = totalPoints * bonusFactor;

      const gameRecord: GameRecord = {
        date: gameData.date || new Date().toISOString().split('T')[0],
        team: gameData.team.trim(),
        points: totalPoints,
        bonus: currentBonus,
        counts: cleanCounts, // <--- SKICKA DEN STÄDADE DATAN HÄR
        template,
        ...(gameData.softSkillCounts && { softSkillCounts: gameData.softSkillCounts })
      };

      console.log("Saving sanitized game record:", gameRecord); // Debug-logg

      // Save player info
      await firestore.savePlayer(user.uid, playerName, {
        name: playerName,
        lastGameDate: gameRecord.date
      });

      // Save game record
      await firestore.saveGame(user.uid, playerName, gameRecord);

      // Update carried over bonus if negative
      if (currentBonus < 0) {
        const userData = await firestore.getUserData(user.uid);
        const carriedOverBonus = (userData?.carriedOverBonus || 0) + currentBonus;
        
        await firestore.updateUserData(user.uid, {
          carriedOverBonus
        });
      }

      return { success: true, gameRecord };
    } catch (err) {
      console.error("Save game failed:", err); // Se det riktiga felet i konsolen
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
      
      // Get game count for each player
      const playersWithStats = await Promise.all(
        players.map(async (player: any) => {
          const games = await firestore.getGames(user.uid, player.name, 1000);
          return {
            ...player,
            gameCount: games.length
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
      // Vi sätter en typ på games här för att hjälpa TypeScript
      const games = (await getPlayerHistory(playerName, 1000)) as GameRecord[];
      
      if (games.length === 0) return null;

      const totalPoints = games.reduce((sum, game) => sum + (game.points || 0), 0);
      const avgPoints = totalPoints / games.length;
      
      // Vi anger typer för best/worst game explicit
      const bestGame = games.reduce((best, game) => 
        (game.points || 0) > (best.points || 0) ? game : best
      );
      const worstGame = games.reduce((worst, game) => 
        (game.points || 0) < (worst.points || 0) ? game : worst
      );

      // Calculate action frequencies
      const actionCounts: Record<string, number> = {};
      
      games.forEach(game => {
        // HÄR VAR FELET: Vi castar count till 'number'
        Object.entries(game.counts || {}).forEach(([action, count]) => {
          // Lägg till 'as number' här nedanför
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