import jwt from 'jsonwebtoken';
import db from '../models/index.js';

const User = db.User;
const Role = db.Role;

// Verify JWT token
export const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findByPk(decoded.userId, {
            include: [{
                model: Role,
                attributes: ['Role_Name']
            }]
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
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