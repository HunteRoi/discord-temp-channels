import { GuildChannel, VoiceChannel, Snowflake } from 'discord.js';
import { TempChannelsManager } from '../TempChannelsManager';
import { TempChannelsManagerEvents } from '../TempChannelsManagerEvents';
import { ChildChannelData, ParentChannelData } from '../types';

const isVoiceOrTextChannel = (c: ChildChannelData, id: Snowflake) =>
	c.voiceChannel.id === id || c.textChannel?.id === id;

export const handleChannelDelete = async (
	manager: TempChannelsManager,
	channel: GuildChannel
): Promise<void> => {
	if (!manager || !channel) return;

	let parent = manager.channels.get(channel.id);
	if (parent) {
		manager.channels.delete(channel.id);
		manager.emit(TempChannelsManagerEvents.channelUnregister, parent);
		return;
	}

	parent = manager.channels.find((p: ParentChannelData) =>
		p.children.some((c: ChildChannelData) =>
			isVoiceOrTextChannel(c, channel.id)
		)
	);
	if (!parent) return;

	const child = parent.children.find((c: ChildChannelData) =>
		isVoiceOrTextChannel(c, channel.id)
	);
	if (!child) return;

	const textChannel = child.textChannel;
	if (textChannel?.id === channel.id) {
		child.textChannel = null;
		manager.emit(TempChannelsManagerEvents.textChannelDelete, textChannel);
		return;
	}

	if (child.voiceChannel.id === channel.id) {
		if (textChannel) {
			await textChannel.delete();
			manager.emit(TempChannelsManagerEvents.textChannelDelete, textChannel);
		}
		parent.children = parent.children.filter(
			(c) => c.voiceChannel.id !== channel.id
		);
		manager.emit(
			TempChannelsManagerEvents.voiceChannelDelete,
			channel as VoiceChannel
		);
		manager.emit(
			TempChannelsManagerEvents.childDelete,
			manager.client.user,
			child,
			manager.client.channels.cache.get(parent.channelId)
		);
	}
};
