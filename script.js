// Constants for fare calculation
const INITIAL_FARE = 29.0;
const THRESHOLD_FARE = 105.2;
const REGULAR_RATE = 2.1;
const HIGH_RATE = 1.4;
const DISTANCE_SEGMENT = 200; // meters
const INITIAL_DISTANCE = 2000; // meters
const UPDATE_INTERVAL = 1000; // milliseconds
const MOVEMENT_SPEED = 50; // meters per second

// State variables
let fare = INITIAL_FARE;
let extras = 0.0;
let isHired = false;
let isWaiting = false;
let distance = 0;
let waitTime = 0;
let timer;

// DOM Elements
const fareDisplay = document.getElementById('fareDisplay');
const extrasDisplay = document.getElementById('extrasDisplay');
const hiredStatus = document.getElementById('hiredStatus');
const waitButton = document.getElementById('waitButton');
const stopButton = document.getElementById('stopButton');
const add10Button = document.getElementById('add10Button');
const add1Button = document.getElementById('add1Button');

/**
 * Calculates the fare based on distance traveled and waiting time
 * @param {number} dist - Distance traveled in meters
 * @param {number} wait - Waiting time in seconds
 * @returns {number} - Calculated fare rounded to 1 decimal place
 */
function calculateFare(dist, wait) {
    let totalFare = INITIAL_FARE;
    
    // Calculate distance-based fare after initial distance
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
    
    // Calculate waiting time fare
    if (wait > 0) {
        const waitSegments = Math.floor(wait / 60); // Convert seconds to minutes
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
 * Starts the trip timer and updates
 */
function startTrip() {
    timer = setInterval(() => {
        if (isWaiting) {
            waitTime++;
        } else {
            distance += MOVEMENT_SPEED;
        }
        fare = calculateFare(distance, waitTime);
        updateDisplay();
    }, UPDATE_INTERVAL);
}

/**
 * Stops the trip timer
 */
function stopTrip() {
    clearInterval(timer);
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
        // Reset all values when starting new trip
        fare = INITIAL_FARE;
        extras = 0.0;
        distance = 0;
        waitTime = 0;
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
