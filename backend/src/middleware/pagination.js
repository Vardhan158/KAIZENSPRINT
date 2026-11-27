const getPaginationAndFilters = (req) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const search = req.query.search || '';
  const sortBy = req.query.sortBy || 'createdAt';
  const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

  return { page, limit, skip, search, sortBy, sortOrder };
};

module.exports = { getPaginationAndFilters };
