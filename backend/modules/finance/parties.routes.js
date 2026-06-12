const router = require("express").Router();
const ctrl = require("./parties.controller");
const { validate } = require("../../core/validate");
// const { authGuard } = require("../../core/authGuard");
// To require auth, add `authGuard` before the handlers below — see the note in
// core/authGuard.js (the ported finance pages must send a token first).

// Shape check before the DB; the Party model enforces the deeper enum/unique rules.
const createSchema = {
  name: { required: true },
  type: { required: true, enum: ["vendor", "client", "employee", "bank", "government", "other"] },
};

router.get("/", ctrl.list);
router.get("/:id", ctrl.get);
router.post("/", validate(createSchema), ctrl.create);
router.patch("/:id", ctrl.update);
router.delete("/:id", ctrl.remove);

module.exports = router;
