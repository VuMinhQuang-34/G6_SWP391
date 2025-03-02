import express from 'express';
import {
    getDashboardData,
} from '../controllers/dashboardController.js';

const dashboardRoutes = express.Router();

// GET dashboard
dashboardRoutes.get('/dashboard', getDashboardData);

export default dashboardRoutes;
