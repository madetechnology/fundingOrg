// Set your Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoidGltbG9wZXptYWRlIiwiYSI6ImNseDM4aXp6cTB3MWEya3BveDIxM2ZkNW0ifQ.Wj4mCYjqAy65rn5MhCbOrA';

// Initialize the map
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [174.769673,-36.867787], // Default center (e.g., Auckland)
    zoom: 10
});

// Add zoom and rotation controls to the map
map.addControl(new mapboxgl.NavigationControl());

// Initialize variables to store GeoJSON data
let schoolsData = null;
let pokieFundsData = null;

// Function to log steps for debugging
function debugLog(message) {
    console.log(`[DEBUG]: ${message}`);
}

// Load Schools GeoJSON
fetch('data/schools.geojson')
    .then(response => {
        debugLog('Fetching schools.geojson');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        schoolsData = data;
        debugLog('Schools data loaded successfully.');
    })
    .catch(error => {
        console.error('Error loading schools GeoJSON:', error);
        alert('Failed to load schools data. Please check the console for more details.');
    });

// Load Pokie Funds GeoJSON
fetch('data/pokie_funds.geojson')
    .then(response => {
        debugLog('Fetching pokie_funds.geojson');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        pokieFundsData = data;
        debugLog('Pokie Funds data loaded successfully.');
    })
    .catch(error => {
        console.error('Error loading Pokie Funds GeoJSON:', error);
        alert('Failed to load Pokie Funds data. Please check the console for more details.');
    });

// Handle search functionality
document.getElementById('search-button').addEventListener('click', () => {
    debugLog('Search button clicked.');
    
    const searchValue = document.getElementById('search-bar').value.trim();
    debugLog(`Search input received: "${searchValue}"`);

    if (!searchValue) {
        alert('Please enter a school name.');
        debugLog('Empty search input.');
        return;
    }

    // Ensure that schoolsData is loaded
    if (!schoolsData) {
        alert('Schools data is not loaded yet. Please try again shortly.');
        debugLog('schoolsData not loaded.');
        return;
    }

    // Find the school in the data
    const school = schoolsData.features.find(feature => feature.properties.school_name === searchValue);
    debugLog(`School found: ${school ? school.properties.school_name : 'None'}`);

    if (!school) {
        alert('School not found.');
        debugLog('Entered school name does not match any records.');
        return;
    }

    const [lng, lat] = school.geometry.coordinates;
    debugLog(`Selected School Coordinates: Longitude=${lng}, Latitude=${lat}`);

    // Center the map on the selected school
    map.flyTo({
        center: [lng, lat],
        zoom: 13,
        essential: true
    });
    debugLog('Map centered on selected school.');

    // Remove existing selected school layer and source if they exist
    if (map.getLayer('selected-school-layer')) {
        map.removeLayer('selected-school-layer');
        debugLog('Removed existing selected-school-layer.');
    }
    if (map.getSource('selected_school')) {
        map.removeSource('selected_school');
        debugLog('Removed existing selected_school source.');
    }

    // Add a source and layer for the selected school
    const selectedSchoolGeoJSON = {
        type: 'Feature',
        properties: {
            school_name: school.properties.school_name,
            address: school.properties.address
        },
        geometry: {
            type: 'Point',
            coordinates: [lng, lat]
        }
    };

    map.addSource('selected_school', {
        type: 'geojson',
        data: selectedSchoolGeoJSON
    });
    debugLog('Added selected_school source.');

    map.addLayer({
        id: 'selected-school-layer',
        type: 'circle',
        source: 'selected_school',
        paint: {
            'circle-radius': 8,
            'circle-color': '#FF0000'
        }
    });
    debugLog('Added selected-school-layer.');

    // Add popup for the selected school
    map.on('click', 'selected-school-layer', (e) => {
        const coordinates = e.features[0].geometry.coordinates.slice();
        const { school_name, address } = e.features[0].properties;

        new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(`<strong>${school_name}</strong><br>${address}`)
            .addTo(map);
        debugLog(`Popup displayed for school: ${school_name}`);
    });

    // Change the cursor to pointer when hovering over the selected school
    map.on('mouseenter', 'selected-school-layer', () => {
        map.getCanvas().style.cursor = 'pointer';
        debugLog('Cursor changed to pointer over selected school.');
    });
    map.on('mouseleave', 'selected-school-layer', () => {
        map.getCanvas().style.cursor = '';
        debugLog('Cursor reverted to default from selected school.');
    });

    // Remove existing filtered Pokie Funds layer and source if they exist
    if (map.getLayer('filtered-pokie-funds-layer')) {
        map.removeLayer('filtered-pokie-funds-layer');
        debugLog('Removed existing filtered-pokie-funds-layer.');
    }
    if (map.getSource('filtered_pokie_funds')) {
        map.removeSource('filtered_pokie_funds');
        debugLog('Removed existing filtered_pokie_funds source.');
    }

    // Ensure that pokieFundsData is loaded
    if (!pokieFundsData) {
        alert('Pokie Funds data is not loaded yet. Please try again shortly.');
        debugLog('pokieFundsData not loaded.');
        return;
    }

    // Filter Pokie Funds within 5km radius
    const filteredFunds = {
        type: "FeatureCollection",
        features: pokieFundsData.features.filter(fund => {
            const distance = getDistanceFromLatLonInKm(lat, lng, fund.geometry.coordinates[1], fund.geometry.coordinates[0]);
            return distance <= 10; // 5 km radius
        })
    };

    debugLog(`Filtered Pokie Funds count within 5 km: ${filteredFunds.features.length}`);

    // Add Pokie Funds source and layer if there are any filtered funds
    if (filteredFunds.features.length > 0) {
        map.addSource('filtered_pokie_funds', {
            type: 'geojson',
            data: filteredFunds
        });
        debugLog('Added filtered_pokie_funds source.');

        map.addLayer({
            id: 'filtered-pokie-funds-layer',
            type: 'circle',
            source: 'filtered_pokie_funds',
            paint: {
                'circle-radius': 6,
                'circle-color': '#0000FF'
            }
        });
        debugLog('Added filtered-pokie-funds-layer.');

        // Add popups for filtered Pokie Funds
        map.on('click', 'filtered-pokie-funds-layer', (e) => {
            const coordinates = e.features[0].geometry.coordinates.slice();
            const { fund_name, address } = e.features[0].properties;

            new mapboxgl.Popup()
                .setLngLat(coordinates)
                .setHTML(`<strong>${fund_name}</strong><br>${address}`)
                .addTo(map);
            debugLog(`Popup displayed for Pokie Fund: ${fund_name}`);
        });

        // Change the cursor to pointer when hovering over filtered Pokie Funds
        map.on('mouseenter', 'filtered-pokie-funds-layer', () => {
            map.getCanvas().style.cursor = 'pointer';
            debugLog('Cursor changed to pointer over filtered Pokie Funds.');
        });
        map.on('mouseleave', 'filtered-pokie-funds-layer', () => {
            map.getCanvas().style.cursor = '';
            debugLog('Cursor reverted to default from filtered Pokie Funds.');
        });
    } else {
        alert('No Pokie Funds found within a 5 km radius of the selected school.');
        debugLog('No Pokie Funds found within the specified radius.');
    }

    // Remove existing radius circle if any
    if (map.getLayer('radius-circle-layer')) {
        map.removeLayer('radius-circle-layer');
        debugLog('Removed existing radius-circle-layer.');
    }
    if (map.getSource('radius-circle')) {
        map.removeSource('radius-circle');
        debugLog('Removed existing radius-circle source.');
    }

    // Create a 5km radius circle using Turf.js
    const circle = turf.circle([lng, lat], 5, { units: 'kilometers', steps: 64 });
    debugLog('Created a 5 km radius circle using Turf.js.');

    map.addSource('radius-circle', {
        type: 'geojson',
        data: circle
    });
    debugLog('Added radius-circle source.');

    map.addLayer({
        id: 'radius-circle-layer',
        type: 'fill',
        source: 'radius-circle',
        layout: {},
        paint: {
            'fill-color': '#00FF00',
            'fill-opacity': 0.1
        }
    });
    debugLog('Added radius-circle-layer.');
});

// Function to calculate distance between two coordinates (Haversine formula)
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1); 
    const dLon = deg2rad(lon2 - lon1); 
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    const d = R * c; // Distance in km
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}