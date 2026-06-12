const Party = require("../../models/Party");
const { genId, ApiError } = require("../../core");

// Query → Mongo filter. Pure, unit-testable, no req/res here.
function buildFilter(q = {}) {
  const filter = {};
  if (q.type)   filter.type   = q.type;
  if (q.status) filter.status = q.status;
  if (q.search) filter.name   = { $regex: q.search, $options: "i" };
  return filter;
}

const list = (query) => Party.find(buildFilter(query)).sort({ name: 1 });

async function get(partyId) {
  const doc = await Party.findOne({ partyId });
  if (!doc) throw ApiError.notFound();
  return doc;
}

const create = (body) => Party.create({ ...body, partyId: genId("PAR") });

async function update(partyId, body) {
  const doc = await Party.findOneAndUpdate(
    { partyId }, { $set: body }, { new: true, runValidators: true });
  if (!doc) throw ApiError.notFound();
  return doc;
}

const remove = (partyId) => Party.findOneAndDelete({ partyId });

module.exports = { list, get, create, update, remove };
