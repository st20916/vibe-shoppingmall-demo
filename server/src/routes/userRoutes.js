const express = require('express');
const {
  getAllUsers,
  getUserCount,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} = require('../controllers/userController');

const router = express.Router();

router.get('/', getAllUsers);
router.get('/count', getUserCount);
router.get('/:id', getUserById);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

module.exports = router;
