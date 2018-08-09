'use strict';

const nslib = require('./main.js');

let bots = []
for(let b = 0;b < 10;b ++) {
    let bot = new nslib.Bot();
    bot.onInitGame = () => {
        const pr = [7,2,3,5];
        bot.move(pr[Math.floor(Math.random() * 4)]);
    }
    bot.startConnect();
    bots.push(bot);
}
