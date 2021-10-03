import {
	OverwriteType,
	VoiceState,
	Permissions,
	VoiceChannel,
	Constants,
} from 'discord.js';
import { TempChannelsManager } from '../TempChannelsManager';
import { TempChannelsManagerEvents } from '../TempChannelsManagerEvents';
import { ChildChannelData } from '../types';

export const handleVoiceStateUpdate = async (
	manager: TempChannelsManager,
	oldState: VoiceState,
	newState: VoiceState
) => {
	if (!manager) return;

	const voiceChannelLeft = !!oldState.channelId && !newState.channelId;
	const voiceChannelMoved =
		!!oldState.channelId &&
		!!newState.channelId &&
		oldState.channelId !== newState.channelId;
	const voiceChannelJoined = !oldState.channelId && !!newState.channelId;

	if (voiceChannelLeft || voiceChannelMoved) {
		const parent = manager.channels.find((p) =>
			p.children.some((c) => c.voiceChannel.id === oldState.channelId)
		);
		if (!parent) return;

		const child = parent.children.find(
			(c) => c.voiceChannel.id === oldState.channelId
		);
		if (!child) return;

		const childShouldBeDeleted =
			(parent.options.childAutoDeleteIfEmpty &&
				oldState.channel.members.size === 0) ||
			(parent.options.childAutoDeleteIfOwnerLeaves &&
				!oldState.channel.members.has(child.owner.id));
		if (childShouldBeDeleted) {
			try {
				if (child.textChannel) {
					await child.textChannel.delete();
					manager.emit(
						TempChannelsManagerEvents.textChannelDelete,
						child.textChannel
					);
				}

				await child.voiceChannel.delete();
				manager.emit(
					TempChannelsManagerEvents.voiceChannelDelete,
					child.voiceChannel
				);

				parent.children = parent.children.filter(
					(c) => c.voiceChannel.id !== child.voiceChannel.id
				);
				manager.emit(
					TempChannelsManagerEvents.childDelete,
					newState.member,
					child,
					manager.client.channels.cache.get(parent.channelId)
				);
			} catch (err) {
				manager.emit(
					TempChannelsManagerEvents.error,
					err,
					'Cannot auto delete channel ' + child.voiceChannel.id
				);
			}
		}
	}

	if (voiceChannelJoined || voiceChannelMoved) {
		const parent = manager.channels.find(
			(p) => p.channelId === newState.channelId
		);
		if (!parent) return;

		const count = Math.max(
			0,
			...parent.children.map((c) =>
				Number(c.voiceChannel.name.match(/\d+/g)?.shift())
			)
		);
		const newChannelName = parent.options.childVoiceFormat(
			newState.member.displayName,
			count + 1
		);
		const voiceChannel = (await newState.guild.channels.create(newChannelName, {
			parent: parent.options.childCategory,
			bitrate: parent.options.childBitrate,
			userLimit: parent.options.childMaxUsers,
			type: Constants.ChannelTypes.GUILD_VOICE,
			permissionOverwrites: [
				{
					id: newState.member.id,
					type: Constants.OverwriteTypes[
						Constants.OverwriteTypes.member
					] as OverwriteType,
					allow: Permissions.FLAGS.MANAGE_CHANNELS,
				},
			],
		})) as VoiceChannel;
		manager.emit(TempChannelsManagerEvents.voiceChannelCreate, voiceChannel);

		if (parent.options.childPermissionOverwriteOptions) {
			for (const roleOrUser of parent.options.childOverwriteRolesAndUsers) {
				voiceChannel.permissionOverwrites
					.edit(roleOrUser, parent.options.childPermissionOverwriteOptions)
					.catch((err) =>
						manager.emit(
							TempChannelsManagerEvents.error,
							err,
							`Couldn't update the permissions of the channel ${
								voiceChannel.id
							} for role or user ${roleOrUser.toString()}`
						)
					);
			}
		}

		const child: ChildChannelData = {
			owner: newState.member,
			voiceChannel,
		};
		parent.children.push(child);
		manager.emit(
			TempChannelsManagerEvents.childCreate,
			newState.member,
			child,
			manager.client.channels.cache.get(parent.channelId)
		);

		newState.setChannel(voiceChannel.id);
	}
};
