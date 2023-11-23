const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const players = [];

let prevUpdateTime = Date.now();

const TIKERATE = 60;

app.use(express.static(path.join(__dirname, "../frontend/assets")));

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// Constantes pour les événements
const CONNECTION_EVENT = "connection";
const CONNECTION_RECEPTION_EVENT = "connectionReception";
const DISCONNECT_EVENT = "disconnect";
const DISCONNECT_PLAYER_EVENT = "disconnectPlayer";
const SPIN_EVENT_END = "spinEnd";
const SPIN_EVENT_START = "spinStart"
const SPIN_EVENT_DATA = "spinData";

const wheelDatas = {
  currentAngle: undefined,
  maxAngularVelocity: undefined,
  currentAngularVelocity: undefined,
  isSpinning: false,
  isAccelerating: false,
};

io.on(CONNECTION_EVENT, (socket) => {
  // Réception d'un nouveau joueur
  const player = {
    id: socket.id,
  };

  players.push(player);

  io.emit(CONNECTION_RECEPTION_EVENT, player);

  // Réception d'une déconnexion
  socket.on(DISCONNECT_EVENT, () => {
    const playerIndex = players.findIndex((p) => p.id === socket.id);

    players.splice(playerIndex, 1);

    io.emit(DISCONNECT_PLAYER_EVENT, playerIndex);
  });

  socket.on(SPIN_EVENT_END, () => {
    wheelDatas.isSpinning = false;
  })

  // Réception du lancement de la roue par un joueur
  socket.on(SPIN_EVENT_START, (spinData) => {
    wheelDatas.currentAngle = spinData.currentAngle;
    wheelDatas.maxAngularVelocity = spinData.maxAngularVelocity;
    wheelDatas.currentAngularVelocity = spinData.currentAngularVelocity;
    wheelDatas.isAccelerating = spinData.isAccelerating;
    wheelDatas.isSpinning = spinData.isSpinning;

    // Émission des données de rotation à tous les clients
    io.emit(SPIN_EVENT_START, wheelDatas);
  });

  socket.on(SPIN_EVENT_DATA, (spinData) => {
    wheelDatas.currentAngle = spinData.currentAngle;
    wheelDatas.maxAngularVelocity = spinData.maxAngularVelocity;
    wheelDatas.currentAngularVelocity = spinData.currentAngularVelocity;
    wheelDatas.isAccelerating = spinData.isAccelerating;
    wheelDatas.isSpinning = spinData.isSpinning;

  })

  setInterval(() => {

    io.emit("syncData", wheelDatas);
  }, 1000 / TIKERATE);

});

server.listen(3000, function () {
  console.log("Serveur actif sur http://localhost:3000");
});
