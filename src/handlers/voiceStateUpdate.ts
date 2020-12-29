import { VoiceState } from 'discord.js';
import TempChannelsManager from '../index';

export const handleVoiceStateUpdate = async (manager: TempChannelsManager, oldState: VoiceState, newState: VoiceState) => {
  const voiceChannelLeft = !!oldState.channelID && !newState.channelID;
  const voiceChannelMoved = !!oldState.channelID && !!newState.channelID && oldState.channelID !== newState.channelID;
  const voiceChannelJoined = !oldState.channelID && !!newState.channelID;

  if (voiceChannelLeft || voiceChannelMoved) {
    const parent = manager.channels.find(p => p.children.some(c => c.voiceChannel.id === oldState.channelID));
    if (!parent) return;

    const child = parent.children.find(c => c.voiceChannel.id === oldState.channelID);
    if (!child) return;


    const childShouldBeDeleted =  (parent.options.childAutoDelete && oldState.channel.members.size === 0) ||
                                  (parent.options.childAutoDeleteIfOwnerLeaves && !oldState.channel.members.has(child.owner.id));
    if (childShouldBeDeleted) {
      try {
        if (child.textChannel) {
          await child.textChannel.delete();
          manager.emit('textChannelDelete', child.textChannel);
        }

        await child.voiceChannel.delete();
        manager.emit('voiceChannelDelete', child.voiceChannel);

        parent.children = parent.children.filter(c => c.voiceChannel.id !== c.voiceChannel.id);
        manager.emit('childDelete', newState.member, child, manager.client.channels.cache.get(parent.channelID));
      } catch (err) {
        manager.emit('error', err, 'Cannot auto delete channel ' + child.voiceChannel.id);
      }
    }
  }

  if (voiceChannelJoined || voiceChannelMoved) {
    const parent = manager.channels.find(p => p.channelID === newState.channelID);
    if (!parent) return;

    const count = parent.children.length + 1;
    const newChannelName = parent.options.childFormat(newState.member.displayName, count);
    const voiceChannel = await newState.guild.channels.create(newChannelName, {
      parent: parent.options.childCategory,
      bitrate: parent.options.childBitrate,
      userLimit: parent.options.childMaxUsers,
      type: 'voice',
      permissionOverwrites: [{ id: newState.member.id, type: 'member', allow: 'MANAGE_CHANNELS' }]
    });
    manager.emit('voiceChannelCreate', voiceChannel);

    if (parent.options.childPermissionOverwriteOption) {
      for (const roleOrUser of parent.options.childOverwriteRolesAndUsers) {
        voiceChannel
          .updateOverwrite(roleOrUser, parent.options.childPermissionOverwriteOption)
          .catch((err) => manager.emit('error', err, `Couldn't update the permissions of the channel ${voiceChannel.id} for role or user ${roleOrUser.toString()}`));
      }
    }

    const child = { owner: newState.member, voiceChannel };
    parent.children.push(child);
    manager.emit('childCreate', newState.member, child, manager.client.channels.cache.get(parent.channelID));

    newState.setChannel(voiceChannel);
  }
};
