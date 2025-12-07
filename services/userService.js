const { User } = require('../models');
const jwt = require('jsonwebtoken');

const register = async (userData) => {
    try {
        const user = await User.create(userData);
        // Remove password from response
        const userResponse = user.toJSON();
        delete userResponse.password;
        return userResponse;
    } catch (error) {
        throw error;
    }
};

const login = async (username, password) => {
    try {
        const user = await User.findOne({ where: { username } });
        if (!user) {
            throw new Error('User not found');
        }

        const isValid = user.validPassword(password);
        if (!isValid) {
            throw new Error('Invalid password');
        }

        // Remove password from response
        const userResponse = user.toJSON();
        delete userResponse.password;

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username 
            },
            process.env.JWT_SECRET || 'your-secret-key-change-in-production',
            { expiresIn: '7d' } // Token expires in 7 days
        );

        return {
            user: userResponse,
            token: token
        };
    } catch (error) {
        throw error;
    }
};

const getAllUsers = async () => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password'] }
        });
        return users;
    } catch (error) {
        throw error;
    }
};

module.exports = {
    register,
    login,
    getAllUsers
};
