const DayBook = require("../../models/DayBook");
const { genId, ApiError } = require("../../core");

function buildFilter(q = {}) {
  const filter = {};
  if (q.type) filter.entryType = q.type;
  if (q.projectId) filter.projectId = q.projectId;
  if (q.date) {
    filter.date = q.date;
  } else if (q.from || q.to) {
    filter.date = {};
    if (q.from) filter.date.$gte = q.from;
    if (q.to)   filter.date.$lte = q.to;
  }
  return filter;
}

const list = (query) => DayBook.find(buildFilter(query)).sort({ date: 1, createdAt: 1 });

function create(body) {
  const entry = { ...body, entryId: genId("DB") };
  if (entry.debit  != null) entry.debit  = parseFloat(entry.debit)  || 0;
  if (entry.credit != null) entry.credit = parseFloat(entry.credit) || 0;
  return DayBook.create(entry);
}

async function update(entryId, body) {
  const doc = await DayBook.findOneAndUpdate(
    { entryId }, { $set: body }, { new: true, runValidators: true });
  if (!doc) throw ApiError.notFound();
  return doc;
}

const remove = (entryId) => DayBook.findOneAndDelete({ entryId });

module.exports = { list, create, update, remove };
