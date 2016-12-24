import { each, filter } from 'lodash';

import canvas from '../canvas';

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
	return filter(canvas.getObjects(), node => {
		if (node === mainNode) return false;
		if (type && node.nodeType !== type) return false;
		return distanceBetweenNodesShorterThan(mainNode, node, 100);
	});
}

const distanceBetweenNodesShorterThan = (node1, node2, distance) => {
	const xdist = node1.left - node2.left;
	const ydist = node1.top - node2.top;
	return xdist * xdist + ydist * ydist < distance * distance;
}

module.exports = {
	setProps,
	animateProps,
	getNodesInRange,
	distanceBetweenNodesShorterThan,
};