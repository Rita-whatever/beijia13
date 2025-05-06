// script.js

const gridSize = 6;
let board = [];
let emptyRow = gridSize - 1;
let emptyCol = gridSize - 1;

function generateBoard() {
  let nums = [...Array(gridSize * gridSize - 1).keys()].map(n => n + 1);
  nums = nums.sort(() => Math.random() - 0.5);
  nums.push(0); // 0 means empty
  board = [];
  for (let i = 0; i < gridSize; i++) {
    board.push(nums.slice(i * gridSize, (i + 1) * gridSize));
  }
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      if (board[i][j] === 0) {
        emptyRow = i;
        emptyCol = j;
      }
    }
  }
}

function render() {
  const puzzle = document.getElementById("puzzle");
  puzzle.innerHTML = "";
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const val = board[row][col];
      const tile = document.createElement("div");
      tile.classList.add("tile");
      if (val === 0) {
        tile.classList.add("empty");
      } else {
        tile.style.backgroundImage = `url(images/${val}.jpg)`;
        tile.addEventListener("click", () => tryMove(row, col));
      }
      puzzle.appendChild(tile);
    }
  }
}

function tryMove(row, col) {
  if ((Math.abs(row - emptyRow) === 1 && col === emptyCol) ||
      (Math.abs(col - emptyCol) === 1 && row === emptyRow)) {
    board[emptyRow][emptyCol] = board[row][col];
    board[row][col] = 0;
    emptyRow = row;
    emptyCol = col;
    render();
    if (checkWin()) alert("\u606d\u559c\u60a8\u6210\u529f\u89e3\u51b3\u534e\u5bb9\u9053！");
  }
}

function checkWin() {
  let count = 1;
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      if (i === gridSize - 1 && j === gridSize - 1) return board[i][j] === 0;
      if (board[i][j] !== count) return false;
      count++;
    }
  }
  return true;
}

generateBoard();
render();
