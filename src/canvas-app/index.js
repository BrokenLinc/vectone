import { each, sortBy } from 'lodash';
import Tone from 'tone';
import { SynthNode, MasterNode, PartNode, PluckSynthNode, Metronome, BitCrusherNode, PitchShiftNode, ChorusNode } from './classes';

import EVENT from './event';
import NODE_TYPE from './nodeType';
import ether from './ether';
import stage from './stage';

// TODO: handle starting another way, done once
window.addEventListener('keypress', (e) => {
	if(e.code === 'KeyS') {
		begin();
	}
});

const begin = () => {

	Tone.Transport.start();

	const masterNode = new MasterNode({x: 100, y: 100});
	new SynthNode({x: 150, y: 200});
	new PluckSynthNode({x: 200, y: 100});

	new ChorusNode({x: 410, y: 350});
	new PitchShiftNode({x: 500, y: 350});
	new BitCrusherNode({x: 350, y: 350});

	new Metronome({frequency: '4n', x: 300, y: 300});
	new Metronome({frequency: '2n', x: 600, y: 300});

	new PartNode({x: 600, y: 100});
	new PartNode({x: 500, y: 100});

	console.log(masterNode);

  // God method
	const connectNodes = masterNode => {
		let femaleNodes = [];
		let maleNodes = [];
		let connectedFemaleNodes = [masterNode];

		each(stage.children, node => {
			if (node.nodeType === NODE_TYPE.MASTER || node.nodeType === NODE_TYPE.EFFECT) {
				femaleNodes.push(node);
			}
			if (node.nodeType === NODE_TYPE.INSTRUMENT || node.nodeType === NODE_TYPE.EFFECT) {
				maleNodes.push(node);
			}
		});

		maleNodes = sortBy(maleNodes, maleNode => {
			return Math.pow(masterNode.x - maleNode.x, 2) + Math.pow(masterNode.y - maleNode.y, 2);
		});

		each(maleNodes, maleNode => {
			const closestConnectedFemaleNode = sortBy(connectedFemaleNodes, femaleNode => {
				return Math.pow(femaleNode.x - maleNode.x, 2) + Math.pow(femaleNode.y - maleNode.y, 2);
			})[0];

			maleNode.connect(closestConnectedFemaleNode);

			// hermaphrodite!
			if (maleNode.nodeType === NODE_TYPE.EFFECT) {
				connectedFemaleNodes.push(maleNode);
			}
		})
	}
	connectNodes(masterNode);

	ether.on(EVENT.NODE_MOVE, () => {
		connectNodes(masterNode);
	});
};
