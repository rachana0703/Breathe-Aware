console.log("Website loaded successfully!");

const API_KEY = 'af04da80b8b80bf1bb5374eaf896fb62';
const citySelect = document.getElementById('city-select');
const container = document.getElementById('data-container');
const latInput = document.getElementById('lat');
const lonInput = document.getElementById('lon');
const getAqiBtn = document.getElementById('get-aqi-btn');

// Chart contexts
const ctxCurrent = document.getElementById('aqiChart').getContext('2d');
const ctxForecast = document.getElementById('forecastChart').getContext('2d');

// Current AQI chart
const currentChart = new Chart(ctxCurrent, {
    type: 'line',
    data: { labels: [], datasets: [{ label: 'Current AQI', data: [], borderColor: 'rgba(69, 162, 158, 1)', backgroundColor: 'rgba(69, 162, 158, 0.2)', fill: true, tension: 0.3 }] },
    options: { scales: { y: { beginAtZero: true, max: 5 } } }
});

// Forecast AQI chart
const forecastChart = new Chart(ctxForecast, {
    type: 'line',
    data: { labels: [], datasets: [{ label: 'Forecast AQI', data: [], borderColor: 'rgba(255, 99, 132, 1)', backgroundColor: 'rgba(255, 99, 132, 0.2)', fill: true, tension: 0.3 }] },
    options: { scales: { y: { beginAtZero: true, max: 5 } } }
});

// AQI color classes
function getAQIColorClass(aqi) {
    if(aqi === 1) return "aqi-good";
    else if(aqi === 2) return "aqi-fair";
    else if(aqi === 3) return "aqi-moderate";
    else if(aqi === 4) return "aqi-unhealthy";
    else if(aqi === 5) return "aqi-very-unhealthy";
    else return "aqi-hazardous";
}

// AQI friendly description
function getAQICategory(aqi) {
    switch(aqi) {
        case 1: return "Good — Air is clean and safe for everyone.";
        case 2: return "Fair — Acceptable, but sensitive groups should be cautious.";
        case 3: return "Moderate — Some may experience mild health effects.";
        case 4: return "Unhealthy — Everyone may start feeling health impacts.";
        case 5: return "Very Poor — Health alert: serious effects possible!";
        default: return "Hazardous — Take all precautions; serious health risks.";
    }
}

// Pollutant friendly descriptions
const pollutantInfo = {
    pm2_5: "PM2.5 fine particles can penetrate deep into lungs and affect heart and lungs.",
    pm10: "PM10 coarse particles may irritate the airways and cause breathing discomfort.",
    co: "Carbon monoxide reduces oxygen delivery to organs and tissues.",
    no2: "Nitrogen dioxide can irritate lungs and worsen respiratory conditions.",
    o3: "Ozone may cause breathing difficulties and aggravate lung issues.",
    so2: "Sulfur dioxide can trigger respiratory problems and worsen heart/lung health."
};

// Display AQI and pollutants (normal font)
function displayAQIData(aqi, components) {
    const colorClass = getAQIColorClass(aqi);
    let html = `<div class="aqi-box ${colorClass}" style="font-weight: normal; font-size: 1rem;">
        <p>AQI: ${aqi} — ${getAQICategory(aqi)}</p>`;

    for (let key in components) {
        if (pollutantInfo[key] !== undefined) {
            const name = key.toUpperCase().replace('_', '.'); // PM2_5 → PM2.5
            html += `<p>${name}: ${components[key].toFixed(1)} μg/m³ — ${pollutantInfo[key]}</p>`;
        }
    }

    html += `</div>`;
    container.innerHTML = html;
}


// Update current chart
function updateCurrentChart(aqi, timeLabel) {
    const data = currentChart.data;
    if (data.labels.length >= 10) { data.labels.shift(); data.datasets[0].data.shift(); }
    data.labels.push(timeLabel);
    data.datasets[0].data.push(aqi);
    currentChart.update();
}

// Update forecast chart
function updateForecastChart(aqiArray, labelsArray) {
    forecastChart.data.labels = labelsArray;
    forecastChart.data.datasets[0].data = aqiArray;
    forecastChart.update();
}

// Get coordinates from select
function getCoordinates(value) {
    const [lat, lon] = value.split(',').map(Number);
    return { lat, lon };
}

// Fetch AQI data
function fetchAQIData(lat, lon) {
    container.innerHTML = "<p>Loading AQI data...</p>";

    // Current AQI
    fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`)
        .then(res => res.json())
        .then(data => {
            if(data.list && data.list.length > 0) {
                const { aqi, components } = data.list[0].main ? data.list[0] : data.list[0].main;
                displayAQIData(data.list[0].main.aqi, data.list[0].components);
                const now = new Date();
                const timeLabel = now.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
                updateCurrentChart(data.list[0].main.aqi, timeLabel);
            } else container.innerHTML = "<p>No AQI data found.</p>";
        })
        .catch(err => { container.textContent = "Failed to load AQI data."; console.error(err); });

    // Forecast AQI
    fetch(`https://api.openweathermap.org/data/2.5/air_pollution/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}`)
        .then(res => res.json())
        .then(data => {
            if(data.list && data.list.length > 0) {
                const aqiArray = data.list.slice(0,12).map(item => item.main.aqi);
                const labelsArray = data.list.slice(0,12).map(item => new Date(item.dt*1000).getHours() + ":00");
                updateForecastChart(aqiArray, labelsArray);
            }
        })
        .catch(err => console.error(err));
}
// Personalized AI Health Advice
const healthForm = document.getElementById('health-form');
const adviceOutput = document.getElementById('advice-output');

healthForm.addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent page refresh

    const age = parseInt(document.getElementById('user-age').value);
    const issue = document.getElementById('user-health').value;

    let advice = "";

    if(issue === "no") {
        if(age < 18) advice = "Air quality is fine for you, but try to avoid outdoor pollution on high AQI days.";
        else if(age < 50) advice = "Generally safe, but consider wearing masks in polluted areas.";
        else advice = "Be cautious; prolonged exposure may affect health.";
    } else {
        if(issue === "asthma") advice = "Limit outdoor activities today. Keep inhalers ready and monitor symptoms.";
        else if(issue === "copd") advice = "Avoid outdoor pollution. Stay indoors with air purifiers.";
        else advice = "Take necessary precautions; pollution may aggravate your condition.";
    }

    adviceOutput.innerHTML = `<p>${advice}</p>`;
});

// Load data from select
function loadData() {
    const { lat, lon } = getCoordinates(citySelect.value);
    fetchAQIData(lat, lon);
}

// Event listeners
window.addEventListener('DOMContentLoaded', loadData);
citySelect.addEventListener('change', loadData);

getAqiBtn.addEventListener('click', () => {
    const lat = parseFloat(latInput.value);
    const lon = parseFloat(lonInput.value);
    if(!isNaN(lat) && !isNaN(lon)) fetchAQIData(lat, lon);
    else alert("Please enter valid latitude and longitude!");
});
