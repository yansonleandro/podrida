// Variables globales
let players = [];
let firstDealerIndex = 0;
let totalRounds = 1;
let currentRound = 1;
let currentDealer = 0;
let currentHand = 0; // 0: 1 carta, 1: 3 cartas, 2: 5 cartas, 3: 7 cartas
let cardsPerHand = [1, 3, 5, 7];
let scores = [];
let totalScores = [];
let predictions = [];
let fulfilled = [];
let currentPlayerIndex = 0;
let totalPredicted = 0;
let gamePhase = "prediction"; // prediction, results

// Elementos DOM
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar navegación por pestañas
    setupTabNavigation();
    // Inicializar eventos
    initPlayerRegistration();
    initRoundConfiguration();
    initGameBoard();
});

// Inicialización de registro de jugadores
function initPlayerRegistration() {
    const addPlayerBtn = document.getElementById('add-player');
    const playersSubmitBtn = document.getElementById('players-submit');
    const playersContainer = document.getElementById('players-container');
    
    // Evento para agregar jugador
    addPlayerBtn.addEventListener('click', function() {
        const playerInputs = document.querySelectorAll('.player-name');
        const newIndex = playerInputs.length + 1;
        
        const playerDiv = document.createElement('div');
        playerDiv.className = 'player-input';
        playerDiv.innerHTML = `
            <input type="text" placeholder="Jugador ${newIndex}" class="player-name">
            <button class="remove-player" title="Eliminar jugador">✕</button>
        `;
        
        playersContainer.appendChild(playerDiv);
        updateFirstDealerOptions();
        
        // Evento para eliminar jugador
        const removeBtn = playerDiv.querySelector('.remove-player');
        removeBtn.addEventListener('click', function() {
            playerDiv.remove();
            updateFirstDealerOptions();
            validateMinimumPlayers();
        });
    });
    
    // Inicializar botones de eliminar
    document.querySelectorAll('.remove-player').forEach(btn => {
        btn.addEventListener('click', function() {
            if (document.querySelectorAll('.player-name').length > 2) {
                this.parentElement.remove();
                updateFirstDealerOptions();
            } else {
                showError('player-error', 'Se necesitan al menos 2 jugadores');
            }
        });
    });
    
    // Evento para enviar jugadores
    playersSubmitBtn.addEventListener('click', function() {
        const playerInputs = document.querySelectorAll('.player-name');
        const playerNames = Array.from(playerInputs).map(input => input.value.trim());
        
        // Validar que todos los jugadores tengan nombres
        if (playerNames.some(name => name === '')) {
            showError('player-error', 'Todos los jugadores deben tener un nombre');
            return;
        }
        
        // Validar que haya al menos 2 jugadores
        if (playerNames.length < 2) {
            showError('player-error', 'Se necesitan al menos 2 jugadores');
            return;
        }
        
        // Validar nombres únicos
        const uniqueNames = new Set(playerNames);
        if (uniqueNames.size !== playerNames.length) {
            showError('player-error', 'Los nombres de los jugadores deben ser únicos');
            return;
        }
        
        // Guardar jugadores y actualizar opciones de repartidor
        players = playerNames;
        updateFirstDealerOptions();
        firstDealerIndex = parseInt(document.getElementById('first-dealer').value);
        currentDealer = firstDealerIndex;
        
        // Avanzar a configuración de rondas
        document.getElementById('player-registration').classList.add('hidden');
        document.getElementById('round-configuration').classList.remove('hidden');
    });
}

function validateMinimumPlayers() {
    const playerInputs = document.querySelectorAll('.player-name');
    if (playerInputs.length < 2) {
        showError('player-error', 'Se necesitan al menos 2 jugadores');
    } else {
        clearError('player-error');
    }
}

// Actualizar opciones del selector de primer repartidor
function updateFirstDealerOptions() {
    const firstDealerSelect = document.getElementById('first-dealer');
    firstDealerSelect.innerHTML = ''; // Clear existing options

    players.forEach((player, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = player || `Jugador ${index + 1}`;
        firstDealerSelect.appendChild(option);
    });

    // Set default selection to the first player
    if (players.length > 0) {
        firstDealerSelect.value = 0;
    }
}

// Inicialización de configuración de rondas
function initRoundConfiguration() {
    const roundsInput = document.getElementById('rounds');
    const roundsSubmitBtn = document.getElementById('rounds-submit');
    const firstDealerSelect = document.getElementById('first-dealer');
    
    // Populate the first dealer dropdown
    firstDealerSelect.innerHTML = ''; // Clear existing options
    players.forEach((player, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = player;
        firstDealerSelect.appendChild(option);
    });
    firstDealerSelect.value = firstDealerIndex; // Set default selection

    // Actualizar resumen al cambiar el número de rondas
    roundsInput.addEventListener('input', updateRoundSummary);
    
    // Inicializar resumen
    updateRoundSummary();
    
    // Evento para enviar configuración de rondas
    roundsSubmitBtn.addEventListener('click', function() {
        const rounds = parseInt(roundsInput.value);
        
        if (rounds < 1) {
            showError('round-error', 'Debe haber al menos 1 ronda');
            return;
        }
        
        // Guardar configuración
        totalRounds = rounds * players.length; // Adjust total rounds
        firstDealerIndex = parseInt(firstDealerSelect.value); // Update first dealer
        currentDealer = firstDealerIndex;
        
        // Inicializar arrays de puntuaciones
        initializeScores();
        
        // Avanzar al tablero de juego
        document.getElementById('round-configuration').classList.add('hidden');
        document.getElementById('game-board').classList.remove('hidden');
        
        // Inicializar tablero
        updateGameInfo();
        initializeRound();
    });
}

function initializeRoundConfiguration() {
    const roundsInput = document.getElementById('rounds');
    const firstDealerSelect = document.getElementById('first-dealer');

    // Ensure the inputs are enabled for initialization
    roundsInput.disabled = false;
    firstDealerSelect.disabled = false;

    // Populate the first dealer dropdown
    firstDealerSelect.innerHTML = ''; // Clear existing options
    players.forEach((player, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = player;
        firstDealerSelect.appendChild(option);
    });
    firstDealerSelect.value = firstDealerIndex; // Set default selection
}

// Actualizar resumen de rondas
function updateRoundSummary() {
    const rounds = parseInt(document.getElementById('rounds').value) || 1;
    
    document.getElementById('rounds-per-player').textContent = rounds;
    document.getElementById('total-hands').textContent = rounds * 4;
    document.getElementById('estimated-time').textContent = Math.round(rounds * 4 * 5);
}

// Inicializar arrays de puntuaciones
function initializeScores() {
    scores = Array(totalRounds * 4).fill().map(() => Array(players.length).fill(0));
    totalScores = Array(players.length).fill(0);
    
    // Inicializar tabla de puntuaciones
    initializeScoreTable();
}

// Inicializar tabla de puntuaciones
function initializeScoreTable() {
    const tableHeader = document.getElementById('score-table-header');
    const tableBody = document.getElementById('score-table-body');
    
    // Limpiar tabla
    while (tableHeader.children.length > 1) {
        tableHeader.removeChild(tableHeader.lastChild);
    }
    
    tableBody.innerHTML = '';
    
    // Agregar encabezados de jugadores
    players.forEach(player => {
        const th = document.createElement('th');
        th.textContent = player;
        tableHeader.appendChild(th);
    });
    
    // Fila de totales (primero)
    const totalRow = document.createElement('tr');
    totalRow.className = 'total-row';
    
    const totalLabelCell = document.createElement('td');
    totalLabelCell.textContent = 'Total';
    totalRow.appendChild(totalLabelCell);
    
    players.forEach((_, playerIndex) => {
        const cell = document.createElement('td');
        cell.id = `total-score-${playerIndex}`;
        cell.textContent = '0';
        totalRow.appendChild(cell);
    });
    
    tableBody.appendChild(totalRow);
    
    // Crear filas para cada mano
    for (let r = 1; r <= totalRounds; r++) {
        for (let h = 0; h < 4; h++) {
            const index = (r - 1) * 4 + h;
            const cards = cardsPerHand[h];
            
            const row = document.createElement('tr');
            row.id = `score-row-${index}`;
            
            // Columna de ronda con nombre del repartidor
            const roundCell = document.createElement('td');
            roundCell.textContent = `${players[(firstDealerIndex + r - 1) % players.length]} (${cards} ${cards === 1 ? 'carta' : 'cartas'})`;
            roundCell.className = 'round-cell';
            row.appendChild(roundCell);
            
            // Columnas de jugadores
            players.forEach((_, playerIndex) => {
                const cell = document.createElement('td');
                cell.id = `score-${index}-${playerIndex}`;
                cell.textContent = '-';
                row.appendChild(cell);
            });
            
            tableBody.appendChild(row);
        }
    }
}

// Inicialización del tablero de juego
function initGameBoard() {
    const playHandBtn = document.getElementById('play-hand');
    const saveResultsBtn = document.getElementById('save-results');
    const nextHandBtn = document.getElementById('next-hand');
    const newGameBtn = document.getElementById('new-game');
    
    // Evento para jugar mano
    playHandBtn.addEventListener('click', function() {
        // Cambiar a fase de resultados
        gamePhase = "results";
        document.getElementById('predictions-section').classList.add('hidden');
        document.getElementById('results-section').classList.remove('hidden');
        
        // Actualizar información del juego
        document.getElementById('current-phase').textContent = 'Resultados';
        document.getElementById('result-cards').textContent = cardsPerHand[currentHand];
        
        // Inicializar sección de resultados
        initializeResultsSection();
    });
    
    // Evento para guardar resultados
    saveResultsBtn.addEventListener('click', function() {
        // Calcular y guardar puntuaciones
        calculateAndSaveScores();
        
        // Actualizar tabla de puntuaciones
        updateScoreTable();
        
        // Habilitar botón de siguiente mano
        nextHandBtn.disabled = false;
    });
    
    // Evento para siguiente mano
    nextHandBtn.addEventListener('click', function() {
        // Avanzar a la siguiente mano o ronda
        advanceToNextHand();
    });
    
    // Evento para nuevo juego
    newGameBtn.addEventListener('click', function() {
        // Reiniciar juego
        resetGame();
    });
}

// Inicializar ronda actual
function initializeRound() {
    // Reiniciar variables
    predictions = Array(players.length).fill(-1);
    fulfilled = Array(players.length).fill(false);
    currentPlayerIndex = (currentDealer + 1) % players.length;
    totalPredicted = 0;
    gamePhase = "prediction";
    
    // Actualizar información del juego
    updateGameInfo();
    
    // Inicializar sección de predicciones
    initializePredictionsSection();
    document.getElementById('prediction-cards').textContent = cardsPerHand[currentHand];
    document.getElementById('all-predicted').classList.add('hidden'); // Hide green message
}

// Actualizar información del juego
function updateGameInfo() {
    document.getElementById('current-round').textContent = currentRound;
    document.getElementById('total-rounds').textContent = totalRounds;
    document.getElementById('current-hand-cards').textContent = cardsPerHand[currentHand];
    document.getElementById('current-dealer').textContent = players[currentDealer];
    document.getElementById('current-phase').textContent = gamePhase === "prediction" ? 'Predicciones' : 'Resultados';
    
    // Resaltar fila actual en la tabla
    const currentIndex = (currentRound - 1) * 4 + currentHand;
    document.querySelectorAll('#score-table-body tr').forEach(row => {
        row.classList.remove('current-row');
    });
    
    const currentRow = document.getElementById(`score-row-${currentIndex}`);
    if (currentRow) {
        currentRow.classList.add('current-row');
    }
}

// Inicializar sección de predicciones
function initializePredictionsSection() {
    const predictionsContainer = document.getElementById('predictions-container');
    predictionsContainer.innerHTML = ''; // Clear container to avoid unintended elements

    const playingOrder = getPlayingOrder();
    playingOrder.forEach(playerIndex => {
        const playerRow = document.createElement('div');
        playerRow.className = 'player-row';
        playerRow.id = `prediction-row-${playerIndex}`;

        const playerName = document.createElement('div');
        playerName.className = 'player-name-display';
        playerName.textContent = players[playerIndex];

        if (playerIndex === currentDealer) {
            const dealerTag = document.createElement('span');
            dealerTag.className = 'dealer-tag';
            dealerTag.textContent = '(Repartidor)';
            playerName.appendChild(dealerTag);
        }

        playerRow.appendChild(playerName);

        if (playerIndex === currentPlayerIndex) {
            const inputContainer = document.createElement('div');
            inputContainer.className = 'prediction-input-container';

            const input = document.createElement('input');
            input.type = 'number';
            input.min = '0';
            input.max = cardsPerHand[currentHand];
            input.className = 'prediction-input wide';
            input.id = `prediction-input-${playerIndex}`;
            input.placeholder = `0-${cardsPerHand[currentHand]}`;

            const confirmBtn = document.createElement('button');
            confirmBtn.textContent = 'Confirmar';
            confirmBtn.className = 'primary-button narrow';
            confirmBtn.addEventListener('click', function () {
                const value = input.value;
                handlePredictionInput(value);
            });

            inputContainer.appendChild(input);
            inputContainer.appendChild(confirmBtn);
            playerRow.appendChild(inputContainer);
        } else {
            const predictionDisplay = document.createElement('div');
            predictionDisplay.className = 'prediction-display prediction-pending';
            predictionDisplay.textContent = 'Pendiente';
            playerRow.appendChild(predictionDisplay);
        }

        predictionsContainer.appendChild(playerRow);
    });
}

// Obtener orden de juego
function getPlayingOrder() {
    const order = [];
    for (let i = 0; i < players.length; i++) {
        const playerIndex = (currentDealer + 1 + i) % players.length;
        order.push(playerIndex);
    }
    return order;
}

// Manejar input de predicción
function handlePredictionInput(value) {
    const prediction = parseInt(value);
    
    // Validar predicción
    if (isNaN(prediction) || prediction < 0 || prediction > cardsPerHand[currentHand]) {
        showError('prediction-error', `La predicción debe estar entre 0 y ${cardsPerHand[currentHand]}`);
        return;
    }
    
    // Regla especial para el repartidor (último jugador en predecir)
    if (currentPlayerIndex === currentDealer) {
        const sumPredictions = totalPredicted + prediction;
        if (sumPredictions === cardsPerHand[currentHand]) {
            showError('prediction-error', `El repartidor no puede pedir ${prediction} porque la suma sería igual a ${cardsPerHand[currentHand]}`);
            return;
        }
    }
    
    // Limpiar error
    clearError('prediction-error');
    
    // Actualizar predicciones
    predictions[currentPlayerIndex] = prediction;
    totalPredicted += prediction;
    
    // Actualizar UI para todos los jugadores
    const playingOrder = getPlayingOrder();
    playingOrder.forEach(playerIndex => {
        const row = document.getElementById(`prediction-row-${playerIndex}`);
        row.innerHTML = '';
        
        const playerName = document.createElement('div');
        playerName.className = 'player-name-display';
        playerName.textContent = players[playerIndex];
        
        if (playerIndex === currentDealer) {
            const dealerTag = document.createElement('span');
            dealerTag.className = 'dealer-tag';
            dealerTag.textContent = '(Repartidor)';
            playerName.appendChild(dealerTag);
        }
        
        row.appendChild(playerName);
        
        const predictionDisplay = document.createElement('div');
        predictionDisplay.className = 'prediction-display';
        predictionDisplay.textContent = predictions[playerIndex] >= 0 ? predictions[playerIndex] : 'Pendiente';
        row.appendChild(predictionDisplay);
    });
    
    // Actualizar contador de predicciones
    document.getElementById('predictions-made').textContent = predictions.filter(p => p >= 0).length;
    
    // Mover al siguiente jugador o finalizar predicciones
    const currentOrderIndex = playingOrder.indexOf(currentPlayerIndex);
    
    if (currentOrderIndex < playingOrder.length - 1) {
        // Mover al siguiente jugador
        currentPlayerIndex = playingOrder[currentOrderIndex + 1];
        
        // Actualizar información del jugador actual
        document.getElementById('current-player-name').textContent = players[currentPlayerIndex];
        
        // Actualizar UI para el siguiente jugador
        initializePredictionsSection();
    } else {
        // Todas las predicciones hechas
        document.getElementById('current-player-info').classList.add('hidden');
        document.getElementById('all-predicted').classList.remove('hidden');
        document.getElementById('play-hand').classList.remove('hidden');
        
        // Actualizar información de predicciones totales
        document.getElementById('total-predicted').textContent = totalPredicted;
        document.getElementById('max-possible').textContent = cardsPerHand[currentHand]; // Mostrar la cantidad posible correcta
    }
}

// Inicializar sección de resultados
function initializeResultsSection() {
    const resultsContainer = document.getElementById('results-container');
    const saveResultsBtn = document.getElementById('save-results');
    const nextHandBtn = document.getElementById('next-hand');
    const resultError = document.getElementById('result-error');

    // Limpiar contenedor
    resultsContainer.innerHTML = '';
    resultError.textContent = ''; // Clear any previous error message

    // Crear filas para cada jugador en el orden de predicción
    const playingOrder = getPlayingOrder();
    playingOrder.forEach(playerIndex => {
        const playerRow = document.createElement('div');
        playerRow.className = 'player-row';

        const playerName = document.createElement('div');
        playerName.className = 'player-name-display';
        playerName.textContent = players[playerIndex];

        if (playerIndex === currentDealer) {
            const dealerTag = document.createElement('span');
            dealerTag.className = 'dealer-tag';
            dealerTag.textContent = '(Repartidor)';
            playerName.appendChild(dealerTag);
        }

        const predictionInfo = document.createElement('div');
        predictionInfo.textContent = `Pidió: ${predictions[playerIndex]}`;
        predictionInfo.style.marginRight = '15px';

        const fulfillmentContainer = document.createElement('div');
        fulfillmentContainer.className = 'fulfillment-container';

        const checkboxContainer = document.createElement('div');
        checkboxContainer.className = 'checkbox-container';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `fulfilled-${playerIndex}`;
        checkbox.checked = fulfilled[playerIndex];
        checkbox.addEventListener('change', function () {
            fulfilled[playerIndex] = this.checked;
            validateSaveResultsButton();
        });

        const label = document.createElement('label');
        label.htmlFor = `fulfilled-${playerIndex}`;
        label.textContent = 'Cumplió';

        checkboxContainer.appendChild(checkbox);
        checkboxContainer.appendChild(label);

        fulfillmentContainer.appendChild(checkboxContainer);

        playerRow.appendChild(playerName);
        playerRow.appendChild(predictionInfo);
        playerRow.appendChild(fulfillmentContainer);

        resultsContainer.appendChild(playerRow);
    });

    // Deshabilitar botón de siguiente mano hasta guardar resultados
    nextHandBtn.style.display = 'none';
    saveResultsBtn.style.display = 'block';
    saveResultsBtn.disabled = true; // Initially disabled
}

function validateSaveResultsButton() {
    const allFulfilled = fulfilled.every(status => status);
    const saveResultsBtn = document.getElementById('save-results');
    const resultError = document.getElementById('result-error');

    if (allFulfilled) {
        saveResultsBtn.disabled = true;
        resultError.textContent = 'No todos los jugadores pueden cumplir. Ajusta las selecciones.';
    } else {
        saveResultsBtn.disabled = false;
        resultError.textContent = ''; // Clear error message
    }
}

// Calcular y guardar puntuaciones
function calculateAndSaveScores() {
    const currentIndex = (currentRound - 1) * 4 + currentHand;

    // Calcular puntuaciones
    players.forEach((_, playerIndex) => {
        if (fulfilled[playerIndex]) {
            // 5 puntos por cumplir + 1 punto por cada mano pedida
            scores[currentIndex][playerIndex] = 5 + predictions[playerIndex];
        } else {
            // 0 puntos si no cumplió
            scores[currentIndex][playerIndex] = 0;
        }

        // Actualizar puntuación total
        totalScores[playerIndex] = 0;
        for (let i = 0; i <= currentIndex; i++) {
            totalScores[playerIndex] += scores[i][playerIndex];
        }
    });

    // Mostrar botón de siguiente mano con diferencias visuales
    const saveResultsBtn = document.getElementById('save-results');
    const nextHandBtn = document.getElementById('next-hand');
    saveResultsBtn.style.display = 'none';
    nextHandBtn.style.display = 'block';
    nextHandBtn.className = `${saveResultsBtn.className} next-hand-button`; // Apply additional class for styling
}

// Actualizar tabla de puntuaciones
function updateScoreTable() {
    const currentIndex = (currentRound - 1) * 4 + currentHand;
    
    // Actualizar celdas de puntuación
    players.forEach((_, playerIndex) => {
        const cell = document.getElementById(`score-${currentIndex}-${playerIndex}`);
        cell.textContent = scores[currentIndex][playerIndex];
        
        // Actualizar total
        const totalCell = document.getElementById(`total-score-${playerIndex}`);
        totalCell.textContent = totalScores[playerIndex];
    });
}

// Avanzar a la siguiente mano o ronda
function advanceToNextHand() {
    // Cambiar a fase de predicciones
    gamePhase = "prediction";
    document.getElementById('predictions-section').classList.remove('hidden');
    document.getElementById('results-section').classList.add('hidden');
    
    // Avanzar a la siguiente mano o ronda
    if (currentHand === 3) {
        // Fin de una ronda (después de la mano de 7 cartas)
        if (currentRound === totalRounds) {
            // Fin del juego
            endGame();
            return;
        } else {
            // Siguiente ronda
            currentRound++;
            currentHand = 0;
            currentDealer = (currentDealer + 1) % players.length;
        }
    } else {
        // Siguiente mano en la misma ronda
        currentHand++;
    }
    
    // Inicializar nueva ronda
    initializeRound();
}

// Finalizar juego
function endGame() {
    // Mostrar pantalla de fin de juego
    document.getElementById('game-board').classList.add('hidden');
    document.getElementById('game-end').classList.remove('hidden');
    
    // Copiar tabla de puntuaciones
    const finalScores = document.getElementById('final-scores');
    finalScores.innerHTML = document.getElementById('score-table-section').innerHTML;
    
    // Llenar tabla de clasificación final
    const rankingTableBody = document.getElementById('ranking-table-body');
    rankingTableBody.innerHTML = ''; // Limpiar tabla

    // Crear un array de jugadores con sus puntajes
    const playerScores = players.map((player, index) => ({
        name: player,
        score: totalScores[index]
    }));

    // Ordenar jugadores por puntaje descendente
    playerScores.sort((a, b) => b.score - a.score);

    // Agregar filas a la tabla
    playerScores.forEach(playerScore => {
        const row = document.createElement('tr');
        const nameCell = document.createElement('td');
        const scoreCell = document.createElement('td');

        nameCell.textContent = playerScore.name;
        scoreCell.textContent = playerScore.score;

        row.appendChild(nameCell);
        row.appendChild(scoreCell);
        rankingTableBody.appendChild(row);
    });

    // Mostrar el ganador
    const maxScore = playerScores[0].score;
    const winnerName = playerScores[0].name;
    const gameEndHeader = document.querySelector('#game-end h2');
    gameEndHeader.textContent = `¡Juego Terminado! Ganador: ${winnerName}`;
}

// Reiniciar juego
function resetGame() {
    // Reiniciar variables
    players = [];
    firstDealerIndex = 0;
    totalRounds = 1;
    currentRound = 1;
    currentDealer = 0;
    currentHand = 0;
    scores = [];
    totalScores = [];
    predictions = [];
    fulfilled = [];
    currentPlayerIndex = 0;
    totalPredicted = 0;
    gamePhase = "prediction";
    
    // Volver a la pantalla de registro de jugadores
    document.getElementById('game-end').classList.add('hidden');
    document.getElementById('player-registration').classList.remove('hidden');
    
    // Limpiar campos
    document.querySelectorAll('.player-name').forEach((input, index) => {
        if (index < 3) {
            input.value = '';
        } else {
            input.parentElement.remove();
        }
    });
    
    document.getElementById('first-dealer').value = '0';
    document.getElementById('rounds').value = '1';
    
    // Limpiar errores
    clearError('player-error');
    clearError('round-error');
    clearError('prediction-error');
    clearError('result-error');
}

// Mostrar mensaje de error
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');
}

// Limpiar mensaje de error
function clearError(elementId) {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = '';
    errorElement.classList.add('hidden');
}

function setupTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach((button) => {
        button.addEventListener('click', () => {
            // Desactivar todas las pestañas
            tabButtons.forEach((btn) => btn.classList.remove('active'));
            tabContents.forEach((content) => content.classList.remove('active'));

            // Activar la pestaña seleccionada
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

function navigateToTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    document.querySelector(`.tab-btn[data-tab="${tabId}"]`).classList.add('active');
    document.getElementById(tabId).classList.add('active');
}