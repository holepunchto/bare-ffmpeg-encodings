import ffmpeg from 'bare-ffmpeg'
export { registerEncodings } from './schema.js'
const { mediaTypes } = ffmpeg.constants

/** @param {ffmpeg.Packet} packet */
export function preencodePacket (packet) {
  return {
    streamIndex: packet.streamIndex,
    dts: packet.dts,
    pts: packet.pts,
    duration: packet.duration,
    flags: packet.flags,
    sideData: packet.sideData.map(sd => ({ type: sd.type, data: sd.data })),
    data: packet.data
  }
}

export function postdecodePacket (obj, dst = new ffmpeg.Packet()) {
  dst.data = obj.data
  dst.streamIndex = obj.streamIndex
  dst.dts = obj.dts
  dst.pts = obj.pts
  dst.duration = obj.duration
  dst.flags = obj.flags
  const sideData = obj.sideData
  if (sideData && sideData.length) {
    dst.sideData = sideData
  }
  return dst
}

/** @param {ffmpeg.Rational} rational */
export function preencodeRational (rational) {
  return {
    numerator: rational.numerator,
    denominator: rational.denominator
  }
}

export function postdecodeRational (obj, dst = new ffmpeg.Rational()) {
  dst.numerator = obj.numerator
  dst.denominator = obj.denominator
  return dst
}

/** @param {ffmpeg.CodecParameters} codecParameters */
export function preencodeCodecParameters (codecParameters) {
  const { type } = codecParameters

  const out = {
    id: codecParameters.id,
    tag: codecParameters.tag,
    type,
    format: codecParameters.format,
    extraData: codecParameters.extraData
  }

  switch (type) {
    case mediaTypes.AUDIO:
      Object.assign(out, {
        bitRate: codecParameters.bitRate,
        bitsPerCodedSample: codecParameters.bitsPerCodedSample,
        bitsPerRawSample: codecParameters.bitsPerRawSample,
        blockAlign: codecParameters.blockAlign,
        sampleRate: codecParameters.sampleRate,
        nbChannels: codecParameters.nbChannels,
        channelLayoutMask: codecParameters.channelLayout.mask,
        initialPadding: codecParameters.initialPadding,
        trailingPadding: codecParameters.trailingPadding,
        seekPreroll: codecParameters.seekPreroll
      })
      break

    case mediaTypes.VIDEO:
      Object.assign(out, {
        width: codecParameters.width,
        height: codecParameters.height,
        profile: codecParameters.profile,
        level: codecParameters.level,
        frameRate: preencodeRational(codecParameters.frameRate),
        sampleAspectRatio: preencodeRational(codecParameters.sampleAspectRatio)
      })
      break

    case mediaTypes.UNKNOWN:
      throw new Error('refusing to encode empty codec-parameters')

    default:
      throw new Error('unsupported codecparameters type:' + type)
  }

  return out
}

export function postdecodeCodecParameters (obj, dst = ffmpeg.CodecParameters.alloc()) {
  dst.id = obj.id
  dst.tag = obj.tag
  dst.type = obj.type
  dst.format = obj.format
  const extraData = obj.extraData
  if (extraData) dst.extraData = extraData

  switch (obj.type) {
    case mediaTypes.AUDIO:
      dst.blockAlign = obj.blockAlign
      dst.bitRate = obj.bitRate
      dst.bitsPerCodedSample = obj.bitsPerCodedSample
      dst.bitsPerRawSample = obj.bitsPerRawSample
      dst.sampleRate = obj.sampleRate
      dst.nbChannels = obj.nbChannels
      dst.channelLayout = obj.channelLayoutMask
      dst.initialPadding = obj.initialPadding
      dst.trailingPadding = obj.trailingPadding
      dst.seekPreroll = obj.seekPreroll
      break

    case mediaTypes.VIDEO:
      dst.width = obj.width
      dst.height = obj.height
      dst.profile = obj.profile
      dst.level = obj.level
      dst.frameRate = postdecodeRational(obj.frameRate)
      dst.sampleAspectRatio = postdecodeRational(obj.sampleAspectRatio)
      break
  }

  return dst
}

/** @param {ffmpeg.Stream} stream */
export function preencodeStream (stream) {
  return {
    id: stream.id,
    index: stream.index,
    timeBase: preencodeRational(stream.timeBase),
    avgFramerate: preencodeRational(stream.avgFramerate),
    codecParameters: preencodeCodecParameters(stream.codecParameters)
  }
}

/** @param {ffmpeg.Stream} dst */
export function postdecodeStream (obj, dst, updateStreamIndex = true) {
  // `bare-ffmpeg@v1.0.0-26` does not support
  // standalone stream initialization. (for good reason)
  dst ||= {}

  dst.id = obj.id

  // conditionally set streamIndex - due to above
  if (updateStreamIndex) dst.index = obj.index

  dst.timeBase = postdecodeRational(obj.timeBase)
  dst.avgFramerate = postdecodeRational(obj.avgFramerate)

  if (dst.codecParameters) {
    postdecodeCodecParameters(obj.codecParameters, dst.codecParameters)
  } else {
    dst.codecParameters = postdecodeCodecParameters(obj.codecParameters)
  }

  return dst
}

export function copyStreamProperties (src, dst, updateStreamIndex = true) {
  postdecodeStream(
    preencodeStream(src),
    dst,
    updateStreamIndex
  )
}
