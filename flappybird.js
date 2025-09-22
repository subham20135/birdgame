
//board
let board;
let boardWidth = 360;
let boardHeight = 640;
let context;
let pipesPassed = 0;
let gamePaused = false;
let animationId = null;
let savedVelocityY = 0;

//bird
let birdWidth = 34; //width/height ratio = 408/228 = 17/12
let birdHeight = 24;
let birdX = boardWidth / 8;
let birdY = boardHeight / 2;
let birdImg;

let bird = {
    x: birdX,
    y: birdY,
    width: birdWidth,
    height: birdHeight
}

//pipes
let pipeArray = [];
let pipeWidth = 64; //width/height ratio = 384/3072 = 1/8
let pipeHeight = 512;
let pipeX = boardWidth;
let pipeY = 0;

let topPipeImg;
let bottomPipeImg;

//physics
let velocityX = -2; //pipes moving left speed
let velocityY = 0; //bird jump speed
let gravity = 0.4;

let gameOver = false;
let score = 0;


window.onload = function () {
    board = document.getElementById("board");
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d");

    // Load images
    birdImg = new Image();
    birdImg.src = "./img/flappybird.gif";
    birdImg.onload = function () {
        context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);
    };

    topPipeImg = new Image();
    topPipeImg.src = "./img/toppipe.png";

    bottomPipeImg = new Image();
    bottomPipeImg.src = "./img/bottompipe.png";

    // 🎮 Button listeners
    document.getElementById("playBtn").addEventListener("click", () => {
        document.getElementById("startScreen").style.display = "none";
        startGame();
    });

    document.getElementById("restartBtn").addEventListener("click", () => {
        document.getElementById("restartScreen").style.display = "none";
        restartGame();
    });

    // Keyboard control
    document.addEventListener("keydown", moveBird);
};


function resetGameState() {
    // Reset all game variables
    bird.y = boardHeight / 2;
    velocityY = 0;
    velocityX = -2;   // 👈 make sure pipes move again
    score = 0;
    pipesPassed = 0;
    gameOver = false;
    gamePaused = false;

    // Clear all existing pipes
    pipeArray = [];
}

function startGame() {
    resetGameState();
    if (pipeInterval) clearInterval(pipeInterval);
    startPipeSpawn(); // only here
    if (animationId) cancelAnimationFrame(animationId);
    animationId = requestAnimationFrame(update);
}
function restartGame() {
    resetGameState();
    if (pipeInterval) clearInterval(pipeInterval);
    startPipeSpawn(); // only here
    if (animationId) cancelAnimationFrame(animationId);
    animationId = requestAnimationFrame(update);
    document.getElementById("restartScreen").style.display = "none";
}

let restartScheduled = false;
function update() {

    context.clearRect(0, 0, board.width, board.height);

    if (gamePaused || gameOver) {
        if (gameOver) {
            context.fillStyle = "white";
            context.font = "45px sans-serif";
            context.fillText("GAME OVER", 50, 300);
        }
       animationId = requestAnimationFrame(update);
        return; // stop updating while paused
    }


    // bird
    velocityY += gravity;
    bird.y = Math.max(bird.y + velocityY, 0);
    context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);

    if (bird.y > board.height) {
        gameOver = true;
        document.getElementById("restartScreen").style.display = "flex";
    }

    // pipes
    for (let i = 0; i < pipeArray.length; i++) {
        let pipe = pipeArray[i];
        pipe.x += velocityX;
        context.drawImage(pipe.img, pipe.x, pipe.y, pipe.width, pipe.height);

        if (!pipe.passed && bird.x > pipe.x + pipe.width) {
            pipe.passed = true;
            score += 0.5;
            pipesPassed++;

            if (pipesPassed % 20 === 0) {
                pauseGameForQuestion();
            }
        }

        if (detectCollision(bird, pipe)) {
            gameOver = true;
            document.getElementById("restartScreen").style.display = "flex"; // show restart overlay
        }

        // 🚀 Remove pipes when they leave the screen
        if (pipe.x + pipe.width < 0) {
            pipeArray.splice(i, 1);
            i--; // adjust index since array size changed
        }
    }


    // clear old pipes
    while (pipeArray.length > 0 && pipeArray[0].x < -pipeWidth) {
        pipeArray.shift();
    }

    // score
    context.fillStyle = "white";
    context.font = "45px sans-serif";
    context.fillText(score, 5, 45);

    animationId = requestAnimationFrame(update);

}


function placePipes() {
    if (gameOver || gamePaused) {
        return;
    }

    //(0-1) * pipeHeight/2.
    // 0 -> -128 (pipeHeight/4)
    // 1 -> -128 - 256 (pipeHeight/4 - pipeHeight/2) = -3/4 pipeHeight
    let randomPipeY = pipeY - pipeHeight / 4 - Math.random() * (pipeHeight / 2);
    let openingSpace = board.height / 3; // bigger gap


    let topPipe = {
        img: topPipeImg,
        x: pipeX,
        y: randomPipeY,
        width: pipeWidth,
        height: pipeHeight,
        passed: false
    }

    let bottomPipe = {
        img: bottomPipeImg,
        x: pipeX,
        y: randomPipeY + pipeHeight + openingSpace,
        width: pipeWidth,
        height: pipeHeight,
        passed: false
    }
    pipeArray.push(topPipe, bottomPipe);
}

function resumeGame() {
    gamePaused = false;
    resumeCooldown = true;

    // wait 2 seconds before pipes spawn again
    setTimeout(() => resumeCooldown = false, 2000);
}

function moveBird(e) {
    if (e.code == "Space" || e.code == "ArrowUp" || e.code == "KeyX") {
        //jump
        velocityY = -6;

        //reset game
        if (gameOver) {
            bird.y = birdY;
            pipeArray = [];
            score = 0;
            gameOver = false;
        }
    }
}

function detectCollision(a, b) {
    return a.x < b.x + b.width &&   //a's top left corner doesn't reach b's top right corner
        a.x + a.width > b.x &&   //a's top right corner passes b's top left corner
        a.y < b.y + b.height &&  //a's top left corner doesn't reach b's bottom left corner
        a.y + a.height > b.y;    //a's bottom left corner passes b's top left corner

}

function pauseGameForQuestion() {
    gamePaused = true;
    stopPipeSpawn();

    // Pause movement
    savedVelocityY = velocityY;
    velocityX = 0;
    velocityY = 0; // freeze bird

    // Generate question
    let num1 = Math.floor(Math.random() * 10) + 1;
    let num2 = Math.floor(Math.random() * 10) + 1;
    let correct = num1 + num2;


    // Show modal instead of prompt
    let modal = document.getElementById("questionModal");
    let qText = document.getElementById("questionText");
    let input = document.getElementById("answerInput");
    let btn = document.getElementById("submitAnswer");

    qText.innerText = `Solve this: ${num1} + ${num2} = ?`;
    document.querySelector(".modal-image").src = "./img/bird.jpg";
    input.value = "";
    modal.style.display = "flex";  // show modal

    btn.onclick = () => {
        let answer = parseInt(input.value);

        if (answer === correct) {
            score += 5;
            qText.innerText = "correct! +5 points"
            qText.style.color = "green";
            
        } else {
            qText.innerText = "Wrong! No points"
            qText.style.color = "red";
            
        }

        setTimeout(() => {
            modal.style.display = "none";
            qText.style.color = "#333";

            velocityX = -2;
            velocityY = savedVelocityY;
            gamePaused = false;
            startPipeSpawn();
        }, 1000);
    };
}




let pipeInterval = null; // store interval id


function startPipeSpawn() {
    if (pipeInterval) {
        clearInterval(pipeInterval);
    }
    pipeInterval = setInterval(placePipes, 1500);
}


function stopPipeSpawn() {
    if (pipeInterval) {
        clearInterval(pipeInterval);
        pipeInterval = null; // ✅ reset
    }
}

