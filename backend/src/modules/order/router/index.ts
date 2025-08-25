import { Router } from 'express';

const router = Router();

// TODO: Implement order routes
router.get('/', (req, res) => {
  res.json({ message: 'Order routes coming soon' });
});

export default router; 