document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    
    // DOM Elements
    const usernameDisplay = document.getElementById('usernameDisplay');
    const userRole = document.getElementById('userRole');
    const coinBalance = document.getElementById('coinBalance');
    const mobileCoinBalance = document.getElementById('mobileCoinBalance');
    const logoutBtn = document.getElementById('logoutBtn');
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.querySelector('.sidebar');
    const navItems = document.querySelectorAll('.sidebar-nav li');
    const contentSections = document.querySelectorAll('.content-section');
    
    // Admin credentials
    const ADMIN_USERNAME = 'darrell';
    const ADMIN_PASSWORD = 'mucheri';
    
    // Initialize dashboard
    initDashboard();
    
    // Functions
    async function initDashboard() {
        try {
            // Get user data
            const user = await fetchUserData();
            
            // Display user info
            usernameDisplay.textContent = user.username;
            userRole.textContent = user.role === 'admin' ? 'Admin' : 'User';
            coinBalance.textContent = user.wallet.coins;
            mobileCoinBalance.textContent = user.wallet.coins;
            
            // Load active/inactive bots count
            await loadDeploymentsCount();
            
            // Load wallet data
            await loadWalletData();
            
            // Load deployments
            await loadDeployments();
            
            // Set up event listeners
            setupEventListeners();
        } catch (err) {
            console.error('Dashboard init error:', err);
            alert('Failed to load dashboard data');
        }
    }
    
    async function fetchUserData() {
        const response = await fetch('/api/auth/user', {
            headers: {
                'x-auth-token': token
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch user data');
        }
        
        return await response.json();
    }
    
    async function loadDeploymentsCount() {
        const response = await fetch('/api/deployments/count', {
            headers: {
                'x-auth-token': token
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            document.getElementById('activeBotsCount').textContent = data.active;
            document.getElementById('inactiveBotsCount').textContent = data.inactive;
            document.getElementById('dashboardCoins').textContent = data.coins;
        }
    }
    
    async function loadWalletData() {
        const response = await fetch('/api/wallet', {
            headers: {
                'x-auth-token': token
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            
            // Update wallet display
            document.getElementById('walletCoins').textContent = data.coins;
            
            // Update referral info
            document.getElementById('referralLink').value = data.referralLink;
            document.getElementById('referralCount').textContent = data.referrals;
            document.getElementById('referralEarnings').textContent = data.referrals * 5;
            
            // Calculate next claim time
            if (data.lastClaim) {
                const lastClaim = new Date(data.lastClaim);
                const nextClaim = new Date(lastClaim.getTime() + 24 * 60 * 60 * 1000);
                const now = new Date();
                
                if (now < nextClaim) {
                    const hoursLeft = Math.ceil((nextClaim - now) / (60 * 60 * 1000));
                    document.getElementById('nextClaimTime').textContent = `${hoursLeft} hours`;
                } else {
                    document.getElementById('nextClaimTime').textContent = 'Now';
                }
            }
        }
    }
    
    async function loadDeployments() {
        const response = await fetch('/api/deployments', {
            headers: {
                'x-auth-token': token
            }
        });
        
        if (response.ok) {
            const deployments = await response.json();
            const deploymentsList = document.getElementById('deploymentsList');
            
            if (deployments.length === 0) {
                deploymentsList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-rocket"></i>
                        <p>You don't have any deployments yet</p>
                        <button id="addFirstDeploymentBtn" class="btn btn-primary">
                            Create Your First Deployment
                        </button>
                    </div>
                `;
                
                document.getElementById('addFirstDeploymentBtn').addEventListener('click', () => {
                    document.getElementById('addDeploymentBtn').click();
                });
                
                return;
            }
            
            deploymentsList.innerHTML = '';
            
            deployments.forEach(deployment => {
                const deploymentCard = document.createElement('div');
                deploymentCard.className = 'deployment-card glass-container';
                deploymentCard.innerHTML = `
                    <div class="deployment-header">
                        <h3>${deployment.branchName}</h3>
                        <span class="status-badge ${deployment.status}">
                            ${deployment.status}
                        </span>
                    </div>
                    <div class="deployment-details">
                        <p><strong>Owner:</strong> ${deployment.ownerNumber}</p>
                        <p><strong>Prefix:</strong> ${deployment.prefix}</p>
                        <p><strong>Created:</strong> ${new Date(deployment.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div class="deployment-actions">
                        <button class="btn btn-secondary btn-sm view-logs" data-id="${deployment._id}">
                            <i class="fas fa-terminal"></i> View Logs
                        </button>
                        <button class="btn btn-danger btn-sm delete-deployment" data-id="${deployment._id}">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                `;
                
                deploymentsList.appendChild(deploymentCard);
            });
            
            // Add event listeners to action buttons
            document.querySelectorAll('.view-logs').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const deploymentId = e.target.getAttribute('data-id');
                    viewDeploymentLogs(deploymentId);
                });
            });
            
            document.querySelectorAll('.delete-deployment').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const deploymentId = e.target.getAttribute('data-id');
                    deleteDeployment(deploymentId);
                });
            });
        }
    }
    
    function setupEventListeners() {
        // Logout button
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            window.location.href = 'login.html';
        });
        
        // Mobile menu toggle
        menuToggle?.addEventListener('click', () => {
            menuToggle.classList.toggle('active');
            sidebar.classList.toggle('active');
        });
        
        // Navigation items
        navItems.forEach(item => {
            if (item.id !== 'logoutBtn') {
                item.addEventListener('click', () => {
                    // Remove active class from all items
                    navItems.forEach(navItem => navItem.classList.remove('active'));
                    
                    // Add active class to clicked item
                    item.classList.add('active');
                    
                    // Hide all content sections
                    contentSections.forEach(section => section.classList.remove('active'));
                    
                    // Show corresponding section
                    const sectionId = `${item.getAttribute('data-section')}Section`;
                    document.getElementById(sectionId).classList.add('active');
                });
            }
        });
        
        // Quick action buttons
        document.getElementById('newDeploymentBtn')?.addEventListener('click', () => {
            document.getElementById('addDeploymentBtn').click();
        });
        
        document.getElementById('claimDailyBtn')?.addEventListener('click', () => {
            document.getElementById('claimDailyWalletBtn').click();
        });
        
        document.getElementById('viewReferralsBtn')?.addEventListener('click', () => {
            // Navigate to wallet section
            navItems.forEach(navItem => navItem.classList.remove('active'));
            document.querySelector('[data-section="wallet"]').classList.add('active');
            
            contentSections.forEach(section => section.classList.remove('active'));
            document.getElementById('walletSection').classList.add('active');
        });
        
        // Deployment modal
        const deploymentModal = document.getElementById('deploymentModal');
        const addDeploymentBtn = document.getElementById('addDeploymentBtn');
        const closeModal = document.querySelector('.close-modal');
        
        if (addDeploymentBtn) {
            addDeploymentBtn.addEventListener('click', () => {
                deploymentModal.style.display = 'block';
            });
        }
        
        if (closeModal) {
            closeModal.addEventListener('click', () => {
                deploymentModal.style.display = 'none';
            });
        }
        
        window.addEventListener('click', (e) => {
            if (e.target === deploymentModal) {
                deploymentModal.style.display = 'none';
            }
        });
        
        // Deployment form
        const deploymentForm = document.getElementById('deploymentForm');
        if (deploymentForm) {
            deploymentForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const branchName = document.getElementById('deployBranchName').value;
                const sessionId = document.getElementById('deploySessionId').value;
                const ownerNumber = document.getElementById('deployOwnerNumber').value;
                const prefix = document.getElementById('deployPrefix').value;
                
                const deployBtnText = document.getElementById('deployBtnText');
                const deployBtnSpinner = document.getElementById('deployBtnSpinner');
                
                deployBtnText.textContent = 'Deploying...';
                deployBtnSpinner.style.display = 'inline-block';
                
                try {
                    const response = await fetch('/api/deployments', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-auth-token': token
                        },
                        body: JSON.stringify({
                            branchName,
                            sessionId,
                            ownerNumber,
                            prefix
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (!response.ok) {
                        throw new Error(data.msg || 'Deployment failed');
                    }
                    
                    // Close modal and refresh deployments
                    deploymentModal.style.display = 'none';
                    await loadDeployments();
                    await loadDeploymentsCount();
                    await loadWalletData();
                    
                    // Update coin balance display
                    const user = await fetchUserData();
                    coinBalance.textContent = user.wallet.coins;
                    mobileCoinBalance.textContent = user.wallet.coins;
                    
                    alert('Deployment created successfully!');
                } catch (err) {
                    alert(err.message);
                } finally {
                    deployBtnText.textContent = 'Deploy';
                    deployBtnSpinner.style.display = 'none';
                }
            });
        }
        
        // Claim daily coins
        const claimDailyBtn = document.getElementById('claimDailyWalletBtn');
        if (claimDailyBtn) {
            claimDailyBtn.addEventListener('click', async () => {
                claimDailyBtn.disabled = true;
                claimDailyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Claiming...';
                
                try {
                    const response = await fetch('/api/wallet/claim', {
                        method: 'POST',
                        headers: {
                            'x-auth-token': token
                        }
                    });
                    
                    const data = await response.json();
                    
                    if (!response.ok) {
                        throw new Error(data.msg || 'Claim failed');
                    }
                    
                    // Update wallet display
                    document.getElementById('walletCoins').textContent = data.coins;
                    coinBalance.textContent = data.coins;
                    mobileCoinBalance.textContent = data.coins;
                    
                    // Update next claim time
                    const nextClaim = new Date(new Date(data.lastClaim).getTime() + 24 * 60 * 60 * 1000);
                    document.getElementById('nextClaimTime').textContent = '24 hours';
                    
                    alert('Successfully claimed 5 coins!');
                } catch (err) {
                    alert(err.message);
                } finally {
                    claimDailyBtn.disabled = false;
                    claimDailyBtn.innerHTML = '<i class="fas fa-gift"></i> Claim Daily (5 coins)';
                }
            });
        }
        
        // Copy referral link
        const copyReferralBtn = document.getElementById('copyReferralBtn');
        if (copyReferralBtn) {
            copyReferralBtn.addEventListener('click', () => {
                const referralLink = document.getElementById('referralLink');
                referralLink.select();
                document.execCommand('copy');
                
                // Show copied tooltip
                const tooltip = document.createElement('span');
                tooltip.className = 'tooltip';
                tooltip.textContent = 'Copied!';
                copyReferralBtn.appendChild(tooltip);
                
                setTimeout(() => {
                    tooltip.remove();
                }, 2000);
            });
        }
        
        // Change password form
        const changePasswordForm = document.getElementById('changePasswordForm');
        if (changePasswordForm) {
            changePasswordForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const currentPassword = document.getElementById('currentPassword').value;
                const newPassword = document.getElementById('newPassword').value;
                const confirmPassword = document.getElementById('confirmPassword').value;
                
                if (newPassword !== confirmPassword) {
                    alert('New passwords do not match');
                    return;
                }
                
                const submitBtn = changePasswordForm.querySelector('button');
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
                
                try {
                    const response = await fetch('/api/auth/change-password', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-auth-token': token
                        },
                        body: JSON.stringify({
                            currentPassword,
                            newPassword
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (!response.ok) {
                        throw new Error(data.msg || 'Password change failed');
                    }
                    
                    alert('Password changed successfully!');
                    changePasswordForm.reset();
                } catch (err) {
                    alert(err.message);
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = 'Update Password';
                }
            });
        }
        
        // Delete account button
        const deleteAccountBtn = document.getElementById('deleteAccountBtn');
        if (deleteAccountBtn) {
            deleteAccountBtn.addEventListener('click', async () => {
                if (confirm('Are you sure you want to delete your account? This cannot be undone.')) {
                    deleteAccountBtn.disabled = true;
                    deleteAccountBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
                    
                    try {
                        const response = await fetch('/api/auth/delete-account', {
                            method: 'DELETE',
                            headers: {
                                'x-auth-token': token
                            }
                        });
                        
                        const data = await response.json();
                        
                        if (!response.ok) {
                            throw new Error(data.msg || 'Account deletion failed');
                        }
                        
                        localStorage.removeItem('token');
                        window.location.href = 'login.html';
                    } catch (err) {
                        alert(err.message);
                        deleteAccountBtn.disabled = false;
                        deleteAccountBtn.innerHTML = '<i class="fas fa-trash"></i> Delete Account';
                    }
                }
            });
        }
    }
    
    async function viewDeploymentLogs(deploymentId) {
        alert(`View logs for deployment ${deploymentId}`);
        // Implement log viewing functionality
    }
    
    async function deleteDeployment(deploymentId) {
        if (confirm('Are you sure you want to delete this deployment?')) {
            try {
                const response = await fetch(`/api/deployments/${deploymentId}`, {
                    method: 'DELETE',
                    headers: {
                        'x-auth-token': token
                    }
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.msg || 'Deletion failed');
                }
                
                // Refresh deployments list
                await loadDeployments();
                await loadDeploymentsCount();
                
                alert('Deployment deleted successfully');
            } catch (err) {
                alert(err.message);
            }
        }
    }
});
