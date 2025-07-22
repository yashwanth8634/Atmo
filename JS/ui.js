export function displayCurrentWeather(data,isFavorite,unitSymbol) {
    //DOM SELECTIONS AND VARIABLES
    const cityNameElement = document.getElementById('city-name');
    const temperatureElement = document.getElementById('temperature');
    const descriptionElement = document.getElementById('description');
    const weatherIconElement = document.getElementById('weather-icon'); 
    const saveFavoriteBtn = document.getElementById('save-favorite-btn');


    //Creted Variables for data from api
    const cityName = data.name;
    const tempInCelsius = data.main.temp;
    const weatherDescription = data.weather[0].description;
    const weatherIconCode = data.weather[0].icon;

    //Updating HTML
    cityNameElement.textContent = cityName;
    temperatureElement.textContent = `${tempInCelsius}°C`;
    descriptionElement.textContent = weatherDescription;
    weatherIconElement.src = `https://openweathermap.org/img/wn/${weatherIconCode}@2x.png`;
    temperatureElement.textContent = `${Math.round(data.main.temp)}${unitSymbol}`;


    const weatherCondition = data.weather[0].main; // e.g., "Clear", "Clouds", "Rain"
    document.body.className = ''; // Reset classes
    document.body.classList.add(`weather-bg-${weatherCondition.toLowerCase()}`);

    if (isFavorite) {
        saveFavoriteBtn.classList.add('is-favorite');
    } else {
        saveFavoriteBtn.classList.remove('is-favorite');
    }
};


export function displayForecastAdvice(advice) {
    const adviceElement = document.getElementById('forecast-advice');
    adviceElement.textContent = advice;
}

// --- ADD THIS FUNCTION FOR THE HOURLY FORECAST ---
export function displayHourlyForecast(hourlyData) {
    const hourlyContainer = document.getElementById('hourly-forecast');
    hourlyContainer.innerHTML = ''; // Clear previous content

    const next24Hours = hourlyData.slice(0, 8); // Get the next 8 3-hour blocks (24 hours)

    for (const hour of next24Hours) {
        const time = new Date(hour.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const icon = hour.weather[0].icon;
        const temp = Math.round(hour.main.temp);

        const hourCard = `
            <div class="forecast-card">
                <p>${time}</p>
                <img src="https://openweathermap.org/img/wn/${icon}.png" alt="weather icon">
                <p>${temp}°C</p>
            </div>
        `;
        hourlyContainer.innerHTML += hourCard;
    }
}

// --- ADD THIS FUNCTION FOR THE DAILY FORECAST ---
// (Note: We'll create the processDailyForecast function in the next step)
export function displayDailyForecast(dailyData) {
    const dailyContainer = document.getElementById('daily-forecast');
    dailyContainer.innerHTML = '';

    // The 'dailyData' will be an array processed by our logic
    for (const day of dailyData) {
        const dayCard = `
            <div class="forecast-card">
                <p>${day.dayName}</p>
                <img src="https://openweathermap.org/img/wn/${day.icon}.png" alt="weather icon">
                <p>${day.temp}°C</p>
            </div>
        `;
        dailyContainer.innerHTML += dayCard;
    }
}


// Add this new function to ui.js
// It will be responsible for both showing the suggestions and making them clickable
export function displayCitySuggestions(suggestions, getWeatherDataCallback, suggestionsContainer) {
    suggestionsContainer.innerHTML = ''; // Clear old suggestions

    if (suggestions.length === 0) {
        suggestionsContainer.style.display = 'none';
        return;
    }

    suggestionsContainer.style.display = 'block';
    
    suggestions.forEach(city => {
        const suggestionItem = document.createElement('div');
        suggestionItem.classList.add('suggestion-item');
        // Display name, state (if available), and country
        suggestionItem.textContent = `${city.name}${city.state ? ', ' + city.state : ''}, ${city.country}`;
        
        suggestionItem.addEventListener('click', () => {
            // When a suggestion is clicked, call the weather fetch function
            getWeatherDataCallback({ city: city.name });
            suggestionsContainer.innerHTML = ''; // Hide suggestions
            suggestionsContainer.style.display = 'none';
        });
        
        suggestionsContainer.appendChild(suggestionItem);
    });
}


// Add this function to ui.js
export function displayFavorites(favorites, weatherCallback, removeCallback) {
    const favoritesList = document.getElementById('favorites-list');
    favoritesList.innerHTML = '';

    if (favorites.length === 0) {
        favoritesList.innerHTML = '<p>No favorites saved yet.</p>';
        return;
    }

    favorites.forEach(city => {
        const favItem = document.createElement('div');
        favItem.classList.add('favorite-item');

        const cityName = document.createElement('span');
        cityName.textContent = city;
        cityName.addEventListener('click', () => weatherCallback({ city }));

        const removeBtn = document.createElement('button');
        removeBtn.textContent = '×';
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent city from being searched
            removeCallback(city);
        });

        favItem.appendChild(cityName);
        favItem.appendChild(removeBtn);
        favoritesList.appendChild(favItem);
    });
}


