import { each, filter } from 'lodash';

import stage from './stage';

export const setProps = (object, props) => {
	each(props, (val, i) => {
		object.set(i, val);
	});
}

export const animateProps = (object, props, options) => {
	each(props, (val, i) => {
		object.animate(i, val, options);
	});
}

export const getNodesInRange = (mainNode, type) => {
	return filter(stage.children, node => {
		if (node === mainNode) return false;
		if (type && node.nodeType !== type) return false;
		return distanceBetweenNodesShorterThan(mainNode, node, 100);
	});
}

export const distanceBetweenNodesShorterThan = (node1, node2, distance) => {
	const xdist = node1.x - node2.x;
	const ydist = node1.y - node2.y;
	return xdist * xdist + ydist * ydist < distance * distance;
}

export const distanceBetweenNodes = (node1, node2) => {
	const xdist = node1.x - node2.x;
	const ydist = node1.y - node2.y;
	return Math.sqrt(xdist * xdist + ydist * ydist);
}

// const draggable = (object, _dragObject) => {
// 	const dragObject = _dragObject || object;
//
// 	dragObject.on('pressmove', e => {
// 		moveToFront(object);
// 		object.x = e.stageX;
// 		object.y = e.stageY;
// 	});
// }

export const moveToFront = displayObject => {
	stage.setChildIndex(displayObject, stage.numChildren - 1);
}
