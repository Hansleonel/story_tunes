document.addEventListener('DOMContentLoaded', () => {
    const trackInfo = document.getElementById('track-info');
    const themeToggle = document.getElementById('theme-toggle');

    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        themeToggle.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
    });

    const urlParams = new URLSearchParams(window.location.search);
    const trackId = urlParams.get('id');
    const accessToken = urlParams.get('access_token');

    if (trackId && accessToken) {
        fetch(`/track/${trackId}?access_token=${accessToken}`)
            .then(response => response.json())
            .then(data => {
                displayTrackInfo(data.track, data.user);
            })
            .catch(error => {
                console.error('Error fetching track data:', error);
                trackInfo.textContent = 'Error loading track data. Please try again.';
            });
    } else {
        trackInfo.textContent = 'Invalid track ID or access token.';
    }
});

function displayTrackInfo(track, user) {
    const trackInfo = document.getElementById('track-info');
    trackInfo.innerHTML = `
        <div class="track-container">
            <img src="${track.image}" alt="${track.name}" class="track-image">
            <div class="track-details">
                <h2 class="track-name">${track.name}</h2>
                <p class="track-artists">${track.artists.join(', ')}</p>
                <p class="track-album">${track.album}</p>
            </div>
            ${track.preview_url ? `
                <div class="preview-container">
                    <button id="play-preview" class="track-button">
                        <i class="fas fa-play"></i> Reproducir Preview
                    </button>
                    <div class="progress-container">
                        <div class="progress-bar"></div>
                    </div>
                    <span id="time-display">0:00 / 0:30</span>
                </div>
            ` : `
                <div id="embed-iframe"></div>
            `}
            <div class="track-controls">
                <a href="${track.external_url}" target="_blank" class="track-button">
                    <i class="fab fa-spotify"></i> Abrir en Spotify
                </a>
                <button id="generate-story" class="track-button generate-story-button">
                    <i class="fas fa-book"></i> Generar Historia
                </button>
            </div>
        </div>
        <div id="story-container"></div>
    `;

    // Si no hay preview_url, usar el Embed de Spotify
    if (!track.preview_url) {
        window.onSpotifyIframeApiReady = (IFrameAPI) => {
            const element = document.getElementById('embed-iframe');
            const options = {
                width: '100%',
                height: '152',
                uri: `spotify:track:${track.id}`
            };
            IFrameAPI.createController(element, options, (EmbedController) => {
                console.log('Spotify Embed ready');
            });
        };
    } else {
        // Usar el reproductor de preview
        const playPreviewButton = document.getElementById('play-preview');
        const audio = new Audio(track.preview_url);
        const progressBar = document.querySelector('.progress-bar');
        const timeDisplay = document.getElementById('time-display');

        playPreviewButton.addEventListener('click', () => {
            if (audio.paused) {
                audio.play();
                playPreviewButton.innerHTML = '<i class="fas fa-pause"></i> Pausar Preview';
            } else {
                audio.pause();
                playPreviewButton.innerHTML = '<i class="fas fa-play"></i> Reproducir Preview';
            }
        });

        audio.addEventListener('timeupdate', () => {
            const progress = (audio.currentTime / 30) * 100;
            progressBar.style.width = `${progress}%`;
            timeDisplay.textContent = `${formatTime(audio.currentTime)} / 0:30`;
        });

        audio.addEventListener('ended', () => {
            playPreviewButton.innerHTML = '<i class="fas fa-play"></i> Reproducir Preview';
            progressBar.style.width = '0%';
            timeDisplay.textContent = '0:00 / 0:30';
        });
    }

    const generateStoryButton = document.getElementById('generate-story');
    generateStoryButton.addEventListener('click', () => {
        generateStory(track, user);
    });
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}

async function generateStory(track, user) {
    const storyContainer = document.getElementById('story-container');
    storyContainer.innerHTML = '<p>Generando historia...</p>';

    const prompt = `A continuación, escribe un capítulo de la novela ‘Travesuras de la niña mala’ que mantenga el estilo, con un tono nostálgico y melancólico por alguién si es protagonista es hombre ese alguien tiene que ser mujer y si es protagonista es mujer ese alguien tiene que ser hombre y el contexto puede ser actual es decir en estos años de la novela de Mario Vargas Llosa. 
    El capítulo debe estar influenciado por el ambiente, ritmo y sensaciones propias del género,
    el o la protagonista debe de llamarse ${user.name}, en lo posible el protagonista debe de tener como maximo 25 años, el capitulo debe de ser de 5 párrafos grandes por lo menos 3000 caracteres`;

    try {
        const response = await fetch('/generate-story', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt, trackInfo: track }),
        });

        if (!response.ok) {
            throw new Error('Error al generar la historia');
        }

        const data = await response.json();

        // Dividir la historia en 4 partes
        const storyParts = data.story.split('\n\n').filter(part => part.trim() !== '');
        const numParts = Math.min(storyParts.length, 4);

        const imagePrompts = [];
        for (let i = 0; i < numParts; i++) {
            const partIndex = Math.floor(i * storyParts.length / numParts);
            imagePrompts.push(`Ilustración manga en blanco y negro de la siguiente escena: ${storyParts[partIndex]}. Estilo: manga detallado, tinta negra sobre papel blanco, sombreado con tramas.`);
        }

        // Rellenar con prompts genéricos si no hay suficientes partes en la historia
        while (imagePrompts.length < 4) {
            imagePrompts.push(`Ilustración manga en blanco y negro de una escena de la historia de ${user.name} inspirada en la canción "${track.name}". Estilo: manga detallado, tinta negra sobre papel blanco, sombreado con tramas.`);
        }

        const storyHtml = `
            <h3>Una historia inspirada en "${track.name}"</h3>
            ${data.story.split('\n\n').map(paragraph => `<p>${paragraph}</p>`).join('')}
        `;

        // Mostrar la historia inmediatamente
        storyContainer.innerHTML = storyHtml;

        // Generar 4 imágenes basadas en la historia
        const imageHtmlPromises = imagePrompts.map(async (prompt, index) => {
            try {
                const imageResponse = await fetch('/generate-image', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        prompt,
                        story: data.story,
                        index
                    }),
                });

                if (!imageResponse.ok) {
                    throw new Error(`Error al generar la imagen ${index + 1}`);
                }

                const imageData = await imageResponse.json();
                return `<img src="${imageData.imageUrl}" alt="Imagen ${index + 1} de la historia" style="max-width: 100%; margin-top: 20px;">`;
            } catch (error) {
                console.error(`Error al generar la imagen ${index + 1}:`, error);
                return `<p>No se pudo generar la imagen ${index + 1}.</p>`;
            }
        });

        // Esperar a que todas las promesas de imágenes se resuelvan
        const imageHtmlArray = await Promise.all(imageHtmlPromises);
        const imageHtml = imageHtmlArray.join('');

        // Añadir las imágenes (o mensajes de error) al final de la historia
        storyContainer.innerHTML += imageHtml;

    } catch (error) {
        console.error('Error al generar la historia:', error);
        storyContainer.innerHTML = '<p>Lo siento, hubo un error al generar la historia. Por favor, intenta de nuevo.</p>';
    }
}
