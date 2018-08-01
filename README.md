# 1 Minute start
### Create a new bot with
```
let myBot = new Bot();
```

### Attach functions you care about, like onServerTick or playerDied;
```
myBot.onServerTick = (changedIDs) => console.log(changedIDs);
...;
```

### Tell the bot to connect to the server
```
myBot.startConnect();
```

# TODO
* Show how to use .move and .shootAtTarget
* More packets
* Document function parameters
* Add examples


