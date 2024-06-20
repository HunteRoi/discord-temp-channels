import { EventEmitter } from "node:events";
import {
    Collection,
    type GuildMember,
    type Snowflake,
    type VoiceChannel,
} from "discord.js";

import { TempChannelsManagerEvents } from "./TempChannelsManagerEvents.js";
import type {
    ChildChannelData,
    ParentChannelData,
    ParentChannelOptions,
} from "./types/index.js";

/**
 * A voice channels manager, handling the relationship between parents and children channels.
 *
 * @export
 * @class VoiceChannelsManager
 * @extends {EventEmitter}
 */
export class VoiceChannelsManager extends EventEmitter {
    readonly #channels: Collection<Snowflake, ParentChannelData>;

    /**
     * Creates an instance of VoiceChannelsManager.
     * @memberof VoiceChannelsManager
     */
    constructor() {
        super();

        this.#channels = new Collection();
    }

    /**
     * Gets the parent channel either based on its ID or by looking for a match
     * on the provided ID and its list of children.
     *
     * @protected
     * @param {Snowflake} channelId
     * @param {boolean} [lookAsChild=false]
     * @return {ParentChannelData | undefined}
     * @memberof VoiceChannelsManager
     */
    protected getParentChannel(
        channelId: Snowflake,
        lookAsChild = false,
    ): ParentChannelData | undefined {
        if (lookAsChild) {
            return this.#channels.find((parent) =>
                parent.children.some(
                    (child) => child.voiceChannel.id === channelId,
                ),
            );
        }
        return this.#channels.get(channelId);
    }

    /**
     * Adds a parent channel into the collection.
     * Emits the {@link TempChannelsManagerEvents.channelRegister} event.
     *
     * @param {Snowflake} channelId
     * @param {ParentChannelOptions} options
     * @memberof VoiceChannelsManager
     */
    public registerChannel(
        channelId: Snowflake,
        options: ParentChannelOptions,
    ): void {
        const parent: ParentChannelData = { channelId, options, children: [] };
        this.#channels.set(channelId, parent);
        this.emit(TempChannelsManagerEvents.channelRegister, parent);
    }

    /**
     * Removes a registered parent channel from the collection, unbinding all children at the same time.
     * Emits the {@link TempChannelsManagerEvents.channelUnregister} event.
     *
     * @param {Snowflake} channelId
     * @return {*}  {boolean}
     * @memberof VoiceChannelsManager
     */
    public unregisterChannel(channelId: Snowflake): boolean {
        const parent = this.#channels.get(channelId);
        if (!parent) return false;

        const unregisteredSuccessfully = this.#channels.delete(channelId);
        if (unregisteredSuccessfully) {
            this.emit(TempChannelsManagerEvents.channelUnregister, parent);
            for (const child of parent.children) {
                this.unbindChannelFromParent(parent, child.voiceChannel.id);
            }
        }

        return unregisteredSuccessfully;
    }

    /**
     * Adds a voice channel as a child of a parent.
     * Emits the {@link TempChannelsManagerEvents.childAdd} event.
     *
     * @param {ParentChannelData} parent
     * @param {VoiceChannel} voiceChannel
     * @param {GuildMember} owner
     * @return {*}  {void}
     * @memberof VoiceChannelsManager
     */
    public bindChannelToParent(
        parent: ParentChannelData,
        voiceChannel: VoiceChannel,
        owner: GuildMember,
    ): void {
        if (!parent) return;

        const child: ChildChannelData = { owner, voiceChannel };
        parent.children.push(child);
        this.emit(TempChannelsManagerEvents.childAdd, child, parent);
    }

    /**
     * Removes a voice channel from the list of children of a parent.
     * Emits the {@link TempChannelsManagerEvents.childRemove} event.
     *
     * @param {ParentChannelData} parent
     * @param {Snowflake} voiceChannelId
     * @return {*}  {void}
     * @memberof VoiceChannelsManager
     */
    public unbindChannelFromParent(
        parent: ParentChannelData,
        voiceChannelId: Snowflake,
    ): void {
        if (!parent) return;

        const index = parent.children.findIndex(
            (c) => c.voiceChannel.id === voiceChannelId,
        );
        if (index === -1) return;

        const [child] = parent.children.splice(index, 1);
        this.emit(TempChannelsManagerEvents.childRemove, child, parent);
    }
}

/**
 * Emitted when a parent channel is registered.
 * @event VoiceChannelsManager#channelRegister
 * @see TempChannelsManagerEvents#channelRegister
 * @param {ParentChannelData} parent The parent channel data
 * @example
 * manager.on('channelRegister', (parent) => {});
 */

/**
 * Emitted when a parent channel is unregistered.
 * @event VoiceChannelsManager#channelUnregister
 * @see TempChannelsManagerEvents#channelUnregister
 * @param {ParentChannelData} parent The parent channel data
 * @example
 * manager.on('channelUnregister', (parent) => {});
 */

/**
 * Emitted when a voice channel is added as a child to a parent.
 * @event VoiceChannelsManager#childAdd
 * @see TempChannelsManagerEvents#childAdd
 * @param {ChildChannelData} child The child channel data
 * @param {ParentChannelData} parent The parent channel data
 * @example
 * manager.on('childAdd', (child, parent) => {});
 */

/**
 * Emitted when a voice channel is removed from the list of children of a parent.
 * @event VoiceChannelsManager#childRemove
 * @see TempChannelsManagerEvents#childRemove
 * @param {ChildChannelData} child The child channel data
 * @param {ParentChannelData} parent The parent channel data
 * @example
 * manager.on('childRemove', (child, parent) => {});
 */
