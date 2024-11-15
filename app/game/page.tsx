'use client';

import { useEffect, useState } from 'react';
import { useSocket } from '@/context/SocketProvider';

interface Player {
  name: string;
  position: { x: number; y: number };
}

export default function GameBoard() {
  const { socket } = useSocket();
  const [players, setPlayers] = useState<Map<string, Player>>(new Map());

  useEffect(() => {
    if (!socket) return;

    const handleMouseMove = (e: MouseEvent) => {
      const position = {
        x: e.clientX,
        y: e.clientY,
      };
      socket.emit('cursor:move', position);
    };

    socket.on('players:update', (updatedPlayers) => {
      setPlayers(new Map(updatedPlayers));
    });

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      socket.off('players:update');
    };
  }, [socket]);

  return (
    <div className="relative min-h-screen bg-gray-100">
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
          <div className="w-4 h-4 bg-blue-500 rounded-full" />
          <span className="mt-1 text-sm bg-white px-2 py-1 rounded shadow">
            {player.name}
          </span>
        </div>
      ))}
    </div>
  );
}