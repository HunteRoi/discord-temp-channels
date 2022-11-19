<a href="https://www.npmjs.com/@hunteroi/discord-temp-channels"><img src="https://img.shields.io/github/v/release/hunteroi/discord-temp-channels?style=for-the-badge" alt="release version"/></a>
<a href="https://www.npmjs.com/@hunteroi/discord-temp-channels"><img src="https://img.shields.io/npm/dt/@hunteroi/discord-temp-channels?style=for-the-badge" alt="nb downloads npm"/></a>

# Discord Temporary Voice Channels

This library works the same way its parent does (see [discord-temp-channels](https://github.com/Androz2091/discord-temp-channels) of [Androz2091](https://github.com/Androz2091)) except that it brings a few new features:

- more events like `voiceChannelCreate` and **4 more**
- give the temporary channels' owner the `MANAGE_CHANNELS` permission on them
- give more permissions to users/roles when channels are created (via registered parent options)
- auto-prefix renamed temporary channels if the prefix is missing
- reload temporary channels in memory in case the bot restarts while the feature is being used
- Source code embedded documentation with [JSDoc](https://en.wikipedia.org/wiki/JSDoc)

![IMAGE](./resources/example.gif)

## Prerequisites ⚠️

Starting at **v2.0.0**, you must use **NodeJS v16.6.0 or higher** to run a bot with this library.

You also must not forget to include [mandatory intents](#mandatory-intents) as well as give your bot the rights to [use application commands](https://discord.com/developers/docs/interactions/application-commands#authorizing-your-application).

### Mandatory intents

- GUILD_VOICE_STATE: used to detect guild members voice state updates (when someone joins a voice channel, leaves or changes from one to another, ...).
- GUILDS: used to recover from possible crashes of your bot (detects and reconstructs the temporary channels list and deletes them if necessary).

## Installation

```sh
npm install --save @hunteroi/discord-temp-channels
```

## Examples

See [./examples/withTempChannelsManager.js](examples/withTempChannelsManager.js) and [./examples/withClientWithTempManager.js](examples/withClientWithTempManager.js).

## Events

```ts
manager.on(
  TempChannelsManagerEvents.channelRegister,
  (parent: ParentChannelData) => {}
);

manager.on(
  TempChannelsManagerEvents.channelUnregister,
  (parent: ParentChannelData) => {}
);

manager.on(
  TempChannelsManagerEvents.childAdd,
  (
    child: ChildChannelData,
    parent: ParentChannelData
  ) => {}
);

manager.on(
  TempChannelsManagerEvents.childRemove,
  (
    child: ChildChannelData,
    parent: ParentChannelData
  ) => {}
);

manager.on(
  TempChannelsManagerEvents.childPrefixChange,
  (child: ChildChannelData) => {}
);

manager.on(
  TempChannelsManagerEvents.error,
  (error: Error | null, message: string) => {}
);
```

## Contribution

Contributions are what make the open source community such an amazing place to be learn, inspire, and create. Any contributions you make are greatly appreciated.

1. Fork the Project
2. Create your Branch: `git checkout -b patch/YourAmazingWork`
3. Commit your Changes: `git commit -m 'Add some amazing work'`
4. Push to the Branch: `git push origin patch/YourAmazingWork`
5. Open a Pull Request

## Credits

Thanks to [Androz2091](https://github.com/Androz2091) for their initial package. This package is a fork of their own work. Check them out!
