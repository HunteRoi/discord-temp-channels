# Breaking Changes

Between version 2.1.1 and version 3.0.0, drastic changes have taken place.
Those changes have a high impact on the public API therefore there are breaking changes, hence
the need to release a new major version.

The following are the expected breaking changes in users' codebase.

## No more text channels
Discord has added text channels directly embedded in voice channels. Therefore, the objective
of such feature in this library is already completed. I decided it was for the good to remove
the support of this feature in this new major version.

## No more voiceChannelCreate & voiceChannelDelete events
The events related to voice channel creation and deletion have been removed. Why do they exist
in the first place to be honest?

## childCreate becomes childAdd & childDelete becomes childRemove
The `childCreate` and `childDelete` events have been renamed as `childAdd` and `childRemove`.

## The channels collection is not public anymore
You cannot interact with the channels collection anymore. It did not feel right that you could
in the first place anyway.

## unregisterChannel now returns a boolean
The `unregisterChannel` method now returns a boolean value which expresses whether the unregister
system ran successfully or not.