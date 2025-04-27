// Check authentication status
async function checkAuth() {
    const { authToken, userEmail } = await chrome?.storage?.local?.get(['authToken', 'userEmail']);
    if (!authToken) {
        window.location.href = 'auth.html';
        return;
    }
    document.getElementById('user-email').textContent = userEmail;
}

// Logout function
async function logout() {
    await chrome.storage.local.remove(['authToken', 'userEmail']);
    window.location.href = 'auth.html';
}

const websiteInput = document.getElementById("websiteInput");
const addBtn = document.getElementById("addBtn");
const blockedList = document.getElementById("blockedList");
const logoutBtn = document.getElementById("logoutBtn");
const passwordModal = document.getElementById("passwordModal");
const passwordInput = document.getElementById("passwordInput");
const verifyBtn = document.getElementById("verifyBtn");
const cancelBtn = document.getElementById("cancelBtn");
const messageDisplay = document.getElementById("messageDisplay");

// Maximum number of sites that can be blocked
const MAX_BLOCKED_SITES = 100;

let pendingWebsite = null;
let pendingAction = null; // 'add' or 'remove'

function sanitizeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function renderList(blockedSites) {
    blockedList.innerHTML = "";
    blockedSites.forEach(site => {
        const li = document.createElement("li");
        li.textContent = sanitizeHTML(site);
        const remove = document.createElement("span");
        remove.textContent = "X";
        remove.className = "remove";
        remove.onclick = () => removeWebsite(site);
        li.appendChild(remove);
        blockedList.appendChild(li);
    });
}

async function loadBlockedSites() {
    try {
        const { blockedSites = [] } = await chrome.storage.local.get("blockedSites");
        renderList(blockedSites);
    } catch (error) {
        console.error('Error loading blocked sites:', error);
    }
}

function showMessage(message, type = 'error') {
    messageDisplay.textContent = message;
    messageDisplay.className = `message-display ${type}`;
    messageDisplay.style.display = 'block';
    
    // Hide the message after 3 seconds
    setTimeout(() => {
        messageDisplay.style.display = 'none';
    }, 3000);
}

async function showPasswordModal(website, action) {
    pendingWebsite = website;
    pendingAction = action;
    passwordModal.style.display = 'flex';
    passwordInput.value = '';
    passwordInput.focus();
}

async function verifyPassword() {
    try {
        const password = passwordInput.value.trim();
        if (!password) return;
        const { userEmail } = await chrome.storage.local.get(['userEmail']);
        
        // Call the login API to verify the password
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: userEmail,
                password: password
            })
        });
        if (response.ok) {
            const data = await response.json();
            if (data.token) {
                // Update the stored authToken
                await chrome.storage.local.set({ authToken: data.token });
                passwordModal.style.display = 'none';
                
                if (pendingWebsite) {
                    if (pendingAction === 'add') {
                        await addWebsiteToStorage(pendingWebsite);
                        showMessage('Website added successfully!', 'success');
                    } else if (pendingAction === 'remove') {
                        await removeWebsiteFromStorage(pendingWebsite);
                        showMessage('Website removed successfully!', 'success');
                    }
                    pendingWebsite = null;
                    pendingAction = null;
                }
            } else {
                showMessage('Invalid response from server');
            }
        } else {
            showMessage('Incorrect password');
        }
    } catch (error) {
        console.error('Error verifying password:', error);
        showMessage('An error occurred while verifying password');
    }
}

async function addWebsiteToStorage(newSite) {
    try {
        const { blockedSites = [] } = await chrome.storage.local.get("blockedSites");
        
        // Check if we've reached the maximum number of blocked sites
        if (blockedSites.length >= MAX_BLOCKED_SITES) {
            showMessage('Maximum number of blocked sites reached. Please remove some sites before adding new ones.');
            return;
        }

        // Check for duplicate sites
        if (!blockedSites.includes(newSite)) {
            blockedSites.push(newSite);
            await chrome.storage.local.set({ blockedSites });
            websiteInput.value = "";
            loadBlockedSites();
        } else {
            showMessage('This website is already in your blocked list');
        }
    } catch (error) {
        console.error('Error adding website:', error);
        showMessage('An error occurred while adding the website');
    }
}

async function addWebsite() {
    try {
        const newSite = websiteInput.value.trim();
        if (!newSite) return;

        // Show password modal instead of adding directly
        await showPasswordModal(newSite, 'add');
    } catch (error) {
        console.error('Error adding website:', error);
        showMessage('An error occurred while adding the website');
    }
}

async function removeWebsite(site) {
    try {
        // Show password modal before removing
        await showPasswordModal(site, 'remove');
    } catch (error) {
        console.error('Error removing website:', error);
        showMessage('An error occurred while removing the website');
    }
}

async function removeWebsiteFromStorage(site) {
    try {
        const { blockedSites = [] } = await chrome.storage.local.get("blockedSites");
        const updated = blockedSites.filter(s => s !== site);
        await chrome.storage.local.set({ blockedSites: updated });
        loadBlockedSites();
    } catch (error) {
        console.error('Error removing website from storage:', error);
        showMessage('An error occurred while removing the website');
    }
}

// Add input validation
websiteInput.addEventListener('input', (e) => {
    // Basic URL validation
    const url = e.target.value.trim();
    if (url && !url.match(/^https?:\/\/.+\..+$/)) {
        websiteInput.setCustomValidity('Please enter a valid URL starting with http:// or https://');
    } else {
        websiteInput.setCustomValidity('');
    }
});

// Initialize
checkAuth();
addBtn.onclick = addWebsite;
logoutBtn.onclick = logout;
verifyBtn.onclick = verifyPassword;
cancelBtn.onclick = () => {
    passwordModal.style.display = 'none';
    pendingWebsite = null;
    pendingAction = null;
};
loadBlockedSites();
