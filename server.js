const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessages = require('./utils/messages');
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require('./utils/user');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// set static folder
app.use(express.static(path.join(__dirname, 'public')));

const botName = 'chat Bot';

// run when client connects
io.on('connection', (socket) => {
  socket.on('joinRoom', ({ username, room }) => {
    const user = userJoin(socket.id, username, room);
    socket.join(user.room);

    //welcome current user
    socket.emit('message', formatMessages(botName, 'welcome to this ws'));
    //broadcast when a user connects
    socket.broadcast
      .to(user.room)
      .emit(
        'message',
        formatMessages(botName, `${user.username} has joined the chat`)
      );

    // send users and room info
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  //listen for chatMessage
  socket.on('chatMessage', (message) => {
    const user = getCurrentUser(socket.id);
    io.to(user.roon).emit('message', formatMessages(user.username, message));
  });

  // Runs when client disconnect
  socket.on('disconnect', () => {
    const user = userLeave(socket.id);
    if (user) {
      io.to(user.room).emit(
        'message',
        formatMessages(botName, `${user.username} has leaved the chat`)
      );
      // send users and room info
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
