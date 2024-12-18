const prismaClient = require("../utils/prismaClient");

const createListItem = async (req, res) => {
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
};

const deleteListItem = async (req, res) => {
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
};

const getListItems = async (req, res) => {
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
};

module.exports = { createListItem, deleteListItem, getListItems };
