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

// Maximum number of sites that can be blocked
const MAX_BLOCKED_SITES = 100;

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

async function addWebsite() {
    try {
        const newSite = websiteInput.value.trim();
        if (!newSite) return;

        const { blockedSites = [] } = await chrome.storage.local.get("blockedSites");
        
        // Check if we've reached the maximum number of blocked sites
        if (blockedSites.length >= MAX_BLOCKED_SITES) {
            alert('Maximum number of blocked sites reached. Please remove some sites before adding new ones.');
            return;
        }

        // Check for duplicate sites
        if (!blockedSites.includes(newSite)) {
            blockedSites.push(newSite);
            await chrome.storage.local.set({ blockedSites });
            websiteInput.value = "";
            loadBlockedSites();
        }
    } catch (error) {
        console.error('Error adding website:', error);
    }
}

async function removeWebsite(site) {
    try {
        const { blockedSites = [] } = await chrome.storage.local.get("blockedSites");
        const updated = blockedSites.filter(s => s !== site);
        await chrome.storage.local.set({ blockedSites: updated });
        loadBlockedSites();
    } catch (error) {
        console.error('Error removing website:', error);
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
loadBlockedSites();
