// Constants for fare calculation
const INITIAL_FARE = 29.0;
const THRESHOLD_FARE = 105.2;
const REGULAR_RATE = 2.1;
const HIGH_RATE = 1.4;
const DISTANCE_SEGMENT = 200; // meters
const INITIAL_DISTANCE = 2000; // meters
const UPDATE_INTERVAL = 1000; // milliseconds

// State variables
let fare = INITIAL_FARE;
let extras = 0.0;
let isHired = false;
let isWaiting = false;
let totalDistance = 0;
let waitTime = 0;
let lastPosition = null;
let currentSpeed = 0;
let watchId = null;

// DOM Elements
const fareDisplay = document.getElementById('fareDisplay');
const extrasDisplay = document.getElementById('extrasDisplay');
const hiredStatus = document.getElementById('hiredStatus');
const waitButton = document.getElementById('waitButton');
const stopButton = document.getElementById('stopButton');
const add10Button = document.getElementById('add10Button');
const add1Button = document.getElementById('add1Button');
const distanceDisplay = document.getElementById('distanceDisplay');
const speedDisplay = document.getElementById('speedDisplay');
const gpsStatus = document.getElementById('gpsStatus');

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
}

/**
 * Handle GPS position updates
 */
function handlePosition(position) {
    gpsStatus.textContent = 'GPS: Active';
    gpsStatus.className = 'active';

    const currentPosition = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        timestamp: position.timestamp
    };

    if (lastPosition && !isWaiting) {
        // Calculate distance
        const distance = calculateDistance(
            lastPosition.lat, lastPosition.lng,
            currentPosition.lat, currentPosition.lng
        );

        // Calculate speed (km/h)
        const timeDiff = (currentPosition.timestamp - lastPosition.timestamp) / 1000; // seconds
        currentSpeed = (distance / timeDiff) * 3.6; // Convert m/s to km/h

        // Update total distance if speed is reasonable (less than 80 km/h for taxi)
        if (currentSpeed < 80 && distance < 100) { // Basic sanity checks
            totalDistance += distance;
        }

        // Update displays
        speedDisplay.textContent = `Speed: ${currentSpeed.toFixed(1)} km/h`;
        distanceDisplay.textContent = `Distance: ${(totalDistance / 1000).toFixed(2)} km`;
        
        // Update fare
        fare = calculateFare(totalDistance, waitTime);
        updateDisplay();
    }

    lastPosition = currentPosition;
}

/**
 * Handle GPS errors
 */
function handlePositionError(error) {
    gpsStatus.textContent = `GPS Error: ${error.message}`;
    gpsStatus.className = 'error';
}

/**
 * Calculates the fare based on distance traveled and waiting time
 */
function calculateFare(dist, wait) {
    let totalFare = INITIAL_FARE;
    
    if (dist > INITIAL_DISTANCE) {
        const additionalMeters = dist - INITIAL_DISTANCE;
        const segments = Math.floor(additionalMeters / DISTANCE_SEGMENT);
        
        if (totalFare < THRESHOLD_FARE) {
            const segmentsUntilThreshold = Math.floor((THRESHOLD_FARE - INITIAL_FARE) / REGULAR_RATE);
            const regularSegments = Math.min(segments, segmentsUntilThreshold);
            totalFare += regularSegments * REGULAR_RATE;
            
            const remainingSegments = segments - regularSegments;
            if (remainingSegments > 0) {
                totalFare += remainingSegments * HIGH_RATE;
            }
        } else {
            totalFare += segments * HIGH_RATE;
        }
    }
    
    if (wait > 0) {
        const waitSegments = Math.floor(wait / 60);
        if (totalFare < THRESHOLD_FARE) {
            const segmentsUntilThreshold = Math.floor((THRESHOLD_FARE - totalFare) / REGULAR_RATE);
            const regularSegments = Math.min(waitSegments, segmentsUntilThreshold);
            totalFare += regularSegments * REGULAR_RATE;
            
            const remainingSegments = waitSegments - regularSegments;
            if (remainingSegments > 0) {
                totalFare += remainingSegments * HIGH_RATE;
            }
        } else {
            totalFare += waitSegments * HIGH_RATE;
        }
    }
    
    return Number(totalFare.toFixed(1));
}

/**
 * Updates all display elements with current values
 */
function updateDisplay() {
    fareDisplay.textContent = fare.toFixed(1);
    extrasDisplay.textContent = extras.toFixed(1);
    hiredStatus.textContent = isHired ? 'HIRED' : 'FOR HIRE';
    waitButton.classList.toggle('active', isWaiting);
    stopButton.classList.toggle('active', isHired);
}

/**
 * Starts GPS tracking and trip timer
 */
function startTrip() {
    if ("geolocation" in navigator) {
        // Start GPS tracking
        const options = {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        };
        
        watchId = navigator.geolocation.watchPosition(
            handlePosition,
            handlePositionError,
            options
        );

        // Start waiting time counter
        waitTimer = setInterval(() => {
            if (isWaiting) {
                waitTime++;
                fare = calculateFare(totalDistance, waitTime);
                updateDisplay();
            }
        }, 1000);
    } else {
        gpsStatus.textContent = 'GPS not available';
        gpsStatus.className = 'error';
    }
}

/**
 * Stops GPS tracking and trip timer
 */
function stopTrip() {
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }
    clearInterval(waitTimer);
    gpsStatus.textContent = 'GPS: Inactive';
    gpsStatus.className = '';
}

// Event Listeners
waitButton.addEventListener('click', () => {
    if (isHired) {
        isWaiting = !isWaiting;
        updateDisplay();
    }
});

stopButton.addEventListener('click', () => {
    isHired = !isHired;
    if (isHired) {
        fare = INITIAL_FARE;
        extras = 0.0;
        totalDistance = 0;
        waitTime = 0;
        lastPosition = null;
        currentSpeed = 0;
        startTrip();
    } else {
        stopTrip();
    }
    updateDisplay();
});

add10Button.addEventListener('click', () => {
    if (isHired) {
        extras += 10;
        updateDisplay();
    }
});

add1Button.addEventListener('click', () => {
    if (isHired) {
        extras += 1;
        updateDisplay();
    }
});

// Initialize display
updateDisplay();
