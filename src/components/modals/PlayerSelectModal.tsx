import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Search } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface Player {
  id: string;
  name: string;
  gameCount: number;
  lastGameDate?: string;
}

interface PlayerSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlayer: (playerName: string) => void;
  onAddNewPlayer: () => void;
}

export default function PlayerSelectModal({
  isOpen,
  onClose,
  onSelectPlayer,
  onAddNewPlayer
}: PlayerSelectModalProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadPlayers();
    }
  }, [isOpen, user]);

  const loadPlayers = async () => {
    setLoading(true);
    // Mock data - replace with actual API call
    setTimeout(() => {
      setPlayers([
        { id: '1', name: 'Erik Karlsson', gameCount: 12, lastGameDate: '2024-02-15' },
        { id: '2', name: 'Victor Hedman', gameCount: 8, lastGameDate: '2024-02-10' },
        { id: '3', name: 'Mika Zibanejad', gameCount: 15, lastGameDate: '2024-02-18' },
        { id: '4', name: 'Elias Pettersson', gameCount: 10, lastGameDate: '2024-02-12' },
        { id: '5', name: 'William Nylander', gameCount: 14, lastGameDate: '2024-02-16' },
      ]);
      setLoading(false);
    }, 500);
  };

  const filteredPlayers = players.filter(player =>
    player.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('selectPlayer')}
      size="md"
    >
      <div className="p-6">
        {/* Search */}
        <div className="mb-6">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search players..."
            icon={Search}
          />
        </div>

        {/* Players List */}
        <div className="max-h-96 overflow-y-auto space-y-2">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500 mx-auto"></div>
              <p className="mt-4 text-gray-400">Loading players...</p>
            </div>
          ) : filteredPlayers.length > 0 ? (
            filteredPlayers.map((player) => (
              <button
                key={player.id}
                onClick={() => {
                  onSelectPlayer(player.name);
                  onClose();
                }}
                className="w-full p-4 bg-gray-800 hover:bg-gray-750 rounded-xl text-left transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-full flex items-center justify-center mr-3">
                      <Users size={18} className="text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white group-hover:text-cyan-300">
                        {player.name}
                      </h4>
                      <p className="text-sm text-gray-400">
                        {player.gameCount} games • Last: {player.lastGameDate}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 bg-cyan-900/30 text-cyan-400 rounded-full text-sm">
                      Select
                    </span>
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="text-center py-12">
              <Users size={48} className="text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No players found</p>
              {searchTerm && (
                <p className="text-sm text-gray-500 mt-2">
                  Try a different search term
                </p>
              )}
            </div>
          )}
        </div>

        {/* Add New Player */}
        <div className="mt-6 pt-6 border-t border-gray-700">
          <Button
            onClick={() => {
              onAddNewPlayer();
              onClose();
            }}
            variant="primary"
            icon={UserPlus}
            fullWidth
          >
            Add New Player
          </Button>
        </div>
      </div>
    </Modal>
  );
}