import { displayCurrentWeather, displayForecastAdvice, displayHourlyForecast, displayDailyForecast, displayCitySuggestions,displayFavorites} from './ui.js';
import { generateForecastAdvice, processDailyForecast } from './forecast.js';
import { API_KEY } from './config.js';



const SearchForm = document.querySelector("#search-form");
const CityInput = document.querySelector("#city-input");
const suggestionsContainer = document.getElementById('suggestions-container');
const saveFavoriteBtn = document.getElementById('save-favorite-btn');
const unitSwitch = document.getElementById('unit-switch');
let currentUnit = localStorage.getItem('weatherAppUnit') || 'metric';
let cityTimezoneOffset = null; // To store the searched city's offset
let clockInterval = null; // To hold our clock's setInterval
let is24HourFormat = localStorage.getItem('weatherAppTimeFormat') === 'true';



function getUnitSymbol() {
    return currentUnit === 'metric' ? '°C' : '°F';
}




async function getWeatherData({ city, coords }) {
    // When we get weather, clear the input and hide suggestions
    CityInput.value = '';
    suggestionsContainer.style.display = 'none';

    try {
        let currentResponse;
        // 1. Determine which API endpoint to use based on input
        if (city) {
            currentResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=${currentUnit}`);
        } else if (coords) {
            currentResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${coords.latitude}&lon=${coords.longitude}&appid=${API_KEY}&units=metric`);
        }

        if (!currentResponse || !currentResponse.ok) {
            throw new Error('City not found');
        }

        // 2. The variable 'currentData' is DECLARED and INITIALIZED here
        const currentData = await currentResponse.json();
        cityTimezoneOffset = currentData.timezone;
        // 3. Now it's SAFE to use 'currentData' to get coordinates and display the weather
        const favorites = getFavorites();
        const isFavorite = favorites.includes(currentData.name);
        displayCurrentWeather(currentData, isFavorite,getUnitSymbol()); // Using currentData here
        
        const { lat, lon } = currentData.coord; // Using currentData here

        // 4. Fetch the forecast data
        const forecastResponse = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${currentUnit}`);
        if (!forecastResponse.ok) {
            throw new Error('Could not fetch forecast');
        }
        const forecastData = await forecastResponse.json();

        // 5. Now it's safe to use forecastData to display the forecasts
        displayHourlyForecast(forecastData.list,getUnitSymbol());
        const dailyData = processDailyForecast(forecastData.list);
        displayDailyForecast(dailyData,getUnitSymbol());
        const advice = generateForecastAdvice(forecastData.list);
        displayForecastAdvice(advice);

    } catch (error) {
        // This is where your error is being caught
        console.error("Error in fetching data:", error);
        alert(error.message);
    }
}

SearchForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const city = CityInput.value;
    if (city) {
        // Correct: Pass an object with the city property
        getWeatherData({ city: city });
    }
});

let debounceTimeout;
function debounce(callback, delay = 500) {
    return (...args) => {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
            callback(...args);
        }, delay);
    };
}

async function getCitySuggestions(query) {
    if (query.length < 3) { // Don't search for less than 3 characters
        suggestionsContainer.style.display = 'none';
        return;
    }
    try {
        const response = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${API_KEY}`);
        if (!response.ok) throw new Error('Failed to fetch suggestions');
        
        const suggestions = await response.json();
        // Pass the suggestions, the callback, and the container to the UI function
        displayCitySuggestions(suggestions, getWeatherData, suggestionsContainer);

    } catch (error) {
        console.error("Suggestion fetch error:", error);
    }
}

CityInput.addEventListener('input', debounce((e) => {
    getCitySuggestions(e.target.value);
}, 250));

function getWeatherForCurrentLocation() {
    // Check if geolocation is supported by the browser
    if (!navigator.geolocation) {
        console.error("Geolocation is not supported by your browser.");
        getWeatherData({ city: "Hyderabad" }); // Fallback to default
        return;
    }

    // This function takes two arguments: a success callback and an error callback
    navigator.geolocation.getCurrentPosition(
        // Success: We got the location!
        (position) => {
            const coords = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            };
            // Call our weather function with the coordinates
            getWeatherData({ coords }); 
        },
        // Error: User denied permission or location could not be found
        (error) => {
            console.error("Could not get user location:", error.message);
            getWeatherData({ city: "Hyderabad" }); // FALLBACK CASE
        }
    );
}

// At the top of main.js, update your imports

// --- LOCALSTORAGE HELPER FUNCTIONS ---
function getFavorites() {
    // Get favorites from localStorage and parse it from a string back to an array
    return JSON.parse(localStorage.getItem('weatherAppFavorites')) || [];
}

function saveFavorites(favorites) {
    // Convert the favorites array to a string and save it in localStorage
    localStorage.setItem('weatherAppFavorites', JSON.stringify(favorites));
}

// --- FAVORITES LOGIC ---
function addFavorite(city) {
    const favorites = getFavorites();
    if (!favorites.includes(city)) {
        favorites.push(city);
        saveFavorites(favorites);
        renderFavorites(); // Re-render the list
    }
    document.getElementById('save-favorite-btn').classList.add('is-favorite');
}

function removeFavorite(city) {
    let favorites = getFavorites();
    favorites = favorites.filter(fav => fav !== city);
    saveFavorites(favorites);
    renderFavorites(); // Re-render the list

    const currentCity = document.getElementById('city-name').textContent;
    if (currentCity === city) {
        // Instantly update the bookmark icon
        document.getElementById('save-favorite-btn').classList.remove('is-favorite');
    }
}

// --- RENDER FUNCTION ---
// A single function to update the favorites UI
function renderFavorites() {
    const favorites = getFavorites();
    // Pass the callbacks to connect UI events back to our main.js logic
    displayFavorites(favorites, getWeatherData, removeFavorite);
}

// --- EVENT LISTENERS ---
// Find the new save button

saveFavoriteBtn.addEventListener('click', () => {
    const currentCity = document.getElementById('city-name').textContent;
    if (!currentCity) return; // Do nothing if there's no city displayed

    const favorites = getFavorites();
    
    // Check if the city is already in the favorites list
    if (favorites.includes(currentCity)) {
        // If it is, remove it
        removeFavorite(currentCity);
    } else {
        // If it's not, add it
        addFavorite(currentCity);
    }
});
unitSwitch.addEventListener('change', () => {
    // Update the current unit based on whether the switch is checked
    currentUnit = unitSwitch.checked ? 'imperial' : 'metric';
    // Save the preference to localStorage
    localStorage.setItem('weatherAppUnit', currentUnit);
    // Re-fetch weather for the currently displayed city to update the values
    const currentCity = document.getElementById('city-name').textContent;
    if (currentCity) {
        getWeatherData({ city: currentCity });
    }
});

unitSwitch.checked = currentUnit === 'imperial';

function startClock() {
    if (clockInterval) clearInterval(clockInterval);

    const localTimezoneName = Intl.DateTimeFormat().resolvedOptions().timeZone;

    clockInterval = setInterval(() => {
        // --- Define time format options based on our state variable ---
        const timeFormatOptions = {
            hour: '2-digit',
            minute: '2-digit',
            hour12: !is24HourFormat // The magic is here: hour12 is true if is24HourFormat is false
        };

        // --- Your Local Time ---
        const localNow = new Date();
        const localTimeStr = localNow.toLocaleTimeString('en-US', timeFormatOptions);
        const localTimezoneAbbr = localNow.toLocaleTimeString('en-US', {timeZoneName: 'short'}).split(' ')[2];
        
        document.getElementById('local-time').textContent = localTimeStr;
        document.getElementById('local-timezone').textContent = `${localTimezoneName} (${localTimezoneAbbr})`;

        // --- Searched City's Time ---
        if (cityTimezoneOffset !== null) {
            const cityNow = new Date(new Date().getTime() + (cityTimezoneOffset * 1000));
            const cityTimeStr = cityNow.toLocaleTimeString('en-US', { ...timeFormatOptions, timeZone: 'UTC' });
            
            const offsetHours = cityTimezoneOffset / 3600;
            const utcOffsetStr = `UTC${offsetHours >= 0 ? '+' : ''}${offsetHours}`;

            document.getElementById('city-time').textContent = cityTimeStr;
            document.getElementById('city-timezone').textContent = utcOffsetStr;
            document.getElementById('city-time-box').style.display = 'flex';
            document.getElementById('city-time-box').style.flexDirection = 'column';
        } else {
            document.getElementById('city-time-box').style.display = 'none';
        }
    }, 1000);
}
const timeFormatBtn = document.getElementById('time-format-btn');
timeFormatBtn.addEventListener('click', () => {
    // Flip the boolean state
    is24HourFormat = !is24HourFormat;
    // Save the new preference to localStorage
    localStorage.setItem('weatherAppTimeFormat', is24HourFormat);
    // The clock will automatically update on its next tick, no extra calls needed!
});

// --- INITIAL LOAD ---
// At the end of your file, after your getWeatherForCurrentLocation() call:
renderFavorites(); // Load and display favorites when the app starts
startClock();



getWeatherForCurrentLocation(); // This will now be the first thing that runs
