import { each, sortBy } from 'lodash';
import Tone from 'tone';
import { SynthNode, MasterNode, PluckSynthNode, Metronome, BitCrusherNode, PitchShiftNode, ChorusNode } from './components';

import nodeType from './nodeType';
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

// synthNode.connect(masterNode);
//synthNode.disconnect();

const metronome1 = new Metronome({ frequency: '4n', x: 300, y: 300 });

const metronome2 = new Metronome({ frequency: '2n', x: 600, y: 300 });

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

// //use an array of objects as long as the object has a "time" attribute
// var part = new Tone.Part(function(time, value){
// 	//the value is an object which contains both the note and the velocity
// 	synth.triggerAttackRelease(value.note, "8n", time, value.velocity);
// }, [{"time" : 0, "note" : "C3", "velocity": 0.9}, 
// 	   {"time" : "0:2", "note" : "C4", "velocity": 0.5},
// 	   {"time" : "0:3", "note" : "C3", "velocity": 0.9}, 
// ]).start(0);
// part.loop = true;

// //toggle
// window.addEventListener('click', () => {
// 	//part.mute = !part.mute;
// 	crusher.wet.value = 1 - crusher.wet.value;
// });
