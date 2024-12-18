const express = require("express");
const router = express.Router();
const listController = require("../controllers/listController");

router.post("/createList", listController.createList);
router.post("/joinList", listController.joinList);
router.get("/getList", listController.getList);
router.delete("/deleteList", listController.deleteList);

module.exports = router;
