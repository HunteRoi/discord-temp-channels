const { IntentsBitField } = require('discord.js');
const { ClientWithTempManager, TempChannelsManagerEvents } = require('../lib');

const client = new ClientWithTempManager({
  intents: [IntentsBitField.Flags.GuildVoiceStates, IntentsBitField.Flags.Guilds],
});

client.on('ready', () => {
  console.log('Connected!');

  client.tempChannelsManager.registerChannel('VOICE_CHANNEL_ID', {
    childCategory: 'CATEGORY_ID',
    childAutoDeleteIfEmpty: true,
    childAutoDeleteIfOwnerLeaves: false,
    childVoiceFormat: (str, count) => `Example #${count} | ${str}`,
    childVoiceFormatRegex: /^Example #\d+ \|/
  });
});

client.login('TOKEN');
