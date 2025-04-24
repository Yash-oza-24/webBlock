// API endpoint for authentication
const API_URL = 'https://your-auth-server.com/api';

// DOM elements
const authForm = document.getElementById('auth-form');
const formTitle = document.getElementById('form-title');
const formSubtitle = document.getElementById('form-subtitle');
const submitBtn = document.getElementById('submit-btn');
const switchFormLink = document.getElementById('switch-form');
const switchFormText = document.getElementById('switch-form-text');
const confirmPasswordGroup = document.getElementById('confirm-password-group');
const errorMessage = document.getElementById('error-message');
const passwordRequirements = document.getElementById('passwordRequirements');
const togglePassword = document.getElementById('togglePassword');
const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');

let isSignUp = false;

// Toggle password visibility
function togglePasswordVisibility(input, button) {
    const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
    input.setAttribute('type', type);
    button.textContent = type === 'password' ? '👁️' : '🔒';
}

togglePassword.addEventListener('click', () => {
    togglePasswordVisibility(document.getElementById('password'), togglePassword);
});

toggleConfirmPassword.addEventListener('click', () => {
    togglePasswordVisibility(document.getElementById('confirm-password'), toggleConfirmPassword);
});

// Toggle between sign in and sign up forms
switchFormLink.addEventListener('click', (e) => {
    e.preventDefault();
    isSignUp = !isSignUp;
    
    if (isSignUp) {
        formTitle.textContent = 'Create Account';
        formSubtitle.textContent = 'Join us to start blocking distracting websites';
        submitBtn.textContent = 'Sign Up';
        switchFormText.textContent = 'Already have an account?';
        switchFormLink.textContent = 'Sign In';
        confirmPasswordGroup.style.display = 'block';
        passwordRequirements.style.display = 'block';
    } else {
        formTitle.textContent = 'Sign In';
        formSubtitle.textContent = 'Welcome back! Please enter your details';
        submitBtn.textContent = 'Sign In';
        switchFormText.textContent = 'Don\'t have an account?';
        switchFormLink.textContent = 'Create an account';
        confirmPasswordGroup.style.display = 'none';
        passwordRequirements.style.display = 'none';
    }
});

// Handle form submission
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    // Validate inputs
    if (isSignUp && password !== confirmPassword) {
        showError('Passwords do not match');
        return;
    }
    
    if (password.length < 8) {
        showError('Password must be at least 8 characters long');
        return;
    }
    
    try {
        const endpoint = isSignUp ? '/register' : '/login';
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Store the authentication token
            await chrome.storage.local.set({
                authToken: data.token,
                userEmail: email
            });
            
            // Redirect to the main extension page
            window.location.href = 'popup.html';
        } else {
            showError(data.message || 'Authentication failed');
        }
    } catch (error) {
        showError('An error occurred. Please try again.');
        console.error('Authentication error:', error);
    }
});

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

// Check if user is already authenticated
async function checkAuth() {
    const { authToken } = await chrome.storage.local.get('authToken');
    if (authToken) {
        window.location.href = 'popup.html';
    }
}

// Check authentication status when the page loads
checkAuth(); 