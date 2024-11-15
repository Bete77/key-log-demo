'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/context/SocketProvider';

export default function Home() {
  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [isLoading, setIsLoading] = useState({
    create: false,
    join: false,
    matchmaking: false
  });
  const [matchmakingStatus, setMatchmakingStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    // Matchmaking event listeners
    const handleMatchFound = ({ roomId }: { roomId: string }) => {
      setMatchmakingStatus('Match found! Joining game...');
      setIsLoading(prev => ({ ...prev, matchmaking: false }));
      router.push(`/game/${roomId}`);
    };

    const handleMatchmakingWaiting = () => {
      setMatchmakingStatus('Waiting for opponent...');
    };

    const handleMatchmakingError = ({ message }: { message: string }) => {
      setError(message);
      setIsLoading(prev => ({ ...prev, matchmaking: false }));
      setMatchmakingStatus('');
    };

    socket.on('match:found', handleMatchFound);
    socket.on('matchmaking:waiting', handleMatchmakingWaiting);
    socket.on('matchmaking:error', handleMatchmakingError);

    return () => {
      socket.off('match:found', handleMatchFound);
      socket.off('matchmaking:waiting', handleMatchmakingWaiting);
      socket.off('matchmaking:error', handleMatchmakingError);
    };
  }, [socket, router]);

  const handlePlayOnline = () => {
    if (!playerName.trim() || !socket) return;

    try {
      setIsLoading(prev => ({ ...prev, matchmaking: true }));
      setError(null);
      setMatchmakingStatus('Searching for players...');
      socket.emit('matchmaking:join', { playerName });
    } catch (err) {
      setError('Failed to start matchmaking');
      setIsLoading(prev => ({ ...prev, matchmaking: false }));
      setMatchmakingStatus('');
    }
  };

  const handleCancelMatchmaking = () => {
    if (!socket) return;
    socket.emit('matchmaking:cancel');
    setIsLoading(prev => ({ ...prev, matchmaking: false }));
    setMatchmakingStatus('');
  };

  const handleCreateRoom = () => {
    if (!playerName.trim() || !socket) return;

    try {
      setIsLoading(prev => ({ ...prev, create: true }));
      setError(null);

      socket.emit('room:create', { playerName });

      socket.once('room:created', ({ roomId }) => {
        console.log('Room created:', roomId);
        router.push(`/game/${roomId}`);
      });

      socket.once('room:error', ({ message }) => {
        setError(message);
        setIsLoading(prev => ({ ...prev, create: false }));
      });
    } catch (err) {
      setError('Failed to create room');
      setIsLoading(prev => ({ ...prev, create: false }));
    }
  };

  const handleJoinRoom = () => {
    if (!playerName.trim() || !roomId.trim() || !socket) return;

    try {
      setIsLoading(prev => ({ ...prev, join: true }));
      setError(null);

      socket.emit('room:join', { roomId, playerName });

      socket.once('room:joined', ({ roomId }) => {
        console.log('Joined room:', roomId);
        router.push(`/game/${roomId}`);
      });

      socket.once('room:error', ({ message }) => {
        setError(message);
        setIsLoading(prev => ({ ...prev, join: false }));
      });
    } catch (err) {
      setError('Failed to join room');
      setIsLoading(prev => ({ ...prev, join: false }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">Cursor Game</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Enter your name"
          className="w-full px-4 py-2 mb-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Play Online Button */}
        <button
          onClick={isLoading.matchmaking ? handleCancelMatchmaking : handlePlayOnline}
          disabled={!playerName.trim()}
          className={`w-full mb-4 bg-purple-500 text-white py-2 rounded-md hover:bg-purple-600 
            transition-colors ${!playerName.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isLoading.matchmaking ? (
            <div className="flex items-center justify-center gap-2">
              <span>{matchmakingStatus}</span>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            'Play Online'
          )}
        </button>

        <div className="relative">
          <div className="absolute inset-x-0 text-center -top-3">
            <span className="bg-white px-4 text-gray-500">or create/join room</span>
          </div>
          <hr className="my-6" />
        </div>

        <div className="flex gap-4 mb-4">
          <button
            onClick={handleCreateRoom}
            disabled={isLoading.create || !playerName.trim()}
            className={`flex-1 bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 
              transition-colors ${isLoading.create ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading.create ? (
              <div className="flex items-center justify-center gap-2">
                <span>Creating...</span>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              'Host Game'
            )}
          </button>
        </div>

        <input
          type="text"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value.toUpperCase())}
          placeholder="Enter Room ID"
          className="w-full px-4 py-2 mb-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          onClick={handleJoinRoom}
          disabled={isLoading.join || !playerName.trim() || !roomId.trim()}
          className={`w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 
            transition-colors ${isLoading.join ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isLoading.join ? (
            <div className="flex items-center justify-center gap-2">
              <span>Joining...</span>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            'Join Game'
          )}
        </button>
      </div>
    </div>
  );
}