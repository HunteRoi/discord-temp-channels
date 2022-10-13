export enum TempChannelsManagerEvents {
  channelRegister = 'channelRegister',
  channelUnregister = 'channelUnregister',

  voiceChannelCreate = 'voiceChannelCreate',
  voiceChannelDelete = 'voiceChannelDelete',

  childCreate = 'childCreate',
  childPrefixChange = 'childPrefixChange',
  childDelete = 'childDelete',

  error = 'error',
}
