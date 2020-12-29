import {
  PermissionOverwriteOption,
  RoleResolvable,
  Snowflake,
  UserResolvable,
} from 'discord.js';

type Resolvables = RoleResolvable | UserResolvable;

export interface ParentChannelOptions {
  childCategory?: Snowflake;
  childAutoDelete: boolean;
  childAutoDeleteIfOwnerLeaves: boolean;
  childFormat(str: string, count: number): string;
  childFormatRegex: RegExp;
  childMaxUsers?: number;
  childBitrate?: number;
  childPermissionOverwriteOption?: PermissionOverwriteOption;
  childOverwriteRolesAndUsers?: Resolvables[];
}
