import { GuildChannel } from 'discord.js';
import { TempChannelsManager } from '..';

export const handleChannelUpdate = async (manager: TempChannelsManager, oldState: GuildChannel, newState: GuildChannel) => {
  if (oldState.id !== newState.id) return;
  if (oldState.name === newState.name) return;

  const parent = manager.channels.find(p => p.children.some(c => c.voiceChannel.id === oldState.id || c.textChannel?.id === oldState.id));
  if (!parent) return;

  const child = parent.children.find(c => c.voiceChannel.id === oldState.id || c.textChannel?.id === oldState.id);
  if (!child) return;

  const isVoice = newState.type === 'voice';
  const nameDoesNotHavePrefix = isVoice
    ? !parent.options.childVoiceFormatRegex.test(newState.name)
    : !parent.options.childTextFormatRegex.test(newState.name);
  
    if (nameDoesNotHavePrefix) {
    const count = parent.children.indexOf(child) + 1;
    const name = isVoice
      ? parent.options.childVoiceFormat(newState.name, count)
      : parent.options.childTextFormat(newState.name, count);
    newState.setName(name);
    
    manager.emit('childPrefixChange', newState);
  }
};
