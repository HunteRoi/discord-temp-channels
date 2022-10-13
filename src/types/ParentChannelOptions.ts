import {
  PermissionOverwriteOptions,
  RoleResolvable,
  Snowflake,
  UserResolvable,
} from 'discord.js';

type Resolvables = RoleResolvable | UserResolvable;

/**
 * The configuration for the channel that triggers the system.
 *
 * @export
 * @interface ParentChannelOptions
 */
export interface ParentChannelOptions {
  /**
   * The category in which the child channels should be created.
   *
   * @type {Snowflake}
   * @memberof ParentChannelOptions
   */
  childCategory?: Snowflake;

  /**
   * Whether the child channel should be removed when empty.
   *
   * @type {boolean}
   * @memberof ParentChannelOptions
   */
  childAutoDeleteIfEmpty: boolean;

  /**
   * Whether the child channel should be removed
   * when its owner leaves it.
   *
   * @type {boolean}
   * @memberof ParentChannelOptions
   */
  childAutoDeleteIfOwnerLeaves: boolean;

  /**
   * Whether the child channel can be renamed or not without forcing the add of the prefix.
   * Please notice that if set on true, the capacity to reload channels into memory on bot restart cannot be guaranteed.
   *
   * @type {boolean}
   * @memberof ParentChannelOptions
   */
  childCanBeRenamed?: boolean;

  /**
   * The function that resolves the name of the child voice channels
   * when automatically generated.
   *
   * @param {string} str
   * @param {number} count
   * @return {*}  {string}
   * @memberof ParentChannelOptions
   */
  childVoiceFormat(str: string, count: number): string;

  /**
   * The regular expression that should fit the childVoiceFormat in order to detect
   * the child channels in case the bot crashes and reconnects.
   *
   * @type {RegExp}
   * @memberof ParentChannelOptions
   */
  childVoiceFormatRegex: RegExp;

  /**
   * The maximum number of users in a child channel.
   *
   * @type {number}
   * @memberof ParentChannelOptions
   */
  childMaxUsers?: number;

  /**
   * The bitrate of a child voice channel.
   *
   * @type {number}
   * @memberof ParentChannelOptions
   */
  childBitrate?: number;

  /**
   * The permissions overwrites of a child channel.
   *
   * @type {PermissionOverwriteOptions}
   * @memberof ParentChannelOptions
   */
  childPermissionOverwriteOptions?: PermissionOverwriteOptions;

  /**
   * The list of users or roles to which the childPermissionOverwriteOption are applied.
   *
   * @type {Resolvables[]}
   * @memberof ParentChannelOptions
   */
  childOverwriteRolesAndUsers?: Resolvables[];
}
