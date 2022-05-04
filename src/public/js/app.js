const socket = io.connect();

const welcome = document.getElementById("welcome");
const form = welcome.querySelector("form");
const room = document.getElementById("room");
const nickname = document.getElementById("name");
const roomname = document.getElementById("roomname");
const imge = document.getElementById("image");
let siofu = new SocketIOFileUpload(socket);
siofu.listenOnInput(document.getElementById("siofu_input"));

room.hidden = true;
roomname.hidden = true;

let roomName;
let newCount;

function addMessage(message) {
  const ul = room.querySelector("ul");
  const li = document.createElement("li");
  li.innerText = message;
  ul.appendChild(li);
}

function handleMessageSubmit(event) {
  event.preventDefault();
  const input = room.querySelector("#msg input");
  const value = input.value;
  socket.emit("new_message", input.value, roomName, () => {
    addMessage(`You: ${value}`);
  });
  input.value = "";
}

function handleNicknameSubmit(event) {
  roomname.hidden = false;
  nickname.hidden = true;
  event.preventDefault();
  const input = welcome.querySelector("#name input");
  const value = input.value;
  socket.emit("nickname", value);
  input.value = "";
}

function showRoom(newCount) {
  welcome.hidden = true;
  room.hidden = false;
  const h3 = room.querySelector("h3");
  h3.innerText = `Room : ${roomName} (${newCount})`;
  const msgForm = room.querySelector("#msg");
  msgForm.addEventListener("submit", handleMessageSubmit);
}

function handleRoomSubmit(event) {
  event.preventDefault();
  const input = form.querySelector("input");
  socket.emit("enter_room", input.value, showRoom);
  input.value = "";
}

siofu.addEventListener("progress", function (event) {
  const percent = (event.bytesLoaded / event.file.size) * 100;
  console.log("File is", percent.toFixed(2), "percent loaded");
});

siofu.addEventListener("complete", function (event) {
  console.log(event);
  console.log(event.detail.nameOfImage);
  const img = document.createElement("img");
  img.setAttribute("style", "float:left;width:500px;height:300px");
  const images = event.detail.nameOfImage;
  console.log(images);
  img.src = images;
  imge.appendChild(img);
});

form.addEventListener("submit", handleRoomSubmit);
nickname.addEventListener("submit", handleNicknameSubmit);

socket.on("join", (user, newCount) => {
  const h3 = room.querySelector("h3");
  h3.innerText = `Room : ${roomName} (${newCount})`;
  addMessage(`${user} Joined!`);
});

socket.on("bye", (user, newCount) => {
  const h3 = room.querySelector("h3");
  h3.innerText = `Room : ${roomName} (${newCount})`;
  addMessage(`${user} left!`);
});

socket.on("new_message", addMessage);

socket.on("room_change", (rooms) => {
  const roomList = welcome.querySelector("ul");
  roomList.innerHTML = "";
  if (rooms.length === 0) {
    return;
  }
  rooms.forEach((room) => {
    const li = document.createElement("li");
    li.innerText = room;
    roomList.append(li);
  });
});
