const mongoose = require('mongoose');

const DEFAULT_CATEGORY_NAMES = ['상의', '하의', '악세서리'];

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'name is required'],
      unique: true,
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Category = mongoose.model('Category', categorySchema);

const ensureDefaultCategories = async () => {
  await Promise.all(
    DEFAULT_CATEGORY_NAMES.map((name) =>
      Category.updateOne(
        { name },
        { $setOnInsert: { name, isDefault: true } },
        { upsert: true }
      )
    )
  );
};

module.exports = Category;
module.exports.DEFAULT_CATEGORY_NAMES = DEFAULT_CATEGORY_NAMES;
module.exports.ensureDefaultCategories = ensureDefaultCategories;
