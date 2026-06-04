const express = require("express");
const router = express.Router();
const ppctController = require("../controllers/ppctController");

router.get("/subject/:mamon", ppctController.getPpctBySubject);
router.post("/", ppctController.addPpct);
router.put("/:id", ppctController.updatePpct);
router.delete("/:id", ppctController.deletePpct);

router.get("/:id/equipment", ppctController.getEquipmentForPpct);
router.post("/:id/equipment", ppctController.saveEquipmentForPpct);

module.exports = router;
