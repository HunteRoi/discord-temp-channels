import { GuildChannel, Constants, ThreadChannel } from 'discord.js';
import { TempChannelsManagerEvents } from '../TempChannelsManagerEvents';
import { TempChannelsManager } from '../TempChannelsManager';

export const handleChannelUpdate = async (
	manager: TempChannelsManager,
	oldState: GuildChannel | ThreadChannel,
	newState: GuildChannel | ThreadChannel
) => {
	if (!manager || !oldState || !newState) return;

	if (oldState.id !== newState.id) return;
	if (oldState.name === newState.name) return;

	const parent = manager.channels.find((p) =>
		p.children.some(
			(c) =>
				c.voiceChannel.id === oldState.id || c.textChannel?.id === oldState.id
		)
	);
	if (!parent) return;

	const child = parent.children.find(
		(c) =>
			c.voiceChannel.id === oldState.id || c.textChannel?.id === oldState.id
	);
	if (!child) return;

	const isVoice =
		newState.type ===
		Constants.ChannelTypes[Constants.ChannelTypes.GUILD_VOICE];
	const nameDoesNotHavePrefix = isVoice
		? !parent.options.childVoiceFormatRegex.test(newState.name)
		: !parent.options.childTextFormatRegex.test(newState.name);

	if (!parent.options.childCanBeRenamed && nameDoesNotHavePrefix) {
		const count = parent.children.indexOf(child) + 1;
		const name = isVoice
			? parent.options.childVoiceFormat(newState.name, count)
			: parent.options.childTextFormat(newState.name, count);
		newState.setName(name);

		manager.emit(TempChannelsManagerEvents.childPrefixChange, newState);
	}
};
