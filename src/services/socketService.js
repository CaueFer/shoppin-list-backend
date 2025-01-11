const prismaClient = require("../utils/prismaClient");

const socketService = (io) => {
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
          callback({
            success: false,
            message: `Failed to join room ${listId}`,
          });
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

          socket.broadcast
            .to(listId.toString())
            .emit("itemUpdated", updatedItem);

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

    socket.on("deleteListItem", async ({ itemId, listId }, callback) => {
      try {
        socket.broadcast.to(listId.toString()).emit("itemDeleted", { itemId });

        callback({
          success: true,
          message: "Item deleted successfully",
        });
      } catch (error) {
        console.error("Error deleting item:", error);
        if (callback) {
          callback({ success: false, message: "Failed to delete item" });
        }
      }
    });

    socket.on("disconnect", () => {
      console.log("A user disconnected");
    });
  });
};

module.exports = socketService;
