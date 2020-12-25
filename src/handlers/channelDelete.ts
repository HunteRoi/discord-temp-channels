import { GuildChannel, VoiceChannel } from "discord.js";
import TempChannelsManager from "../index";

export const handleChannelDelete = async (manager: TempChannelsManager, channel: GuildChannel) => {
    // Check if the channel is a parent or a child
    const parentChannel = manager.channels.get(channel.id);
    if (parentChannel) {
        // Remove the parent channel
        manager.channels.delete(channel.id);
        return manager.emit("channelUnregister", parentChannel);
    }
    
    const parentChildChannel = manager.channels.find(channelData => channelData.children.some(child => child.voiceChannel.id === channel.id || child.textChannel.id === channel.id));
    if (parentChildChannel) {
        // Remove the child from children
        const child = parentChildChannel.children.find(child => child.textChannel.id === channel.id || child.voiceChannel.id === channel.id);
        const textChannel = child.textChannel;
        if (textChannel?.id === channel.id) {
            child.textChannel = null;
            return manager.emit("textChannelDelete", textChannel);
        }
        if (child.voiceChannel.id === channel.id) {
            if (textChannel) {
                await textChannel.delete();
                manager.emit("textChannelDelete", textChannel);
            }
            parentChildChannel.children = parentChildChannel.children.filter(child => child.voiceChannel.id !== channel.id);
            manager.emit("voiceChannelDelete", channel as VoiceChannel);
            return manager.emit("childDelete", undefined, child, manager.client.channels.cache.get(parentChannel.channelID));
        }
    }
};
