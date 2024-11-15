'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/context/SocketProvider';

export default function Home() {
  const [playerName, setPlayerName] = useState('');
  const router = useRouter();
  const { socket } = useSocket();

  const handleJoinGame = () => {
    if (playerName.trim() && socket) {
      socket.emit('player:join', playerName);
      router.push('/game');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">Join Game</h1>
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Enter your name"
          className="w-full px-4 py-2 mb-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleJoinGame}
          className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors"
        >
          Join Game
        </button>
      </div>
    </div>
  );
}