import Tone from 'tone';
// import { fabric } from 'fabric-browseronly';

import nodeType from './nodeType';
import { getNodesInRange } from './helpers';
import ether from './ether';
import canvas from './canvas';
import { SynthNode, PluckSynthNode, Metronome, BitCrusherNode } from './components';

import '../css/app.less';

canvas.on('object:moving', event => {
	const node = event.target;
	if(node.nodeType === nodeType.INSTRUMENT) {
		ether.trigger('INSTRUMENT_MOVE', { node });
	}
	if(node.nodeType === nodeType.EFFECT) {
		ether.trigger('EFFECT_MOVE', { node });
	}
});

Tone.Transport.start();


const synthNode = new SynthNode({ left: 100, top: 100 });
const synthNode2 = new PluckSynthNode({ left: 200, top: 100 });

const metronome1 = new Metronome({ frequency: '8n', left: 100, top: 350 });

const effect1 = new BitCrusherNode({ left: 350, top: 350 })

//const metronome2 = new Metronome({ frequency: '8n', left: 350, top: 350 });



// ### scratch pad ###

//metronome --> synth

// (loops, parts) --> synth

// metronome1.addReceiver(synthNode);
// metronome1.removeReceiver(synthNode);





// var synth = new Tone.Synth().toMaster();


// var crusher = new Tone.BitCrusher(4).toMaster();
// //var synth = new Tone.MonoSynth();
// synth.connect(crusher);
// //synth.discconnect(crusher);

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
