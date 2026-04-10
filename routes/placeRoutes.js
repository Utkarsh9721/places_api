// backend/routes/places.js
import express from "express";
import Place from "../models/place.js";

const router = express.Router();

//
// 🟢 GET ALL PLACES / FILTER BY TYPE WITH PAGINATION
//
router.get("/places", async (req, res) => {
  try {
    const { 
      type, 
      page = 1, 
      limit = 20,
      state,
      city,
      category,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    // Build filter object
    let filter = {};

    // filter by tourism type OR category
    if (type && type !== 'all') {
      filter = {
        $or: [
          { "tags.tourism": type },
          { category: type }
        ]
      };
    }

    // Filter by state
    if (state && state !== 'all') {
      filter.state = state;
    }

    // Filter by city
    if (city) {
      filter.city = city;
    }

    // Filter by category
    if (category && category !== 'all') {
      filter.category = category;
    }

    // Convert page and limit to numbers
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute queries in parallel for better performance
    const [data, total] = await Promise.all([
      Place.find(filter)
        .select("name city state location tags.tourism category description rating phone website")
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Place.countDocuments(filter)
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.json({
      success: true,
      type: type || "all",
      pagination: {
        currentPage: pageNum,
        totalPages: totalPages,
        totalItems: total,
        itemsPerPage: limitNum,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? pageNum + 1 : null,
        prevPage: hasPrevPage ? pageNum - 1 : null
      },
      places: data
    });

  } catch (error) {
    console.error('Error in /places:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

//
// 📍 NEARBY PLACES WITH PAGINATION
//
router.get("/nearby", async (req, res) => {
  try {
    const { 
      lat, 
      lng, 
      maxDistance = 5000,
      page = 1,
      limit = 20
    } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "lat and lng are required"
      });
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [data, total] = await Promise.all([
      Place.find({
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [parseFloat(lng), parseFloat(lat)]
            },
            $maxDistance: parseInt(maxDistance)
          }
        }
      })
        .select("name city state location tags.tourism category description rating phone website")
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Place.countDocuments({
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [parseFloat(lng), parseFloat(lat)]
            },
            $maxDistance: parseInt(maxDistance)
          }
        }
      })
    ]);

    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;

    res.json({
      success: true,
      pagination: {
        currentPage: pageNum,
        totalPages: totalPages,
        totalItems: total,
        itemsPerPage: limitNum,
        hasNextPage,
        nextPage: hasNextPage ? pageNum + 1 : null
      },
      places: data
    });

  } catch (error) {
    console.error('Error in /nearby:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

//
// 🟡 GET SINGLE PLACE BY ID
//
router.get("/places/:id", async (req, res) => {
  try {
    const place = await Place.findById(req.params.id).lean();

    if (!place) {
      return res.status(404).json({
        success: false,
        message: "Place not found"
      });
    }

    res.json({
      success: true,
      place
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

//
// 📊 GET STATS (Optional - for dashboard)
//
router.get("/stats", async (req, res) => {
  try {
    const [totalPlaces, byType, byState] = await Promise.all([
      Place.countDocuments(),
      Place.aggregate([
        { $group: { _id: "$tags.tourism", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Place.aggregate([
        { $group: { _id: "$state", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    res.json({
      success: true,
      stats: {
        total: totalPlaces,
        byType: byType.filter(t => t._id).map(t => ({ type: t._id, count: t.count })),
        topStates: byState.filter(s => s._id).map(s => ({ state: s._id, count: s.count }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;