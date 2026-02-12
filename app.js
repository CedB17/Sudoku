const boardEl = document.getElementById('sudoku-board');
const difficultyEl = document.getElementById('difficulty');
const newGameBtn = document.getElementById('new-game-btn');
const checkBtn = document.getElementById('check-btn');
const solveBtn = document.getElementById('solve-btn');
const statusEl = document.getElementById('status');

const difficultyToHoles = {
  easy: 36,
  medium: 46,
  hard: 54,
};

let solution = [];
let puzzle = [];

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function isValid(board, row, col, value) {
  for (let i = 0; i < 9; i += 1) {
    if (board[row][i] === value || board[i][col] === value) {
      return false;
    }
  }

  const rowStart = Math.floor(row / 3) * 3;
  const colStart = Math.floor(col / 3) * 3;
  for (let r = rowStart; r < rowStart + 3; r += 1) {
    for (let c = colStart; c < colStart + 3; c += 1) {
      if (board[r][c] === value) {
        return false;
      }
    }
  }
  return true;
}

function generateSolvedBoard() {
  const board = Array.from({ length: 9 }, () => Array(9).fill(0));

  function fillCell(index = 0) {
    if (index === 81) {
      return true;
    }

    const row = Math.floor(index / 9);
    const col = index % 9;

    for (const value of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
      if (isValid(board, row, col, value)) {
        board[row][col] = value;
        if (fillCell(index + 1)) {
          return true;
        }
      }
    }

    board[row][col] = 0;
    return false;
  }

  fillCell();
  return board;
}

function copyBoard(board) {
  return board.map((row) => [...row]);
}

function createPuzzleFromSolution(solvedBoard, holes) {
  const board = copyBoard(solvedBoard);
  const positions = shuffle(Array.from({ length: 81 }, (_, i) => i));

  for (let i = 0; i < holes && i < positions.length; i += 1) {
    const pos = positions[i];
    const row = Math.floor(pos / 9);
    const col = pos % 9;
    board[row][col] = 0;
  }

  return board;
}

function createCell(row, col, value) {
  const input = document.createElement('input');
  input.className = 'cell';
  input.setAttribute('maxlength', '1');
  input.setAttribute('inputmode', 'numeric');
  input.dataset.row = row;
  input.dataset.col = col;

  if ((col + 1) % 3 === 0 && col !== 8) {
    input.style.borderRight = '2px solid #111827';
  }
  if ((row + 1) % 3 === 0 && row !== 8) {
    input.style.borderBottom = '2px solid #111827';
  }

  if (value !== 0) {
    input.value = value;
    input.disabled = true;
    input.classList.add('fixed');
  }

  input.addEventListener('input', () => {
    input.value = input.value.replace(/[^1-9]/g, '').slice(0, 1);
    clearStatus();
  });

  return input;
}

function renderBoard(board) {
  boardEl.innerHTML = '';
  for (let row = 0; row < 9; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      boardEl.appendChild(createCell(row, col, board[row][col]));
    }
  }
}

function readBoardFromUI() {
  const board = Array.from({ length: 9 }, () => Array(9).fill(0));
  document.querySelectorAll('.cell').forEach((cell) => {
    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);
    board[row][col] = Number(cell.value) || 0;
  });
  return board;
}

function setStatus(message, type = '') {
  statusEl.textContent = message;
  statusEl.className = `status ${type}`.trim();
}

function clearStatus() {
  setStatus('');
}

function checkBoard() {
  const currentBoard = readBoardFromUI();

  for (let row = 0; row < 9; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      const value = currentBoard[row][col];
      if (value === 0) {
        setStatus('La grille est incomplète.', 'error');
        return;
      }

      if (value !== solution[row][col]) {
        setStatus('Il y a des erreurs dans la grille.', 'error');
        return;
      }
    }
  }

  setStatus('Bravo ! Sudoku résolu 🎉', 'success');
}

function solveBoard() {
  renderBoard(solution);
  setStatus('Solution affichée.', 'success');
}

function startNewGame() {
  setStatus('Génération de la grille...');
  const difficulty = difficultyEl.value;
  const holes = difficultyToHoles[difficulty];

  setTimeout(() => {
    solution = generateSolvedBoard();
    puzzle = createPuzzleFromSolution(solution, holes);
    renderBoard(puzzle);
    setStatus(`Nouvelle grille (${difficulty === 'easy' ? 'facile' : difficulty === 'medium' ? 'moyen' : 'dur'}).`);
  }, 20);
}

newGameBtn.addEventListener('click', startNewGame);
checkBtn.addEventListener('click', checkBoard);
solveBtn.addEventListener('click', solveBoard);

document.addEventListener('keydown', (event) => {
  const active = document.activeElement;
  if (!active || !active.classList.contains('cell') || active.disabled) {
    return;
  }

  if (event.key === 'Backspace' || event.key === 'Delete') {
    active.value = '';
    clearStatus();
  }
});

startNewGame();
