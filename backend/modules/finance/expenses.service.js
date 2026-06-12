const Expense = require("../../models/Expense");
const { ApiError } = require("../../core");

function buildFilter(q = {}) {
  const filter = {};
  if (q.status) filter.status = q.status;
  if (q.cat)    filter.cat    = q.cat;
  if (q.empId)  filter.empId  = q.empId;
  if (q.projectId) filter.projectId = q.projectId;
  if (q.month)  filter.date   = { $regex: `^${q.month}` };
  return filter;
}

const list = (query) => Expense.find(buildFilter(query)).sort({ date: -1, createdAt: -1 });

// Faithful to the legacy route: the client supplies `expenseId` (the Expense
// model requires it) — we do NOT generate it server-side here.
function create(body, attachments) {
  const doc = { ...body };
  if (doc.amount   != null) doc.amount   = parseFloat(doc.amount)   || 0;
  if (doc.receipts != null) doc.receipts = parseInt(doc.receipts, 10) || 0;
  doc.attachments = attachments;
  if (!doc.receipts) doc.receipts = attachments.length;
  return Expense.create(doc);
}

async function addAttachments(expenseId, attachments) {
  const doc = await Expense.findOneAndUpdate(
    { expenseId },
    { $push: { attachments: { $each: attachments } }, $inc: { receipts: attachments.length } },
    { new: true }
  );
  if (!doc) throw ApiError.notFound();
  return doc;
}

async function removeAttachment(expenseId, idx) {
  const doc = await Expense.findOne({ expenseId });
  if (!doc) throw ApiError.notFound();
  if (idx < 0 || idx >= doc.attachments.length) throw ApiError.badRequest("Invalid index");
  doc.attachments.splice(idx, 1);
  doc.receipts = Math.max(0, doc.receipts - 1);
  doc.markModified("attachments");
  await doc.save();
  return doc;
}

async function update(expenseId, body) {
  const doc = await Expense.findOneAndUpdate(
    { expenseId }, { $set: body }, { new: true, runValidators: true });
  if (!doc) throw ApiError.notFound();
  return doc;
}

const remove = (expenseId) => Expense.findOneAndDelete({ expenseId });

module.exports = { list, create, addAttachments, removeAttachment, update, remove };
