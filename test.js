import test from 'brittle'
import ffmpeg from 'bare-ffmpeg'
import Hyperschema from 'hyperschema'
import {
  registerEncodings,
  preencodePacket,
  postdecodePacket,
  preencodeCodecParameters,
  postdecodeCodecParameters,
  preencodeStream,
  postdecodeStream
} from './index.js'
import { readFileSync } from 'bare-fs'

let _cache
async function testSchema () {
  if (_cache) return _cache

  const testSchema = Hyperschema.from('./spec')
  registerEncodings(testSchema)
  Hyperschema.toDisk(testSchema)

  _cache = import('./spec')
  return _cache
}

function openFixture () {
  const data = readFileSync('./fixture.webm')
  return new ffmpeg.InputFormatContext(new ffmpeg.IOContext(data))
}

test('packet', async t => {
  const { encode, decode } = await testSchema()

  const format = openFixture()

  const ns = '@ffmpeg/packet'
  const a = new ffmpeg.Packet()
  const b = new ffmpeg.Packet()

  let nPackets = 0
  let nSideData = 0
  let nBytes = 0
  while (format.readFrame(a)) {
    t.comment('packet stream:', a.streamIndex, 'dts:', a.dts, 'duration', a.duration)
    postdecodePacket(decode(ns, encode(ns, preencodePacket(a))), b)
    validatePacket(t, a, b)
  }

  function validatePacket (t, a, b) {
    t.is(a.dts, b.dts, 'dts')
    t.is(a.pts, b.pts, 'pts')
    t.is(a.streamIndex, b.streamIndex, 'streamIndex')
    t.is(a.duration, b.duration, 'duration')
    t.is(a.flags, b.flags, 'flags')
    t.is(a.isKeyframe, b.isKeyframe, 'isKeyframe') // part of flags
    t.ok(a.data.equals(b.data), 'data')
    nBytes += a.data.length

    for (let i = 0; i < Math.max(a.sideData.length, b.sideData.length); i++) {
      t.is(a.sideData[i].type, b.sideData[i].type, `sideData[${i}].type`)
      t.ok(a.sideData[i].data.equals(b.sideData[i].data), `sideData[${i}].data`)
      nSideData++
    }

    nPackets++
  }

  b.destroy()
  a.destroy()
  format.destroy()

  t.ok(nPackets > 0, `validated packets: ${nPackets}`)
  t.ok(nSideData > 0, `validated sideData: ${nSideData}`)
  t.ok(nBytes > 0, `validated bytes: ${nBytes}`)
})

test('codecParameters', async t => {
  const { encode, decode } = await testSchema()
  const format = openFixture()

  const ns = '@ffmpeg/codecparameters'

  for (const stream of format.streams) {
    const a = stream.codecParameters

    const b = postdecodeCodecParameters(decode(ns, encode(ns, preencodeCodecParameters(a))))
    validateCodecParameters(t, a, b)

    // check sanity
    const decoder = stream.decoder()
    a.extraData.equals(decoder.extraData)
    decoder.destroy()

    b.destroy()
  }

  function validateCodecParameters (t, a, b) {
    t.is(a.id, b.id, 'id')
    t.is(a.format, b.format, 'format')
    t.is(a.tag, b.tag, 'tag')
    t.alike(a.frameRate, b.frameRate, 'frameRate')
    t.is(a.videoDelay, b.videoDelay, 'videoDelay')
    t.is(a.profile, b.profile, 'profile')
    t.is(a.level, b.level, 'level')
    t.is(a.width, b.width, 'width')
    t.is(a.height, b.height, 'height')
    t.alike(a.sampleAsectRatio, b.sampleAsectRatio, 'sampleAsectRatio')
    t.is(a.bitRate, b.bitRate, 'bitRate')
    t.is(a.bitsPerCodedSample, b.bitsPerCodedSample, 'bitsPerCodedSample')
    t.is(a.bitsPerRawSample, b.bitsPerRawSample, 'bitsPerRawSample')
    t.is(a.sampleRate, b.sampleRate, 'sampleRate')
    t.is(a.nbChannels, b.nbChannels, 'nbChannels')
    t.is(a.channelLayout?.nbChannels, b.channelLayout?.nbChannels, 'channelLayout.nbChannels')
    t.ok(a.extraData.equals(b.extraData), 'extraData')
    t.is(a.blockAlign, b.blockAlign, 'blockAlign')
    t.is(a.initialPadding, b.initialPadding, 'initialPadding')
    t.is(a.trailingPadding, b.trailingPadding, 'trailingPadding')
    t.is(a.seekPreroll, b.seekPreroll, 'seekPreroll')
    t.is(a.frameSize, b.frameSize, 'frameSize')
  }

  format.destroy()
})

test('stream', async t => {
  const { encode, decode } = await testSchema()
  const format = openFixture()

  const ns = '@ffmpeg/stream'

  for (const stream of format.streams) {
    /** @type {ffmpeg.Stream} */
    const a = stream

    const b = postdecodeStream(decode(ns, encode(ns, preencodeStream(a))))
    validateStream(t, a, b)
  }

  function validateStream (t, a, b) {
    t.is(a.id, b.id, 'id')
    t.is(a.index, b.index, 'index')
    t.alike(a.timeBase, b.timeBase, 'timeBase')
    t.alike(a.avgFramerate, b.avgFramerate, 'avgFramerate')
  }

  format.destroy()
})
