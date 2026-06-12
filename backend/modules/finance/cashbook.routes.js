const router = require("express").Router();
const ctrl = require("./cashbook.controller");
const { validate } = require("../../core/validate");

const createSchema = {
  date:        { required: true },
  entryType:   { required: true, enum: ["receipt", "payment"] },
  description: { required: true },
  amount:      { required: true, type: "number" },
};

router.get("/", ctrl.list);
router.post("/", validate(createSchema), ctrl.create);
router.patch("/:id", ctrl.update);
router.delete("/:id", ctrl.remove);

module.exports = router;
