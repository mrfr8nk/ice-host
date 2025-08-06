const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// @route   GET api/wallet
// @desc    Get user wallet info
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('wallet username');
        
        // Generate referral link
        const referralLink = `${req.protocol}://${req.get('host')}/register?ref=${user.username}`;
        
        res.json({
            coins: user.wallet.coins,
            lastClaim: user.wallet.lastClaim,
            referralLink,
            referrals: user.referrals.length
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST api/wallet/claim
// @desc    Claim daily coins
router.post('/claim', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const now = new Date();
        
        // Check if user can claim
        if (user.wallet.lastClaim) {
            const lastClaim = new Date(user.wallet.lastClaim);
            const hoursDiff = (now - lastClaim) / (1000 * 60 * 60);
            
            if (hoursDiff < 24) {
                return res.status(400).json({ 
                    msg: `You can claim again in ${Math.ceil(24 - hoursDiff)} hours`
                });
            }
        }
        
        // Add coins and update last claim time
        user.wallet.coins += 5;
        user.wallet.lastClaim = now;
        await user.save();
        
        res.json({ 
            coins: user.wallet.coins,
            lastClaim: user.wallet.lastClaim
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
