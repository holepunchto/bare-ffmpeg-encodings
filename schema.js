export function registerEncodings (schema) {
  const template = schema.namespace('ffmpeg')
  const compact = true

  template.register({
    name: 'rational',
    compact,
    fields: [
      { name: 'numerator', type: 'int', require: true },
      { name: 'denominator', type: 'int', require: true }
    ]
  })

  template.register({
    name: 'packet',
    compact,
    fields: [
      { name: 'dts', type: 'int', required: true },
      { name: 'pts', type: 'int', required: true },
      { name: 'streamIndex', type: 'int', required: true },
      { name: 'flags', type: 'int', require: true },
      { name: 'duration', type: 'int', require: true },
      { name: 'sideData', type: '@ffmpeg/sidedata', array: true, require: true },
      { name: 'data', type: 'buffer', require: true }
    ]
  })

  template.register({
    name: 'sidedata',
    compact,
    fields: [
      { name: 'type', type: 'int', required: true },
      { name: 'data', type: 'buffer', required: true }
    ]
  })

  template.register({
    name: 'codecparameters',
    compact,
    fields: [
      // Common
      { name: 'id', type: 'int', require: true },
      { name: 'tag', type: 'int', require: true },
      { name: 'type', type: 'int', require: true },
      { name: 'format', type: 'int', require: true },
      { name: 'extraData', type: 'buffer', require: false },

      // Audio
      { name: 'bitRate', type: 'uint', require: false },
      { name: 'bitsPerCodedSample', type: 'uint', require: false },
      { name: 'bitsPerRawSample', type: 'uint', require: false },
      { name: 'sampleRate', type: 'uint', require: false },
      { name: 'channelLayoutMask', type: 'int', require: false },
      { name: 'blockAlign', type: 'int', require: false },
      { name: 'nbChannels', type: 'int', require: false },
      { name: 'initialPadding', type: 'int', require: false },
      { name: 'trailingPadding', type: 'int', require: false },
      { name: 'seekPreroll', type: 'int', require: false },

      // Video
      { name: 'frameRate', type: '@ffmpeg/rational', require: false },
      { name: 'width', type: 'uint', require: false },
      { name: 'height', type: 'uint', require: false },
      { name: 'profile', type: 'int', require: false },
      { name: 'level', type: 'int', require: false },
      { name: 'sampleAspectRatio', type: '@ffmpeg/rational', require: false }
    ]
  })

  template.register({
    name: 'stream',
    compact,
    fields: [
      { name: 'id', type: 'int', require: true },
      { name: 'index', type: 'int', require: true },
      { name: 'timeBase', type: '@ffmpeg/rational', require: true },
      { name: 'avgFramerate', type: '@ffmpeg/rational', require: true },
      { name: 'codecParameters', type: '@ffmpeg/codecparameters', require: true }
    ]
  })
}
