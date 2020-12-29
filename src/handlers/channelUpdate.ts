import { GuildChannel } from 'discord.js';
import TempChannelsManager from '../index';

export const handleChannelUpdate = async (manager: TempChannelsManager, oldState: GuildChannel, newState: GuildChannel) => {
  if (oldState.id !== newState.id) return;
  if (oldState.name === newState.name) return;

  const parent = manager.channels.find(p => p.children.some(c => c.voiceChannel.id === oldState.id || c.textChannel?.id === oldState.id));
  if (!parent) return;

  const child = parent.children.find(c => c.voiceChannel.id === oldState.id || c.textChannel?.id === oldState.id);
  if(!child) return;

  const nameDoesNotHavePrefix = !parent.options.childFormatRegex.test(newState.name);
  if (nameDoesNotHavePrefix) {
    const count = parent.children.indexOf(child) + 1;
    const name = parent.options.childFormat(newState.name, count);
    newState.setName(name);
    
    manager.emit("childPrefix", newState);
  }
};
