import { each, sortBy } from 'lodash';
import Tone from 'tone';
import { SynthNode, MasterNode, PartNode, PluckSynthNode, Metronome, BitCrusherNode, PitchShiftNode, ChorusNode } from './components';

import nodeType from '../src/constants/nodeType';
import ether from './ether';
import stage from './stage';

import '../css/app.less';

Tone.Transport.start();

const masterNode = new MasterNode({ x: 100, y: 100 });
const synthNode = new SynthNode({ x: 150, y: 200 });
const synthNode2 = new PluckSynthNode({ x: 200, y: 100 });

const effect2 = new ChorusNode({ x: 410, y: 350 });
const effect3 = new PitchShiftNode({ x: 500, y: 350 });
const effect1 = new BitCrusherNode({ x: 350, y: 350 });

const metronome1 = new Metronome({ frequency: '4n', x: 300, y: 300 });
const metronome2 = new Metronome({ frequency: '2n', x: 600, y: 300 });

const part1 = new PartNode({ x: 600, y: 100 });
const part2 = new PartNode({ x: 500, y: 100 });

// God method
const connectNodes = masterNode => {
	let femaleNodes = [];
	let maleNodes = [];
	let connectedFemaleNodes = [masterNode];

	each(stage.children, node => {
		if(node.nodeType === nodeType.MASTER || node.nodeType === nodeType.EFFECT) {
			femaleNodes.push(node);
		}
		if(node.nodeType === nodeType.INSTRUMENT || node.nodeType === nodeType.EFFECT) {
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
		if (maleNode.nodeType === nodeType.EFFECT) {
			connectedFemaleNodes.push(maleNode);
		}
	})
}
connectNodes(masterNode);

ether.on('NODE_MOVE', () => {
	connectNodes(masterNode);
});
