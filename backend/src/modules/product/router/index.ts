import { Router } from 'express';

const router = Router();

// TODO: Implement product routes
router.get('/', (req, res) => {
  res.json({ message: 'Product routes coming soon' });
});

export default router; 