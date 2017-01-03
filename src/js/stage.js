import createjs from 'createjs-combined'

// config
const CANVAS_ID = 'mainCanvas';

const stage = new createjs.Stage(CANVAS_ID);
// stage.enableMouseOver();

// make responsive
const fillStageToWindow = () => { 
	stage.canvas.width = window.innerWidth;
	stage.canvas.height = window.innerHeight;     
}
window.addEventListener('resize', fillStageToWindow, false); 
fillStageToWindow();

// keep everything updated
createjs.Ticker.setFPS(50);
createjs.Ticker.addEventListener("tick", stage);

export default stage;