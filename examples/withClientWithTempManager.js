const { IntentsBitField, SlashCommandBuilder } = require('discord.js');
const synchronizeSlashCommands = require('discord-sync-commands');
const { ClientWithTempManager, TempChannelsManagerEvents } = require('../lib');

const client = new ClientWithTempManager({
  intents: [IntentsBitField.Flags.GuildVoiceStates, IntentsBitField.Flags.Guilds],
});
synchronizeSlashCommands(
  client,
  [
    new SlashCommandBuilder()
      .setName('createtext')
      .setDescription(
        'Create a text channel linked to the temporary voice channel and the owner'
      ),
  ],
  { guildId: 'GUILD_ID' }
);

client.on('ready', () => {
  console.log('Connected!');

  client.tempChannelsManager.registerChannel('VOICE_CHANNEL_ID', {
    childCategory: 'CATEGORY_ID',
    childAutoDeleteIfEmpty: true,
    childAutoDeleteIfOwnerLeaves: false,
    childVoiceFormat: (str, count) => `Example #${count} | ${str}`,
    childVoiceFormatRegex: /^Example #\d+ \|/,
    childTextFormat: (str, count) => `example-${count}_${str}`,
    childTextFormatRegex: /^example-\d+_/i,
    textChannelAsThreadParent: 'TEXT_CHANNEL_ID',
    threadArchiveDuration: 60,
  });
});

client.on('interactionCreate', async (interaction) => {
  if (interaction.isCommand() && interaction.commandName === 'createtext') {
    await interaction.deferReply({ ephemeral: true });
    client.tempChannelsManager.emit(
      TempChannelsManagerEvents.createText,
      interaction
    );
  }
});

client.tempChannelsManager.on(
  TempChannelsManagerEvents.textChannelCreate,
  (textChannel, interaction) =>
    interaction &&
    interaction
      .editReply(
        `The text channel #${textChannel?.name ?? ''} has been created !`
      )
      .catch((err) => console.error(err))
);

client.tempChannelsManager.on(
  TempChannelsManagerEvents.textChannelDelete,
  (textChannel, interaction) =>
    interaction &&
    interaction
      .editReply(
        `The text channel #${textChannel?.name ?? ''} has been removed!`
      )
      .catch((err) => console.error(err))
);

client.tempChannelsManager.on(
  TempChannelsManagerEvents.voiceNotExisting,
  (interaction) =>
    interaction &&
    interaction
      .editReply('You must be owner of a temporary voice channel to do that!')
      .catch((err) => console.error(err))
);

client.login('TOKEN');