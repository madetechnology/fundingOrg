// Set your Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoidGltbG9wZXptYWRlIiwiYSI6ImNseDM4aXp6cTB3MWEya3BveDIxM2ZkNW0ifQ.Wj4mCYjqAy65rn5MhCbOrA';

// Initialize the map
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [174.769673, -41.2], // Center of New Zealand
    zoom: 5,
    minZoom: 4, // Restrict zoom out level
    maxBounds: [ // Restrict map panning to NZ area
        [165.87, -47.3], // Southwest coordinates
        [178.2, -34.4]  // Northeast coordinates
    ]
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
fetch('data/pokie_funds_full.geojson')
    .then(response => {
        debugLog('Fetching pokie_funds_full.geojson');
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
    const school = schoolsData.features.find(feature => {
        if (!feature.properties) return false;
        const schoolName = feature.properties["School Name"] || feature.properties["school_name"];
        return schoolName && schoolName.toLowerCase() === searchValue.toLowerCase();
    });
    debugLog(`School found: ${school ? (school.properties["School Name"] || school.properties["school_name"]) : 'None'}`);

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
            school_name: school.properties["School Name"] || school.properties["school_name"],
            address: school.properties["Address"]
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
            return distance <= 5; // Changed from 10 to 5 km radius
        })
    };

    debugLog(`Filtered Pokie Funds count within 5 km: ${filteredFunds.features.length}`);

    // Update results panel with table
    const resultsPanel = document.getElementById('results-panel');
    
    // Get unique foundations from the filtered results
    const uniqueFoundations = [...new Set(filteredFunds.features.map(fund => fund.properties["Foundation"]))];

    resultsPanel.innerHTML = `
        <div class="results-header">
            <h2>Nearby Funding Sources</h2>
            <span class="results-count">${filteredFunds.features.length} found within 5km</span>
        </div>
        <table class="results-table">
            <thead>
                <tr>
                    <th>Venue Name</th>
                    <th>Foundation</th>
                    <th>Address</th>
                    <th>Distance</th>
                </tr>
            </thead>
            <tbody>
                ${filteredFunds.features.map(fund => {
                    const distance = getDistanceFromLatLonInKm(
                        lat, lng,
                        fund.geometry.coordinates[1],
                        fund.geometry.coordinates[0]
                    ).toFixed(1);
                    return `
                        <tr>
                            <td>${fund.properties["Pub Name"] || 'N/A'}</td>
                            <td>${fund.properties["Foundation"] || 'N/A'}</td>
                            <td>${fund.properties["Address"] || 'N/A'}</td>
                            <td>${distance} km</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>

        <div class="results-header" style="margin-top: 2rem;">
            <h2>Available Foundations</h2>
            <span class="results-count">${uniqueFoundations.length} foundations</span>
        </div>
        <table class="results-table foundations-table">
            <thead>
                <tr>
                    <th>Foundation Name</th>
                </tr>
            </thead>
            <tbody>
                ${uniqueFoundations.map(foundation => `
                    <tr>
                        <td>${foundation || 'N/A'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    // Add Pokie Funds source and layer if there are any filtered funds
    if (filteredFunds.features.length > 0) {
        map.addSource('filtered_pokie_funds', {
            type: 'geojson',
            data: filteredFunds
        });
        debugLog('Added filtered_pokie_funds source.');

        map.addLayer({
            id: 'filtered-pokie-funds-layer',
            type: 'symbol',
            source: 'filtered_pokie_funds',
            layout: {
                'text-field': '$',
                'text-size': 16,
                'text-allow-overlap': true,
                'text-ignore-placement': true,
                'text-anchor': 'center'
            },
            paint: {
                'text-color': '#4169E1',
                'text-halo-color': '#ffffff',
                'text-halo-width': 2
            }
        });
        debugLog('Added filtered-pokie-funds-layer with $ symbols.');

        // Add popups for filtered Pokie Funds
        map.on('click', 'filtered-pokie-funds-layer', (e) => {
            const coordinates = e.features[0].geometry.coordinates.slice();
            const { "Pub Name": venueName, "Foundation": foundation, "Address": address } = e.features[0].properties;

            new mapboxgl.Popup()
                .setLngLat(coordinates)
                .setHTML(`
                    <strong>${venueName}</strong><br>
                    ${foundation}<br>
                    ${address}
                `)
                .addTo(map);
            debugLog(`Popup displayed for Pokie Fund: ${venueName}`);
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

// Initialize the results panel with default state
function initializeResultsPanel() {
    const resultsPanel = document.getElementById('results-panel');
    resultsPanel.innerHTML = `
        <div class="results-header">
            <h2>Nearby Funding Sources</h2>
            <span class="results-count">No results yet</span>
        </div>
        <table class="results-table">
            <thead>
                <tr>
                    <th>Venue Name</th>
                    <th>Foundation</th>
                    <th>Address</th>
                    <th>Distance</th>
                </tr>
            </thead>
            <tbody>
                <tr class="empty-state">
                    <td colspan="3">
                        <div class="empty-message">
                            Search for a school to find nearby funding sources
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>
    `;
}

// Call initialize function when the map is loaded
map.on('load', () => {
    initializeResultsPanel();
    debugLog('Results panel initialized with default state');
});

let selectedIndex = -1;

// Function to filter schools based on search input
function filterSchools(searchText) {
    if (!schoolsData || !searchText || searchText.length < 3) return [];
    
    const searchLower = searchText.toLowerCase();
    return schoolsData.features
        .filter(feature => {
            const schoolName = feature.properties["School Name"] || feature.properties["school_name"];
            return schoolName && schoolName.toLowerCase().includes(searchLower);
        })
        .slice(0, 10); // Limit to 10 results
}

// Function to update the dropdown
function updateDropdown(searchText) {
    const dropdown = document.getElementById('autocomplete-dropdown');
    const matches = filterSchools(searchText);
    
    if (matches.length > 0 && searchText.length >= 3) {
        dropdown.innerHTML = matches
            .map((feature, index) => {
                const schoolName = feature.properties["School Name"] || feature.properties["school_name"];
                return `
                    <div class="autocomplete-item ${index === selectedIndex ? 'selected' : ''}" 
                         data-index="${index}">
                        ${schoolName}
                    </div>
                `;
            })
            .join('');
        dropdown.classList.add('show');
    } else {
        dropdown.innerHTML = '';
        dropdown.classList.remove('show');
    }
}

// Add input event listener for search bar
document.getElementById('search-bar').addEventListener('input', (e) => {
    const searchText = e.target.value.trim();
    selectedIndex = -1;
    updateDropdown(searchText);
});

// Handle keyboard navigation
document.getElementById('search-bar').addEventListener('keydown', (e) => {
    const dropdown = document.getElementById('autocomplete-dropdown');
    const items = dropdown.getElementsByClassName('autocomplete-item');
    
    if (!items.length) return;

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIndex = (selectedIndex + 1) % items.length;
        updateDropdown(e.target.value.trim());
        if (items[selectedIndex]) {
            items[selectedIndex].scrollIntoView({ block: 'nearest' });
        }
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIndex = selectedIndex <= 0 ? items.length - 1 : selectedIndex - 1;
        updateDropdown(e.target.value.trim());
        if (items[selectedIndex]) {
            items[selectedIndex].scrollIntoView({ block: 'nearest' });
        }
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault();
        const selectedSchoolName = items[selectedIndex].textContent.trim();
        document.getElementById('search-bar').value = selectedSchoolName;
        dropdown.classList.remove('show');
        document.getElementById('search-button').click();
    }
});

// Handle click on dropdown items
document.getElementById('autocomplete-dropdown').addEventListener('click', (e) => {
    const item = e.target.closest('.autocomplete-item');
    if (item) {
        const schoolName = item.textContent.trim();
        document.getElementById('search-bar').value = schoolName;
        document.getElementById('autocomplete-dropdown').classList.remove('show');
        document.getElementById('search-button').click();
    }
});

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-input-group')) {
        document.getElementById('autocomplete-dropdown').classList.remove('show');
    }
});

// Modal functionality
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('show');
    document.body.style.overflow = '';
}

// Event listeners for modals
document.getElementById('about-link').addEventListener('click', (e) => {
    e.preventDefault();
    openModal('about-modal');
});

document.getElementById('ai-grant-writer-link').addEventListener('click', (e) => {
    e.preventDefault();
    openModal('ai-grant-writer-modal');
});

// Close modal when clicking the close button or outside the modal
document.querySelectorAll('.modal').forEach(modal => {
    modal.querySelector('.close-modal').addEventListener('click', () => {
        closeModal(modal.id);
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal(modal.id);
        }
    });
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal').forEach(modal => {
            if (modal.classList.contains('show')) {
                closeModal(modal.id);
            }
        });
    }
});