const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const { PrismaClient } = require("@prisma/client");
const cors = require("cors");

const prismaClient = new PrismaClient();
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*", methods: ["GET", "POST", "PUT", "DEL"] },
});

app.use(cors());
app.use(express.json());

app.post("/api/createList", async (req, res) => {
  const { name, password, owner } = req.body;
  console.log(owner);

  if (!name || !password) {
    return res.status(400).json({ error: "Nome e senha são obrigatórios" });
  }

  try {
    const existingList = await prismaClient.list.findUnique({
      where: { name },
    });

    if (existingList) {
      return res
        .status(400)
        .json({ error: "Uma lista com este nome já existe" });
    }

    const list = await prismaClient.list.create({
      data: { name, password, owner },
    });

    res.status(201).json(list);
  } catch (error) {
    console.error("Erro ao criar a lista:", error);
    res.status(500).json({ error: "Erro ao criar a lista" });
  }
});

app.post("/api/joinList", async (req, res) => {
  const { name, password } = req.body;

  if (!name || !password) {
    return res.status(400).json({ error: "Nome e senha são obrigatórios" });
  }

  try {
    const list = await prismaClient.list.findUnique({
      where: { name },
    });

    if (!list) {
      return res.status(404).json({ error: "Lista não encontrada" });
    }

    if (list.password !== password) {
      return res.status(401).json({ error: "Senha incorreta" });
    }

    res.status(200).json({ success: true, listId: list.id });
  } catch (error) {
    console.error("Erro ao tentar juntar a lista:", error);
    res.status(500).json({ error: "Erro ao tentar juntar a lista" });
  }
});

app.get("/api/getList", async (req, res) => {
  const { owner } = req.query;

  if (!owner) {
    return res.status(400).json({ error: "Owner é obrigatório" });
  }

  try {
    const lists = await prismaClient.list.findMany({
      where: { owner },
    });

    res.status(200).json(lists);
  } catch (error) {
    console.error("Erro ao obter listas:", error);
    res.status(500).json({ error: "Erro ao obter listas" });
  }
});

app.get("/api/getListItems", async (req, res) => {
  const { listId } = req.query;

  if (!listId) {
    return res.status(400).json({ error: "listID é obrigatório" });
  }

  const listIdNumber = Number(listId);

  try {
    const listItems = await prismaClient.item.findMany({
      where: { listId: listIdNumber },
    });

    res.status(200).json(listItems);
  } catch (error) {
    console.error("Erro ao obter items de lista:", error);
    res.status(500).json({ error: "Erro ao obter items de lista" });
  }
});

app.post("/api/createListItem", async (req, res) => {
  const { listId, itemName } = req.body;

  if (!itemName || !newItem) {
    return res.status(400).json({ error: "listItem e ID é obrigatório" });
  }

  const listIdNumber = Number(listId);

  try {
    const list = await prismaClient.list.findUnique({
      where: { id: listIdNumber },
    });
    if (!list) return res.status(404).json({ error: "Lista não encontrada." });

    const item = await prismaClient.item.create({
      data: { name: itemName, listId },
    });

    res.status(201).json(item);
  } catch (error) {
    console.error("Erro ao criar item de lista:", error);
    res.status(500).json({ error: "Erro ao criar item de lista" });
  }
});

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("updateList", async (data) => {
    const { listId, items } = data;
    await prismaClient.item.deleteMany({
      where: { listId },
    });
    await prismaClient.item.createMany({
      data: items.map((item) => ({ ...item, listId })),
    });

    io.to(listId.toString()).emit("listUpdated", items);
  });

  socket.on("joinList", (listId) => {
    socket.join(listId.toString());
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

// Iniciar o servidor
server.listen(3001, () => {
  console.log("Servidor rodando na porta 3001");
});
