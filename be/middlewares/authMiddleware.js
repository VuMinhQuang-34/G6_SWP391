import jwt from 'jsonwebtoken';
import db from '../models/index.js';

const User = db.User;
const Role = db.Role;

// Verify JWT token
export const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        // Log để debug
        console.log('Auth header:', authHeader);
        console.log('ACCESS_TOKEN_SECRET exists:', !!process.env.ACCESS_TOKEN_SECRET);

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token format'
            });
        }

        const token = authHeader.split(' ')[1];

        // Log token để debug
        console.log('Extracted token:', token);

        if (!process.env.ACCESS_TOKEN_SECRET) {
            return res.status(500).json({
                success: false,
                message: 'ACCESS_TOKEN_SECRET is not configured'
            });
        }

        try {
            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            console.log('Decoded token:', decoded);

            const user = await User.findByPk(decoded.userId, {
                include: [{
                    model: Role,
                    attributes: ['Role_Name']
                }]
            });

            console.log('Found user:', user); // Log để debug

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            }

            req.user = user;
            next();
        } catch (jwtError) {
            console.error('JWT verification error:', jwtError);
            return res.status(401).json({
                success: false,
                message: 'Invalid token',
                error: jwtError.message
            });
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Check user role
export const checkRole = (allowedRoles) => {
    return async (req, res, next) => {
        try {
            if (!req.user || !req.user.Role) {
                return res.status(403).json({
                    success: false,
                    message: 'No role specified'
                });
            }

            const userRole = req.user.Role.Role_Name;

            if (allowedRoles.includes(userRole)) {
                next();
            } else {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Error checking role',
                error: error.message
            });
        }
    };
}; 