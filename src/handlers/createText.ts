import {
	OverwriteType,
	TextChannel,
	Permissions,
	Constants,
	GuildMember,
	Interaction,
	Message,
} from 'discord.js';

import { TempChannelsManagerEvents } from '../TempChannelsManagerEvents';
import { TempChannelsManager } from '../TempChannelsManager';

export const handleTextCreation = async (
	manager: TempChannelsManager,
	interactionOrMessage: Interaction | Message
) => {
	if (!manager || !interactionOrMessage) return;

	const owner = interactionOrMessage.member as GuildMember;
	const voiceChannel = owner.voice.channel;
	if (
		!voiceChannel ||
		!manager.channels.some((p) =>
			p.children.some((c) => c.voiceChannel.id === voiceChannel.id)
		)
	) {
		return manager.emit(
			TempChannelsManagerEvents.voiceNotExisting,
			interactionOrMessage
		);
	}

	const parent = manager.channels.find((p) =>
		p.children.some((c) => c.voiceChannel.id === voiceChannel.id)
	);
	if (!parent) return;

	const child = parent.children.find(
		(c) => c.voiceChannel.id === voiceChannel.id
	);
	if (!child || child.owner.id !== owner.id) return;

	if (!child.textChannel) {
		const count = parent.children.indexOf(child) + 1;
		const newChannelName = parent.options.childTextFormat(
			owner.displayName,
			count
		);

		const textChannel = (await interactionOrMessage.guild.channels.create(
			newChannelName,
			{
				parent: parent.options.childCategory,
				type: Constants.ChannelTypes.GUILD_TEXT,
				permissionOverwrites: [
					{
						id: owner.id,
						type: Constants.OverwriteTypes[
							Constants.OverwriteTypes.member
						] as OverwriteType,
						allow: Permissions.FLAGS.MANAGE_CHANNELS,
					},
				],
			}
		)) as TextChannel;
		child.textChannel = textChannel;

		return manager.emit(
			TempChannelsManagerEvents.textChannelCreate,
			textChannel,
			interactionOrMessage
		);
	} else {
		const textChannel = child.textChannel;
		child.textChannel = null;

		await textChannel?.delete();

		return manager.emit(
			TempChannelsManagerEvents.textChannelDelete,
			textChannel,
			interactionOrMessage
		);
	}
};
