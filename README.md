# Discord Temporary Voice Channels

This framework works the same way its parent does (see [discord-temp-channels](https://github.com/Androz2091/discord-temp-channels) of [Androz2091](https://github.com/Androz2091) except that it brings a few new features: 
- create/delete a temporary text channel via an event
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

## Examples

See [./example/index.js](example/index.js) and [./example/index2.js](example/index2.js).

## Events
```ts
manager.on('voiceChannelCreate', (voiceChannel: VoiceChannel) => {});

manager.on('voiceChannelDelete', (voiceChannel: VoiceChannel) => {});

manager.on('textChannelCreate', (textChannel: TextChannel) => {});

manager.on('textChannelDelete', (textChannel: TextChannel) => {});

manager.on('childPrefixChange', (channel: GuildChannel) => {});

manager.on('childCreate', (member: GuildMember | ClientUser, child: ChildChannelData, parent: ParentChannelData) => {});

manager.on('childDelete', (member: GuildMember | ClientUser, child: ChildChannelData, parent: ParentChannelData) => {});

manager.on('channelRegister', (parent: ParentChannelData) => {});

manager.on('channelUnregister', (parent: ParentChannelData) => {});

manager.on('error', (error: Error, message: string) => {});
```

## Commands
In order to trigger the creation/deletion of a text channel, please emit the event `createText` using your instance of the `TempChannelsManager` class and pass it the message object: 
```ts
client.on('message', message => {
  if (message.content.startsWith('!createText')) {
    manager.emit('createText', message);
  }
});
```

## Contribution
Contributions are what make the open source community such an amazing place to be learn, inspire, and create. Any contributions you make are greatly appreciated.

1. Fork the Project
2. Create your Branch: `git checkout -b patch/YourAmazingWork`
3. Commit your Changes: `git commit -m 'Add some amazing work'`
4. Push to the Branch: `git push origin patch/YourAmazingWork`
5. Open a Pull Request

## Credits
Thanks to [Androz2091](https://github.com/Androz2091) for their initial package. My package is a result of a fork of their work. Check them out!
