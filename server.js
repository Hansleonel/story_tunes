const express = require('express');
const dotenv = require('dotenv');
const axios = require('axios');
const cors = require('cors');
const { OpenAI } = require('openai');

dotenv.config();
console.log('Environment variables loaded');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Spotify API credentials
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:3000/callback';

console.log('Spotify credentials loaded:', { CLIENT_ID, REDIRECT_URI });

// Routes
app.get('/login', (req, res) => {
    console.log('Login route accessed');
    const scope = 'user-read-private user-read-email user-top-read';
    const authUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${CLIENT_ID}&scope=${encodeURIComponent(scope)}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
    console.log('Redirecting to Spotify auth URL:', authUrl);
    res.redirect(authUrl);
});

app.get('/callback', async (req, res) => {
    console.log('Callback route accessed');
    const code = req.query.code;
    console.log('Received authorization code:', code);

    try {
        console.log('Attempting to exchange code for access token');
        const tokenResponse = await axios.post('https://accounts.spotify.com/api/token', null, {
            params: {
                grant_type: 'authorization_code',
                code,
                redirect_uri: REDIRECT_URI,
            },
            headers: {
                'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'),
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        const { access_token } = tokenResponse.data;
        console.log('Access token received');

        // Redirect to the frontend with the access token
        const redirectUrl = `/?access_token=${access_token}`;
        console.log('Redirecting to frontend:', redirectUrl);
        res.redirect(redirectUrl);
    } catch (error) {
        console.error('Error getting access token:', error.response ? error.response.data : error.message);
        res.status(500).send('Error getting access token');
    }
});

app.get('/user-info', async (req, res) => {
    console.log('User info route accessed');
    const { access_token } = req.query;
    console.log('Received access token:', access_token);

    try {
        console.log('Fetching user profile');
        const userResponse = await axios.get('https://api.spotify.com/v1/me', {
            headers: { 'Authorization': `Bearer ${access_token}` },
        });
        console.log('User profile fetched');

        console.log('Fetching top tracks');
        const topTracksResponse = await axios.get('https://api.spotify.com/v1/me/top/tracks?limit=50', {
            headers: { 'Authorization': `Bearer ${access_token}` },
        });
        console.log('Top tracks fetched');

        // Imprimir todas las propiedades de las canciones en la consola
        console.log('Todas las propiedades de las canciones:');
        topTracksResponse.data.items.forEach((track, index) => {
            if (index === 0) {
                console.log(`Canción ${index + 1}:`);
                console.log(JSON.stringify(track, null, 2));
            }
        });

        const responseData = {
            user: userResponse.data,
            topTracks: topTracksResponse.data.items.map(track => ({
                id: track.id,  // Añadimos el ID de la canción
                name: track.name,
                artists: track.artists.map(artist => artist.name),
                image: track.album.images[0]?.url,
                album: track.album.name,
                duration_ms: track.duration_ms
            })),
        };
        console.log('Sending response to frontend');
        res.json(responseData);
    } catch (error) {
        console.error('Error fetching user data:', error.response ? error.response.data : error.message);
        res.status(500).send('Error fetching user data');
    }
});

app.get('/track/:id', async (req, res) => {
    console.log('Track info route accessed');
    const { id } = req.params;
    const { access_token } = req.query;
    console.log(`Fetching track data for ID: ${id}`);

    try {
        console.log('Fetching track and user data');
        const [trackResponse, userResponse] = await Promise.all([
            axios.get(`https://api.spotify.com/v1/tracks/${id}`, {
                headers: { 'Authorization': `Bearer ${access_token}` },
            }),
            axios.get('https://api.spotify.com/v1/me', {
                headers: { 'Authorization': `Bearer ${access_token}` },
            })
        ]);

        const trackData = trackResponse.data;
        const userData = userResponse.data;
        console.log('Track and user data fetched successfully');

        const responseData = {
            track: {
                id: trackData.id,
                name: trackData.name,
                artists: trackData.artists.map(artist => artist.name),
                album: trackData.album.name,
                image: trackData.album.images[0]?.url,
                preview_url: trackData.preview_url,
                external_url: trackData.external_urls.spotify
            },
            user: {
                name: userData.display_name,
                email: userData.email
            }
        };
        console.log('Sending track and user data to frontend');
        res.json(responseData);
    } catch (error) {
        console.error('Error fetching track data:', error.response ? error.response.data : error.message);
        res.status(500).send('Error fetching track data');
    }
});

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

app.post('/generate-story', async (req, res) => {
    console.log('Story generation route accessed');
    try {
        const { prompt, trackInfo } = req.body;
        console.log('Received prompt for story generation');

        // Sistema de prompt mejorado para GPT-4
        const messages = [
            {
                role: "system",
                content: `Eres un gran escritor creativo con el tono de Mario Vargas Llosa y que crea historias narrativas cautivadoras. 
                Debes crear un capitulo de la novela ‘Travesuras de la niña mala’ que:
                - Tenga aproximadamente 5 párrafos con como maximo 4000 caracteres
                - Incorporen elementos de la canción de forma sutil y creativa
                - Sean emocionalmente resonantes
                No menciones explícitamente que la historia está basada en una canción.`
            },
            {
                role: "user",
                content: `Genera una historia que mencione esta canción:
                Título: ${trackInfo.name}
                Artista: ${trackInfo.artists.join(', ')}
                Contexto: ${prompt}`
            }
        ];

        console.log('Sending request to OpenAI API');
        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: messages,
            max_tokens: 7000,
            temperature: 0.8, // Aumentamos la creatividad
            presence_penalty: 0.6, // Favorece la variación en el contenido
            frequency_penalty: 0.3, // Reduce repeticiones
        });

        console.log('Received response from OpenAI API');
        const story = completion.choices[0].message.content;

        // Validación de la respuesta
        if (!story || story.length < 1000) {
            throw new Error('La historia generada es demasiado corta');
        }

        console.log('Story generated successfully');
        res.json({
            story,
            usage: completion.usage // Para monitoreo de tokens
        });
    } catch (error) {
        console.error('Error generating story:', error);

        // Manejo de errores más específico
        if (error.response?.status === 429) {
            res.status(429).json({ error: 'Demasiadas solicitudes. Por favor, intenta más tarde.' });
        } else {
            res.status(500).json({
                error: 'Error al generar la historia',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
});

app.post('/generate-image', async (req, res) => {
    console.log('Image generation route accessed');
    try {
        const { prompt, story, index } = req.body;
        console.log(`Received prompt for image generation ${index + 1}`);

        // Crear un prompt más detallado usando la historia y el índice
        const detailedPrompt = `
            Basado en la siguiente historia: "${story.substring(0, 500)}..."
            
            Genera una imagen para la parte ${index + 1} de 4 de la historia.
            Descripción específica: ${prompt}
            
            Asegúrate de mantener la consistencia con las imágenes anteriores en términos de estilo y apariencia de los personajes.
            La imagen debe ser coherente con el tono y la atmósfera de la historia.
        `;

        console.log('Sending request to OpenAI API for image generation');
        const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: detailedPrompt,
            n: 1,
            size: "1024x1024",
            style: "vivid", // Usar el estilo "vivid" para imágenes más detalladas y coloridas
        });
        console.log(`Image ${index + 1} generated successfully`);

        const imageUrl = response.data[0].url;
        res.json({ imageUrl });
    } catch (error) {
        console.error('Error generating image:', error);
        res.status(500).json({ error: 'Error al generar la imagen' });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});