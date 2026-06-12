const router = require("express").Router();

/**
 * Finance domain router — the reference module for the layered architecture.
 *
 * Mounted by hrm_server.js under /api, so each sub-router keeps its existing
 * public path: /api/parties, /api/cashbook, /api/daybook, /api/expenses.
 * The frontend surface is unchanged — only the backend internals are restructured
 * (route → controller → service → model, with shared core/ middleware).
 */
router.use("/parties",  require("./parties.routes"));
router.use("/cashbook", require("./cashbook.routes"));
router.use("/daybook",  require("./daybook.routes"));
router.use("/expenses", require("./expenses.routes"));

module.exports = router;
