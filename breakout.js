const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

//startGameKeyword odreduje koji screen ce biti aktivan
let gameKeyword = "START"; //ako je start prikazuje se naslov, ako je play onda se igra vrti, gameover za kraj igre

//definiraj broj bodova i varijablu koja
let score = 0;
let bestScore = Number(localStorage.getItem("bestScore")) || 0;

//definiraj broj redaka/stupaca cigli
const BRICK_COLUMNS = 10;
const BRICK_ROWS = 5;

//definiraj velicinu cigli
const BRICK_WIDTH = 45;
const BRICK_HEIGHT = 20;

//definiraj medusobnu udaljenost medu ciglama
const VERTICAL_DISTANCE = 15;
const HORIZONTAL_DISTANCE = 30;

//definiraj RGB vrijednosti cigli
const BRICK_COLORS = [
    'rgb(153, 51, 0)',
    'rgb(255, 0, 0)',
    'rgb(255, 153, 204)',
    'rgb(0, 255, 0)',
    'rgb(255, 255, 153)'
]

//definiraj velicinu i boju palice
const STICK_WIDTH = 80;
const STICK_HEIGHT = 15;
const STICK_COLOR = 'white';

let stick = {
    x: (canvas.width - STICK_WIDTH) / 2,
    y: canvas.height - 60,
    width: STICK_WIDTH,
    height: STICK_HEIGHT
};

//definiraj izgled i velicinu loptice
const BALL_SIZE = 10;
const BALL_COLOR = 'white';
const BALL_START_SPEED = 4;

let ball = {
    x: stick.x + stick.width / 2 - BALL_SIZE / 2,
    y: stick.y - BALL_SIZE - 2,
    size: BALL_SIZE,
    change_x: 0,
    change_y: 0
};

function startScreen() {

    /*ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    showBricks();
    showStick();
    showBall();*/

    //breakout naslov
    ctx.fillStyle = 'white';
    ctx.font = 'bold 36px Helvetica, Verdana';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('BREAKOUT', canvas.width / 2, canvas.height / 2 - 30);

    //press space tekst
    ctx.font = 'bold italic 18px Helvetica';
    ctx.fillText('Press SPACE to begin', canvas.width / 2, canvas.height / 2 + 10);
    
}

let bricks = [];

//izracunaj koliko ce mjesta u sirinu zauzeti sve cigle i praznine medu njima
const totalBricksWidth = BRICK_COLUMNS * BRICK_WIDTH + (BRICK_COLUMNS - 1) * HORIZONTAL_DISTANCE;

const bricksStartLeft = (canvas.width - totalBricksWidth) / 2; //odakle krecu cigle s lijeve strane
const bricksStartTop = 60; //zadaj odakle krecu cigle od gore

function formBricks() {
    bricks = [];

    for(let r = 0; r < BRICK_ROWS; r++) {
        for(let c = 0; c < BRICK_COLUMNS; c++) {

            //za svaku ciglicu izracunati gdje ce se nalazit
            const brick_posRow = bricksStartLeft + c * (BRICK_WIDTH + HORIZONTAL_DISTANCE);
            const brick_posCol = bricksStartTop + r * (BRICK_HEIGHT + VERTICAL_DISTANCE);

            bricks.push({
                x: brick_posRow,
                y: brick_posCol, 
                width: BRICK_WIDTH,
                height: BRICK_HEIGHT,
                color: BRICK_COLORS[r],
                alive: true
            });
        }
    }
}

//funkcija kojom se prikazuju sve generirane cigle
function showBricks() {
    bricks.forEach(brick => {
        if(!brick.alive) return;
        ctx.fillStyle = brick.color;
        ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
        ctx.strokeStyle = 'black';
        ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
    });
}

//funkcija kojom se prikazuje palica
function showStick() {
    ctx.fillStyle = STICK_COLOR;
    ctx.fillRect(stick.x, stick.y, stick.width, stick.height);
    ctx.strokeStyle = 'black';
    ctx.strokeRect(stick.x, stick.y, stick.width, stick.height);
}

//funkcija kojom se prikazuje loptica
function showBall() {
    ctx.fillStyle = BALL_COLOR;
    ctx.fillRect(ball.x, ball.y, ball.size, ball.size);
    ctx.strokeStyle = 'black';
    ctx.strokeRect(ball.x, ball.y, ball.size, ball.size);
}

//zadaj kojim tipkama ce se igra igrati - K i L
let keys = {
    KeyK: false,
    KeyL: false
};

//ako je tipka pritisnuta
window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyK' || e.code === 'KeyL') {
        e.preventDefault();
        keys[e.code] = true;
    }

    if (e.code === 'Space') {
        if (gameKeyword === "START") {
            startGame();
        } else if (gameKeyword === "GAMEOVER") {
            restartGame();
        }

        //ako je gameKeyword PLAY, space nista ne radi 
     }
});

//odnosno da tipka vise nije pritisnuta
window.addEventListener('keyup', (e) => {
    if (e.code === 'KeyK' || e.code === 'KeyL') {
        keys[e.code] = false;
    }
});

//funkcija koja odreduje kretanje palice lijevo desno
function stickMovement() {
    const SPEED = 6;

    if (keys.KeyK) stick.x -= SPEED;
    if (keys.KeyL) stick.x += SPEED;

    if (stick.x < 0) stick.x = 0;
    if (stick.x + stick.width > canvas.width) {
        stick.x = canvas.width - stick.width;
    }

    if (gameKeyword === "START") {
        resetBallOnStick();
    }
}

//funkcija koja odreduje kretanje loptice
function ballMovement() {

    if (ball.change_x === 0 && ball.change_y === 0) return;

    ball.x += ball.change_x;
    ball.y += ball.change_y;

    if (ball.x <= 0) {
        ball.x = 0;
        ball.change_x *= -1;
    }

    if (ball.x + BALL_SIZE >= canvas.width) {
        ball.x = canvas.width - ball.size
        ball.change_x *= -1;
    }

    if (ball.y <= 0) {
        ball.y = 0;
        ball.change_y *= -1;
    }

    if (ball.y > canvas.height) {
        gameOver();
        return;
    }

    //dogada se kada loptica udari ciglicu
    for (let i = 0; i < bricks.length; i++) {
        let brick = bricks[i];
        if(!brick.alive) continue;

        if(collisionBallBrick(ball, brick)) {
            brick.alive = false;
            ball.change_y *= -1; //kad udari od ciglicu, promijeni smjer loptice
            score++;
            if(bricks.every(b => !b.alive)) { //samo u slucaju da su sve ciglice razbijene
                winGame();
                return;
            }
            break;
        }
    }
}

function resetBallOnStick() {
    ball.x = stick.x + stick.width / 2 - BALL_SIZE / 2;
    ball.y = stick.y - BALL_SIZE - 2;
    ball.change_x = 0;
    ball.change_y = 0;
}

function startGame() {
    gameKeyword = "PLAY";
    let direction = Math.random() < 0.5 ? -1 : 1;
    ball.change_x = BALL_START_SPEED * direction;
    ball.change_y = -BALL_START_SPEED;
}

/*function startScreenLoop() {
    cancelAnimationFrame(startScreenAnimation);
    gameKeyword = "PLAY";
    gameLoop(); 
}*/

//funkcija kojom se keyword vraca na gameover
function gameOver() {
    gameKeyword = "GAMEOVER";
    ball.change_x = 0;
    ball.change_y = 0;

    //ako je novi broj bodova veci od postojeceg, updateaj ga u localStorage
    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem("bestScore", bestScore);
    }
}

//funkcija kojom se ostvaruje prikaz game over nakon sto igra zavrsi
function gameOverScreen() {
    /*ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);*/

    ctx.fillStyle = 'yellow';
    ctx.font = 'bold 40px Helvetica';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
}

//funkcija kojom se ostvaruje prikaz ekrana kad igrac pobijedi
function winScreen() {
    ctx.fillStyle = 'yellow';
    ctx.font = 'bold 40px Helvetica';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText("CONGRATS! YOU WON!", canvas.width / 2, canvas.height / 2);
}

//funkcija koja dodaje broj bodova na ekran
function scoreToScreen() {
    ctx.fillStyle = 'white';
    ctx.font = '20px Helvetica, Verdana';
    ctx.textAlign = 'left';
    ctx.fillText("Score: " + score, 20, 20);

    ctx.textAlign = 'right';
    ctx.fillText("Best: " + bestScore, canvas.width - 100, 20);
}

//funkcija kojom se vraca pocetni postav
function restartGame() {
    stick.x = (canvas.width - STICK_WIDTH) / 2;
    resetBallOnStick();
    formBricks();

    score = 0;
    gameKeyword = "START";
}

//funkcija koja opisuje slucaj kad igrac pobijedi
function winGame() {
    gameKeyword = "GAMEOVER";
    ball.change_x = 0;
    ball.change_y = 0;
    setTimeout(() => {
        winScreen();
    }, 50);
}

//funkcija koja detektira sudar loptice i ciglice
function collisionBallBrick(ball, brick) {
    return (
        ball.x + ball.size > brick.x &&
        ball.x < brick.x + brick.width &&
        ball.y <= brick.y + brick.height &&
        ball.y + ball.size >= brick.y
    );
}

//funkcija koja detektira je li loptica pogodila palicu i ako je mijenja joj smjer, odnosno odbacuje ju
function stickBallCollision() {
    let ballBottom = ball.y + ball.size;
    let ballTop = ball.y;
    let ballLeft = ball.x;
    let ballRight = ball.x + ball.size;

    let stickTop = stick.y;
    let stickBottom = stick.y + stick.height;
    let stickLeft = stick.x;
    let stickRight = stick.x + stick.width;

    if (
        ballBottom >= stickTop &&
        ballTop <= stickBottom &&
        ballRight >= stickLeft &&
        ballLeft <= stickRight
    ) {
        ball.y = stick.y - ball.size;
        ball.change_y *= -1;

        let angleChange = (ball.x + ball.size / 2) - (stick.x + stick.width / 2);
        ball.change_x = (angleChange / (stick.width / 2)) * 5;
    }
}

//funkcija kojom se provjerava u kojem je stanju igra i sukladno tome prikazi tekst na ekranu 
//i ponasanje loptice ako je igra u tijeku
function mainLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    stickMovement();

    //za svaku varijaciju keyworda prikazi odgovarajuci ekran
    if (gameKeyword === "START") {
        showBricks();
        showStick();
        showBall();
        startScreen(); 
    } else if (gameKeyword === "PLAY") {
        ballMovement();
        stickBallCollision();
        showBricks();
        showStick();
        showBall();
        scoreToScreen();
    } else if (gameKeyword === "GAMEOVER") {
        showBricks();
        showStick();
        showBall();
        if (bricks.every(b => !b.alive)) {
            winScreen();
        } else {
            gameOverScreen();
        }
    }

    requestAnimationFrame(mainLoop);
}

formBricks();
resetBallOnStick();
mainLoop();
//startScreenLoop();

