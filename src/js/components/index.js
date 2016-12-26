import { assign, each, remove, uniq } from 'lodash';
import createjs from 'createjs-combined';
import Tone from 'tone';

import nodeType from '../nodeType';
import { animateProps, distanceBetweenNodesShorterThan, moveToFront } from '../helpers';
import ether from '../ether';
import stage from '../stage';

const GRIP_SIZE = 50;
const EVENT_RANGE = 100;

class Grip extends createjs.Shape {
	constructor(props) {
		super(props);

		this.graphics
			.beginFill('black')
			.drawCircle(0, 0, GRIP_SIZE / 2);
	}
}

class DestinationLine extends createjs.Shape {
	to(x = 0, y = 0) {
		this.graphics
			.clear()
			.setStrokeStyle(1)
			.beginStroke('black')
			.moveTo(0, 0)
			.lineTo(x, y)
			.endStroke();
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

		this.onNodeMove = this.onNodeMove.bind(this);

		const grip = new Grip();
		this.addChild(grip);

		this.destinationLine = new DestinationLine();
		this.addChild(this.destinationLine);

		grip.on('pressmove', e => {
			const node = this;

			moveToFront(node);
			node.x = e.stageX;
			node.y = e.stageY;

			ether.trigger('NODE_MOVE', { node });
		});

		ether.on('NODE_MOVE', this.onNodeMove);

		stage.addChild(this);
	}
	onNodeMove(e) {
		if(e.node === this || e.node === this.connectedTo) {
			this.updateConnection();
		}
	}
	disconnect() {
		if(this.channel && this.connectedTo) {
			this.channel.disconnect();
			this.connectedTo == null;
		}	
	}
	connect(node) {
		if(node !== this.connectedTo) {
			this.disconnect();

			if(this.channel) {
				this.channel.connect(node.channel);
				this.connectedTo = node;
				this.updateConnection();
			}
		}
	}
	updateConnection() {
		if(this.connectedTo) {
			const xdist = this.connectedTo.x - this.x;
			const ydist = this.connectedTo.y - this.y;
			this.destinationLine.to(xdist, ydist);
		}
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

class MasterNode extends Node {
	constructor(props) {
		super(props);

		this.nodeType = nodeType.MASTER;
		this.channel = Tone.Master;
	}
}

class EventNode extends Node {
	constructor(props) {
		super(props);

		this.nodeType = nodeType.EVENT;
		this.range = EVENT_RANGE;

		const rangeRing = new RangeRing();
		this.addChild(rangeRing);
	}
}

// control volume/intensity somehow?
class InstrumentNode extends Node {
	constructor(props) {
		super(props);
		this.nodeType = nodeType.INSTRUMENT;

		this.onEventSignal = this.onEventSignal.bind(this);

		ether.on('EVENT_SIGNAL', this.onEventSignal);
	}
	onEventSignal({ node, signal }) {
		if (distanceBetweenNodesShorterThan(this, node, node.range + GRIP_SIZE / 2)) {
			this.receiveSignal(signal);
		}
	}
	receiveSignal(props) {
		super.receiveSignal(props);

		const { time } = props;
		this.channel.triggerAttackRelease('C3', '8n', time, 1);
	}
	dispose() {
		ether.off('EVENT_SIGNAL', this.onEventSignal);
		super.dispose();
	}
}

class EffectNode extends Node {
	constructor(props) {
		super(props);

		this.nodeType = nodeType.EFFECT;
	}
	updateConnection() {
		super.updateConnection();

		const xdist = this.connectedTo.x - this.x;
		const ydist = this.connectedTo.y - this.y;

		const distSq = Math.pow(xdist, 2) + Math.pow(ydist, 2);
		this.channel.wet.value = Math.min(2000 / distSq, 1);
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

		this.channel = new Tone.Synth();
	}
	dispose() {
		this.channel.dispose();
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

		this.channel = new Tone.PluckSynth();
	}
	dispose() {
		this.channel.dispose();
		super.dispose();
	}
}

class Metronome extends EventNode {
	constructor(props) {
		super(props);
		this.frequency = props.frequency;

		this.onLoop = this.onLoop.bind(this);

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

		this.icon = new SolidCircle({
			fill: 'yellow',
			radius: 9
		});
		this.addChild(this.icon);

		this.channel = new Tone.BitCrusher(4);
	}
	dispose() {
		this.channel.dispose();
		super.dispose();
	}
}

class PitchShiftNode extends EffectNode {
	constructor(props) {
		super(props);

		this.icon = new SolidCircle({
			fill: 'pink',
			radius: 9
		});
		this.addChild(this.icon);

		this.channel = new Tone.PitchShift(-8);
	}
	dispose() {
		this.channel.dispose();
		super.dispose();
	}
}

class ChorusNode extends EffectNode {
	constructor(props) {
		super(props);

		this.icon = new SolidCircle({
			fill: 'purple',
			radius: 9
		});
		this.addChild(this.icon);

		this.channel = new Tone.Chorus();
	}
	dispose() {
		this.channel.dispose();
		super.dispose();
	}
}

module.exports = {
	Node,
	MasterNode,
	SynthNode,
	PluckSynthNode,
	Metronome,
	BitCrusherNode,
	PitchShiftNode,
	ChorusNode,
};