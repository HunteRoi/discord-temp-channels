import { GuildChannel, VoiceChannel } from 'discord.js';
import TempChannelsManager from '../index';

export const handleChannelDelete = async (manager: TempChannelsManager, channel: GuildChannel) => {
  let parent = manager.channels.get(channel.id);
  if (parent) {
    manager.channels.delete(channel.id);
    return manager.emit('channelUnregister', parent);
  }

  parent = manager.channels.find(p => p.children.some(c => c.voiceChannel.id === channel.id || c.textChannel.id === channel.id));
  if (!parent) return;
  
  const child = parent.children.find(c => c.textChannel.id === channel.id || c.voiceChannel.id === channel.id);
  if (!child) return;

  const textChannel = child.textChannel;
  if (textChannel?.id === channel.id) {
    child.textChannel = null;
    return manager.emit('textChannelDelete', textChannel);
  }

  if (child.voiceChannel.id === channel.id) {
    if (textChannel) {
      await textChannel.delete();
      manager.emit('textChannelDelete', textChannel);
    }
    parent.children = parent.children.filter(c => c.voiceChannel.id !== channel.id);
    manager.emit('voiceChannelDelete', channel as VoiceChannel);
    return manager.emit('childDelete', manager.client.user, child, manager.client.channels.cache.get(parent.channelID));
  }
};
