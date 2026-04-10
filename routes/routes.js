import express from "express";
import Place from "../models/place.js";

const router = express.Router();

router.get("/nearby", async (req, res) => {
  try {
    const { lng, lat } = req.query;

    const places = await Place.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: 5000
        }
      }
    });

    res.json(places);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;