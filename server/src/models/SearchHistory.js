const mongoose = require('mongoose');

const searchHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'user is required'],
      index: true,
    },
    keyword: {
      type: String,
      required: [true, 'keyword is required'],
      trim: true,
      maxlength: [100, 'keyword must be at most 100 characters'],
    },
  },
  {
    timestamps: true,
  }
);

searchHistorySchema.index({ user: 1, createdAt: -1 });

const SearchHistory = mongoose.model('SearchHistory', searchHistorySchema);

module.exports = SearchHistory;
