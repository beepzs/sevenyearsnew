import { Router } from 'express';
import { getBanners, saveBanner, deleteBanner } from '../controllers/banners.controller.js';

const router = Router();

router.get('/', getBanners);
router.post('/', (req, res) => {
  const id = req.body.id || `banner-${Date.now()}`;
  req.params.id = id;
  return saveBanner(req, res);
});
router.put('/:id', saveBanner);
router.delete('/:id', deleteBanner);

export default router;
