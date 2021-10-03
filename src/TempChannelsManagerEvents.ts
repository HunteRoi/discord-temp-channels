export enum TempChannelsManagerEvents {
	channelRegister = 'channelRegister',
	channelUnregister = 'channelUnregister',

	voiceChannelCreate = 'voiceChannelCreate',
	voiceChannelDelete = 'voiceChannelDelete',
	voiceNotExisting = 'voiceNotExisting',

	childCreate = 'childCreate',
	childPrefixChange = 'childPrefixChange',
	childDelete = 'childDelete',

	createText = 'createText',
	textChannelCreate = 'textChannelCreate',
	textChannelDelete = 'textChannelDelete',

	error = 'error',
}
