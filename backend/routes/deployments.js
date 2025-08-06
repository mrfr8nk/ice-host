const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { check, validationResult } = require('express-validator');
const Deployment = require('../models/Deployment');
const User = require('../models/User');

// @route   POST api/deployments
// @desc    Create new deployment
router.post('/', [
    auth,
    [
        check('branchName', 'Branch name is required').not().isEmpty(),
        check('sessionId', 'Session ID is required').not().isEmpty(),
        check('ownerNumber', 'Owner number is required').not().isEmpty()
    ]
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { branchName, sessionId, ownerNumber, prefix } = req.body;

    try {
        const user = await User.findById(req.user.id);
        
        // Check if user has enough coins
        if (user.wallet.coins < 10) {
            return res.status(400).json({ msg: 'Not enough coins. Each deployment costs 10 coins.' });
        }

        // Check if branch name is unique
        const existingDeployment = await Deployment.findOne({ branchName });
        if (existingDeployment) {
            return res.status(400).json({ msg: 'Branch name already in use' });
        }

        // Create new deployment
        const deployment = new Deployment({
            user: req.user.id,
            branchName,
            sessionId,
            ownerNumber,
            prefix: prefix || '.'
        });

        // Deduct coins
        user.wallet.coins -= 10;
        await user.save();
        await deployment.save();

        res.json(deployment);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/deployments
// @desc    Get user deployments
router.get('/', auth, async (req, res) => {
    try {
        const deployments = await Deployment.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(deployments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
