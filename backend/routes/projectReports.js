const express  = require("express");
const router   = express.Router();
const Project  = require("../models/Project");
const Expense  = require("../models/Expense");
const CashBook = require("../models/CashBook");
const DayBook  = require("../models/DayBook");

// GET /api/reports/project-pnl
// Per-project profit / loss aggregated across Expenses, Cash Book and Day Book.
//
// Income (money in)  = Cash Book receipts + Day Book credits
// Cost (money out)   = Expenses (not rejected) + Cash Book payments + Day Book debits
// Net Profit / Loss  = Income - Cost
router.get("/project-pnl", async (req, res) => {
  try {
    const [projects, expenses, cashbook, daybook] = await Promise.all([
      Project.find({}).sort({ createdAt: -1 }),
      Expense.find({}),
      CashBook.find({}),
      DayBook.find({}),
    ]);

    // Seed a row for every project
    const rows = {};
    function blank(projectId, projectName, project) {
      return {
        projectId:       projectId || "__unassigned__",
        projectName:     projectName || "Unassigned",
        title:           project ? project.title : (projectName || "Unassigned"),
        partyName:       project ? project.partyName : "",
        type:            project ? project.type : "",
        stage:           project ? project.stage : "",
        location:        project ? project.location : "",
        contractValue:   project ? (project.approvedAmount || project.quotationAmount || 0) : 0,
        quotationAmount: project ? (project.quotationAmount || 0) : 0,
        approvedAmount:  project ? (project.approvedAmount || 0) : 0,
        // money in
        receipts:        0,   // cash book receipts
        dayCredits:      0,   // day book credits
        // money out
        expenses:        0,   // expense module
        payments:        0,   // cash book payments
        dayDebits:       0,   // day book debits
        // counts
        expenseCount:    0,
        receiptCount:    0,
        paymentCount:    0,
        dayCount:        0,
      };
    }

    projects.forEach((p) => {
      rows[p.projectId] = blank(p.projectId, p.partyName, p);
    });

    function ensure(projectId, projectName) {
      const key = projectId || "__unassigned__";
      if (!rows[key]) rows[key] = blank(projectId, projectName, null);
      return rows[key];
    }

    // Expenses — exclude rejected from committed cost
    expenses.forEach((e) => {
      if (!e.projectId) return;               // only project-tagged
      if (e.status === "rejected") return;
      const r = ensure(e.projectId, e.projectName);
      r.expenses += e.amount || 0;
      r.expenseCount += 1;
    });

    // Cash Book — receipts (in) / payments (out)
    cashbook.forEach((c) => {
      if (!c.projectId) return;
      const r = ensure(c.projectId, c.projectName);
      if (c.entryType === "receipt") {
        r.receipts += c.amount || 0;
        r.receiptCount += 1;
      } else {
        r.payments += c.amount || 0;
        r.paymentCount += 1;
      }
    });

    // Day Book — credits (in) / debits (out)
    daybook.forEach((d) => {
      if (!d.projectId) return;
      const r = ensure(d.projectId, d.projectName);
      r.dayCredits += d.credit || 0;
      r.dayDebits  += d.debit  || 0;
      r.dayCount   += 1;
    });

    // Finalise computed totals
    const list = Object.values(rows).map((r) => {
      const totalIncome = r.receipts + r.dayCredits;
      const totalCost   = r.expenses + r.payments + r.dayDebits;
      const netProfit   = totalIncome - totalCost;
      const margin      = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;
      return Object.assign(r, {
        totalIncome:  totalIncome,
        totalCost:    totalCost,
        netProfit:    netProfit,
        margin:       margin,
      });
    });

    // Drop rows with absolutely no financial activity AND no contract value,
    // unless it's a real project (keep projects so user sees zero-activity ones too)
    const filtered = list.filter((r) => {
      if (r.projectId === "__unassigned__") {
        return r.totalIncome !== 0 || r.totalCost !== 0;
      }
      return true;
    });

    // Sort: biggest net profit first
    filtered.sort((a, b) => b.netProfit - a.netProfit);

    // Grand totals
    const grand = filtered.reduce(
      (g, r) => {
        g.totalIncome += r.totalIncome;
        g.totalCost   += r.totalCost;
        g.netProfit   += r.netProfit;
        g.receipts    += r.receipts;
        g.payments    += r.payments;
        g.expenses    += r.expenses;
        g.dayCredits  += r.dayCredits;
        g.dayDebits   += r.dayDebits;
        return g;
      },
      { totalIncome: 0, totalCost: 0, netProfit: 0, receipts: 0, payments: 0, expenses: 0, dayCredits: 0, dayDebits: 0 }
    );

    res.json({ rows: filtered, grand: grand });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/project-pnl/:projectId  — full transaction breakdown for one project
router.get("/project-pnl/:projectId", async (req, res) => {
  try {
    const pid = req.params.projectId;
    const [project, expenses, cashbook, daybook] = await Promise.all([
      Project.findOne({ projectId: pid }),
      Expense.find({ projectId: pid }),
      CashBook.find({ projectId: pid }),
      DayBook.find({ projectId: pid }),
    ]);

    const transactions = [];
    expenses.forEach((e) => {
      if (e.status === "rejected") return;
      transactions.push({
        source: "expense", date: e.date, description: e.desc || "",
        ref: e.expenseId, party: e.party || e.empName || "",
        direction: "out", amount: e.amount || 0, category: e.cat || "", status: e.status,
      });
    });
    cashbook.forEach((c) => {
      transactions.push({
        source: "cashbook", date: c.date, description: c.description || "",
        ref: c.reference || c.entryId, party: c.party || "",
        direction: c.entryType === "receipt" ? "in" : "out",
        amount: c.amount || 0, category: c.category || "", mode: c.paymentMode || "",
      });
    });
    daybook.forEach((d) => {
      if (d.credit > 0) transactions.push({ source: "daybook", date: d.date, description: d.description || "", ref: d.reference || d.entryId, party: d.party || "", direction: "in",  amount: d.credit, account: d.account || "" });
      if (d.debit  > 0) transactions.push({ source: "daybook", date: d.date, description: d.description || "", ref: d.reference || d.entryId, party: d.party || "", direction: "out", amount: d.debit,  account: d.account || "" });
    });

    transactions.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

    res.json({ project: project, transactions: transactions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
