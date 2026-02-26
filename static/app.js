// const canvas = document.getElementById('whiteboard');
// const ctx = canvas.getContext('2d');
// const clearBtn = document.getElementById('clear-btn');

// // Setup WebSocket connection
// const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
// const wsUrl = `${protocol}//${window.location.host}/ws`;
// const ws = new WebSocket(wsUrl);

// // Canvas state
// let isDrawing = false;
// let currentX = 0;
// let currentY = 0;

// // Setup canvas styles
// ctx.lineWidth = 3;
// ctx.lineCap = 'round';
// ctx.strokeStyle = '#2c3e50';

// // Event listeners for drawing
// canvas.addEventListener('mousedown', startDrawing);
// canvas.addEventListener('mousemove', draw);
// canvas.addEventListener('mouseup', stopDrawing);
// canvas.addEventListener('mouseout', stopDrawing);

// // Touch support
// canvas.addEventListener('touchstart', handleTouchStart);
// canvas.addEventListener('touchmove', handleTouchMove);
// canvas.addEventListener('touchend', stopDrawing);

// clearBtn.addEventListener('click', () => {
//     clearCanvas();
//     // Broadcast clear event
//     if (ws.readyState === WebSocket.OPEN) {
//         ws.send(JSON.stringify({ type: 'clear' }));
//     }
// });

// // WebSocket message handling
// ws.onmessage = (event) => {
//     const data = JSON.parse(event.data);
    
//     if (data.type === 'draw') {
//         drawLine(data.x0, data.y0, data.x1, data.y1, false);
//     } else if (data.type === 'clear') {
//         clearCanvas();
//     }
// };

// ws.onopen = () => {
//     console.log('Connected to whiteboard server');
// };

// ws.onerror = (error) => {
//     console.error('WebSocket error:', error);
// };

// // Drawing functions
// function startDrawing(e) {
//     isDrawing = true;
//     const rect = canvas.getBoundingClientRect();
//     currentX = e.clientX - rect.left;
//     currentY = e.clientY - rect.top;
// }

// function draw(e) {
//     if (!isDrawing) return;
    
//     const rect = canvas.getBoundingClientRect();
//     const x = e.clientX - rect.left;
//     const y = e.clientY - rect.top;
    
//     drawLine(currentX, currentY, x, y, true);
    
//     currentX = x;
//     currentY = y;
// }

// function stopDrawing() {
//     isDrawing = false;
// }

// function handleTouchStart(e) {
//     if (e.touches.length > 0) {
//         e.preventDefault();
//         isDrawing = true;
//         const rect = canvas.getBoundingClientRect();
//         currentX = e.touches[0].clientX - rect.left;
//         currentY = e.touches[0].clientY - rect.top;
//     }
// }

// function handleTouchMove(e) {
//     if (!isDrawing || e.touches.length === 0) return;
//     e.preventDefault();
    
//     const rect = canvas.getBoundingClientRect();
//     const x = e.touches[0].clientX - rect.left;
//     const y = e.touches[0].clientY - rect.top;
    
//     drawLine(currentX, currentY, x, y, true);
    
//     currentX = x;
//     currentY = y;
// }

// function drawLine(x0, y0, x1, y1, emit) {
//     ctx.beginPath();
//     ctx.moveTo(x0, y0);
//     ctx.lineTo(x1, y1);
//     ctx.stroke();
//     ctx.closePath();
    
//     if (!emit) return;
    
//     // Broadcast the drawing event
//     if (ws.readyState === WebSocket.OPEN) {
//         ws.send(JSON.stringify({
//             type: 'draw',
//             x0: x0,
//             y0: y0,
//             x1: x1,
//             y1: y1
//         }));
//     }
// }

// function clearCanvas() {
//     ctx.clearRect(0, 0, canvas.width, canvas.height);
// }


const canvas = document.getElementById('whiteboard');
const ctx = canvas.getContext('2d');
const clearBtn = document.getElementById('clear-btn');
const penBtn = document.getElementById('pen-btn');
const squareBtn = document.getElementById('square-btn');

// Setup WebSocket connection
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const wsUrl = `${protocol}//${window.location.host}/ws`;
const ws = new WebSocket(wsUrl);

// Canvas state
let isDrawing = false;
let currentX = 0;
let currentY = 0;
let startX = 0;
let startY = 0;
let drawingMode = 'pen'; // 'pen' or 'square'

// Setup canvas styles
ctx.lineWidth = 3;
ctx.lineCap = 'round';
ctx.strokeStyle = '#2c3e50';

// Mode switching
penBtn.addEventListener('click', () => drawingMode = 'pen');
squareBtn.addEventListener('click', () => drawingMode = 'square');

// Mouse events
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

// Touch support
canvas.addEventListener('touchstart', handleTouchStart);
canvas.addEventListener('touchmove', handleTouchMove);
canvas.addEventListener('touchend', stopDrawing);

// Clear button
clearBtn.addEventListener('click', () => {
    clearCanvas();
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'clear' }));
    }
});

// WebSocket message handling
ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === 'draw') {
        drawLine(data.x0, data.y0, data.x1, data.y1, false);
    } 
    else if (data.type === 'square') {
        drawSquare(data.x, data.y, data.size, false);
    }
    else if (data.type === 'clear') {
        clearCanvas();
    }
};

// ================== Drawing Logic ==================

function startDrawing(e) {
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;
    currentX = startX;
    currentY = startY;
}

function draw(e) {
    if (!isDrawing) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (drawingMode === 'pen') {
        drawLine(currentX, currentY, x, y, true);
        currentX = x;
        currentY = y;
    }
}

function stopDrawing(e) {
    if (!isDrawing) return;
    isDrawing = false;

    if (drawingMode === 'square') {
        const rect = canvas.getBoundingClientRect();
        const endX = e?.clientX ? e.clientX - rect.left : currentX;
        const endY = e?.clientY ? e.clientY - rect.top : currentY;

        const size = Math.max(
            Math.abs(endX - startX),
            Math.abs(endY - startY)
        );

        drawSquare(startX, startY, size, true);
    }
}

// ================== Touch ==================

function handleTouchStart(e) {
    if (e.touches.length > 0) {
        e.preventDefault();
        startDrawing(e.touches[0]);
    }
}

function handleTouchMove(e) {
    if (!isDrawing || e.touches.length === 0) return;
    e.preventDefault();

    if (drawingMode === 'pen') {
        draw(e.touches[0]);
    }
}

// ================== Drawing Functions ==================

function drawLine(x0, y0, x1, y1, emit) {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.closePath();

    if (!emit) return;

    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'draw',
            x0, y0, x1, y1
        }));
    }
}

function drawSquare(x, y, size, emit) {
    ctx.beginPath();
    ctx.rect(x, y, size, size);
    ctx.stroke();
    ctx.closePath();

    if (!emit) return;

    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'square',
            x,
            y,
            size
        }));
    }
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}