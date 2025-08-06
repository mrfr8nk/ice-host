const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const User = require('../models/User');

// @route   POST api/auth/register
// @desc    Register user
router.post('/register', [
    check('username', 'Username is required').not().isEmpty(),
    check('password', 'Password must be 6+ characters').isLength({ min: 6 }),
    check('referralCode', 'Referral code must be valid').optional()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, password, referralCode } = req.body;

    try {
        // Check if user exists
        let user = await User.findOne({ username });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        // Create new user
        user = new User({ username, password });

        // Handle referral
        if (referralCode) {
            const referrer = await User.findOne({ username: referralCode });
            if (referrer) {
                user.referredBy = referrer._id;
                referrer.referrals.push(user._id);
                referrer.wallet.coins += 5;
                await referrer.save();
            }
        }

        // Check for admin registration
        if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
            user.role = 'admin';
        }

        await user.save();

        // Create JWT
        const payload = { 
            user: { 
                id: user.id,
                role: user.role 
            } 
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '5h' },
            (err, token) => {
                if (err) throw err;
                res.json({ 
                    token,
                    user: {
                        id: user.id,
                        username: user.username,
                        role: user.role
                    }
                });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST api/auth/login
// @desc    Login user
router.post('/login', [
    check('username', 'Username is required').not().isEmpty(),
    check('password', 'Password is required').exists()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    try {
        // Check if user exists
        let user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        // Create JWT
        const payload = { 
            user: { 
                id: user.id,
                role: user.role 
            } 
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '5h' },
            (err, token) => {
                if (err) throw err;
                res.json({ 
                    token,
                    user: {
                        id: user.id,
                        username: user.username,
                        role: user.role
                    }
                });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/auth/user
// @desc    Get current user data
router.get('/user', async (req, res) => {
    try {
        // Get token from header
        const token = req.header('x-auth-token');
        if (!token) {
            return res.status(401).json({ msg: 'No token, authorization denied' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.user.id).select('-password');
        
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST api/auth/change-password
// @desc    Change user password
router.post('/change-password', [
    check('currentPassword', 'Current password is required').exists(),
    check('newPassword', 'New password must be 6+ characters').isLength({ min: 6 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    try {
        // Get token from header
        const token = req.header('x-auth-token');
        if (!token) {
            return res.status(401).json({ msg: 'No token, authorization denied' });
        }

        // Verify token and get user
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.user.id);
        
        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Current password is incorrect' });
        }
        
        // Hash new password and save
        user.password = newPassword;
        await user.save();
        
        res.json({ msg: 'Password changed successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   DELETE api/auth/delete-account
// @desc    Delete user account
router.delete('/delete-account', async (req, res) => {
    try {
        // Get token from header
        const token = req.header('x-auth-token');
        if (!token) {
            return res.status(401).json({ msg: 'No token, authorization denied' });
        }

        // Verify token and get user
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.user.id;
        
        // Remove user
        await User.findByIdAndRemove(userId);
        
        res.json({ msg: 'Account deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
