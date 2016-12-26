import { assign, each, remove, uniq } from 'lodash';
import createjs from 'createjs-combined';
import Tone from 'tone';

import nodeType from '../nodeType';
import { animateProps, distanceBetweenNodesShorterThan, moveToFront } from '../helpers';
import ether from '../ether';
import stage from '../stage';

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

class Grip extends createjs.Shape {
	constructor(props) {
		super(props);

		this.graphics
			.beginFill('black')
			.drawCircle(0, 0, GRIP_SIZE / 2);
	}
}

class RangeRing extends createjs.Shape {
	constructor(props) {
		super(props);

		this.graphics
			.setStrokeDash([7, 7])
			.setStrokeStyle(1)
			.beginStroke('#888')
			.drawCircle(0, 0, EVENT_RANGE);
	}
}

class PulseRing extends createjs.Shape {
	constructor(props) {
		super(props);

		this.graphics
			.setStrokeStyle(1)
			.beginStroke('black')
			.drawCircle(0, 0, GRIP_SIZE / 2);
	}
}

class SolidCircle extends createjs.Shape {
	constructor({ fill, radius }) {
		super();

		this.graphics
			.beginFill(fill || 'white')
			.drawCircle(0, 0, radius || 9);
	}
}

class Node extends createjs.Container {
	constructor(props) {
		super(props);

		this.set(props);

		this.receiverNodes = [];

		const grip = new Grip();
		this.addChild(grip);

		grip.on('pressmove', e => {
			const node = this;

			moveToFront(node);
			node.x = e.stageX;
			node.y = e.stageY;

			if(node.nodeType === nodeType.INSTRUMENT) {
				ether.trigger('INSTRUMENT_MOVE', { node });
			}
			if(node.nodeType === nodeType.EFFECT) {
				ether.trigger('EFFECT_MOVE', { node });
			}
		});

		stage.addChild(this);
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

			const ring = new PulseRing();
			this.addChild(ring);

			createjs.Tween.get(ring)
				.to({
					alpha: 0,
					scaleX: 1.7,
					scaleY: 1.7 
				}, durationMilliseconds, createjs.Ease.getPowOut(3))
				.call(() => {
					this.removeChild(ring);
				});
	}
	dispose() {
		//TODO: remove all children
	}
}

class EventNode extends Node {
	constructor(props) {
		super(props);

		this.nodeType = nodeType.EVENT;
		this.range = EVENT_RANGE;
	}
}

// control volume/intensity somehow
class InstrumentNode extends Node {
	constructor(props) {
		super(props);
		this.nodeType = nodeType.INSTRUMENT;
		this.effects = [];

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
			this.connectEffect(node.effect);
		} else {
			this.disconnectEffect(node.effect);
		}
	}
	connectEffect(effect) {
		this.effects.push(effect);
		this.effects = uniq(this.effects);
		this.applyEffects();
	}
	disconnectEffect(effect) {
		remove(this.effects, effect);
		this.applyEffects();
	}
	applyEffects() {
		this.synth.disconnect();
		each(this.effects, effect => {
			this.synth.connect(effect);
		})
		if(this.effects.length <= 0) {
			this.synth.connect(Tone.Master);
		}
	}
	dispose() {
		ether.off('EVENT_SIGNAL', this.onEventSignal);
		super.dispose();
	}
}

// control wetness somehow
class EffectNode extends Node {
	constructor(props) {
		super(props);

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
	constructor(props) {
		super(props);

		this.icon = new SolidCircle({
			fill: 'cyan',
			radius: 9
		});
		this.addChild(this.icon);

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
	constructor(props) {
		super(props);

		this.icon = new SolidCircle({
			fill: 'orange',
			radius: 9
		});
		this.addChild(this.icon);

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
	constructor(props) {
		super(props);
		this.frequency = props.frequency;

		this.onLoop = this.onLoop.bind(this);

		const rangeRing = new RangeRing();
		this.addChild(rangeRing);

		this.icon = new SolidCircle({
			fill: 'blue',
			radius: 9
		});
		this.addChild(this.icon);

		this.loop = new Tone.Loop(this.onLoop, this.frequency);
		this.loop.start();
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
	constructor(props) {
		super(props);

		const rangeRing = new RangeRing();
		this.addChild(rangeRing);

		this.icon = new SolidCircle({
			fill: 'yellow',
			radius: 9
		});
		this.addChild(this.icon);

		this.effect = new Tone.BitCrusher(4).toMaster();
	}
	dispose() {
		this.effect.dispose();
		super.dispose();
	}
}

class PitchShiftNode extends EffectNode {
	constructor(props) {
		super(props);

		const rangeRing = new RangeRing();
		this.addChild(rangeRing);

		this.icon = new SolidCircle({
			fill: 'pink',
			radius: 9
		});
		this.addChild(this.icon);

		this.effect = new Tone.PitchShift(-8).toMaster();
	}
	dispose() {
		this.effect.dispose();
		super.dispose();
	}
}

class ChorusNode extends EffectNode {
	constructor(props) {
		super(props);

		const rangeRing = new RangeRing();
		this.addChild(rangeRing);

		this.icon = new SolidCircle({
			fill: 'purple',
			radius: 9
		});
		this.addChild(this.icon);

		this.effect = new Tone.Chorus().toMaster();
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
	PitchShiftNode,
	ChorusNode,
};