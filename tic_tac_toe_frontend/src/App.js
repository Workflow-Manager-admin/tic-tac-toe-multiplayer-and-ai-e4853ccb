import React, { useState, useEffect } from 'react';
import './App.css';

/**
 * Color/Theme values per spec:
 * primary: #1e88e5 (main for buttons and highlights)
 * secondary: #90caf9 (board/background accents)
 * accent: #ff7043 (win highlight/accent details)
 * Minimalistic & responsive layout, centered content.
 */

// Helper functions
const emptyBoard = () => Array(9).fill(null);

const calculateWinner = (squares) => {
  const lines = [
    [0,1,2], [3,4,5], [6,7,8], // Rows
    [0,3,6], [1,4,7], [2,5,8], // Columns
    [0,4,8], [2,4,6]           // Diagonals
  ];
  for (const [a, b, c] of lines) {
    if (squares[a] && squares[a] === squares[b] && squares[b] === squares[c])
      return squares[a];
  }
  return null;
};

const isDraw = (squares) =>
  squares.every(cell => cell !== null) && !calculateWinner(squares);

// Minimal AI: choose random empty spot
const aiMove = (board) => {
  const empties = board
    .map((val, idx) => val === null ? idx : null)
    .filter(v => v !== null);
  if (empties.length === 0) return null;
  return empties[Math.floor(Math.random() * empties.length)];
};

/**
 * Game modes
 */
const MODES = {
  PVP: 'Player vs Player',
  PVC: 'Player vs Computer'
};

// PUBLIC_INTERFACE
function App() {
  // Theme toggling
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Game state
  const [mode, setMode] = useState(null);
  const [board, setBoard] = useState(emptyBoard());
  const [xIsNext, setXIsNext] = useState(true);
  const [winner, setWinner] = useState(null);
  const [draw, setDraw] = useState(false);
  const [started, setStarted] = useState(false);

  // Minimal stats: X wins, O wins, draws
  const [stats, setStats] = useState({ X: 0, O: 0, Draw: 0 });

  // Handle game end
  useEffect(() => {
    const win = calculateWinner(board);
    const drawNow = isDraw(board);
    if (win) {
      setWinner(win);
      setDraw(false);
      setStats((prev) => ({ ...prev, [win]: prev[win] + 1 }));
    } else if (drawNow) {
      setDraw(true);
      setWinner(null);
      setStats((prev) => ({ ...prev, Draw: prev.Draw + 1 }));
    }
  // Only run when board changes, but not at init
  // eslint-disable-next-line
  }, [board]);

  // Computer turn effect
  useEffect(() => {
    if (
      started &&
      mode === MODES.PVC &&
      !winner &&
      !draw &&
      !xIsNext // 'O' is computer
    ) {
      // Small delay for realism
      const timeout = setTimeout(() => {
        const move = aiMove(board);
        if (move !== null) handleCellClick(move);
      }, 500);
      return () => clearTimeout(timeout);
    }
    // eslint-disable-next-line
  }, [xIsNext, board, winner, draw, started, mode]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme(t => t === 'light' ? 'dark' : 'light');
  };

  // PUBLIC_INTERFACE
  const handleStartGame = (chosenMode) => {
    setMode(chosenMode);
    setBoard(emptyBoard());
    setXIsNext(true);
    setWinner(null);
    setDraw(false);
    setStarted(true);
  };

  // PUBLIC_INTERFACE
  const handleRestart = () => {
    setBoard(emptyBoard());
    setXIsNext(true);
    setWinner(null);
    setDraw(false);
    setStarted(true);
  };

  // PUBLIC_INTERFACE
  const handleCellClick = (idx) => {
    if (!started || winner || draw || board[idx]) return;
    // Don't allow user click if it's computer's turn in PVC
    if (mode === MODES.PVC && !xIsNext) return;
    const newBoard = board.slice();
    newBoard[idx] = xIsNext ? 'X' : 'O';
    setBoard(newBoard);
    setXIsNext(!xIsNext);
  };

  // Restart to menu
  const handleBackToMenu = () => {
    setMode(null);
    setBoard(emptyBoard());
    setWinner(null);
    setDraw(false);
    setXIsNext(true);
    setStarted(false);
  };

  const renderBoard = () => (
    <div className="ttt-board" role="grid" aria-label="Tic Tac Toe board">
      {board.map((cell, idx) => (
        <button
          key={idx}
          className={`ttt-cell${
            cell ? ' filled' : ''
          }${winner && winner === cell && isWinningCell(idx, board, winner) ? ' win-cell' : ''}`}
          onClick={() => handleCellClick(idx)}
          aria-label={`Cell ${Math.floor(idx / 3) + 1},${(idx % 3) + 1}`}
          disabled={!!winner || !!draw || cell}
        >
          {cell}
        </button>
      ))}
    </div>
  );

  // Check if a given cell is part of the winning line (for highlight)
  function isWinningCell(idx, brd, winMark) {
    const lines = [
      [0,1,2], [3,4,5], [6,7,8], // Rows
      [0,3,6], [1,4,7], [2,5,8], // Cols
      [0,4,8], [2,4,6]
    ];
    for (const line of lines) {
      if (line.includes(idx) &&
        line.every(i => brd[i] === winMark)
      ) {
        return true;
      }
    }
    return false;
  }

  const status = !started
    ? 'Choose game mode to start'
    : winner
      ? `Winner: ${winner}`
      : draw
        ? "It's a draw!"
        : mode === MODES.PVP
          ? `Next: ${xIsNext ? 'X' : 'O'}`
          : xIsNext
            ? "Your turn (X)"
            : "Computer's turn (O)";

  // Render UI
  return (
    <div className="App">
      <header className="App-header ttt-header">
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
        <div className="ttt-container">
          <h1 className="ttt-title">Tic-Tac-Toe</h1>
          {!started ? (
            <>
              <p className="ttt-subtitle">Play against a friend or computer.</p>
              <div className="ttt-mode-buttons">
                <button
                  className="ttt-btn ttt-btn-primary"
                  style={{ background: "var(--primary)", color: "#fff" }}
                  onClick={() => handleStartGame(MODES.PVP)}
                >
                  {MODES.PVP}
                </button>
                <button
                  className="ttt-btn ttt-btn-secondary"
                  style={{ background: "var(--secondary)", color: "#1e88e5" }}
                  onClick={() => handleStartGame(MODES.PVC)}
                >
                  {MODES.PVC}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="ttt-controls">
                <span className="ttt-status">{status}</span>
                <button className="ttt-btn ttt-btn-secondary" onClick={handleRestart}>
                  Restart
                </button>
                <button className="ttt-btn ttt-btn-tertiary" onClick={handleBackToMenu}>
                  Main Menu
                </button>
              </div>
              {renderBoard()}
              <div className="ttt-stats">
                <span className="ttt-stat" style={{ color: "var(--primary)" }}>X wins: {stats.X}</span>
                <span className="ttt-stat" style={{ color: "var(--accent)" }}>O wins: {stats.O}</span>
                <span className="ttt-stat" style={{ color: "var(--text-secondary)" }}>Draws: {stats.Draw}</span>
              </div>
            </>
          )}
        </div>
      </header>
    </div>
  );
}

export default App;
