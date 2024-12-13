document.addEventListener('DOMContentLoaded', () => {
    const loginButton = document.getElementById('login-button');
    const themeToggle = document.getElementById('theme-toggle');

    if (loginButton) {
        loginButton.addEventListener('click', () => {
            console.log('Login button clicked');
            window.location.href = '/login';
        });
    } else {
        console.log('Login button not found');
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            themeToggle.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
        });

        function setInitialTheme() {
            if (document.body.classList.contains('dark-mode')) {
                themeToggle.textContent = '☀️';
            } else {
                themeToggle.textContent = '🌙';
            }
        }

        setInitialTheme();
    } else {
        console.log('Theme toggle button not found');
    }

    // Check if we're redirected back from Spotify
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('access_token');

    if (accessToken) {
        // Redirect to gallery page with the access token
        console.log('Access token found, redirecting to gallery');
        window.location.href = `/gallery.html?access_token=${accessToken}`;
    } else {
        console.log('No access token found');
    }
});
