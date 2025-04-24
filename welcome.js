document.getElementById('getStartedBtn').addEventListener('click', () => {
    // Check if user is already authenticated
    chrome.storage.local.get(['authToken'], (result) => {
        if (result.authToken) {
            // If already authenticated, go to main page
            window.location.href = 'popup.html';
        } else {
            // If not authenticated, go to auth page
            window.location.href = 'auth.html';
        }
    });
}); 