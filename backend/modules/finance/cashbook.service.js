const CashBook = require("../../models/CashBook");
const { genId, ApiError } = require("../../core");

function buildFilter(q = {}) {
  const filter = {};
  if (q.type) filter.entryType   = q.type;
  if (q.mode) filter.paymentMode = q.mode;
  if (q.projectId) filter.projectId = q.projectId;
  if (q.from || q.to) {
    filter.date = {};
    if (q.from) filter.date.$gte = q.from;
    if (q.to)   filter.date.$lte = q.to;
  }
  return filter;
}

const list = (query) => CashBook.find(buildFilter(query)).sort({ date: 1, createdAt: 1 });

function create(body) {
  const entry = { ...body, entryId: genId("CB") };
  if (entry.amount != null) entry.amount = parseFloat(entry.amount) || 0;
  return CashBook.create(entry);
}

async function update(entryId, body) {
  const doc = await CashBook.findOneAndUpdate(
    { entryId }, { $set: body }, { new: true, runValidators: true });
  if (!doc) throw ApiError.notFound();
  return doc;
}

const remove = (entryId) => CashBook.findOneAndDelete({ entryId });

module.exports = { list, create, update, remove };
