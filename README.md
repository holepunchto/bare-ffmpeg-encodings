# bare-ffmpeg-encodings

Hyperschema for serializable [`bare-ffmpeg`](/holepunchto/bare-ffmpeg) types.

## Use

```console
npm i --save-dev bare-ffmpeg-encodings
```

```js
const Hyperschema = require('hyperschema')
const { registerEncodings } = require('bare-ffmpeg-encodings')

const schema = Hyperschema.from('./spec')

registerEncodings(schema)

const template = schema.namespace('my-namespace')
template.register({
    name: 'my-type',
    fields: [
        { name: 'rational', type: '@ffmpeg/rational' },
        { name: 'streams', type: '@ffmpeg/stream' },
        { name: 'packets', type: '@ffmpeg/packet' },
        { name: 'parameters', type: '@ffmpeg/codecparameters' }
    ]
})

Hyperschema.toDisk(schema)
```

## License

Apache-2.0
