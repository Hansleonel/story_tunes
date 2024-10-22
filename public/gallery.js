document.addEventListener('DOMContentLoaded', () => {
    const userInfo = document.getElementById('user-info');
    const userName = document.getElementById('user-name');
    const userEmail = document.getElementById('user-email');
    const topTracks = document.getElementById('top-tracks');
    const themeToggle = document.getElementById('theme-toggle');
    const loadingOverlay = document.getElementById('loading-overlay');
    const loadingText = document.getElementById('loading-text');

    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        themeToggle.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
    });

    function setInitialTheme() {
        document.body.classList.add('dark-mode');
        themeToggle.textContent = '☀️';
    }

    setInitialTheme();

    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('access_token');

    if (accessToken) {
        console.log('Access token found:', accessToken);
        showLoading('Cargando tus datos...');

        console.log('Fetching user info from server');
        fetch(`/user-info?access_token=${accessToken}`)
            .then(response => {
                console.log('Response received from server');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('User data received:', data);
                displayUserInfo(data);
                hideLoading(); // Ocultar el loading después de mostrar la información
            })
            .catch(error => {
                console.error('Error fetching user data:', error);
                userInfo.textContent = 'Error loading user data. Please try again.';
                hideLoading(); // Ocultar el loading en caso de error
            });
    } else {
        console.log('No access token found');
        window.location.href = '/'; // Redirect to home if no access token
    }

    function displayUserInfo(data) {
        userName.textContent = `Name: ${data.user.display_name}`;
        userEmail.textContent = `Email: ${data.user.email}`;

        console.log('Rendering top tracks');
        topTracks.innerHTML = ''; // Clear existing content
        data.topTracks.forEach((track, index) => {
            const bookElement = document.createElement('div');
            bookElement.className = 'book';
            bookElement.innerHTML = `
                <div class="book-cover">
                    <div class="book-front" style="background-image: url('${track.image}');"></div>
                    <div class="book-back"></div>
                    <div class="book-spine"></div>
                </div>
                <div class="book-info">
                    <p>${track.name}</p>
                    <p>${track.artists.join(', ')}</p>
                    <button class="generate-story" data-track-id="${track.id}">Generar historia</button>
                </div>
            `;
            topTracks.appendChild(bookElement);
        });
        console.log('Top tracks rendered');

        // Add event listeners to the "Generar historia" buttons
        document.querySelectorAll('.generate-story').forEach(button => {
            button.addEventListener('click', function () {
                const trackId = this.getAttribute('data-track-id');
                generateStory(trackId);
            });
        });
    }

    function generateStory(trackId) {
        console.log(`Redirigiendo a la página de la canción con ID: ${trackId}`);
        window.location.href = `/track.html?id=${trackId}&access_token=${accessToken}`;
    }

    function showLoading(message) {
        loadingText.textContent = message;
        loadingOverlay.style.display = 'flex';
    }

    function hideLoading() {
        loadingOverlay.style.display = 'none';
    }

    async function loadUserInfo() {
        showLoading('Cargando tus datos...');
        // ... código para cargar la información del usuario ...
        hideLoading();
    }

    async function loadTopTracks() {
        showLoading('Cargando tus canciones más escuchadas...');
        // ... código para cargar las canciones más escuchadas ...
        hideLoading();
    }
});
