import { GuildMember, TextChannel, VoiceChannel } from "discord.js";

export interface ChildChannelData {
    owner: GuildMember;
    voiceChannel: VoiceChannel;
    textChannel?: TextChannel;
}
