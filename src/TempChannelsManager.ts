import {
  Client,
  Snowflake,
  GuildChannel,
  Collection,
  DMChannel,
  VoiceState,
  ThreadChannel,
  IntentsBitField,
  VoiceChannel,
  ChannelType,
  OverwriteType,
  PermissionsBitField
} from 'discord.js';
import { EventEmitter } from 'events';

import { ChildChannelData, ParentChannelData, ParentChannelOptions } from './types';
import { TempChannelsManagerEvents } from './TempChannelsManagerEvents';

/**
 * The temporary channels manager.
 * @export
 * @class TempChannelsManager
 * @extends {EventEmitter}
 */
export class TempChannelsManager extends EventEmitter {
  /**
   * The collection of registered parent channels.
   * @name TempChannelsManager#channels
   * @type {Collection<Snowflake, ParentChannelData>}
   */
  public readonly channels: Collection<Snowflake, ParentChannelData>;

  /**
   * The client that instantiated this Manager
   * @name TempChannelsManager#client
   * @type {Client}
   * @readonly
   */
  public readonly client: Client;

  /**
   * Creates an instance of TempChannelsManager.
   * @param {Client} [client] The client that instantiated this Manager
   */
  constructor(client: Client) {
    super();

    const intents = new IntentsBitField(client.options.intents);
    if (!intents.has(IntentsBitField.Flags.GuildVoiceStates)) {
      throw new Error(
        'GUILD_VOICE_STATES intent is required to use this package!'
      );
    }

    if (!intents.has(IntentsBitField.Flags.Guilds)) {
      throw new Error('GUILDS intent is required to use this package!');
    }

    this.channels = new Collection();
    this.client = client;

    this.client.on(
      'voiceStateUpdate',
      async (oldState: VoiceState, newState: VoiceState) =>
        this.#handleVoiceStateUpdate(oldState, newState)
    );
    this.client.on(
      'channelUpdate',
      async (
        oldState: GuildChannel | DMChannel,
        newState: GuildChannel | DMChannel
      ) =>
        this.#handleChannelUpdate(
          oldState as GuildChannel,
          newState as GuildChannel
        )
    );
    this.client.on('channelDelete', async (channel: GuildChannel | DMChannel) =>
      this.#handleChannelDelete(channel as GuildChannel)
    );

    this.on(
      TempChannelsManagerEvents.channelRegister,
      async (parent: ParentChannelData) => this.#handleRegistering(parent)
    );
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
   *       childPermissionOverwriteOption: { MANAGE_CHANNELS: true }
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
      childPermissionOverwriteOptions: { ['ManageChannels']: true },
    }
  ): void {
    const channelData: ParentChannelData = {
      channelId,
      options,
      children: [],
    };
    this.channels.set(channelId, channelData);
    this.emit(TempChannelsManagerEvents.channelRegister, channelData);
  }

  /**
   * Unregisters a parent channel. When a user joins it, nothing will happen.
   *
   * @param {Snowflake} channelId
   */
  public unregisterChannel(channelId: Snowflake): void {
    const channel = this.channels.get(channelId);
    const isDeleted = this.channels.delete(channelId);
    if (isDeleted) {
      this.emit(TempChannelsManagerEvents.channelUnregister, channel);
      return;
    }

    this.emit('error', null, `There is no channel with the id ${channelId}`);
  }

  async #handleChannelDelete(channel: GuildChannel | ThreadChannel) {
    if (!channel) return;

    let parent = this.channels.get(channel.id);
    if (parent) {
      this.channels.delete(channel.id);
      this.emit(TempChannelsManagerEvents.channelUnregister, parent);
      return;
    }

    parent = this.channels.find((p: ParentChannelData) =>
      p.children.some((c: ChildChannelData) => c.voiceChannel.id === channel.id)
    );
    if (!parent) return;

    const child = parent.children.find((c: ChildChannelData) =>
      c.voiceChannel.id === channel.id
    );
    if (!child) return;

    if (child.voiceChannel.id === channel.id) {
      parent.children = parent.children.filter(
        (c) => c.voiceChannel.id !== channel.id
      );
      this.emit(
        TempChannelsManagerEvents.voiceChannelDelete,
        channel as VoiceChannel
      );
      this.emit(
        TempChannelsManagerEvents.childDelete,
        this.client.user,
        child,
        this.client.channels.cache.get(parent.channelId)
      );
    }
  }

  async #handleRegistering(parent: ParentChannelData) {
    if (!parent) return;

    const parentChannel = this.client.channels.resolve(
      parent.channelId
    ) as VoiceChannel;

    // reconstruct parent's children array when bot is ready
    if (parentChannel && parent.options.childVoiceFormatRegex) {
      const voiceChildren = parentChannel.parent.children.cache.filter(
        (c) => parent.options.childVoiceFormatRegex.test(c.name) && c.type === ChannelType.GuildVoice && c.permissionOverwrites.cache.some((po) => po.type === OverwriteType.Member)
      );

      parent.children = await Promise.all(
        voiceChildren.map(async (child) => {
          const ownerId = child.permissionOverwrites.cache.find((po) => po.type === OverwriteType.Member).id;
          const owner = await child.guild.members.fetch(ownerId);

          const channelData: ChildChannelData = {
            owner,
            voiceChannel: child as VoiceChannel
          };
          return channelData;
        })
      );

      // remove children if voice channels are empty when bot is ready
      parent.children = Array.from(
        new Collection(parent.children.map((c) => [c.owner.id, c]))
          .each(async (child) => {
            const childShouldBeDeleted =
              (parent.options.childAutoDeleteIfEmpty &&
                child.voiceChannel.members.size === 0) ||
              (parent.options.childAutoDeleteIfOwnerLeaves &&
                !child.voiceChannel.members.has(child.owner.id));
            if (childShouldBeDeleted) {
              await child.voiceChannel.delete();
              this.emit(
                TempChannelsManagerEvents.voiceChannelDelete,
                child.voiceChannel
              );

              this.emit(
                TempChannelsManagerEvents.childDelete,
                this.client.user,
                child,
                parentChannel
              );
            }
          })
          .filter((c) => c.voiceChannel.deletable)
          .values()
      );
    }
  }

  async #handleChannelUpdate(
    oldState: GuildChannel | ThreadChannel,
    newState: GuildChannel | ThreadChannel
  ) {
    if (!oldState || !newState) return;

    if (oldState.id !== newState.id) return;
    if (oldState.name === newState.name) return;

    const parent = this.channels.find((p) =>
      p.children.some(
        (c) =>
          c.voiceChannel.id === oldState.id
      )
    );
    if (!parent) return;

    const child = parent.children.find(
      (c) =>
        c.voiceChannel.id === oldState.id
    );
    if (!child) return;

    const nameDoesNotHavePrefix = !parent.options.childVoiceFormatRegex.test(newState.name);
    if (!parent.options.childCanBeRenamed && nameDoesNotHavePrefix) {
      const count = parent.children.indexOf(child) + 1;
      const name = parent.options.childVoiceFormat(newState.name, count)
      newState.setName(name);

      this.emit(TempChannelsManagerEvents.childPrefixChange, newState);
    }
  }

  async #handleVoiceStateUpdate(
    oldState: VoiceState,
    newState: VoiceState
  ) {
    const voiceChannelLeft = !!oldState.channelId && !newState.channelId;
    const voiceChannelMoved =
      !!oldState.channelId &&
      !!newState.channelId &&
      oldState.channelId !== newState.channelId;
    const voiceChannelJoined = !oldState.channelId && !!newState.channelId;

    if (voiceChannelLeft || voiceChannelMoved) {
      const parent = this.channels.find((p) =>
        p.children.some((c) => c.voiceChannel.id === oldState.channelId)
      );
      if (!parent) return;

      const child = parent.children.find(
        (c) => c.voiceChannel.id === oldState.channelId
      );
      if (!child) return;

      const childShouldBeDeleted =
        (parent.options.childAutoDeleteIfEmpty &&
          oldState.channel.members.size === 0) ||
        (parent.options.childAutoDeleteIfOwnerLeaves &&
          !oldState.channel.members.has(child.owner.id));
      if (childShouldBeDeleted) {
        try {
          await child.voiceChannel.delete();
          this.emit(
            TempChannelsManagerEvents.voiceChannelDelete,
            child.voiceChannel
          );

          parent.children = parent.children.filter(
            (c) => c.voiceChannel.id !== child.voiceChannel.id
          );
          this.emit(
            TempChannelsManagerEvents.childDelete,
            newState.member,
            child,
            this.client.channels.cache.get(parent.channelId)
          );
        } catch (err) {
          this.emit(
            TempChannelsManagerEvents.error,
            err,
            'Cannot auto delete channel ' + child.voiceChannel.id
          );
        }
      }
    }

    if (voiceChannelJoined || voiceChannelMoved) {
      const parent = this.channels.find(
        (p) => p.channelId === newState.channelId
      );
      if (!parent) return;

      const count = Math.max(
        0,
        ...parent.children.map((c) =>
          Number(c.voiceChannel.name.match(/\d+/g)?.shift())
        )
      );
      const newChannelName = parent.options.childVoiceFormat(
        newState.member.displayName,
        count + 1
      );
      const voiceChannel = (await newState.guild.channels.create({
        name: newChannelName,
        parent: parent.options.childCategory,
        bitrate: parent.options.childBitrate,
        userLimit: parent.options.childMaxUsers,
        type: ChannelType.GuildVoice,
        permissionOverwrites: [
          {
            id: newState.member.id,
            type: OverwriteType.Member,
            allow: PermissionsBitField.Flags.ManageChannels,
          },
        ],
      })) as VoiceChannel;
      this.emit(TempChannelsManagerEvents.voiceChannelCreate, voiceChannel);

      if (parent.options.childPermissionOverwriteOptions) {
        for (const roleOrUser of parent.options.childOverwriteRolesAndUsers) {
          voiceChannel.permissionOverwrites
            .edit(roleOrUser, parent.options.childPermissionOverwriteOptions)
            .catch((err) =>
              this.emit(
                TempChannelsManagerEvents.error,
                err,
                `Couldn't update the permissions of the channel ${voiceChannel.id
                } for role or user ${roleOrUser.toString()}`
              )
            );
        }
      }

      const child: ChildChannelData = {
        owner: newState.member,
        voiceChannel,
      };
      parent.children.push(child);
      this.emit(
        TempChannelsManagerEvents.childCreate,
        newState.member,
        child,
        this.client.channels.cache.get(parent.channelId)
      );

      newState.setChannel(voiceChannel.id);
    }
  }
}

/**
 * Emitted when a parent channel is registered.
 * @event TempChannelsManager#channelRegister
 * @see TempChannelsManagerEvents#channelRegister
 * @param {ParentChannelData} parent The parent channel data
 * @example
 * manager.on('channelRegister', (parent) => {});
 */

/**
 * Emitted when a parent channel is unregistered.
 * @event TempChannelsManager#channelUnregister
 * @see TempChannelsManagerEvents#channelUnregister
 * @param {ParentChannelData} parent The parent channel data
 * @example
 * manager.on('channelUnregister', (parent) => {});
 */

/**
 * Emitted when a voice channel is created.
 * @event TempChannelsManager#voiceChannelCreate
 * @see TempChannelsManagerEvents#voiceChannelCreate
 * @param {Discord.VoiceChannel} voiceChannel The voice channel
 * @example
 * manager.on('voiceChannelCreate', (voiceChannel) => {});
 */

/**
 * Emitted when a voice channel is deleted.
 * @event TempChannelsManager#voiceChannelDelete
 * @see TempChannelsManagerEvents#voiceChannelDelete
 * @param {Discord.VoiceChannel} voiceChannel The voice channel
 * @example
 * manager.on('voiceChannelDelete', (voiceChannel) => {});
 */

/**
 * Emitted when a channel is renamed and that the prefix is missing.
 * @event TempChannelsManager#childPrefixChange
 * @see TempChannelsManagerEvents#childPrefixChange
 * @param {Discord.GuildChannel} channel The channel
 * @example
 * manager.on('childPrefixChange', (channel) => {});
 */

/**
 * Emitted when a child channel is created.
 * @event TempChannelsManager#childCreate
 * @see TempChannelsManagerEvents#childCreate
 * @param {Discord.GuildMember | Discord.ClientUser} member The member
 * @param {ChildChannelData} child The child channel data
 * @param {ParentChannelData} parent The parent channel data
 * @example
 * manager.on('childCreate', (member, child, parent) => {});
 */

/**
 * Emitted when a child channel is deleted.
 * @event TempChannelsManager#childDelete
 * @see TempChannelsManagerEvents#childDelete
 * @param {Discord.GuildMember | Discord.ClientUser} member The member
 * @param {ChildChannelData} child The child channel data
 * @param {ParentChannelData} parent The parent channel data
 * @example
 * manager.on('childDelete', (member, child, parent) => {});
 */

/**
 * Emitted when an error occurs.
 * @event TempChannelsManager#error
 * @see TempChannelsManagerEvents#error
 * @param {Error} error The error object
 * @param {string} message The message of the error
 * @example
 * manager.on('error', (error, message) => {});
 */
