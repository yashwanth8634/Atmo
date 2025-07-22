export function generateForecastAdvice(hourlyData) {
    // Get the forecast for the next 3-6 hours
    const nextFewHours = hourlyData.slice(0, 2); 

    let willRain = false;
    for (const hour of nextFewHours) {
        // The API gives a weather ID. Codes 200-531 are all types of rain.
        if (hour.weather[0].id >= 200 && hour.weather[0].id <= 531) {
            willRain = true;
            break; 
        }
    }

    if (willRain) {
        return "Heads up: Rain is expected in the next few hours. Don't forget an umbrella! ☔";
    }

    // Check for clear skies (ID 800)
    const isClear = nextFewHours.every(hour => hour.weather[0].id === 800);
    if (isClear) {
        return "Looks like clear skies ahead. A great time for a walk! ☀️";
    }

    return "Enjoy your day! Check back later for more detailed updates."; // A default message
}


// This new function will process the hourly list into a clean daily summary
export function processDailyForecast(hourlyData) {
    const dailyForecasts = {};

    // Group forecast data by day
    for (const hour of hourlyData) {
        const date = new Date(hour.dt * 1000).toLocaleDateString();
        if (!dailyForecasts[date]) {
            dailyForecasts[date] = [];
        }
        dailyForecasts[date].push(hour);
    }

    const summarizedDays = [];
    for (const date in dailyForecasts) {
        const dayData = dailyForecasts[date];
        const dayName = new Date(dayData[0].dt * 1000).toLocaleDateString([], { weekday: 'short' });
        
        // Calculate average temperature for the day
        const totalTemp = dayData.reduce((sum, hour) => sum + hour.main.temp, 0);
        const avgTemp = Math.round(totalTemp / dayData.length);
        
        // Use the icon from the midday forecast for representation
        const icon = dayData.find(hour => new Date(hour.dt*1000).getHours() === 12)
                   ? dayData.find(hour => new Date(hour.dt*1000).getHours() === 12).weather[0].icon
                   : dayData[0].weather[0].icon;

        summarizedDays.push({
            dayName: dayName,
            temp: avgTemp,
            icon: icon
        });
    }

    return summarizedDays.slice(0, 5); // Return the next 5 days
}