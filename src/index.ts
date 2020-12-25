import { Client, Snowflake, GuildChannel, Collection } from "discord.js";
import { EventEmitter } from "events";

import { ParentChannelData, ParentChannelOptions } from "./types";
import { handleChannelDelete, handleVoiceStateUpdate, handleChannelUpdate, handleMessage } from "./handlers";

class TempChannelsManager extends EventEmitter {
    public client: Client;
    public channels: Collection<Snowflake, ParentChannelData>;

    constructor(client: Client, prefix: string) {
        super();

        this.channels = new Collection();
        this.client = client;

        this.client.on("message", async (message) => {
            handleMessage(this, prefix, message);
        });

        this.client.on("voiceStateUpdate", async (oldState, newState) => {
            handleVoiceStateUpdate(this, oldState, newState);
        });

        this.client.on("channelUpdate", async (oldState, newState) => {
            handleChannelUpdate(this, oldState as GuildChannel, newState as GuildChannel);
        });

        this.client.on("channelDelete", async channel => {
            handleChannelDelete(this, channel as GuildChannel);
        });
    }

    registerChannel(channelID: Snowflake, options: ParentChannelOptions = {
        childCategory: null,
        childAutoDelete: true,
        childAutoDeleteIfOwnerLeaves: false,
        childFormat: (member, count) => `[DRoom ${count}] ${member.displayName}`,
        childPermissionOverwriteOption: {
            "MANAGE_CHANNELS": true
        }
    }) {
        const channelData: ParentChannelData = { channelID, options, children: [] };
        this.channels.set(channelID, channelData);
        this.emit("channelRegister", channelData);
    }

    unregisterChannel(channelID: Snowflake) {
        const channel = this.channels.get(channelID);
        const isDeleted = this.channels.delete(channelID);
        if (isDeleted) {
            return this.emit("channelUnregister", channel);
        }
        return this.emit("error", null, `There is no channel with the id ${channelID}`);
    }
}

export = TempChannelsManager;
