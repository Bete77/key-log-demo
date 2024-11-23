'use client';

import { useEffect, useState } from 'react';
import { useSocket } from '@/context/SocketProvider';
import { useParams, useRouter } from 'next/navigation';

interface Player {
  name: string;
  position: { x: number; y: number };
  isHost: boolean;
}

export default function GameBoard() {
  const { socket } = useSocket();
  const params = useParams();
  const router = useRouter();
  const roomId = params?.roomId as string;
  const [players, setPlayers] = useState<Map<string, Player>>(new Map());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!socket || !roomId) return;

    const handleMouseMove = (e: MouseEvent) => {
      socket.emit('cursor:move', {
        roomId,
        position: { x: e.clientX, y: e.clientY }
      });
    };

    socket.on('players:update', ({ players: updatedPlayers }) => {
      console.log('Players update:', updatedPlayers);
      setPlayers(new Map(updatedPlayers));
    });

    socket.on('room:error', ({ message }) => {
      setError(message);
      setTimeout(() => router.push('/'), 3000);
    });

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      socket.off('players:update');
      socket.off('room:error');
    };
  }, [socket, roomId, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-red-100 text-red-700 p-4 rounded-md">
          {error}
          <div className="text-sm mt-2">Redirecting to home...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gray-100">
      <div className="absolute top-4 left-4 bg-white p-4 rounded-md shadow-md">
        <h2 className="text-lg font-bold mb-2">Room ID: {roomId}</h2>
        <div className="space-y-2">
          {Array.from(players.entries()).map(([id, player]) => (
            <div key={id} className="flex items-center gap-2">
              <span className="font-medium">{player.name}</span>
              {player.isHost ? (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  Host
                </span>
              ) : (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  Player
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {Array.from(players.entries()).map(([id, player]) => (
        <div
          key={id}
          className="absolute pointer-events-none"
          style={{
            left: player.position.x,
            top: player.position.y,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className={`w-4 h-4 ${player.isHost ? 'bg-blue-500' : 'bg-green-500'} rounded-full`} />
          <span className="mt-1 text-sm bg-white px-2 py-1 rounded shadow">
            {player.name}
          </span>
        </div>
      ))}
    </div>
  );
}