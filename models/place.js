import mongoose from "mongoose";

const placeSchema = new mongoose.Schema({
  name: String,
  city: String,
  state: String,
  location: {
    type: {
      type: String
    },
    coordinates: [Number]
  },
  tags: Object,
  category: String,
  createdAt: Date
});

// ✅ IMPORTANT: third parameter = exact collection name
const Place = mongoose.model("Place", placeSchema, "places");

export default Place;