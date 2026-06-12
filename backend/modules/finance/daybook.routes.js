const router = require("express").Router();
const ctrl = require("./daybook.controller");
const { validate } = require("../../core/validate");

const createSchema = {
  date:        { required: true },
  entryType:   { required: true, enum: ["expense", "income", "salary", "bank_deposit", "bank_withdrawal", "transfer", "adjustment", "other"] },
  account:     { required: true },
  description: { required: true },
};

router.get("/", ctrl.list);
router.post("/", validate(createSchema), ctrl.create);
router.patch("/:id", ctrl.update);
router.delete("/:id", ctrl.remove);

module.exports = router;
