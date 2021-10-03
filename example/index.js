const { Client, Intents } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const synchronizeSlashCommands = require('discord-sync-commands');
const { TempChannelsManager, TempChannelsManagerEvents } = require('../lib');

const client = new Client({
	intents: [Intents.FLAGS.GUILD_VOICE_STATES],
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

const manager = new TempChannelsManager(client);

client.on('ready', () => {
	console.log('Connected!');

	manager.registerChannel('CHANNEL_ID', {
		childCategory: 'CATEGORY_ID',
		childAutoDeleteIfEmpty: true,
		childAutoDeleteIfOwnerLeaves: false,
		childVoiceFormat: (str, count) => `Example #${count} | ${str}`,
		childVoiceFormatRegex: /^Example #\d+ \|/,
		childTextFormat: (str, count) => `example-${count}_${str}`,
		childTextFormatRegex: /^example-\d+_/i,
	});
});

client.on('interactionCreate', async (interaction) => {
	if (interaction.isCommand() && interaction.commandName === 'createtext') {
		await interaction.deferReply({ ephemeral: true });
		manager.emit(TempChannelsManagerEvents.createText, interaction);
	}
});

manager.on(
	TempChannelsManagerEvents.textChannelCreate,
	(textChannel, interaction) =>
		interaction &&
		interaction
			.editReply(
				`The text channel #${textChannel?.name ?? ''} has been created !`
			)
			.catch((err) => console.error(err))
);

manager.on(
	TempChannelsManagerEvents.textChannelDelete,
	(textChannel, interaction) =>
		interaction &&
		interaction
			.editReply(
				`The text channel #${textChannel?.name ?? ''} has been removed!`
			)
			.catch((err) => console.error(err))
);

manager.on(
	TempChannelsManagerEvents.voiceNotExisting,
	(interaction) =>
		interaction &&
		interaction
			.editReply('You must be owner of a temporary voice channel to do that!')
			.catch((err) => console.error(err))
);

client.login('TOKEN');
