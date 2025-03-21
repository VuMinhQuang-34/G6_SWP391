import express from 'express';
import { getAllBin, getOneBinById, createBin, updateBin, deleteBin, getAllShelf } from '../controllers/binController.js';

const router = express.Router();

router.get('/bins', getAllBin);
router.get('/bins/:id', getOneBinById);

router.post('/bins', createBin);
router.put('/bins/:id', updateBin);
router.delete('/bins/:id', deleteBin);

router.get('/shelfs', getAllShelf);

export default router;
