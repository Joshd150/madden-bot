/**
 * VFL Manager Admin Login JavaScript
 * 
 * Handles the authentication flow for the admin portal. This provides a smooth,
 * user-friendly login experience with proper error handling and feedback.
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔐 VFL Manager Admin Login initialized');
    
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('error-message');
    const submitButton = loginForm.querySelector('button[type="submit"]');

    // Handle form submission
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Show loading state
        setLoadingState(true);
        hideError();
        
        // Get form data
        const formData = new FormData(loginForm);
        const email = formData.get('email');
        const password = formData.get('password');

        try {
            console.log('🔄 Attempting login...');
            
            const response = await fetch('/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                console.log('✅ Login successful, redirecting...');
                
                // Show success state briefly before redirect
                submitButton.innerHTML = '✅ Success! Redirecting...';
                submitButton.style.backgroundColor = 'var(--admin-success)';
                
                // Redirect after a short delay for better UX
                setTimeout(() => {
                    window.location.href = data.redirect;
                }, 1000);
                
            } else {
                console.log('❌ Login failed:', data.error);
                showError(data.error || 'Login failed. Please check your credentials.');
                setLoadingState(false);
            }
            
        } catch (error) {
            console.error('❌ Network error during login:', error);
            showError('Network error. Please check your connection and try again.');
            setLoadingState(false);
        }
    });

    /**
     * Show loading state on the submit button
     */
    function setLoadingState(loading) {
        if (loading) {
            submitButton.innerHTML = '🔄 Signing In...';
            submitButton.disabled = true;
            submitButton.style.opacity = '0.7';
        } else {
            submitButton.innerHTML = 'Sign In to Admin Portal';
            submitButton.disabled = false;
            submitButton.style.opacity = '1';
            submitButton.style.backgroundColor = 'var(--admin-primary)';
        }
    }

    /**
     * Show error message with animation
     */
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.add('show');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            hideError();
        }, 5000);
    }

    /**
     * Hide error message
     */
    function hideError() {
        errorMessage.classList.remove('show');
    }

    // Add some nice input focus effects
    const inputs = loginForm.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.style.transform = 'translateY(-2px)';
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.style.transform = 'translateY(0)';
        });
    });

    // Add keyboard shortcut for quick login (Enter key)
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !submitButton.disabled) {
            loginForm.dispatchEvent(new Event('submit'));
        }
    });
});