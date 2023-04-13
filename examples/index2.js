const { IntentsBitField } = require('discord.js');
const { ClientWithTempManager, TempChannelsManagerEvents } = require('../lib');

const client = new ClientWithTempManager({
  intents: [
    IntentsBitField.Flags.GuildVoiceStates,
    IntentsBitField.Flags.Guilds,

    // for the unregister command
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent
  ],
});

client.on('ready', () => {
  console.log('Connected!');

  client.tempChannelsManager.registerChannel('VOICE_CHANNEL_ID', {
    childCategory: 'CATEGORY_ID',
    childAutoDeleteIfEmpty: true,
    childAutoDeleteIfOwnerLeaves: false,
    childAutoDeleteIfParentGetsUnregistered: true,
    childVoiceFormat: (str, count) => `Example #${count} | ${str}`,
    childVoiceFormatRegex: /^Example #\d+ \|/,
    childMaxUsers: 3,
    childBitrate: 64000,
    childShouldBeACopyOfParent: false
  });

  client.on('messageCreate', (message) => message.content === 'unregister' && manager.unregisterChannel('CHANNEL_ID'));

  client.tempChannelsManager.on(TempChannelsManagerEvents.channelRegister, (parent) => console.log('Registered', parent));
  client.tempChannelsManager.on(TempChannelsManagerEvents.channelUnregister, (parent) => console.log('Unregistered', parent));
  client.tempChannelsManager.on(TempChannelsManagerEvents.childAdd, (child, parent) => console.log('Child added!', child, parent));
  client.tempChannelsManager.on(TempChannelsManagerEvents.childRemove, (child, parent) => console.log('Child removed!', child, parent));
  client.tempChannelsManager.on(TempChannelsManagerEvents.childPrefixChange, (child) => console.log('Prefix changed', child));
});

client.login('TOKEN');
