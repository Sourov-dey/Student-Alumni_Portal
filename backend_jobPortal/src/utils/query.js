// src/utils/query.js

/**
 * Build MongoDB query filter from request query params
 * Supports single character search using regex instead of text search
 */
export const buildJobQuery = (query) => {
  const filter = {};

  // Search - works with even 1 character!
  if (query.search && query.search.trim()) {
    const searchTerm = query.search.trim();
    
    // Use regex for single character or short searches (more flexible)
    // This searches in title, company, description, and department fields
    filter.$or = [
      { title: { $regex: searchTerm, $options: 'i' } },
      { company: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } },
      { department: { $regex: searchTerm, $options: 'i' } },
      { location: { $regex: searchTerm, $options: 'i' } },
    ];
  }

  // Department filter
  if (query.department) {
    filter.department = query.department;
  }

  // Location filter
  if (query.location) {
    filter.location = { $regex: query.location, $options: 'i' };
  }

  // Job type filter
  if (query.type) {
    filter.type = query.type;
  }

  // Only show active jobs by default (unless explicitly requested)
  if (query.includeInactive !== 'true') {
    filter.isActive = true;
  }

  // Filter by poster (for "my jobs")
  if (query.postedBy) {
    filter.postedBy = query.postedBy;
  }

  return filter;
};

/**
 * Build sort object from query params
 */
export const buildSort = (query) => {
  const sortBy = query.sortBy || 'createdAt';
  const order = query.order === 'asc' ? 1 : -1;

  const sort = {};
  sort[sortBy] = order;

  return sort;
};

/**
 * Alternative: Hybrid approach - use text search for longer queries, regex for short ones
 */
export const buildJobQueryHybrid = (query) => {
  const filter = {};

  // Search - intelligent switching between text search and regex
  if (query.search && query.search.trim()) {
    const searchTerm = query.search.trim();
    
    // For queries 3+ characters, use text search (faster for long queries)
    // For 1-2 characters, use regex (more flexible)
    if (searchTerm.length >= 3) {
      // Use text search if you have a text index
      filter.$text = { $search: searchTerm };
    } else {
      // Use regex for short searches
      filter.$or = [
        { title: { $regex: searchTerm, $options: 'i' } },
        { company: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { department: { $regex: searchTerm, $options: 'i' } },
        { location: { $regex: searchTerm, $options: 'i' } },
      ];
    }
  }

  // Department filter
  if (query.department) {
    filter.department = query.department;
  }

  // Location filter
  if (query.location) {
    filter.location = { $regex: query.location, $options: 'i' };
  }

  // Job type filter
  if (query.type) {
    filter.type = query.type;
  }

  // Only show active jobs by default
  if (query.includeInactive !== 'true') {
    filter.isActive = true;
  }

  // Filter by poster
  if (query.postedBy) {
    filter.postedBy = query.postedBy;
  }

  return filter;
};