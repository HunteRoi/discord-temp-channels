import { OptionDefaults } from 'typedoc'

/** @type {import('typedoc').TypeDocOptions} */
export default {
    entryPoints: ["src/index.ts"],
    out: "docs/api-docs",
    hideGenerator: true,
    excludePrivate: true,
    excludeExternals: true,
    navigationLinks: {
        GitHub: "https://github.com/hunteroi/discord-temp-channels",
        "Breaking Changes": "https://github.com/hunteroi/discord-temp-channels/blob/master/BREAKING_CHANGES.md"
    },
    blockTags: [...OptionDefaults.blockTags, "@export", "@name", "@min", "@max", "@memberof", "@remark"],
    externalSymbolLinkMappings: {
        "discord.js": { "Client": "https://discord.js.org/docs/packages/discord.js/14.22.1/Client:Class" }
    }
}
