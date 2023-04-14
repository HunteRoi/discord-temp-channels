import { CategoryChannel, ChannelType, Client, DMChannel, Events, Guild, GuildMember, IntentsBitField, NonThreadGuildBasedChannel, OverwriteType, PermissionsBitField, Snowflake, VoiceChannel } from 'discord.js';
import { ChildChannelData, ParentChannelData, ParentChannelOptions } from './types';
import { VoiceChannelsManager } from './VoiceChannelsManager';
import { TempChannelsManagerEvents } from './TempChannelsManagerEvents';
import addDiscordLogs from 'discord-logs';
/**
 * The temporary channels manager.
 * @export
 * @class TempChannelsManager
 * @extends {EventEmitter}
 */
export class TempChannelsManager extends VoiceChannelsManager {
    public readonly client: Client;

    /**
     * Creates an instance of TempChannelsManager.
     * @param {Client} client
     * @memberof TempChannelsManager
     */
    constructor(client: Client) {
        super();

        const intents = new IntentsBitField(client.options.intents);
        if (!intents.has(IntentsBitField.Flags.GuildVoiceStates)) {
            throw new Error('GUILD_VOICE_STATES intent is required to use this package!');
        }

        if (!intents.has(IntentsBitField.Flags.Guilds)) {
            throw new Error('GUILDS intent is required to use this package!');
        }

        this.client = client;
        this.#listenToChannelEvents();
        addDiscordLogs(client);
    }

    /**
     * Registers a parent channel. When a user joins a it, a child will be created and they will be moved to it.
     *
     * @param {Snowflake} channelId
     * @param {ParentChannelOptions} [options={
     *       childCategory: null,
     *       childAutoDeleteIfEmpty: true,
     *       childAutoDeleteIfOwnerLeaves: false,
     *       childFormat: (name, count) => `[DRoom #${count}] ${name}`,
     *       childFormatRegex: /^\[DRoom #\d+\]\s+.+/i,
     *       childPermissionOverwriteOption: { 'ManageChannels': true }
     *     }]
     */
    public registerChannel(
        channelId: Snowflake,
        options: ParentChannelOptions = {
            childCategory: null,
            childAutoDeleteIfEmpty: true,
            childAutoDeleteIfOwnerLeaves: false,
            childVoiceFormat: (name, count) => `[DRoom #${count}] ${name}`,
            childVoiceFormatRegex: /^\[DRoom #\d+\]\s+.+/i,
            childPermissionOverwriteOptions: { 'ManageChannels': true },
            childShouldBeACopyOfParent: false
        }
    ): void {
        super.registerChannel(channelId, options);
    }

    /**
     * Unregisters a parent channel. When a user joins it, nothing will happen.
     *
     * @param {Snowflake} channelId
     */
    public unregisterChannel(channelId: Snowflake): boolean {
        const hasBeenUnregistered = super.unregisterChannel(channelId);
        if (!hasBeenUnregistered) {
            this.emit(TempChannelsManagerEvents.error, null, `Could not unregister the channel with the id ${channelId}`);
        }

        return hasBeenUnregistered;
    }

    #listenToChannelEvents(): void {
        this.client.on('voiceChannelJoin', async (member: GuildMember, channel: VoiceChannel) => await this.#createNewChild.apply(this, [member, channel]));
        this.client.on('voiceChannelSwitch', async (member: GuildMember, previousChannel: VoiceChannel, currentChannel: VoiceChannel) => await this.#handleChild.apply(this, [member, previousChannel, currentChannel]));
        this.client.on('voiceChannelLeave', async (member: GuildMember, channel: VoiceChannel) => await this.#checkChildForDeletion.apply(this, [channel]));

        this.client.on(Events.ChannelUpdate, async (oldState: DMChannel | NonThreadGuildBasedChannel, newState: DMChannel | NonThreadGuildBasedChannel) => await this.#handleChannelRenaming.apply(this, [oldState, newState]));
        this.client.on(Events.ChannelDelete, (channel: DMChannel | NonThreadGuildBasedChannel) => this.#cleanUpAfterDeletion.apply(this, [channel]));
        this.on(TempChannelsManagerEvents.channelRegister, async (parent: ParentChannelData) => await this.#restoreAfterCrash.apply(this, [parent]));
        this.on(TempChannelsManagerEvents.channelUnregister, async (parent: ParentChannelData) => {
            if (parent.options.childAutoDeleteIfParentGetsUnregistered) {
                for (const child of parent.children) {
                    await this.#deleteVoiceChannel.apply(this, [child.voiceChannel]);
                }
            }
        });
    }

    async #deleteVoiceChannel(channel: VoiceChannel): Promise<void> {
        try {
            await channel.delete();
        }
        catch (error) {
            this.emit(TempChannelsManagerEvents.error, error, 'Cannot auto delete channel ' + channel.id);
        }
    }

    async #restoreAfterCrash(parentData: ParentChannelData) {
        if (!parentData) return;

        const parent = this.getParentChannel(parentData.channelId);
        const voiceChannel = await this.client.channels.fetch(parent.channelId) as VoiceChannel;
        if (!voiceChannel) return;

        const bot = await voiceChannel.guild.members.fetch(this.client.user);
        const category = await voiceChannel.guild.channels.fetch(parent.options.childCategory ?? voiceChannel.parentId) as CategoryChannel;
        const children = (category?.children ?? voiceChannel.guild.channels).cache
            .filter(c => parent.options.childVoiceFormatRegex.test(c.name) && c.type === ChannelType.GuildVoice && c.permissionOverwrites.cache.some((po) => po.type === OverwriteType.Member));
        for (let child of [...children.values()] as VoiceChannel[]) {
            child = await this.client.channels.fetch(child.id) as VoiceChannel;
            this.bindChannelToParent(parent, child, child.members.size > 0 ? child.members.first() : bot);
            await this.#checkChildForDeletion(child);
        }
    }

    async #handleChannelRenaming(oldState: DMChannel | NonThreadGuildBasedChannel, newState: DMChannel | NonThreadGuildBasedChannel): Promise<void> {
        if (oldState.isDMBased() || newState.isDMBased()) return;
        if (oldState.name === newState.name) return;

        const parent = this.getParentChannel(newState.id, true);
        if (!parent) return;

        const child = parent.children.find(c => c.voiceChannel.id === newState.id);
        const nameDoesNotHavePrefix = !parent.options.childVoiceFormatRegex.test(newState.name);
        if (!parent.options.childCanBeRenamed && nameDoesNotHavePrefix) {
            const count = parent.children.indexOf(child) + 1;
            const nameWithPrefix = parent.options.childVoiceFormat(newState.name, count);
            await newState.setName(nameWithPrefix);

            this.emit(TempChannelsManagerEvents.childPrefixChange, child);
        }
    }

    async #checkChildForDeletion(channel: VoiceChannel): Promise<void> {
        const parent = this.getParentChannel(channel.id, true);
        if (!parent) return;

        const child = parent.children.find(c => c.voiceChannel.id === channel.id);
        const shouldBeDeleted = (parent.options.childAutoDeleteIfEmpty && child.voiceChannel.members.size === 0)
            || (parent.options.childAutoDeleteIfOwnerLeaves && !child.voiceChannel.members.has(child.owner.id));
        if (!shouldBeDeleted) return;

        await this.#deleteVoiceChannel(channel);
    }

    async #handleChild(member: GuildMember, oldChannel: VoiceChannel, newChannel: VoiceChannel): Promise<void> {
        await this.#checkChildForDeletion(oldChannel);
        await this.#createNewChild(member, newChannel);
    }

    async #createNewChild(member: GuildMember, channel: VoiceChannel): Promise<void> {
        const parent = this.getParentChannel(channel.id);
        if (!parent) return;

        const parentChannel = await this.client.channels.fetch(parent.channelId) as VoiceChannel;
        const count = Math.max(
            0,
            ...parent.children.map(child => Number(child.voiceChannel.name.match(/\d+/).shift()))
        );
        const name = parent.options.childVoiceFormat(member.displayName, count + 1);

        let categoryChannel: CategoryChannel | null = null;
        if (parent.options.childCategory) {
            categoryChannel = await channel.guild.channels.fetch(parent.options.childCategory) as CategoryChannel;
        }
        else if (parentChannel.parentId) {
            categoryChannel = await channel.guild.channels.fetch(parentChannel.parentId) as CategoryChannel;
        }

        let voiceChannel: VoiceChannel | null = null;
        if (parent.options.childShouldBeACopyOfParent) {
            voiceChannel = await parentChannel.clone({
                name
            });
        } else {
            voiceChannel = await channel.guild.channels.create({
                name,
                parent: categoryChannel?.id ?? null,
                bitrate: parent.options.childBitrate,
                userLimit: parent.options.childMaxUsers,
                type: ChannelType.GuildVoice,
                permissionOverwrites: categoryChannel ? [...categoryChannel.permissionOverwrites.cache.values()] : []
            });
        }

        await voiceChannel.permissionOverwrites.edit(member.id, { 'ManageChannels': true });
        if (parent.options.childPermissionOverwriteOptions) {
            for (const roleOrUser of parent.options.childOverwriteRolesAndUsers) {
                try {
                    await voiceChannel.permissionOverwrites.edit(roleOrUser, parent.options.childPermissionOverwriteOptions);
                }
                catch (error) {
                    this.emit(TempChannelsManagerEvents.error, error, `Couldn't update the permissions of the channel ${voiceChannel.id} for role or user ${roleOrUser.toString()}`);
                }
            }
        }

        this.bindChannelToParent(parent, voiceChannel, member);
        await member.voice.setChannel(voiceChannel);
    }

    #cleanUpAfterDeletion(channel: DMChannel | NonThreadGuildBasedChannel): void {
        if (!channel || channel.type !== ChannelType.GuildVoice) return;

        let parent = this.getParentChannel(channel.id);
        if (parent) {
            this.unregisterChannel(channel.id);
            return;
        }

        parent = this.getParentChannel(channel.id, true);
        if (!parent) return;

        this.unbindChannelFromParent(parent, channel.id);
    }
}


/**
 * Emitted when a voice channel name is changed because it does not respect the prefix regular expression.
 * @event TempChannelsManager#childPrefixChange
 * @see TempChannelsManagerEvents#childPrefixChange
 * @param {ChildChannelData} child The child channel data
 * @example
 * manager.on('childPrefixChange', (child) => {});
 */
