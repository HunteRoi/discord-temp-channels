import { TextChannel, VoiceChannel, VoiceState } from "discord.js";
import TempChannelsManager from "../index";

export const handleVoiceStateUpdate = async (manager: TempChannelsManager, oldState: VoiceState, newState: VoiceState) => {
    const voiceChannelLeft: boolean = !!oldState.channelID && !newState.channelID;
    const voiceChannelMoved: boolean = !!oldState.channelID && !!newState.channelID && oldState.channelID !== newState.channelID;
    const voiceChannelJoined: boolean = !oldState.channelID && !!newState.channelID;

    // If the member left a channel or moved to a new one
    if (voiceChannelLeft || voiceChannelMoved) {
        // The parent channel of the channel in which the member isn't anymore
        const parentChannel = manager.channels.find(channelData => channelData.children.some(child => child.voiceChannel.id === oldState.channelID));
        // If there is a parent
        if (parentChannel) {
            const childToDelete = parentChannel.children.find(child => child.voiceChannel.id === oldState.channelID);
            // If the channel has to be deleted and is empty
            if (
                (parentChannel.options.childAutoDelete && oldState.channel.members.size === 0) ||
                (parentChannel.options.childAutoDeleteIfOwnerLeaves && !oldState.channel.members.has(childToDelete.owner.id))
            ) {
                // Delete it
                childToDelete.voiceChannel
                    .delete()
                    .then(async () => {
                        const isDeleted = await childToDelete.textChannel?.delete();
                        if (isDeleted) {
                            manager.emit("textChannelDelete", childToDelete.textChannel);
                        }
                        manager.emit("voiceChannelDelete", childToDelete.voiceChannel);
                        // Remove the channelData from the children
                        parentChannel.children = parentChannel.children.filter(child => child.voiceChannel.id !== childToDelete.voiceChannel.id);
                        manager.emit("childDelete", newState.member, childToDelete, manager.client.channels.cache.get(parentChannel.channelID));
                    })
                    .catch(error => {
                        manager.emit("error", error, "Cannot auto delete channel " + childToDelete.voiceChannel.id);
                    });
            }1
        }
    }

    // If the member joined a voice channel or moved to a new one
    if (voiceChannelJoined || voiceChannelMoved) {
        // Check if the member is in a parent channel
        const parentChannel = manager.channels.find(channelData => channelData.channelID === newState.channelID);
        // If the member is in a parent channel
        if (parentChannel) {
            // Create a child channel
            const count = parentChannel.children.length + 1;
            const newChannelName = parentChannel.options.childFormat(newState.member, count);
            const voiceChannel = await newState.guild.channels.create(newChannelName, {
                parent: parentChannel.options.childCategory,
                bitrate: parentChannel.options.childBitrate,
                userLimit: parentChannel.options.childMaxUsers,
                type: "voice"
            });

            if (parentChannel.options.childPermissionOverwriteOption) {
                for (const roleOrUser of parentChannel.options.childOverwriteRolesAndUsers) {
                    voiceChannel
                        .updateOverwrite(roleOrUser, parentChannel.options.childPermissionOverwriteOption)
                        .catch(err => manager.emit("error", err, "Couldn't update the permissions of the channel " + voiceChannel.id));
                }
            }
            manager.emit("voiceChannelCreate", voiceChannel);
            manager.emit("childCreate", newState.member, voiceChannel, manager.client.channels.cache.get(parentChannel.channelID));
            // Move the member in the new channel
            newState.setChannel(voiceChannel);
            // Add the child
            parentChannel.children.push({
                owner: newState.member,
                voiceChannel
            });
        }
    }
};
