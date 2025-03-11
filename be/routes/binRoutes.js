import express from 'express';
import { getAllBin, getOneBinById, createBin, updateBin, deleteBin } from '../controllers/binController.js';

const router = express.Router();

router.get('/bins', getAllBin);
router.get('/bins/:id', getOneBinById);

router.post('/bins', createBin);
router.patch('/bins/:id', updateBin);
router.delete('/bins/:id', deleteBin);

export default router;
