'use strict';

const WebSocket = require('ws');

const dist = (x1, y1, x2, y2) => {
	const alpha = x1 - x2;
	const beta  = y1 - y2;
	return Math.sqrt((alpha * alpha) + (beta * beta));
}

const calcAngle = (x1, y1, x2, y2) => {
	const dx = x2 - x1;
	const dy = y2 - y1;
	return Math.atan2(dy, dx);
}


class Bot {
	constructor() {
		this.socket   = null;
		this.ingameId = null;
		this.name	 = 'bot' + Math.floor(Math.random() * 10000);
		this.users	= {};
		this.onInitGame		   = (() => {});
		this.onPlayerConnected	= (() => {});
		this.onPlayerDisconnected = (() => {});
		this.onPlayerDied		 = (() => {});
		this.onPlayerRespawned	= (() => {});
		this.onPlayerStat		 = (() => {});
	}

	startConnect() {
		this.socket = new WebSocket('ws://localhost:5000');
		this.socket.on('open', () => {
			console.log('Connection succsessful');
		});
		this.socket.on('message', (rawData, flags) => {this.handleMessage(rawData, flags)});
	}

	handleMessage(rawData, flags) {
		let data_b = new ArrayBuffer(rawData.length);
		let data = new DataView(data_b);
		for(let i = 0;i < rawData.length;++ i)
			data.setUint8(i, rawData[i]);

		const pid = data.getUint8(0);

		if(pid === 1) { // auth req
			let response_b = new ArrayBuffer(1 + this.name.length);
			let response = new DataView(response_b);
			response.setUint8(0, 0); // pid

			for(let i = 0;i < this.name.length;++ i)
				response.setUint8(1+i, this.name.charCodeAt(i));

			this.socket.send(response_b, {binary: true, mask: true});

			return;
		}

		if(pid === 2) { // init game
			this.ingameId = data.getUint32(1, false);
			this.onInitGame(this.ingameId);
			return;
		}

		if(pid === 11) { // add user
			const nameRawLen = data.getUint8(1);

			let name = "";
			for(let i = 0;i < nameRawLen;i ++) {
				name += String.fromCharCode(data.getUint8(2+i, false));
			}

			const id = data.getUint32(2+nameRawLen, false);
			const x  = data.getInt32(2+nameRawLen+4 + 0, false);
			const y  = data.getInt32(2+nameRawLen+4 + 4, false);

			const kills  = data.getInt32(2+nameRawLen+4 + 8,  false);
			const deaths = data.getInt32(2+nameRawLen+4 + 12, false);

			this.users[id] = {name: name, x: x, y: y, dead: false, kills: kills, deaths: deaths};

			this.onPlayerConnected(id);
			return;
		}

		if(pid == 12) { // player disconected
			const id = data.getUint32(1);

			//special case - the user cb is called before the function does its job
			this.onPlayerDisconnected(id);
			delete this.users[id];
			return;
		}

		if(pid === 13) { // basic player info
			const count = data.getUint32(1, false);

			let changedIDs = [];
			for(var i = 0;i < count;++ i) {
				const id = data.getUint32(5 + i * 24, false);
				changedIDs.push(id);

				this.users[id].x = data.getFloat32(9 + i * 24, false);
				this.users[id].y = data.getFloat32(13 + i * 24, false);
			}

			this.onPlayerStat(changedIDs);
			return;
		}

		if(pid === 14) { // player died
			const id = data.getUint32(1, false);
			this.users[id].dead = true;
			this.onPlayerDied(id);
			return;
		}

		if(pid === 15) { // player respawned
			const id = data.getUint32(1, false);
			this.users[id].dead = false;
			this.onPlayerRespawned(id);
			return;
		}

		if(pid == 42) { // scoreboard
			const id = data.getUint32(1, false);

			const value = data.getInt32(5, false);
			const type  = data.getInt8(9,  false);

			if     (type === 1) this.users[id].deaths = value;
			else if(type === 0) this.users[id].kills  = value;
			else                throw 'wrong packet conten';

			return;
		}

		//console.log('received packet with unknown pid', pid);
	}

	move(moveDirection)
	{
		let packet_b = new ArrayBuffer(2);
		let packet = new DataView(packet_b);
		packet.setUint8(0, 2);

		packet.setUint8(1, moveDirection);
		this.socket.send(packet_b);
	}

	shootAtTarget(target)
	{
		if(target == null)
			return;

		let packet_b = new ArrayBuffer(5);
		let packet = new DataView(packet_b);
		packet.setUint8(0, 1);

		let angle = calcAngle(this.users[ingameId].x, this.users[ingameId].y, this.users[target].x, this.users[target].y);
		packet.setFloat32(1, angle, false);
		this.socket.send(packet_b);
	}
	shootAtAngle(angle)
	{
		let packet_b = new ArrayBuffer(5);
		let packet = new DataView(packet_b);
		packet.setUint8(0, 1);

		packet.setFloat32(1, angle, false);
		this.socket.send(packet_b);
	}
}

module.exports.Bot = Bot;
