const mongoose = require('mongoose');

const DeploymentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    branchName: {
        type: String,
        required: true,
        unique: true
    },
    sessionId: {
        type: String,
        required: true
    },
    ownerNumber: {
        type: String,
        required: true
    },
    prefix: {
        type: String,
        default: '.'
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'pending'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastActive: Date
});

module.exports = mongoose.model('Deployment', DeploymentSchema);
