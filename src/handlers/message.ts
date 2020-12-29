import { Message } from 'discord.js';
import TempChannelsManager from '..';

export const handleMessage = async (manager: TempChannelsManager, commandName: string, message: Message) => {
  const owner = message.member;

  if (!message.content.includes(commandName)) return;

  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel || !manager.channels.some(p => p.children.some(c => c.voiceChannel.id === voiceChannel.id))) return;
  const parent = manager.channels.find(p => p.children.some(c => c.voiceChannel.id === voiceChannel.id));
  if (!parent) return;

  const child = parent.children.find(c => c.voiceChannel.id === voiceChannel.id);
  if (!child || child.owner.id !== owner.id) return;

  if (!child.textChannel) {
    const count = parent.children.indexOf(child) + 1;
    const newChannelName = parent.options.childFormat(owner.displayName, count);

    const textChannel = await message.guild.channels.create(newChannelName, {
      parent: parent.options.childCategory,
      type: 'text',
      permissionOverwrites: [{ id: owner.id, type: 'member', allow: 'MANAGE_CHANNELS' }]
    });
    child.textChannel = textChannel;

    return manager.emit('textChannelCreate', textChannel);
  }

  if (child.textChannel) {
    const textChannel = child.textChannel;

    await textChannel?.delete();
    child.textChannel = null;

    return manager.emit('textChannelDelete', textChannel);
  }
};
