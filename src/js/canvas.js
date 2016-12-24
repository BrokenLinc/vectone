import { assign } from 'lodash';
import { fabric } from 'fabric-browseronly'

// config
const CANVAS_ID = 'mainCanvas';

const canvas = new fabric.Canvas(CANVAS_ID);

const makeResponsive = () => {
	const makeFullScreen = () => {
		var width = (window.innerWidth > 0) ? window.innerWidth : screen.width;
		var height = (window.innerHeight > 0) ? window.innerHeight : screen.height;
		canvas.setDimensions({
			width,
			height,
		});
	}

	window.addEventListener('resize', makeFullScreen);
	window.addEventListener('orientationChange', makeFullScreen);

	makeFullScreen();
};

const animate = () => {
	canvas.renderAll();
	fabric.util.requestAnimFrame(animate, canvas.getElement);
};

makeResponsive();
animate();

export default canvas;