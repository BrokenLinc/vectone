import { assign, each, indexOf, remove } from 'lodash';
import { fabric } from 'fabric-browseronly';
import Tone from 'tone';

import nodeType from '../nodeType';
import { animateProps, distanceBetweenNodesShorterThan } from '../helpers';
import ether from '../ether';
import canvas from '../canvas';

const GRIP_SIZE = 50;
const EVENT_RANGE = 100;
const EFFECT_RANGE = 100;
const RANGE_RING_PROPS = {
	fill: 'transparent',
	stroke: 'black',
	strokeDashArray: [7, 7], 
	strokeWidth: 1,
	opacity: 0.4,
};

fabric.Object.prototype.set({
	originX: 'center',
	originY: 'center',
});

class RangeRing extends fabric.Circle {
	initialize(props) {
		super.initialize(assign(props, RANGE_RING_PROPS));
	}
}

class Node extends fabric.Group {
	initialize(props) {
		super.initialize([], assign({
			width: GRIP_SIZE,
			height: GRIP_SIZE,
			hasControls: false,
			borderColor: 'transparent',
			// selectable: false,
			// lockScalingX: true,
			// lockScalingY: true,
		} ,props));

		// this.setControlsVisibility({
		// 	mt: false,
		// 	mb: false,
		// 	ml: false,
		// 	mr: false,
		// 	tr: false,
		// 	tl: false,
		// 	br: false,
		// 	bl: false
		// });
		// this.hasRotatingPoint = true;

		this.receiverNodes = [];
		
		this.grip = new fabric.Circle({
			fill: 'black',
			radius: GRIP_SIZE / 2,
		});
		this.add(this.grip);

		canvas.add(this);
	}
	setReceivers(nodes) {
		this.receiverNodes = nodes;
	}
	receiveSignal(props) {
		this.spawnRing(props);
	}
	spawnRing({ note, duration, frequency, intensity }) {
		const durationMilliseconds =
			new Tone.Time(duration || frequency).toMilliseconds();
		const ring = new fabric.Circle({
			stroke: 'black',
			strokeWidth: 1,
			radius: 20,
			fill: null,
		});
		this.add(ring);

		animateProps(
			ring, 
			{ scaleX: 1.7, scaleY: 1.7, opacity: 0 },
			{
				duration: durationMilliseconds,
				easing: fabric.util.ease.easeOutCubic,
				onComplete: () => {
					this.remove(ring);
				}
			});
	}
	dispose() {
		//TODO: remove all children
	}
}

class EventNode extends Node {
	initialize(props) {
		super.initialize(props);

		this.nodeType = nodeType.EVENT;
		this.range = EVENT_RANGE;
	}
}

// control volume/intensity somehow
class InstrumentNode extends Node {
	initialize(props) {
		super.initialize(props);
		this.nodeType = nodeType.INSTRUMENT;
		this.effectNodes = [];

		this.onEventSignal = this.onEventSignal.bind(this);
		this.onEffectMove = this.onEffectMove.bind(this);

		ether.on('EVENT_SIGNAL', this.onEventSignal);
		ether.on('EFFECT_MOVE', this.onEffectMove);
	}
	onEventSignal({ node, signal }) {
		if (distanceBetweenNodesShorterThan(this, node, node.range + GRIP_SIZE / 2)) {
			this.receiveSignal(signal);
		}
	}
	onEffectMove({ node }) {
		const shouldBeConnected = distanceBetweenNodesShorterThan(this, node, node.range + GRIP_SIZE / 2);

		if (shouldBeConnected) {
			this.connectEffect(node);
		} else {
			this.disconnectEffect(node);
		}

		// if(this.effectNodes.indexOf(effectNode) >= 0) {
		// 	this.effectNodes.push(effectNode);
		// } else {
		// }

		// const effectsGained = difference(effects, this.connectedEffects);
		// const effectsLost = difference(this.connectedEffects, effects);

		// each(effectsGained, effect => {
		// 	effect.synth.connect(this.effect);
		// });

		// each(effectsLost, effect => {
		// 	effect.synth.disconnect(this.effect);
		// });

		// this.connectedEffects = effects;
	}
	connectEffect(node) {
		const nodeIndex = indexOf(this.effectNodes, node);
		const isConnected =  nodeIndex >= 0;
		if (!isConnected) {
			this.effectNodes.push(node);
			this.synth.connect(node.effect);
		}
	}
	disconnectEffect(node) {
		const nodeIndex = indexOf(this.effectNodes, node);
		const isConnected =  nodeIndex >= 0;
		if (isConnected) {
			this.effectNodes.splice(nodeIndex, 1);
			this.synth.disconnect(node.effect);
			if (this.effectNodes.length === 0) {
				this.synth.toMaster();
			}
		}
	}
	dispose() {
		ether.off('EVENT_SIGNAL', this.onEventSignal);
		super.dispose();
	}
}

// control wetness somehow
class EffectNode extends Node {
	initialize(props) {
		super.initialize(props);

		this.nodeType = nodeType.EFFECT;
		this.range = EFFECT_RANGE;

		this.onInstrumentMove = this.onInstrumentMove.bind(this);

		ether.on('INSTRUMENT_MOVE', this.onInstrumentMove);
	}
	onInstrumentMove({ node }) {
		const shouldBeConnected = distanceBetweenNodesShorterThan(this, node, this.range + GRIP_SIZE / 2);

		if (shouldBeConnected) {
			node.connectEffect(this);
		} else {
			node.disconnectEffect(this);
		}
	}
}

// Also
// Tone.Transport control to affect overall BPM
// a global "key", and notes are n, n+1, n+2, etc.

class SynthNode extends InstrumentNode {
	initialize(props) {
		super.initialize(props);

		this.icon = new fabric.Circle({
			fill: 'cyan',
			radius: 9,
		});
		this.add(this.icon);

		this.synth = new Tone.Synth().toMaster();
	}
	receiveSignal(props) {
		super.receiveSignal(props);

		const { time } = props;
		this.synth.triggerAttackRelease('C3', '8n', time, 1);
	}
	dispose() {
		this.synth.dispose();
		super.dispose();
	}
}

class PluckSynthNode extends InstrumentNode {
	initialize(props) {
		super.initialize(props);

		this.icon = new fabric.Circle({
			fill: 'orange',
			radius: 9,
		});
		this.add(this.icon);

		this.synth = new Tone.PluckSynth().toMaster();
	}
	receiveSignal(props) {
		super.receiveSignal(props);

		const { time } = props;
		this.synth.triggerAttackRelease('C3', '8n', time, 0.1);
	}
	dispose() {
		this.synth.dispose();
		super.dispose();
	}
}

class Metronome extends EventNode {
	initialize(props) {
		super.initialize(props);
		this.frequency = props.frequency;

		this.onLoop = this.onLoop.bind(this);

		this.rangeRing = new RangeRing({
			radius: this.range,
		});
		this.add(this.rangeRing);

		this.icon = new fabric.Triangle({
			fill: 'white',
			width: 20, height: 18,
			top: -2.5,
		});
		this.add(this.icon);

		this.loop = new Tone.Loop(this.onLoop, this.frequency);
		this.loop.start();

		// this.on('rotating', event => {
		// 	// let p = (this.angle - 180)/180;
		// 	// let s = p/Math.abs(p);
		// 	// console.log(p - s);
		// 	this.loop.interval = Math.pow(2, Math.ceil(this.angle/360 * 4)) + 'n';
		// });
	}
	onLoop(time) {
		const signal = { time, frequency: this.frequency};
		this.receiveSignal(signal);
		ether.trigger('EVENT_SIGNAL', { node: this, signal });
	}
	dispose() {
		this.loop.dispose();
		super.dispose();
	}
}

class BitCrusherNode extends EffectNode {
	initialize(props) {
		super.initialize(props);

		this.rangeRing = new RangeRing({
			radius: this.range,
		});
		this.add(this.rangeRing);

		this.effect = new Tone.BitCrusher(4).toMaster();
	}
	dispose() {
		this.effect.dispose();
		super.dispose();
	}
}

module.exports = {
	Node,
	SynthNode,
	PluckSynthNode,
	Metronome,
	BitCrusherNode,
};