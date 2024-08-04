const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const { PrismaClient } = require("@prisma/client");
const cors = require("cors");

const prismaClient = new PrismaClient();
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
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
    return res.status(400).json({ error: "Nome e senha são obrigatórios." });
  }

  try {
    const list = await prismaClient.list.findUnique({
      where: { name },
    });

    if (!list) {
      return res.status(404).json({ error: "Lista não encontrada." });
    }

    if (list.password !== password) {
      return res.status(401).json({ error: "Senha incorreta." });
    }

    res.status(200).json({ success: true, list });
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
  const { listId, newItemName } = req.body;

  if (!newItemName || !listId) {
    return res.status(400).json({ error: "listItem e ID é obrigatório" });
  }

  const listIdNumber = Number(listId);

  try {
    const list = await prismaClient.list.findUnique({
      where: { id: listIdNumber },
    });
    if (!list) return res.status(404).json({ error: "Lista não encontrada." });

    const item = await prismaClient.item.create({
      data: { name: newItemName, listId: listIdNumber },
    });

    res.status(201).json(item);
  } catch (error) {
    console.error("Erro ao criar item de lista:", error);
    res.status(500).json({ error: "Erro ao criar item de lista" });
  }
});

app.delete("/api/deleteListItem", async (req, res) => {
  const { listId, itemId } = req.body;

  if (!listId || !itemId) {
    return res.status(400).json({ error: "listId e itemId são obrigatórios" });
  }

  const listIdNumber = Number(listId);
  const itemIdNumber = Number(itemId);

  try {
    const list = await prismaClient.list.findUnique({
      where: { id: listIdNumber },
    });

    if (!list) return res.status(404).json({ error: "Lista não encontrada." });

    const item = await prismaClient.item.findUnique({
      where: { id: itemIdNumber },
    });

    if (!item) return res.status(404).json({ error: "Item não encontrado." });

    await prismaClient.item.delete({
      where: { id: itemIdNumber },
    });

    res.status(200).json({ message: "Item excluído com sucesso.", success: true, item: item});
  } catch (error) {
    console.error("Erro ao excluir item de lista:", error);
    res.status(500).json({ error: "Erro ao excluir item de lista" });
  }
});

app.delete("/api/deleteList", async (req, res) => {
  const { listId } = req.body;

  if (!listId) {
    return res.status(400).json({ error: "listId são obrigatórios" });
  }

  const listIdNumber = Number(listId);

  try {
    const list = await prismaClient.list.findUnique({
      where: { id: listIdNumber },
    });
    if (!list) return res.status(404).json({ error: "Lista não encontrada." });

    const listItem = await prismaClient.item.findFirst({
      where: { listId: listIdNumber },
    });
    if (listItem) return res.status(406).json({ error: "Delete os itens, antes de deletar lista!" });

    await prismaClient.list.delete({
      where: { id: listIdNumber },
    });

    res.status(200).json({ message: "Lista excluída com sucesso.", success: true, list: list});
  } catch (error) {
    console.error("Erro ao excluir lista:", error);
    res.status(500).json({ error: "Erro ao excluir lista" });
  }
});


io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("joinList", (listId, callback) => {
    try {
      socket.join(listId.toString());
      console.log(`Socket ${socket.id} joined room ${listId}`);
      if (callback) {
        callback({ success: true, message: `Joined room ${listId}` });
      }
    } catch (error) {
      console.error(`Failed to join room ${listId}:`, error);
      if (callback) {
        callback({ success: false, message: `Failed to join room ${listId}` });
      }
    }
  });

  socket.on(
    "updateListItem",
    async ({ itemId, itemName, itemMarked, listId }, callback) => {
      try {
        const updatedItem = await prismaClient.item.update({
          where: { id: itemId },
          data: { name: itemName, marked: itemMarked },
        });

        socket.broadcast.to(listId.toString()).emit("itemUpdated", updatedItem);

        if (callback) {
          callback({
            success: true,
            message: "Item updated successfully",
          });
        }
      } catch (error) {
        console.error("Error updating item:", error);
        if (callback) {
          callback({ success: false, message: "Failed to update item" });
        }
      }
    }
  );

  socket.on(
    "deleteListItem",
    async ({ itemId, itemName, itemMarked, listId }, callback) => {
      try {
        socket.broadcast.to(listId.toString()).emit("itemDeleted", itemId);

        if (callback) {
          callback({
            success: true,
            message: "Item deleted successfully",
          });
        }
      } catch (error) {
        console.error("Error share deleting item:", error);
        if (callback) {
          callback({ success: false, message: "Failed share deleting item" });
        }
      }
    }
  );

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta: ${PORT}`);
});
