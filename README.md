# Discord Temporary Voice Channels

This framework works the same way its parent does (see [discord-temp-channels](https://github.com/Androz2091/discord-temp-channels) of [Androz2091](https://github.com/Androz2091)) except that it brings a few new features: 
- create a temporary text channel via a textual command
- delete a temporary text channel via a textual command
- more events like `voiceChannelCreate`, `textChannelCreate` and **2 more**
- give the temporary channels' owner the `MANAGE_CHANNELS` permission on them
- give more permissions to users/roles when channels are created (via registered parent options)
- auto-prefix renamed temporary channels if the prefix is missing
- reload temporary channels in memory in case the bot restarts while the feature is being used
- Source code embedded documentation with [JSDoc](https://en.wikipedia.org/wiki/JSDoc)

## Installation

```sh
npm install --save @hunteroi/discord-temp-channels
```

## Example

```js
const Discord = require('discord.js');
const client = new Discord.Client();

const TempChannelsManager = require('@hunteroi/discord-temp-channels');
const manager = new TempChannelsManager(client, "textchannel");

// Register a new main channel
manager.registerChannel('688084899537616999', {
  childCategory: '569985103175090216',
  childAutoDelete: true,
  childFormat: (username, count) => `[DRoom #${count}] ${username}`,
  childFormatRegex: /^\[DRoom #\d+\]\s+.+/i  
});

client.login(); // discord.js will automatically load your token from process.env.DISCORD_TOKEN if set
```

## Events
```js
manager.on("voiceChannelCreate", (voiceChannel) => {});

manager.on("voiceChannelDelete", (voiceChannel) => {});

manager.on("textChannelCreate", (textChannel) => {});

manager.on("textChannelDelete", (textChannel) => {});

manager.on("childPrefix", (channel) => {});

manager.on("childCreate", (member, child, parent) => {});

manager.on("childDelete", (member, child, parent) => {});

manager.on("channelRegister", (parent) => {});

manager.on("channelUnregister", (parent) => {});

manager.on("error", (error, message) => {});
```

## Can be improved (PR accepted)
- Creation & deletion of text channel through textual command (`./src/handlers/message`)
- Auto detection of temporary channels in case of restart (`./src/handlers/ready`)
