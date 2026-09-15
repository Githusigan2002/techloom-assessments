const { Product } = require('../models');
const { AppError } = require('../middleware/errorHandler');

// Get all products with Search, Category, Price Range, Availability & Pagination
const getProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      available,
      sort,
      page = 1,
      limit = 8,
    } = req.query;

    const filter = {};

    // Text / Regex Search across Name & Description
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [{ name: searchRegex }, { description: searchRegex }];
    }

    // Category Filter
    if (category && category.trim() && category.toLowerCase() !== 'all') {
      filter.category = category.trim().toLowerCase();
    }

    // Price Range Filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined && minPrice !== '') {
        filter.price.$gte = Number(minPrice);
      }
      if (maxPrice !== undefined && maxPrice !== '') {
        filter.price.$lte = Number(maxPrice);
      }
    }

    // Availability Filter
    if (available !== undefined) {
      if (available === 'true' || available === true) {
        filter.availability = true;
      } else if (available === 'false' || available === false) {
        filter.availability = false;
      }
    }

    // Sorting
    let sortOption = { createdAt: -1 };
    if (sort === 'price-asc') {
      sortOption = { price: 1 };
    } else if (sort === 'price-desc') {
      sortOption = { price: -1 };
    } else if (sort === 'name-asc') {
      sortOption = { name: 1 };
    } else if (sort === 'newest') {
      sortOption = { createdAt: -1 };
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10) || 8));
    const skip = (pageNum - 1) * limitNum;

    const totalProducts = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    const totalPages = Math.ceil(totalProducts / limitNum) || 1;

    res.status(200).json({
      status: 'success',
      results: products.length,
      pagination: {
        totalProducts,
        totalPages,
        currentPage: pageNum,
        limit: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
      products,
    });
  } catch (error) {
    next(error);
  }
};

// Get single product by ID
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    res.status(200).json({
      status: 'success',
      product,
    });
  } catch (error) {
    next(error);
  }
};

// Get unique categories
const getCategories = async (req, res, next) => {
  try {
    const categories = await Product.distinct('category');
    res.status(200).json({
      status: 'success',
      categories,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  getCategories,
};
