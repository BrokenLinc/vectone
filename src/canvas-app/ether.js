import EventEmitter from 'events';

const ether = new EventEmitter();
ether.setMaxListeners(100);

export default ether;
