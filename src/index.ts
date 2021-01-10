import { Client, Snowflake, GuildChannel, Collection, ClientOptions } from 'discord.js';
import { EventEmitter } from 'events';

import { ParentChannelData, ParentChannelOptions } from './types';
import {
  handleChannelDelete,
  handleVoiceStateUpdate,
  handleChannelUpdate,
  handleTextCreation,
  handleRegistering,
} from './handlers';

/**
 *The temporary channels manager.
 * @export
 * @class TempChannelsManager
 * @extends {EventEmitter}
 */
export class TempChannelsManager extends EventEmitter {
  /**
   *The collection of registered parent channels.
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
   *Creates an instance of TempChannelsManager.
   * @param {Client} [client] The client that instantiated this Manager
   */
  constructor(client: Client) {
    super();

    this.channels = new Collection();
    this.client = client;

    this.client.on('voiceStateUpdate', async (oldState, newState) => handleVoiceStateUpdate(this, oldState, newState));
    this.client.on('channelUpdate', async (oldState, newState) => handleChannelUpdate(this, oldState as GuildChannel, newState as GuildChannel));
    this.client.on('channelDelete', async (channel) => handleChannelDelete(this, channel as GuildChannel));

    this.on('channelRegister', async (parent) => handleRegistering(this, parent));
    this.on('createText', async (message) => handleTextCreation(this, message));
  }

  /**
   *Registers a parent channel. When a user joins a it, a child will be created and they will be moved to it.
   *
   * @param {Snowflake} channelID
   * @param {ParentChannelOptions} [options={
   *       childCategory: null,
   *       childAutoDelete: true,
   *       childAutoDeleteIfOwnerLeaves: false,
   *       childFormat: (name, count) => `[DRoom #${count}] ${name}`,
   *       childFormatRegex: /^\[DRoom #\d+\]\s+.+/i,
   *       childPermissionOverwriteOption: { MANAGE_CHANNELS: true }
   *     }]
   */
  registerChannel(
    channelID: Snowflake,
    options: ParentChannelOptions = {
      childCategory: null,
      childAutoDelete: true,
      childAutoDeleteIfOwnerLeaves: false,
      childVoiceFormat: (name, count) => `[DRoom #${count}] ${name}`,
      childVoiceFormatRegex: /^\[DRoom #\d+\]\s+.+/i,
      childTextFormat: (name, count) => `droom-${count}_${name}`,
      childTextFormatRegex: /^droom-\d+_/i,
      childPermissionOverwriteOption: { MANAGE_CHANNELS: true },
    }
  ) {
    const channelData: ParentChannelData = { channelID, options, children: [] };
    this.channels.set(channelID, channelData);
    this.emit('channelRegister', channelData);
  }

  /**
   *Unregisters a parent channel. When a user joins it, nothing will happen.
   *
   * @param {Snowflake} channelID
   */
  unregisterChannel(channelID: Snowflake) {
    const channel = this.channels.get(channelID);
    const isDeleted = this.channels.delete(channelID);
    if (isDeleted) {
      return this.emit('channelUnregister', channel);
    }

    return this.emit('error', null, `There is no channel with the id ${channelID}`);
  }
}

/**
 * A wrapper of {@link Client} that provides a support for the TempChannelsManager.
 * @export
 * @class ClientWithTempManager
 * @extends {Client}
 */
export class ClientWithTempManager extends Client {
  /**
   * An instance of {@link TempChannelsManager} that currently manages all the temporary channels for the client.
   *
   * @name ClientWithTempManager#tempChannelsManager
   * @type {TempChannelsManager}
   */
  public tempChannelsManager: TempChannelsManager;

  /**
   *Creates an instance of ClientWithTempManager.
   * @param {ClientOptions} [options] Options for the client
   * @memberof ClientWithTempManager
   */
  constructor(options?: ClientOptions) {
    super(options);

    this.tempChannelsManager = new TempChannelsManager(this);
  }
}

**
 * Emitted when a new ticket is created by a user.
 * @event MailboxManager#ticketCreate
 * @param {Ticket} ticket The ticket
 * @example
 * manager.on('ticketCreate', (ticket) => {
 *  console.log(`${ticket.id} has been created`);
 * });
 */

/**
 * Emitted when a voice channel is created.
 * @event TempChannelsManager#voiceChannelCreate
 * @param {Discord.VoiceChannel} voiceChannel The voice channel
 * @example
 * manager.on('voiceChannelCreate', (voiceChannel) => {});
 */

/**
 * Emitted when a voice channel is deleted.
 * @event TempChannelsManager#voiceChannelDelete
 * @param {Discord.VoiceChannel} voiceChannel The voice channel
 * @example
 * manager.on('voiceChannelDelete', (voiceChannel) => {});
 */

/**
 * Emitted when a text channel is created.
 * @event TempChannelsManager#textChannelCreate
 * @param {Discord.TextChannel} textChannel The text channel
 * @example
 * manager.on('textChannelCreate', (textChannel) => {});
 */

/**
 * Emitted when a text channel is deleted.
 * @event TempChannelsManager#textChannelDelete
 * @param {Discord.TextChannel} textChannel The text channel
 * @example
 * manager.on('textChannelDelete', (textChannel) => {});
 */

/**
 * Emitted when a channel is renamed and that the prefix is missing.
 * @event TempChannelsManager#childPrefixChange
 * @param {Discord.GuildChannel} channel The channel
 * @example
 * manager.on('childPrefixChange', (channel) => {});
 */

/**
 * Emitted when a child channel is created.
 * @event TempChannelsManager#childCreate
 * @param {Discord.GuildMember | Discord.ClientUser} member The member
 * @param {ChildChannelData} child The child channel data
 * @param {ParentChannelData} parent The parent channel data
 * @example
 * manager.on('childCreate', (member, child, parent) => {});
 */

/**
 * Emitted when a child channel is deleted.
 * @event TempChannelsManager#childDelete
 * @param {Discord.GuildMember | Discord.ClientUser} member The member
 * @param {ChildChannelData} child The child channel data
 * @param {ParentChannelData} parent The parent channel data
 * @example
 * manager.on('childDelete', (member, child, parent) => {});
 */

/**
 * Emitted when a parent channel is registered.
 * @event TempChannelsManager#channelRegister
 * @param {ParentChannelData} parent The parent channel data
 * @example
 * manager.on('channelRegister', (parent) => {});
 */

/**
 * Emitted when a parent channel is unregistered.
 * @event TempChannelsManager#channelUnregister
 * @param {ParentChannelData} parent The parent channel data
 * @example
 * manager.on('channelUnregister', (parent) => {});
 */

/**
 * Emitted when an error occurs.
 * @event TempChannelsManager#error
 * @param {Error} error The error object
 * @param {string} message The message of the error
 * @example
 * manager.on('error', (error, message) => {});
 */
