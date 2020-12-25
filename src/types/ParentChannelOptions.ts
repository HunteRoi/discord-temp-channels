import { GuildMember, PermissionOverwriteOption, RoleResolvable, Snowflake, UserResolvable } from "discord.js";

type Resolvables = RoleResolvable | UserResolvable;

export interface ParentChannelOptions {
    childAutoDelete: boolean;
    childAutoDeleteIfOwnerLeaves: boolean;
    childFormat(member: GuildMember, count: number): string;
    childMaxUsers?: number;
    childBitrate?: number;
    childCategory?: Snowflake;
    childPermissionOverwriteOption?: PermissionOverwriteOption;
    childOverwriteRolesAndUsers?: Resolvables[];
}
