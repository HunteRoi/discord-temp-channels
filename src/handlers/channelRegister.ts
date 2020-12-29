import { Collection, VoiceChannel } from 'discord.js';
import TempChannelsManager from '../index';
import { ChildChannelData, ParentChannelData } from '../types';

export const handleRegistering = (manager: TempChannelsManager, parent: ParentChannelData) => {
  const channel = manager.client.channels.resolve(parent.channelID) as VoiceChannel;

  // reconstruct parent's children array when bot is ready
  if (channel) {
    const childrenCollection = channel.parent.children.filter(c => parent.options.childFormatRegex.test(c.name));
    const textChildren = childrenCollection.filter(c => c.isText());
    const voiceChildren = childrenCollection.filter(c => c.type === 'voice');

    parent.children = voiceChildren.map(child => {
      const ownerId = child.permissionOverwrites.find(po => po.type === 'member').id;
      const owner = child.guild.members.resolve(ownerId);

      return {
        owner: owner,
        voiceChannel: child as VoiceChannel,
        textChannel: textChildren.find(c => c.permissionOverwrites.some(po => po.type === 'member' && po.id === ownerId)),
      } as ChildChannelData;
    });

    // remove children if voice channels are empty when bot is ready
    parent.children = Array.from(
      new Collection(parent.children.map(c => [c.owner.id, c]))
        .each(async child => {
          const childShouldBeDeleted =  (parent.options.childAutoDelete && child.voiceChannel.members.size === 0) ||
                                        (parent.options.childAutoDeleteIfOwnerLeaves && !child.voiceChannel.members.has(child.owner.id));
          if (childShouldBeDeleted) {
            if (child.textChannel) {
              await child.textChannel.delete();
              manager.emit('textChannelDelete', child.textChannel);
            }

            await child.voiceChannel.delete();
            manager.emit('voiceChannelDelete', child.voiceChannel);

            manager.emit('childDelete', manager.client.user, child, manager.client.channels.cache.get(parent.channelID));
          }
        })
        .filter(c => c.voiceChannel.deleted)
        .values()
    );
  }
};
