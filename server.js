const express = require('express');
const app = express();
const http = require('http');
const path = require('path');
const server = http.createServer(app);
const { Server } = require("socket.io");

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(express.static(path.join(__dirname, 'public')));

let users = [];

io.on('connection', (socket) => {
  
  socket.on('join-room', (name) => {
    const user = { id: socket.id, name: name };
    users.push(user);
    io.emit('update-users', users);
    
    // CORREÇÃO: Avisa a todos que alguém novo entrou na sala
    socket.broadcast.emit('new-user', socket.id);
  });

  // CORREÇÃO: A ponte para avisar o novato sobre telas que já estão ligadas
  socket.on('notify-already-sharing', (targetId) => {
    socket.to(targetId).emit('user-started-share', socket.id);
  });

  socket.on('chat-message', (data) => {
    io.emit('chat-message', data);
  });

  socket.on('start-share', () => {
    socket.broadcast.emit('user-started-share', socket.id);
  });

  socket.on('stop-share', () => {
    socket.broadcast.emit('user-stopped-share', socket.id);
  });

  socket.on('offer', (data) => {
    socket.to(data.target).emit('offer', { sender: socket.id, offer: data.offer });
  });

  socket.on('answer', (data) => {
    socket.to(data.target).emit('answer', { sender: socket.id, answer: data.answer });
  });

  socket.on('ice-candidate', (data) => {
    socket.to(data.target).emit('ice-candidate', { sender: socket.id, candidate: data.candidate });
  });

  socket.on('disconnect', () => {
    users = users.filter(u => u.id !== socket.id);
    io.emit('update-users', users);
    socket.broadcast.emit('user-stopped-share', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor Web rodando na porta ${PORT}`);
});
