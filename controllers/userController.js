const userService = require('../services/userService');

const register = async (req, res) => {
    try {
        const user = await userService.register(req.body);
        res.status(201).json({
            message: 'User registered successfully',
            data: user
        });
    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
};

const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await userService.login(username, password);
        res.status(200).json({
            message: 'Login successful',
            data: result.user,
            token: result.token
        });
    } catch (error) {
        res.status(401).json({
            message: error.message
        });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await userService.getAllUsers();
        res.status(200).json({
            data: users
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

module.exports = {
    register,
    login,
    getAllUsers
};
