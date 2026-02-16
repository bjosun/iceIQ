import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../services/firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { Users, Search, Plus, Trash2, User, ChevronRight, TrendingUp } from 'lucide-react';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';

interface Player {
  id: string;
  name: string;
  team: string;
  createdAt?: any;
}

export default function Players() {
  const { user } = useAuth();
  const { t } = useLanguage();
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerTeam, setNewPlayerTeam] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- 1. Hämta spelare ---
  const fetchPlayers = async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'players'), 
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc') // Sortera nyast först
      );
      
      const querySnapshot = await getDocs(q);
      const playersList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Player[];
      
      setPlayers(playersList);
    } catch (error) {
      console.error("Error fetching players:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, [user]);

  // --- 2. Lägg till spelare ---
  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newPlayerName.trim()) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'players'), {
        userId: user.uid,
        name: newPlayerName.trim(),
        team: newPlayerTeam.trim() || 'My Team',
        createdAt: new Date(),
        currentBalance: 0 // Initiera saldo
      });
      
      toast.success("Player added!");
      setNewPlayerName('');
      setNewPlayerTeam('');
      setIsAddModalOpen(false);
      fetchPlayers(); // Uppdatera listan
    } catch (error) {
      toast.error("Could not add player.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- 3. Radera spelare ---
  const handleDeletePlayer = async (playerId: string, playerName: string) => {
    if (!window.confirm(`Are you sure you want to delete ${playerName}? This cannot be undone.`)) return;

    try {
      await deleteDoc(doc(db, 'players', playerId));
      toast.success("Player deleted.");
      setPlayers(players.filter(p => p.id !== playerId));
    } catch (error) {
      toast.error("Error deleting player.");
    }
  };

  // Filtrera sökning
  const filteredPlayers = players.filter(player => 
    player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.team.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-900 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Users className="text-cyan-400" size={32} />
              {t('players') || "Players"}
            </h1>
            <p className="text-gray-400 text-sm mt-1">Manage your roster and view stats.</p>
          </div>
          
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all transform hover:scale-105"
          >
            <Plus size={20} />
            Add Player
          </button>
        </div>

        {/* SEARCH BAR */}
        <div className="relative mb-8">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="text-gray-500" size={20} />
          </div>
          <input
            type="text"
            placeholder="Search players or teams..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-800/50 border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
          />
        </div>

        {/* PLAYER GRID */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto"></div>
          </div>
        ) : filteredPlayers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlayers.map((player) => (
              <Card key={player.id} className="group hover:border-cyan-500/50 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center border border-gray-600 group-hover:border-cyan-500/50 transition-colors">
                      <User size={24} className="text-gray-400 group-hover:text-cyan-400 transition-colors" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">
                        {player.name}
                      </h3>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                        {player.team}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeletePlayer(player.id, player.name)}
                    className="p-2 text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete Player"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                
                <div className="flex gap-2">
                  <Link 
                    // Länka till dashboard med spelaren vald, eller en specifik detaljsida om du har en
                    to={`/dashboard?player=${encodeURIComponent(player.name)}`} 
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold py-2 rounded-lg text-center transition-colors flex items-center justify-center gap-2"
                  >
                    <TrendingUp size={16} />
                    View Stats
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-gray-800/30 rounded-2xl border border-gray-700 border-dashed">
            <Users size={48} className="mx-auto text-gray-600 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No players found</h3>
            <p className="text-gray-400 mb-6">Get started by adding your first player.</p>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="text-cyan-400 font-bold hover:underline"
            >
              Add a new player
            </button>
          </div>
        )}
      </div>

      {/* ADD PLAYER MODAL */}
      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        title="Add New Player"
      >
        <form onSubmit={handleAddPlayer} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
            <input 
              type="text" 
              required
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              placeholder="e.g. Elias Pettersson"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Team</label>
            <input 
              type="text" 
              value={newPlayerTeam}
              onChange={(e) => setNewPlayerTeam(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              placeholder="e.g. Vancouver Canucks"
            />
          </div>
          <div className="pt-4 flex gap-3">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => setIsAddModalOpen(false)}
              fullWidth
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
              loading={isSubmitting}
              fullWidth
            >
              Add Player
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}