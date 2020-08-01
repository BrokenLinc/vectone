import { each, filter } from 'lodash';

import stage from '../stage';

const randomInteger = (min, max) => {
	return min + Math.floor(Math.random() * (max - min + 1));
}

const setProps = (object, props) => {
	each(props, (val, i) => {
		object.set(i, val);
	});
}

const animateProps = (object, props, options) => {
	each(props, (val, i) => {
		object.animate(i, val, options);
	});
}

const getNodesInRange = (mainNode, type) => {
	return filter(stage.children, node => {
		if (node === mainNode) return false;
		if (type && node.nodeType !== type) return false;
		return distanceBetweenNodesShorterThan(mainNode, node, 100);
	});
}

const distanceBetweenNodesShorterThan = (node1, node2, distance) => {
	const xdist = node1.x - node2.x;
	const ydist = node1.y - node2.y;
	return xdist * xdist + ydist * ydist < distance * distance;
}

const distanceBetweenNodes = (node1, node2) => {
	const xdist = node1.x - node2.x;
	const ydist = node1.y - node2.y;
	return Math.sqrt(xdist * xdist + ydist * ydist);
}

const draggable = (object, _dragObject) => {
	const dragObject = _dragObject || object;

	dragObject.on('pressmove', e => {
		moveToFront(object);
		object.x = e.stageX;
		object.y = e.stageY;
	});
}

const moveToFront = displayObject => {
	stage.setChildIndex(displayObject, stage.getNumChildren() - 1);
}

module.exports = {
	setProps,
	animateProps,
	getNodesInRange,
	distanceBetweenNodesShorterThan,
	moveToFront,
	distanceBetweenNodes,
	randomInteger,
};