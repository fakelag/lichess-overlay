# Lichess Overlay

A project skeleton for full-stack web development using TypeScript, GraphQL, MongoDB and React.

## Languages
* JavaScript

## Dependencies
* `https://raw.githubusercontent.com/fakelag/chess.js/master/chess.js` must also get loaded before `overlay.js`

## Setup
* Clone or download `overlay.js` to your computer
* Inject it into the web page after `lichess.org` loads it's own scripts

## Features
| Feature  |  |
| ------------- | ------------- |
| Display captures by my pieces | ✓ |
| Display captures by opponent's pieces | ✓ |
| Rendering (lichess native SVG arrows) | ✓ |
| Rendering (custom canvas overlay) | ✓ |
| Show stockfish move suggestions | TODO |

## Images

### Move arrows
![Move arrows](https://raw.githubusercontent.com/fakelag/lichess-overlay/master/img/img0.png)
![Move arrows](https://raw.githubusercontent.com/fakelag/lichess-overlay/master/img/img1.png)

### Settings GUI
![Settings](https://raw.githubusercontent.com/fakelag/lichess-overlay/master/img/img2.png)

### Canvas rendering
![Settings](https://raw.githubusercontent.com/fakelag/lichess-overlay/master/img/img3.png)

## Todo List
* Add stockfish (or any other chess engine) integration via a local server
* Add an option to display captures multiple moves to the future