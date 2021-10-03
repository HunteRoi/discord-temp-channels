import {
	Client,
	Snowflake,
	GuildChannel,
	Collection,
	Intents,
} from 'discord.js';
import { EventEmitter } from 'events';

import { ParentChannelData, ParentChannelOptions } from './types';
import {
	handleChannelDelete,
	handleVoiceStateUpdate,
	handleChannelUpdate,
	handleTextCreation,
	handleRegistering,
} from './handlers';
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

		const intents = new Intents(client.options.intents);
		if (!intents.has(Intents.FLAGS.GUILD_VOICE_STATES)) {
			throw new Error(
				'GUILD_VOICE_STATES intent is required to use this package!'
			);
		}

		this.channels = new Collection();
		this.client = client;

		this.client.on('voiceStateUpdate', async (oldState, newState) =>
			handleVoiceStateUpdate(this, oldState, newState)
		);
		this.client.on('channelUpdate', async (oldState, newState) =>
			handleChannelUpdate(
				this,
				oldState as GuildChannel,
				newState as GuildChannel
			)
		);
		this.client.on('channelDelete', async (channel) =>
			handleChannelDelete(this, channel as GuildChannel)
		);

		this.on(TempChannelsManagerEvents.channelRegister, async (parent) =>
			handleRegistering(this, parent)
		);
		this.on(TempChannelsManagerEvents.createText, async (message) =>
			handleTextCreation(this, message)
		);
	}

	/**
	 * Registers a parent channel. When a user joins a it, a child will be created and they will be moved to it.
	 *
	 * @param {Snowflake} channelId
	 * @param {ParentChannelOptions} [options={
	 *       childCategory: null,
	 *       childAutoDelete: true,
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
			childTextFormat: (name, count) => `droom-${count}_${name}`,
			childTextFormatRegex: /^droom-\d+_/i,
			childPermissionOverwriteOptions: { MANAGE_CHANNELS: true },
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
 * Emitted when a text channel is created.
 * @event TempChannelsManager#textChannelCreate
 * @see TempChannelsManagerEvents#textChannelCreate
 * @param {Discord.TextChannel} textChannel The text channel
 * @example
 * manager.on('textChannelCreate', (textChannel) => {});
 */

/**
 * Emitted when a text channel is deleted.
 * @event TempChannelsManager#textChannelDelete
 * @see TempChannelsManagerEvents#textChannelDelete
 * @param {Discord.TextChannel} textChannel The text channel
 * @example
 * manager.on('textChannelDelete', (textChannel) => {});
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
