import http from "http";
import { Server } from "socket.io";
import express from "express";
import { instrument } from "@socket.io/admin-ui";
import siofu from "socketio-file-upload";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use(siofu.router);
app.use(express.static(__dirname + "/uploads"));
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req, res) => res.render("home"));

const handleListen = () => console.log(`Listening on http://localhost:3000`);

const server = http.createServer(app);
const weServer = new Server(server, {
  cors: {
    origin: ["https://admin.socket.io"],
    credentials: true,
  },
});

instrument(weServer, {
  auth: false,
});

function publicRooms() {
  const {
    sockets: {
      adapter: { sids, rooms },
    },
  } = weServer;
  const publicRooms = [];
  rooms.forEach((_, key) => {
    if (sids.get(key) === undefined) {
      publicRooms.push(key);
    }
  });
  return publicRooms;
}

function countRoom(roomName) {
  return weServer.sockets.adapter.rooms.get(roomName)?.size;
}

weServer.on("connection", (socket) => {
  weServer.sockets.emit("room_change", publicRooms());
  socket["nickname"] = "Annon";
  socket.onAny((event) => {
    console.log(`Socket Event: ${event}`);
  });
  const uploader = new siofu();
  uploader.dir = "./uploads";
  uploader.listen(socket);
  uploader.on("saved", (event) => {
    event.file.clientDetail.nameOfImage = event.file.pathName;
  });
  socket.on("enter_room", (roomName, welcomeRoom) => {
    socket.join(roomName);
    welcomeRoom(countRoom(roomName));
    socket.to(roomName).emit("join", socket.nickname, countRoom(roomName));
    weServer.sockets.emit("room_change", publicRooms());
  });
  socket.on("disconnecting", () => {
    socket.rooms.forEach((room) =>
      socket.to(room).emit("bye", socket.nickname, countRoom(room) - 1)
    );
  });
  socket.on("disconnect", () => {
    weServer.sockets.emit("room_change", publicRooms());
  });
  socket.on("new_message", (msg, room, done) => {
    socket.to(room).emit("new_message", `${socket.nickname}: ${msg}`);
    done();
  });
  socket.on("nickname", (nickname) => (socket["nickname"] = nickname));
});

server.listen(3000, handleListen);
