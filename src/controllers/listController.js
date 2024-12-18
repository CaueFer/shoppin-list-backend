
const prismaClient = require("../utils/prismaClient");

const createList = async (req, res) => {
  const { name, password, owner } = req.body;

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
};

const joinList = async (req, res) => {
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
};

const getList = async (req, res) => {
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
};

const deleteList = async (req, res) => {
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
};

module.exports = { createList, joinList, getList, deleteList };
