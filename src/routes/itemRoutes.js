const express = require("express");
const router = express.Router();
const itemController = require("../controllers/itemController");

router.post("/createListItem", itemController.createListItem);
router.delete("/deleteListItem", itemController.deleteListItem);
router.get("/getListItems", itemController.getListItems);

module.exports = router;
