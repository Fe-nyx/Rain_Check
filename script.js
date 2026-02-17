let cityInput = document.getElementById("cityInput");
let searchBtn = document.getElementById("searchBtn");
const cityNameEl = document.querySelector(".city-name");
const weatherIconEl = document.querySelector(".weather-icon");
const conditionTextEl = document.querySelector(".condition-text");
const temperatureEl = document.querySelector(".temperature");
const feelsLikeEl = document.querySelector(".feels-like");
const metricsSectionEl = document.querySelector(".metrics-section");


searchBtn.addEventListener("click", searchHandler);
cityInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        searchHandler();
    }
});


async function searchHandler(event) {
    console.time("Total Time");
    let searchInput = cityInput.value.trim();
    cityInput.value = "";

    if (searchInput == "") {
        cityInput.value = "";
        return;
    }
    cityNameEl.textContent = "Loading...";

    try {
        const masterData = await fetchWeather(searchInput);
        renderCurrent(masterData);
    } catch (error) {
        cityNameEl.textContent = error.message;
    }

    console.timeEnd("Total Time");
    // console.log(masterData.weather.current.temperature)
}



async function fetchWeather(city) {


    let geoCodeResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}`);
    let geoCode = await geoCodeResponse.json();

    if (!geoCode.results || geoCode.results.length === 0) {
        throw new Error("City not found");
    }


    let name = geoCode.results[0].name;
    let country = geoCode.results[0].country;
    let lat = geoCode.results[0].latitude;
    let long = geoCode.results[0].longitude;
    let elevation = geoCode.results[0].elevation;


    const [aqi, forecast] = await Promise.all([
        fetchAQI(lat, long),
        fetchForecast(lat, long)
    ]);


    const weatherData = {
        location: {
            name: name,
            country: country,
            elevation: elevation,
        },

        weather: {
            current: {
                feelsLike: forecast.current.apparent_temperature,
                cloudCover: forecast.current.cloud_cover,
                isDay: forecast.current.is_day,
                precipitation: forecast.current.precipitation,
                pressure: forecast.current.pressure_msl,
                humidity: forecast.current.relative_humidity_2m,
                temperature: forecast.current.temperature_2m,
                weatherCode: forecast.current.weather_code,
                windDirection: forecast.current.wind_direction_10m,
                windSpeed: forecast.current.wind_speed_10m,
            },

            daily: {

            },

            hourly: {

            },
        },

        aqi: {

        },

        units: {
            temperature: forecast.current_units.temperature_2m,
            cloudCover: forecast.current_units.cloud_cover,
            precipitation: forecast.current_units.precipitation,
            pressure: forecast.current_units.pressure_msl,
            humidity: forecast.current_units.relative_humidity_2m,
            windDirection: forecast.current_units.wind_direction_10m,
            windSpeed: forecast.current_units.wind_speed_10m,
        },

    }

    return weatherData;
}




function renderCurrent(data) {

    cityNameEl.textContent =
        `${data.location.name}, ${data.location.country}`;

    weatherIconEl.textContent = getWeatherIcon(data.weather.current.weatherCode);

    conditionTextEl.textContent =
        interpretWeatherCode(data.weather.current.weatherCode);

    temperatureEl.textContent =
        `${data.weather.current.temperature} ${data.units.temperature}`;

    feelsLikeEl.textContent =
        `Feels like: ${data.weather.current.feelsLike} ${data.units.temperature}`;

    renderMetrics(data);
}

function renderMetrics(data) {

    metricsSectionEl.innerHTML = "";

    function addMetric(label, value, unit) {

        const metricDiv = document.createElement("div");
        metricDiv.className = "metric";

        const labelSpan = document.createElement("span");
        labelSpan.textContent = label;

        const valueSpan = document.createElement("span");
        valueSpan.textContent = `${value} ${unit}`;

        metricDiv.appendChild(labelSpan);
        metricDiv.appendChild(valueSpan);

        metricsSectionEl.appendChild(metricDiv);
    }

    addMetric("Humidity:", data.weather.current.humidity, data.units.humidity);
    addMetric("Cloud Cover:", data.weather.current.cloudCover, data.units.cloudCover);
    addMetric("Wind Speed:", data.weather.current.windSpeed, data.units.windSpeed);
    addMetric("Wind Direction:", data.weather.current.windDirection, data.units.windDirection);
    addMetric("Pressure:", data.weather.current.pressure, data.units.pressure);
}

function interpretWeatherCode(code) {

    const map = {
        0: "Clear Sky",
        1: "Mainly Clear",
        2: "Partly Cloudy",
        3: "Overcast",
        45: "Fog",
        61: "Rain",
        71: "Snow"
    };

    return map[code] || "Unknown";
}

function getWeatherIcon(code) {
    const map = {
        0: "☀️",
        1: "🌤️",
        2: "⛅",
        3: "☁️",
        45: "🌫️",
        61: "🌧️",
        71: "❄️"
    };

    return map[code] || "❓";
}


// First I thought we should await again and return the object itself, then after consoling I remembered that async functions ALWAYS wrap its return in a promise.
async function fetchAQI(lat, long) {
    let aqiResponse = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${long}&hourly=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,us_aqi&current=us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,ozone,sulphur_dioxide&forecast_days=7`);
    return aqiResponse.json();
}

async function fetchForecast(lat, long) {
    let forecastResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${long}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max,uv_index_max,sunrise,sunset,daylight_duration,sunshine_duration&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,cloud_cover,visibility,wind_speed_10m,weather_code&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,is_day,weather_code&forecast_days=7&timezone=auto`);
    return forecastResponse.json();
}



// function interpretAQI(value) {
//     // return { label, color }
// }

