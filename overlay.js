// ==UserScript==
// @name         Lichess Overlay
// @match        *://lichess.org/*
// @require      https://raw.githubusercontent.com/fakelag/chess.js/master/chess.js
// ==/UserScript==

let lichess = {
    chessJs: undefined,
    round: undefined,
    state: undefined,
    player: 'w',
    canvasId: 'overlay_canvas',
    svgId: 'overlay_svg',
};

let config = {
    circleSize: 16,
    moveColor: '#15781B',
    ponderColor: '#781B15',
    visEngine: 'svg',
    enableMove: false,
    enablePonder: true,
};

const reRenderOverlay = () => {
    const canvas = document.getElementById(lichess.canvasId);
    if (canvas) {
        canvas.parentNode.removeChild(canvas);
    }

    const svg = document.getElementById(lichess.svgId);
    if (svg) {
        svg.parentNode.removeChild(svg);
    }

    initWaterMark(lichess.state.player.color);
    initOptionsMenu();
    onBoardUpdate(lichess.state);
}

const loMoveChanged = (e) => {
    config.enableMove = e.target.checked;
    reRenderOverlay();
}

const loPonderChanged = (e) => {
    config.enablePonder = e.target.checked;
    reRenderOverlay();
}

const loEngineChanged = (e) => {
    config.visEngine = e.target.value;
    reRenderOverlay();
}

const translateBoard = (move, board, size) => {
    const translation = [board.left, board.bottom];
    const x = move.charCodeAt(0) - 97;
    const y = Number.parseInt(move[1]);

    if (lichess.player === 'b') {
        return [translation[0] + (7 - x) * size, board.top + (y - 1) * size];
    }

    return [translation[0] + x * size, translation[1] - y * size];
};

const getChessBoard = () => {
    let boards = document.getElementsByClassName('lichess_board_wrap');

    if (!boards || boards.length !== 1) {
        boards = document.getElementsByTagName('cg-board');
        return boards[0];
    }

    return boards[0];
};

const visualizePath = (ctx, boardRect, boardPieceSize, coord0, coord1, isPonder) => {
    if (config.visEngine === 'svg') {
        const newLine = document.createElementNS('http://www.w3.org/2000/svg','line');
        newLine.setAttribute('stroke', isPonder ? config.ponderColor : config.moveColor);
        newLine.setAttribute('stroke-width', '14.6875');
        newLine.setAttribute('stroke-linecap', 'round');
        newLine.setAttributeNS(null, 'marker-end', `url(#arrowhead-g-${isPonder ? 'p' : 'm'})`);
        newLine.setAttribute('opacity', '1');
        newLine.setAttribute('cgHash', 'c2d4green');
        newLine.setAttribute('id', 'line2');
        newLine.setAttribute('x1', coord0[0] - boardRect.left + boardPieceSize * 0.5);
        newLine.setAttribute('y1', coord0[1] - boardRect.top + boardPieceSize * 0.5);
        newLine.setAttribute('x2', coord1[0] - boardRect.left + boardPieceSize * 0.5);
        newLine.setAttribute('y2', coord1[1] - boardRect.top + boardPieceSize * 0.5);
        ctx.appendChild(newLine);
    } else {
        ctx.beginPath();
        ctx.strokeStyle = isPonder ? config.ponderColor : config.moveColor;
        ctx.lineWidth = 5;
        ctx.moveTo(coord0[0] - boardRect.left + (boardPieceSize / 2), coord0[1] - boardRect.top + (boardPieceSize / 2));
        ctx.lineTo(coord1[0] - boardRect.left + (boardPieceSize / 2), coord1[1] - boardRect.top + (boardPieceSize / 2));
        ctx.stroke();
        ctx.closePath();

        ctx.beginPath();
        ctx.arc(coord1[0] - boardRect.left + (boardPieceSize / 2), coord1[1] - boardRect.top + (boardPieceSize / 2), config.circleSize, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.closePath();
    }
};

const createOverlay = () => {
    const board = getChessBoard();
    const boardRect = board.getBoundingClientRect();
    const boardSize = (boardRect.right - boardRect.left);
    const boardPieceSize = (boardRect.right - boardRect.left) / 8;
    let div = document.createElement('div');
    div.setAttribute('class', 'lichess-overlay-container');

    let canvasStyle = `pointer-events: none; z-index: 900; position: absolute; top: ${boardRect.top}px; left: ${boardRect.left}px`;
    div.innerHTML = `<canvas id="${lichess.canvasId}" width="${boardSize}" height="${boardSize}" style="${canvasStyle}"></canvas>`.trim();
    document.body.appendChild(div);

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('id', lichess.svgId);
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svg.setAttribute('style', `position:absolute;top:${boardRect.top}px;left:${boardRect.left}px;z-index:1000;pointer-events:none;opacity:0.4;`);
    svg.setAttribute('width', `${boardSize}px`);
    svg.setAttribute('height', `${boardSize}px`);
    svg.innerHTML = `<defs> \
<marker id="arrowhead-g-m" orient="auto" markerWidth="4" markerHeight="8" refX="2.05" refY="2.01" cgKey="g"><path d="M0,0 V4 L3,2 Z" fill="${config.moveColor}"> </path></marker> \
<marker id="arrowhead-g-p" orient="auto" markerWidth="4" markerHeight="8" refX="2.05" refY="2.01" cgKey="g"><path d="M0,0 V4 L3,2 Z" fill="${config.ponderColor}"></path></marker> \
<defs>`;

    const canvas = document.getElementById(lichess.canvasId);

    div.appendChild(svg);
    return canvas;
}

const clearOverlay = () => {
    const board = getChessBoard();
    const boardRect = board.getBoundingClientRect();
    const boardSize = (boardRect.right - boardRect.left);

    const removeList = document.getElementsByClassName('lichess-overlay-container');
    for (let i = removeList.length - 1; i >= 0; --i) {
        removeList[i].parentNode.removeChild(removeList[i]);
    }

    let canvas = document.getElementById(lichess.canvasId);
    let svg = document.getElementById(lichess.svgId);

    if (!canvas || !svg) {
        canvas = createOverlay();
        svg = document.getElementById(lichess.svgId);
    }

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, boardSize, boardSize);

    for (let i = svg.children.length - 1; i >= 0; i--) {
        if (svg.children[i].tagName.toLowerCase() !== 'defs') {
            svg.removeChild(svg.children[i]);
        }
    }
}

const visualizeMove = (nextMove, isPonder) => {
    const board = getChessBoard();
    const boardRect = board.getBoundingClientRect();
    const boardSize = (boardRect.right - boardRect.left);
    const boardPieceSize = (boardRect.right - boardRect.left) / 8;

    let bestMoveCoord0 = translateBoard(nextMove.substring(0, 2), boardRect, boardPieceSize);
    let bestMoveCoord1 = translateBoard(nextMove.substring(2, 4), boardRect, boardPieceSize);

    let canvas = document.getElementById(lichess.canvasId);

    if (!canvas) {
        canvas = createOverlay();
    }

    let svg = document.getElementById(lichess.svgId);

    if (canvas && svg) {
        visualizePath(config.visEngine === 'svg' ? svg : canvas.getContext('2d'), boardRect, boardPieceSize, bestMoveCoord0, bestMoveCoord1, isPonder);
    }

    // console.log('[LO] Visualized move: ', nextMove);
};

const initWaterMark = (playerColor) => {
    const board = getChessBoard();
    const boardRect = board.getBoundingClientRect();

    const removeList = document.getElementsByClassName('lichess-overlay-wm');
    for (let i = removeList.length - 1; i >= 0; --i) {
        removeList[i].parentNode.removeChild(removeList[i]);
    }

    let div = document.createElement('div');
    div.setAttribute('class', 'lichess-overlay-wm');

    let stylestring = `color: red; position: absolute; top: ${boardRect.top - 16}px; left: ${boardRect.left}px`;
    div.innerHTML = `<div style="${stylestring}">Lichess Overlay (playing ${playerColor})</div>`.trim();
    document.body.appendChild(div);
};

const initOptionsMenu = () => {
    const side = document.getElementsByClassName('round__side');

    if (!side[0]) {
        console.error('[LO] round__side not found. Unable to create options menu.');
        return;
    }

    const removeList = document.getElementsByClassName('lichess-overlay-options');
    for (let i = removeList.length - 1; i >= 0; --i) {
        removeList[i].parentNode.removeChild(removeList[i]);
    }

    const form = document.createElement('form');
    form.setAttribute('class', 'lichess-overlay-options');
    form.setAttribute('style', 'width:500px');
    form.innerHTML = ` \
<input type="checkbox" id="lo_show_move" name="lo_show_move">Show my moves</input><br /> \
<input type="checkbox" id="lo_show_ponder" name="lo_show_ponder">Show opponent's moves</input> <br />
<input type="checkbox" id="lo_show_bestmove" name="lo_show_bestmove" disabled>Stockfish recommendation (Coming Soon)</input> <br />\
Render engine: <select id="lo_renderer"> \
  <option value="svg">Svg</option> \
  <option value="canvas">Canvas</option> \
</select> \
`;

    side[0].appendChild(form);

    let element = document.getElementById('lo_show_move');
    element.onchange = loMoveChanged;
    element.checked = config.enableMove;

    element = document.getElementById('lo_show_ponder');
    element.onchange = loPonderChanged
    element.checked = config.enablePonder;

    element = document.getElementById('lo_renderer');
    element.onchange = loEngineChanged
    element.value = config.visEngine;
}

const onBoardUpdate = (data) => {
    if (data.steps.length <= 0) {
        return;
    }

    lichess.chessJs.load(data.game.fen);

    for (const step of data.steps) {
        if (step.san) {
            lichess.chessJs.move(step.san);
        } else {
            lichess.chessJs.load(step.fen);
        }
    }

    console.log('[LO] Game state: ', lichess.chessJs.fen());
    console.log(lichess.chessJs.ascii());
    const curFen = lichess.chessJs.fen();
    const curTurn = lichess.chessJs.turn();

    clearOverlay();

    for (const row of 'abcdefgh') {
        for (const col of '12345678') {
            const square = row + col;
            const piece = lichess.chessJs.get(square);

            if (!piece) {
                continue;
            }

            lichess.chessJs.load(curFen);
            if (piece.color === lichess.player) {
                if (!config.enableMove) {
                    continue;
                }
                lichess.chessJs.setTurn(lichess.player);
                const moves = lichess.chessJs.moves({ square: square, verbose: true });

                for (const move of moves) {
                    const toPiece = lichess.chessJs.get(move.to);
                    if (toPiece && toPiece.color !== lichess.player) {
                        visualizeMove(move.from + move.to, false);
                    }
                }
            } else {
                if (!config.enablePonder) {
                    continue;
                }
                lichess.chessJs.setTurn(lichess.player === 'w' ? 'b' : 'w');
                const moves = lichess.chessJs.moves({ square: square, verbose: true });

                for (const move of moves) {
                    const toPiece = lichess.chessJs.get(move.to);
                    if (toPiece && toPiece.color === lichess.player) {
                        visualizeMove(move.from + move.to, true);
                    }
                }
            }
        }
    }

    lichess.chessJs.setTurn(curTurn);
    lichess.chessJs.load(curFen);
};

function bootHook(e) {
    console.log('[LO] bootHook: ', e);
    return lichess.round.boot(e);
}

function initModuleHook(e) {
    console.log('[LO] initModuleHook: ', e);
    lichess.player = e.data.player.color === 'white' ? 'w' : 'b';
    lichess.chessJs = new Chess();

    const next = e.onChange;
    e.onChange = (e) => {
        onBoardUpdate(e);
        next();
    };

    initWaterMark(e.data.player.color);
    initOptionsMenu();

    if (lichess.player === 'w') {
        onBoardUpdate(e.data);
    }

    lichess.state = e.data;
    return lichess.round.app(e);
};

function setRound(value) {
    lichess.round = value;
};

function getRound() {
    return { ...lichess.round, app: initModuleHook, boot: bootHook };
};

(function() {
    'use strict';
    setRound(unsafeWindow.LichessRound);
    unsafeWindow.__defineSetter__('LichessRound', setRound);
    unsafeWindow.__defineGetter__('LichessRound', getRound);

    // handle resizing
    const body = document.getElementsByTagName('body');
    body[0].onresize = (e) => {
        if (lichess.state) {
            reRenderOverlay();
        }
    }

    console.log('[LO] Lichess Overlay Enabled');
})();