const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  
  const rooms = new Map();

  io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);

    // Create Room Handler
    socket.on('room:create', ({ playerName }) => {
      try {
        const roomId = generateRoomId();
        console.log(`Creating room ${roomId} for player ${playerName}`);

        rooms.set(roomId, { 
          host: socket.id, 
          players: new Map([[socket.id, {
            name: playerName,
            position: { x: 0, y: 0 },
            isHost: true
          }]])
        });
        
        socket.join(roomId);
        socket.emit('room:created', { roomId });
        io.to(roomId).emit('players:update', {
          players: Array.from(rooms.get(roomId).players)
        });

        console.log(`Room ${roomId} created successfully`);
      } catch (error) {
        console.error('Error creating room:', error);
        socket.emit('room:error', { message: 'Failed to create room' });
      }
    });

    // Join Room Handler
    socket.on('room:join', ({ roomId, playerName }) => {
      console.log(`Player ${playerName} attempting to join room ${roomId}`);
      
      const room = rooms.get(roomId);
      
      if (!room) {
        console.log(`Room ${roomId} not found`);
        socket.emit('room:error', { message: 'Room not found' });
        return;
      }

      try {
        socket.join(roomId);
        room.players.set(socket.id, {
          name: playerName,
          position: { x: 0, y: 0 },
          isHost: false
        });

        console.log(`Player ${playerName} joined room ${roomId}`);
        socket.emit('room:joined', { roomId });
        
        io.to(roomId).emit('players:update', {
          players: Array.from(room.players)
        });
      } catch (error) {
        console.error('Error joining room:', error);
        socket.emit('room:error', { message: 'Failed to join room' });
      }
    });

    // Cursor Movement Handler
    socket.on('cursor:move', ({ roomId, position }) => {
      const room = rooms.get(roomId);
      if (room && room.players.has(socket.id)) {
        room.players.get(socket.id).position = position;
        io.to(roomId).emit('players:update', {
          players: Array.from(room.players)
        });
      }
    });

    // Disconnect Handler
    socket.on('disconnect', () => {
      console.log('Player disconnected:', socket.id);
      
      rooms.forEach((room, roomId) => {
        if (room.players.has(socket.id)) {
          const playerName = room.players.get(socket.id).name;
          room.players.delete(socket.id);
          
          if (room.players.size === 0) {
            rooms.delete(roomId);
            console.log(`Room ${roomId} deleted - no players remaining`);
          } else {
            if (socket.id === room.host) {
              const newHost = Array.from(room.players.keys())[0];
              room.host = newHost;
              room.players.get(newHost).isHost = true;
              console.log(`New host assigned in room ${roomId}`);
            }
            io.to(roomId).emit('players:update', {
              players: Array.from(room.players)
            });
          }
        }
      });
    });
  });

  function generateRoomId(length = 6) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length }, () => 
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join('');
  }

  server.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
  });
});