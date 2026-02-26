import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Search, Shield, Wallet, Trash2 } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { usePlayerData } from '../../hooks/usePlayerData'; 
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import toast from 'react-hot-toast';

interface Player {
  id: string;
  name: string;
  gameCount: number;
  lastGameDate?: string;
  lastTeam?: string;      
  currentBalance?: number; 
}

interface PlayerSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlayer: (playerName: string) => void;
  onAddNewPlayer: (playerName: string) => void; // <--- Nu förväntar den sig ett namn!
  isPremium?: boolean; 
}

export default function PlayerSelectModal({
  isOpen,
  onClose,
  onSelectPlayer,
  onAddNewPlayer,
  isPremium = false 
}: PlayerSelectModalProps) {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  
  const { getPlayers, deletePlayer } = usePlayerData();

  const [players, setPlayers] = useState<Player[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  const currencySymbol = language === 'en' ? 'USD' : 'SEK';

  useEffect(() => {
    if (isOpen && user) {
      loadPlayers();
    }
  }, [isOpen, user]);

  const loadPlayers = async () => {
    setLoading(true);
    try {
      const fetchedPlayers = await getPlayers();
      setPlayers(fetchedPlayers as Player[]);
    } catch (error) {
      console.error("Failed to load players", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlayer = async (e: React.MouseEvent, player: Player) => {
    e.stopPropagation(); 
    
    const confirmMessage = language === 'en' 
      ? `Are you sure you want to delete ${player.name}? All history and balance will be removed.`
      : `Är du säker på att du vill ta bort ${player.name}? All historik och saldo kommer att raderas.`;

    if (window.confirm(confirmMessage)) {
      try {
        await deletePlayer(player.name);
        setPlayers(prev => prev.filter(p => p.id !== player.id));
        toast.success(language === 'en' ? "Player deleted" : "Spelare borttagen");
      } catch (error) {
        console.error("Kunde inte ta bort spelare:", error);
        toast.error(language === 'en' ? "Failed to delete player" : "Kunde inte ta bort spelaren");
      }
    }
  };

  const handleAddNewClick = () => {
    const newName = searchTerm.trim();
    
    // 1. Kolla så att man skrivit ett namn
    if (!newName) {
      toast.error(language === 'en' ? "Please enter a name first" : "Skriv in ett namn först");
      return;
    }

    // 2. Kolla premium-spärren
    if (!isPremium && players.length >= 1) {
      toast.error(language === 'en' 
        ? "Free plan is limited to 1 player. Upgrade to add more." 
        : "Gratisplanen är begränsad till 1 spelare. Uppgradera för att lägga till fler.", 
        { icon: '🔒', duration: 4000 }
      );
      return;
    }

    // 3. Skicka namnet upp till Dashboard
    onAddNewPlayer(newName);
    setSearchTerm(''); 
  };

  const filteredPlayers = players.filter(player =>
    player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (player.lastTeam && player.lastTeam.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('selectPlayer')}
      size="md"
    >
      <div className="p-6">
        <div className="mb-6">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('searchPlayers') || "Search players or teams..."}
            icon={Search}
            autoFocus
          />
        </div>

        <div className="max-h-96 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500 mx-auto"></div>
              <p className="mt-4 text-gray-400">Loading players...</p>
            </div>
          ) : filteredPlayers.length > 0 ? (
            filteredPlayers.map((player) => (
              <div key={player.id} className="relative group">
                <button
                  onClick={() => {
                    onSelectPlayer(player.name);
                    onClose();
                  }}
                  className="w-full p-4 bg-gray-800 hover:bg-gray-750 rounded-xl text-left transition-all border border-gray-700 hover:border-cyan-500/50 flex items-center justify-between pr-12"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center mr-3 shrink-0">
                      <Users size={18} className="text-cyan-400" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-white group-hover:text-cyan-400 transition-colors truncate">
                        {player.name}
                      </h4>
                      <div className="flex flex-wrap gap-2 mt-0.5">
                        {player.lastTeam && (
                          <span className="flex items-center text-[10px] text-gray-400">
                            <Shield size={10} className="mr-1" /> {player.lastTeam}
                          </span>
                        )}
                        <span className="flex items-center text-[10px] text-yellow-500 font-medium">
                          <Wallet size={10} className="mr-1" /> {player.currentBalance || 0} {currencySymbol}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right hidden sm:block shrink-0 ml-2">
                    <span className="text-[10px] text-gray-500 uppercase tracking-tighter">
                      {player.gameCount || 0} {t('matches') || 'Matches'}
                    </span>
                  </div>
                </button>

                <button
                  onClick={(e) => handleDeletePlayer(e, player)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                  title="Ta bort spelare"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <Users size={40} className="text-gray-700 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No players found</p>
            </div>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-700">
          <Button
            onClick={handleAddNewClick} 
            variant="primary"
            icon={UserPlus}
            fullWidth
          >
            {t('addNewPlayer') || 'Add New Player'}
          </Button>
          
          {!isPremium && players.length >= 1 && (
             <p className="text-xs text-center text-gray-500 mt-2">
               {language === 'en' 
                 ? "Free plan: 1 of 1 player used." 
                 : "Gratisplan: 1 av 1 spelare använd."}
             </p>
          )}
        </div>
      </div>
    </Modal>
  );
}