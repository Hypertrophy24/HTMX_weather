const functions = require('firebase-functions');
const fetch = require('node-fetch');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

// Initialize Firebase Admin SDK
admin.initializeApp();

exports.weather = functions.https.onRequest(async (req, res) => {
    cors(req, res, async () => {
        // Set the Access-Control-Allow-Origin header to allow access from the specified origin
        res.set('Access-Control-Allow-Origin', 'https://htmx-weather.web.app');

        const location = req.body.location;
        if (!location) {
            res.status(400).send('Location is required');
            return;
        }

        const apiKey = functions.config().weather.api_key;
        const url = `https://api.weatherstack.com/current?access_key=${apiKey}&query=${location}`;

        try {
            const response = await fetch(url);
            const data = await response.json();
            console.log('Weather data:', data);

            // Store weather data in Firestore
            await admin.firestore().collection('weatherData').add(data);

            const weatherInfo = formatWeatherData(data);
            console.log('Formatted weather info:', weatherInfo);
            res.status(200).send(weatherInfo); // Send the weather data as HTML
        } catch (error) {
            console.error('Error fetching weather data:', error);
            res.status(500).send('Error fetching weather data');
        }
    });
});

function formatWeatherData(data) {
    if (data && data.current) {
        return `
            <h2>Current Weather Information</h2>
            <p>Temperature: ${data.current.temperature}°C</p>
            <p>Weather: ${data.current.weather_descriptions[0]}</p>
            <p>Feels Like: ${data.current.feelslike}°C</p>
        `;
    } else {
        return '<p>Error: Invalid weather data received</p>';
    }
}
