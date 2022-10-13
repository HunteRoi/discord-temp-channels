const { Client, IntentsBitField } = require('discord.js');
const { TempChannelsManager, TempChannelsManagerEvents } = require('../lib');

const client = new Client({
  intents: [IntentsBitField.Flags.GuildVoiceStates, IntentsBitField.Flags.Guilds],
});

const manager = new TempChannelsManager(client);

client.on('ready', () => {
  console.log('Connected!');

  manager.registerChannel('VOICE_CHANNEL_ID', {
    childCategory: 'CATEGORY_ID',
    childAutoDeleteIfEmpty: true,
    childAutoDeleteIfOwnerLeaves: false,
    childVoiceFormat: (str, count) => `Example #${count} | ${str}`,
    childVoiceFormatRegex: /^Example #\d+ \|/
  });
});

client.login('TOKEN');
