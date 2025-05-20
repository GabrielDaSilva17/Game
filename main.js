// Configuração do Firebase (copiado do seu Google Keep)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-analytics.js";
import { getDatabase, ref, push, onValue, set } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyB2sIIgD_GjSUk6EKtB0MT1WF6QHZKLNwE",
  authDomain: "impostor-a803f.firebaseapp.com",
  databaseURL: "https://impostor-a803f-default-rtdb.firebaseio.com",
  projectId: "impostor-a803f",
  storageBucket: "impostor-a803f.firebasestorage.app",
  messagingSenderId: "740424193719",
  appId: "1:740424193719:web:05fa85d2836da571b09f32",
  measurementId: "G-HKWD9F73Q7"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const database = getDatabase(app); // Obter uma referência para o Realtime Database

// Referências aos elementos do DOM
const nicknameInput = document.getElementById('nicknameInput');
const createGameBtn = document.getElementById('createGameBtn');
const roomCodeInput = document.getElementById('roomCodeInput');
const joinGameBtn = document.getElementById('joinGameBtn');

// Event Listeners para os botões
createGameBtn.addEventListener('click', createGame);
joinGameBtn.addEventListener('click', joinGame);

function createGame() {
    const nickname = nicknameInput.value.trim();
    if (nickname) {
        // Lógica para criar uma nova sala no Firebase
        const newRoomRef = push(ref(database, 'rooms')); // Gera uma chave única para a sala
        const roomCode = newRoomRef.key.substring(0, 6).toUpperCase(); // Pega os primeiros 6 caracteres como código

        set(newRoomRef, {
            host: nickname,
            players: {
                [nickname]: {
                    status: 'online'
                }
            },
            status: 'waiting', // waiting, in-game, finished
            word: '',
            impostors: [],
            currentTurn: nickname // O host começa
        }).then(() => {
            alert(`Sala criada! Código: ${roomCode}. Compartilhe com seus amigos.`);
            // Redirecionar ou mostrar a tela da sala de espera
            console.log("Sala criada com sucesso:", roomCode);
            // Aqui você precisaria mudar a interface do usuário para a sala de espera
            // Por enquanto, vamos apenas logar no console
            localStorage.setItem('nickname', nickname);
            localStorage.setItem('roomCode', roomCode);
            // Simular mudança de tela para o lobby
            document.querySelector('.lobby-container').innerHTML = `
                <h2>Sala: ${roomCode}</h2>
                <h3>Bem-vindo, ${nickname}!</h3>
                <p>Esperando outros jogadores...</p>
                <div id="playerList"></div>
                <button id="startGameBtn">Iniciar Jogo</button>
            `;
            setupRoomListener(roomCode);
        }).catch(error => {
            console.error("Erro ao criar sala:", error);
            alert("Erro ao criar sala. Tente novamente.");
        });
    } else {
        alert("Por favor, digite seu Nickname.");
    }
}

function joinGame() {
    const nickname = nicknameInput.value.trim();
    const roomCode = roomCodeInput.value.trim().toUpperCase();

    if (nickname && roomCode) {
        const roomRef = ref(database, `rooms/${roomCode}`);
        onValue(roomRef, (snapshot) => {
            const roomData = snapshot.val();
            if (roomData) {
                if (roomData.status === 'waiting') {
                    // Adicionar o jogador à sala
                    const playerRef = ref(database, `rooms/${roomCode}/players/${nickname}`);
                    set(playerRef, {
                        status: 'online'
                    }).then(() => {
                        alert(`Você entrou na sala: ${roomCode}`);
                        console.log("Entrou na sala:", roomCode);
                        localStorage.setItem('nickname', nickname);
                        localStorage.setItem('roomCode', roomCode);
                        // Simular mudança de tela para o lobby
                        document.querySelector('.lobby-container').innerHTML = `
                            <h2>Sala: ${roomCode}</h2>
                            <h3>Bem-vindo, ${nickname}!</h3>
                            <p>Esperando outros jogadores...</p>
                            <div id="playerList"></div>
                            <button id="startGameBtn">Iniciar Jogo</button>
                        `;
                        setupRoomListener(roomCode);
                    }).catch(error => {
                        console.error("Erro ao entrar na sala:", error);
                        alert("Erro ao entrar na sala. Tente novamente.");
                    });
                } else {
                    alert("Esta sala já está em jogo ou foi finalizada.");
                }
            } else {
                alert("Código da sala inválido.");
            }
        }, {
            onlyOnce: true // Pega os dados uma vez para verificar se a sala existe
        });
    } else {
        alert("Por favor, digite seu Nickname e o Código da Sala.");
    }
}

function setupRoomListener(roomCode) {
    const roomRef = ref(database, `rooms/${roomCode}`);
    onValue(roomRef, (snapshot) => {
        const roomData = snapshot.val();
        if (roomData) {
            const playerListDiv = document.getElementById('playerList');
            if (playerListDiv) {
                playerListDiv.innerHTML = '<h4>Jogadores na sala:</h4>';
                for (const playerNickname in roomData.players) {
                    playerListDiv.innerHTML += `<p>${playerNickname}</p>`;
                }
            }

            const startGameBtn = document.getElementById('startGameBtn');
            // Apenas o host pode iniciar o jogo
            if (startGameBtn && roomData.host === localStorage.getItem('nickname')) {
                startGameBtn.style.display = 'block'; // Mostra o botão para o host
                startGameBtn.onclick = () => startGame(roomCode, roomData.players);
            } else if (startGameBtn) {
                startGameBtn.style.display = 'none'; // Esconde o botão para os outros
            }

            if (roomData.status === 'in-game') {
                // Se o jogo começou, redirecionar para a tela do jogo
                console.log("Jogo começou! Redirecionando...");
                // Aqui você precisaria mudar a interface do usuário para a tela do jogo
                displayGameScreen(roomData);
            }
        } else {
            console.log("Sala não encontrada ou foi removida.");
            // Poderia redirecionar de volta para o lobby ou mostrar uma mensagem de erro
        }
    });
}

function startGame(roomCode, players) {
    const playerNicknames = Object.keys(players);
    if (playerNicknames.length < 2) {
        alert("Pelo menos 2 jogadores são necessários para iniciar o jogo.");
        return;
    }

    // Sortear a palavra e o impostor(es)
    const words = ["cachorro", "gato", "elefante", "pássaro", "macaco"]; // Exemplo de palavras
    const chosenWord = words[Math.floor(Math.random() * words.length)];

    let impostorsCount = 1; // Padrão: 1 impostor
    if (playerNicknames.length >= 5) { // Exemplo: se tiver 5 ou mais, 2 impostores
        impostorsCount = 2;
    }
    if (playerNicknames.length >= 8) { // Exemplo: se tiver 8 ou mais, 3 impostores
        impostorsCount = 3;
    }

    const impostorIndexes = [];
    while (impostorIndexes.length < impostorsCount) {
        const randomIndex = Math.floor(Math.random() * playerNicknames.length);
        if (!impostorIndexes.includes(randomIndex)) {
            impostorIndexes.push(randomIndex);
        }
    }

    const impostors = impostorIndexes.map(index => playerNicknames[index]);

    // Atualizar o estado da sala no Firebase
    const roomRef = ref(database, `rooms/${roomCode}`);
    set(roomRef, {
        ...players, // Mantém os jogadores existentes
        host: localStorage.getItem('nickname'), // Mantém o host
        players: players, // Garante que a estrutura de players está correta
        status: 'in-game',
        word: chosenWord,
        impostors: impostors,
        currentTurn: playerNicknames[0] // O primeiro jogador começa
    }).then(() => {
        console.log("Jogo iniciado!");
    }).catch(error => {
        console.error("Erro ao iniciar jogo:", error);
        alert("Erro ao iniciar jogo. Tente novamente.");
    });
}

function displayGameScreen(roomData) {
    const mainContainer = document.querySelector('.lobby-container'); // Reutilizando o container principal
    mainContainer.innerHTML = `
        <h2>Jogo em Andamento - Sala: ${localStorage.getItem('roomCode')}</h2>
        <h3>Sua vez: <span id="currentTurnDisplay"></span></h3>
        <p id="wordDisplay"></p>
        <p id="impostorNotification"></p>
        <input type="text" id="talkInput" placeholder="Digite sua palavra relacionada...">
        <button id="submitTalkBtn">Falar</button>
        <div id="chatDisplay"></div>
        <button id="voteBtn">Votar</button>
    `;

    const nickname = localStorage.getItem('nickname');
    const wordDisplay = document.getElementById('wordDisplay');
    const impostorNotification = document.getElementById('impostorNotification');
    const currentTurnDisplay = document.getElementById('currentTurnDisplay');
    const talkInput = document.getElementById('talkInput');
    const submitTalkBtn = document.getElementById('submitTalkBtn');
    const chatDisplay = document.getElementById('chatDisplay');
    const voteBtn = document.getElementById('voteBtn');

    if (roomData.impostors.includes(nickname)) {
        impostorNotification.textContent = "Você é o IMPOSTOR!";
        wordDisplay.textContent = "Sua missão: descubra a palavra secreta e disfarce-se!";
    } else {
        wordDisplay.textContent = `A palavra secreta é: "${roomData.word}"`;
    }

    // Lógica para mostrar a vez e permitir que o jogador fale
    const roomRef = ref(database, `rooms/${localStorage.getItem('roomCode')}`);
    onValue(roomRef, (snapshot) => {
        const currentRoomData = snapshot.val();
        if (currentRoomData) {
            currentTurnDisplay.textContent = currentRoomData.currentTurn;

            if (currentRoomData.currentTurn === nickname) {
                talkInput.disabled = false;
                submitTalkBtn.disabled = false;
                // Implementar o timer de 30s aqui
                // setTimeout para desabilitar o input e passar a vez
            } else {
                talkInput.disabled = true;
                submitTalkBtn.disabled = true;
            }

            // Atualizar o chat
            chatDisplay.innerHTML = '<h4>Histórico de falas:</h4>';
            if (currentRoomData.chat) {
                for (const messageId in currentRoomData.chat) {
                    const message = currentRoomData.chat[messageId];
                    chatDisplay.innerHTML += `<p><strong>${message.player}:</strong> ${message.text}</p>`;
                }
            }
        }
    });

    submitTalkBtn.addEventListener('click', () => {
        const message = talkInput.value.trim();
        if (message) {
            const chatRef = ref(database, `rooms/${localStorage.getItem('roomCode')}/chat`);
            push(chatRef, {
                player: nickname,
                text: message,
                timestamp: Date.now()
            }).then(() => {
                talkInput.value = '';
                // Lógica para passar a vez para o próximo jogador
                passTurn(localStorage.getItem('roomCode'), roomData.players);
            });
        }
    });

    voteBtn.addEventListener('click', () => {
        // Lógica para iniciar a votação
        alert("Votação em breve...");
    });
}

function passTurn(roomCode, players) {
    const playerNicknames = Object.keys(players);
    const roomRef = ref(database, `rooms/${roomCode}`);
    onValue(roomRef, (snapshot) => {
        const currentRoomData = snapshot.val();
        if (currentRoomData) {
            const currentPlayerIndex = playerNicknames.indexOf(currentRoomData.currentTurn);
            const nextPlayerIndex = (currentPlayerIndex + 1) % playerNicknames.length;
            const nextPlayer = playerNicknames[nextPlayerIndex];

            set(ref(database, `rooms/${roomCode}/currentTurn`), nextPlayer)
                .then(() => console.log("Vez passada para:", nextPlayer))
                .catch(error => console.error("Erro ao passar a vez:", error));
        }
    }, {
        onlyOnce: true
    });
}
