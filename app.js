const boardEl = document.getElementById('sudoku-board');
const difficultyEl = document.getElementById('difficulty');
const newGameBtn = document.getElementById('new-game-btn');
const checkBtn = document.getElementById('check-btn');
const solveBtn = document.getElementById('solve-btn');
const statusEl = document.getElementById('status');

const difficultyLevels = {
  'very-easy': { holes: 30, label: 'très facile' },
  easy: { holes: 38, label: 'facile' },
  medium: { holes: 46, label: 'moyen' },
  hard: { holes: 54, label: 'difficile' },
  expert: { holes: 60, label: 'expert' },
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
    input.classList.remove('error-cell');
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

function clearErrorHighlights() {
  document.querySelectorAll('.cell.error-cell').forEach((cell) => {
    cell.classList.remove('error-cell');
  });
}

function markErrorCell(row, col) {
  const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
  if (cell && !cell.disabled) {
    cell.classList.add('error-cell');
  }
}

function highlightClueMismatches(board) {
  for (let row = 0; row < 9; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      if (puzzle[row][col] !== 0 && board[row][col] !== puzzle[row][col]) {
        markErrorCell(row, col);
      }
    }
  }
}

function highlightDuplicateErrors(board) {
  for (let row = 0; row < 9; row += 1) {
    const positions = new Map();
    for (let col = 0; col < 9; col += 1) {
      const value = board[row][col];
      if (!positions.has(value)) {
        positions.set(value, []);
      }
      positions.get(value).push({ row, col });
    }

    positions.forEach((cells) => {
      if (cells.length > 1) {
        cells.forEach(({ row: r, col: c }) => markErrorCell(r, c));
      }
    });
  }

  for (let col = 0; col < 9; col += 1) {
    const positions = new Map();
    for (let row = 0; row < 9; row += 1) {
      const value = board[row][col];
      if (!positions.has(value)) {
        positions.set(value, []);
      }
      positions.get(value).push({ row, col });
    }

    positions.forEach((cells) => {
      if (cells.length > 1) {
        cells.forEach(({ row: r, col: c }) => markErrorCell(r, c));
      }
    });
  }

  for (let boxRow = 0; boxRow < 3; boxRow += 1) {
    for (let boxCol = 0; boxCol < 3; boxCol += 1) {
      const positions = new Map();
      for (let row = boxRow * 3; row < boxRow * 3 + 3; row += 1) {
        for (let col = boxCol * 3; col < boxCol * 3 + 3; col += 1) {
          const value = board[row][col];
          if (!positions.has(value)) {
            positions.set(value, []);
          }
          positions.get(value).push({ row, col });
        }
      }

      positions.forEach((cells) => {
        if (cells.length > 1) {
          cells.forEach(({ row: r, col: c }) => markErrorCell(r, c));
        }
      });
    }
  }
}


function isBoardComplete(board) {
  for (let row = 0; row < 9; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      if (board[row][col] < 1 || board[row][col] > 9) {
        return false;
      }
    }
  }
  return true;
}

function isBoardValid(board) {
  for (let row = 0; row < 9; row += 1) {
    const rowSeen = new Set();
    const colSeen = new Set();

    for (let i = 0; i < 9; i += 1) {
      const rowValue = board[row][i];
      const colValue = board[i][row];

      if (rowSeen.has(rowValue) || colSeen.has(colValue)) {
        return false;
      }

      rowSeen.add(rowValue);
      colSeen.add(colValue);
    }
  }

  for (let boxRow = 0; boxRow < 3; boxRow += 1) {
    for (let boxCol = 0; boxCol < 3; boxCol += 1) {
      const seen = new Set();
      for (let r = boxRow * 3; r < boxRow * 3 + 3; r += 1) {
        for (let c = boxCol * 3; c < boxCol * 3 + 3; c += 1) {
          const value = board[r][c];
          if (seen.has(value)) {
            return false;
          }
          seen.add(value);
        }
      }
    }
  }

  return true;
}

function respectsInitialClues(board) {
  for (let row = 0; row < 9; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      if (puzzle[row][col] !== 0 && board[row][col] !== puzzle[row][col]) {
        return false;
      }
    }
  }
  return true;
}

function checkBoard() {
  const currentBoard = readBoardFromUI();
  clearErrorHighlights();

  if (!isBoardComplete(currentBoard)) {
    setStatus('La grille est incomplète.', 'error');
    return;
  }

  if (!respectsInitialClues(currentBoard)) {
    highlightClueMismatches(currentBoard);
    setStatus('La grille ne respecte pas les indices de départ.', 'error');
    return;
  }

  if (!isBoardValid(currentBoard)) {
    highlightDuplicateErrors(currentBoard);
    setStatus('Il y a des erreurs dans la grille.', 'error');
    return;
  }

  setStatus('Bravo ! Sudoku résolu 🎉', 'success');
}

function solveBoard() {
  renderBoard(solution);
  setStatus('Solution affichée.', 'success');
}

function startNewGame() {
  setStatus('Génération de la grille...');
  clearErrorHighlights();
  const difficulty = difficultyEl.value;
  const { holes, label } = difficultyLevels[difficulty];

  setTimeout(() => {
    solution = generateSolvedBoard();
    puzzle = createPuzzleFromSolution(solution, holes);
    renderBoard(puzzle);
    setStatus(`Nouvelle grille (${label}).`);
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
