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

  const io = new Server(server);
  
  const players = new Map();

  io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);

    socket.on('player:join', (playerName) => {
      players.set(socket.id, { name: playerName, position: { x: 0, y: 0 } });
      io.emit('players:update', Array.from(players));
    });

    socket.on('cursor:move', (position) => {
      if (players.has(socket.id)) {
        players.get(socket.id).position = position;
        io.emit('players:update', Array.from(players));
      }
    });

    socket.on('disconnect', () => {
      players.delete(socket.id);
      io.emit('players:update', Array.from(players));
      console.log('Player disconnected:', socket.id);
    });
  });

  server.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
  });
});