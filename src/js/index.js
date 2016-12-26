import Tone from 'tone';
import { SynthNode, PluckSynthNode, Metronome, BitCrusherNode, PitchShiftNode, ChorusNode } from './components';

import '../css/app.less';

Tone.Transport.start();

const synthNode = new SynthNode({ x: 100, y: 100 });
const synthNode2 = new PluckSynthNode({ x: 200, y: 100 });

const metronome1 = new Metronome({ frequency: '8n', x: 100, y: 350 });

const effect1 = new BitCrusherNode({ x: 350, y: 350 });
const effect2 = new ChorusNode({ x: 410, y: 350 });

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
