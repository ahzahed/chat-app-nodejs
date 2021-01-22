const Filter = require("bad-words");
const express = require("express");
const path = require("path");
const app = express();
const { generateMessage, generateLocationMessage } = require("./utils/message");
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
} = require("./utils/users");

const server = require("http").createServer(app);
const io = require("socket.io")(server);

const publicPathDirectory = path.join(__dirname, "../public");
app.use(express.static(publicPathDirectory));
app.use(express.json);

io.on("connection", (socket) => {
  console.log("connected");

  socket.on("join", (options, callback) => {
    const { error, user } = addUser({ id: socket.id, ...options });
    if (error) {
      return callback(error);
    }
    socket.join(user.room);
    socket.emit("message", generateMessage("Admin", "Welcome"));
    socket
      .to(user.room)
      .broadcast.emit(
        "message",
        generateMessage("Admin", `${user.username} has been connected`)
      );
    callback();
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });
  });

  socket.on("sendMessage", (msg, callback) => {
    const user = getUser(socket.id);
    const filter = new Filter();
    if (filter.isProfane(msg)) {
      return callback("Profound is not allowed");
    }
    io.to(user.room).emit("message", generateMessage(user.username, msg));
    callback();
  });

  socket.on("sendLocation", (coords, callback) => {
    const user = getUser(socket.id);
    io.to(user.room).emit(
      "locationMessage",
      generateLocationMessage(
        user.username,
        `https://google.com/maps?q=${coords.lat},${coords.lon}`
      )
    );
    callback();
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.room).emit(
        "message",
        generateMessage("Admin", `${user.username} has been left`)
      );
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
  });
});

server.listen(3000);
