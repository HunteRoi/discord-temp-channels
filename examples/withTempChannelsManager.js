const { Client, IntentsBitField } = require('discord.js');
const { TempChannelsManager, TempChannelsManagerEvents } = require('../lib');

const client = new Client({
  intents: [
    IntentsBitField.Flags.GuildVoiceStates,
    IntentsBitField.Flags.Guilds,

    // for the unregister command
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent
  ],
});

const manager = new TempChannelsManager(client);

client.on('ready', () => {
  console.log('Connected!');

  manager.registerChannel('CHANNEL_ID', {
    childCategory: 'CATEGORY_ID',
    childAutoDeleteIfEmpty: true,
    childAutoDeleteIfParentGetsUnregistered: true,
    childAutoDeleteIfOwnerLeaves: false,
    childVoiceFormat: (str, count) => `Example #${count} | ${str}`,
    childVoiceFormatRegex: /^Example #\d+ \|/,
    childMaxUsers: 3,
    childBitrate: 64000
  });
});

client.on('messageCreate', (message) => message.content === 'unregister' && manager.unregisterChannel('CHANNEL_ID'));

manager.on(TempChannelsManagerEvents.channelRegister, (parent) => console.log('Registered', parent));
manager.on(TempChannelsManagerEvents.channelUnregister, (parent) => console.log('Unregistered', parent));
manager.on(TempChannelsManagerEvents.childAdd, (child, parent) => console.log('Child added!', child, parent));
manager.on(TempChannelsManagerEvents.childRemove, (child, parent) => console.log('Child removed!', child, parent));
manager.on(TempChannelsManagerEvents.childPrefixChange, (child) => console.log('Prefix changed', child));

client.login('TOKEN');
