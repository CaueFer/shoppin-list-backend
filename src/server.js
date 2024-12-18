const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");

const prismaClient = require("./utils/prismaClient");
const listRoutes = require("./routes/listRoutes");
const itemRoutes = require("./routes/itemRoutes");
const socketService = require("./services/socketService");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

app.use(cors());
app.use(express.json());

// Rotas
app.use("/api", listRoutes);
app.use("/api", itemRoutes);

// Socket.IO
socketService(io);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta: ${PORT}`);
});
