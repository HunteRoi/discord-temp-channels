/** @type {import('typedoc').TypeDocOptions} */
export default {
    "entryPoints": ["src/index.ts"],
    "out": "docs/api-docs",
    "hideGenerator": true,
    "excludePrivate": true,
    "excludeExternals": true,
    "navigationLinks": {
        "GitHub": "https://github.com/hunteroi/discord-temp-channels",
        "Breaking Changes": "https://github.com/hunteroi/discord-temp-channels/blob/master/BREAKING_CHANGES.md"
    }
}
