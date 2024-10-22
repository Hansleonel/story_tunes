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
                    <button id="play-preview" class="track-button"><i class="fas fa-play"></i> Reproducir Preview</button>
                    <div class="progress-container">
                        <div class="progress-bar"></div>
                    </div>
                    <span id="time-display">0:00 / 0:30</span>
                </div>
            ` : ''}
            <div class="track-controls">
                <a href="${track.external_url}" target="_blank" class="track-button"><i class="fab fa-spotify"></i> Abrir en Spotify</a>
                <button id="generate-story" class="track-button generate-story-button"><i class="fas fa-book"></i> Generar Historia</button>
            </div>
        </div>
        <div id="story-container"></div>
    `;

    const playPreviewButton = document.getElementById('play-preview');
    if (playPreviewButton) {
        let audio = new Audio(track.preview_url);
        let progressBar = document.querySelector('.progress-bar');
        let timeDisplay = document.getElementById('time-display');

        // Función para iniciar la reproducción
        function startPlayback() {
            audio.play().then(() => {
                playPreviewButton.innerHTML = '<i class="fas fa-pause"></i> Pausar Preview';
            }).catch(error => {
                console.log('Autoplay was prevented. User interaction may be required.');
            });
        }

        // Intenta reproducir automáticamente
        startPlayback();

        playPreviewButton.addEventListener('click', () => {
            if (audio.paused) {
                startPlayback();
            } else {
                audio.pause();
                playPreviewButton.innerHTML = '<i class="fas fa-play"></i> Reproducir Preview';
            }
        });

        audio.addEventListener('timeupdate', () => {
            let progress = (audio.currentTime / 30) * 100;
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

    const prompt = `Escribe una historia cautivadora dirigida al público juvenil, centrada en una narrativa romántica, y dividida en cuatro partes principales: Introducción, Desarrollo, Clímax con Giro Sorprendente y Desenlace. Cada parte debe contener cuatro párrafos extensos, sumando un total de dieciséis párrafos para toda la historia. La historia debe tener un final abierto, dejando la posibilidad de continuarla en el futuro. La historia debe estar inspirada en la canción '${track.name}' de ${track.artists.join(', ')}.

    Además, la historia debe incluir:
    - Conversaciones entre personajes: Diálogos significativos que muestren las relaciones y conflictos entre los personajes.
    - Pensamientos internos: Reflexiones y monólogos internos que profundicen en las emociones y motivaciones de los personajes.
    - Recuerdos o flashbacks: Momentos del pasado que aporten contexto y enriquezcan la trama y los personajes.

    Introducción (4 párrafos):
    - Presenta a ${user.name} como protagonista principal, un joven carismático y relatable.
    - Introduce al interés amoroso y dos personajes secundarios importantes.
    - Describe vívidamente el entorno, estableciendo el escenario de la historia de amor.
    - Establece la situación inicial de ${user.name}, sus deseos y aspiraciones.
    - Siembra pistas sobre posibles conflictos o elementos misteriosos en la relación.
    - Incorpora elementos o metáforas relacionadas con la canción '${track.name}' para enriquecer la narrativa.
    - Incluye diálogos iniciales que muestren las interacciones entre los personajes.
    - Muestra pensamientos internos de ${user.name} que revelen sus sentimientos y expectativas.
    - Utiliza recuerdos o flashbacks que aporten contexto al pasado de ${user.name}.

    Desarrollo (4 párrafos):
    - Introduce un conflicto que afecta la relación entre ${user.name} y su interés amoroso.
    - Muestra cómo los personajes secundarios influyen en la trama romántica.
    - Incrementa la tensión y el suspenso a medida que los personajes enfrentan obstáculos.
    - Profundiza en las dinámicas entre los personajes y sus motivaciones.
    - Explora temas como el primer amor, los celos, la confianza y el autodescubrimiento.
    - Continúa utilizando metáforas y referencias musicales de '${track.name}'.
    - Incluye conversaciones y confrontaciones que reflejen el conflicto.
    - Revela pensamientos internos y dudas que los personajes enfrentan.
    - Incorpora recuerdos que expliquen reacciones o decisiones actuales.

    Clímax con Giro Sorprendente (4 párrafos):
    - Revela un giro inesperado que cambia drásticamente la dirección de la historia de amor.
    - Involucra a los personajes secundarios de manera significativa en este giro.
    - Aumenta el impacto emocional y obliga a los protagonistas a replantearse su relación.
    - Intensifica el conflicto interno y externo, dejando al lector en suspenso.
    - Asegúrate de que el giro sea sorprendente pero coherente con los elementos previamente establecidos.
    - Incluye diálogos cargados de emoción que muestren la sorpresa y el dolor.
    - Muestra pensamientos internos contradictorios y la lucha interna de los personajes.
    - Utiliza recuerdos o revelaciones que aporten profundidad al giro.

    Desenlace (4 párrafos):
    - Muestra cómo ${user.name} y los demás personajes afrontan las consecuencias del giro.
    - Resuelve parcialmente el conflicto principal, dejando algunos hilos sueltos.
    - Destaca el crecimiento personal de los personajes y la evolución de su relación.
    - Concluye con un final abierto que deje al lector reflexionando y deseando saber más.
    - Refleja una transformación significativa en los personajes.
    - Incluye diálogos finales que aporten esperanza o nuevas interrogantes.
    - Muestra pensamientos internos de aceptación o determinación.
    - Incorpora metáforas musicales que conecten el final con el tema de la canción '${track.name}'.

    Consideraciones Generales:
    - Utiliza un lenguaje descriptivo y evocador para crear imágenes vívidas.
    - Asegúrate de que la historia fluya naturalmente entre las partes y párrafos.
    - Combina narración, diálogos y pensamientos internos para enriquecer la experiencia del lector.
    - Las conversaciones entre personajes deben ser auténticas y reflejar sus personalidades.
    - Los pensamientos internos deben ofrecer una mirada profunda a sus emociones y conflictos.
    - Los recuerdos o flashbacks deben aportar contexto y enriquecer la trama.
    - Aborda temas como la identidad, las relaciones interpersonales y el crecimiento personal.
    - Explora emociones complejas y situaciones comunes en la juventud.
    - Incorpora elementos o metáforas relacionadas con la música y la canción '${track.name}' a lo largo de la historia.
    - Utiliza la música como símbolo o reflejo de las emociones y situaciones de los personajes.
    - Mantén un tono apropiado para novelas juveniles románticas, combinando romance, drama y un toque de comedia si es adecuado.
    - Asegúrate de que los diálogos y pensamientos internos sean coherentes con la edad y personalidad de los personajes.

    Recuerda que ${user.name} es el protagonista principal y la canción '${track.name}' debe ser un elemento central en la narrativa.`;

    try {
        const response = await fetch('/generate-story', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt }),
        });

        if (!response.ok) {
            throw new Error('Error al generar la historia');
        }

        const data = await response.json();
        const storyHtml = `
            <h3>Una historia de amor inspirada en "${track.name}"</h3>
            ${data.story.split('\n\n').map(paragraph => `<p>${paragraph}</p>`).join('')}
        `;

        // Generar 4 imágenes basadas en la historia
        const imagePrompts = [
            `Una escena romántica que muestra a ${user.name} y su interés amoroso en la introducción de la historia, inspirada en la canción "${track.name}".`,
            `Una imagen que represente el conflicto o desafío principal en el desarrollo de la historia de ${user.name}.`,
            `Una escena dramática que ilustre el giro sorprendente en el clímax de la historia de ${user.name}.`,
            `Una imagen que capture el final abierto y la transformación de los personajes en el desenlace de la historia de ${user.name}.`
        ];

        const imageHtmlPromises = imagePrompts.map(async (prompt, index) => {
            const imageResponse = await fetch('/generate-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt,
                    story: data.story, // Enviamos la historia completa para contexto
                    index // Enviamos el índice para mantener la consistencia
                }),
            });

            if (!imageResponse.ok) {
                throw new Error(`Error al generar la imagen ${index + 1}`);
            }

            const imageData = await imageResponse.json();
            return `<img src="${imageData.imageUrl}" alt="Imagen ${index + 1} de la historia" style="max-width: 100%; margin-top: 20px;">`;
        });

        const imageHtmlArray = await Promise.all(imageHtmlPromises);
        const imageHtml = imageHtmlArray.join('');

        storyContainer.innerHTML = storyHtml + imageHtml;
    } catch (error) {
        console.error('Error:', error);
        storyContainer.innerHTML = '<p>Lo siento, hubo un error al generar la historia o las imágenes. Por favor, intenta de nuevo.</p>';
    }
}