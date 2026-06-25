import mongoose from 'mongoose';

const shopItemSchema = new mongoose.Schema({
  itemId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, default: '🛍️' },
  price: { type: Number, required: true },
  category: { type: String, default: 'general' },
  maxOwnable: { type: Number, default: 1 }
});

const ShopItem = mongoose.model('ShopItem', shopItemSchema);
export default ShopItem;
