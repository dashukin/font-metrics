# Font metrics parser

Javascript tool for parsing font metrics data.
Each font is loaded via CSS Font Loading API and then parsed from canvas in Chromium browser with `experimentalCanvasFeatures` set to `true`

## Usage
- install package
```javascript
npm install font-metrics --save-dev
```
- include parser via `import`
```javascript
import 'fontParser' from 'font-metrics'
```
 or `require` syntax
```javascript
var fontParser = require('font-metrics')
```
- call parse method
```javascript
fontParser(options).parse();
```

## Options
* fonts {Object[]} Array of objects.
* fonts.fontFamily {String} font-family
* [fonts.src] {String} Custom fonts are expected to have `src` value specified. Each font will be loaded via CSS Font Loading API and then parsed.
* debug {Boolean} Show logs.
* output {String} Output path.
* filename {String} Output filename.
* fontSize {Number} Font size
* express {Object} Express options
  * port {Number} Express port
* nightmare {Object} Nightmare options. Accepts any options that are valid for Nightmare initialization.
  * show {Boolean} Show browser window. Default: `false`

## Returns
JSON data

#### Usage example

```javascript
var fontMetrics = require('font-metrics');

fontMetrics({
	fonts: [
		{
			fontFamily: 'Arial'
		},
		{
			fontFamily: 'Roboto',
			src: 'https://fonts.gstatic.com/s/roboto/v15/sTdaA6j0Psb920Vjv-mrzH-_kf6ByYO6CLYdB4HQE-Y.woff2'
		}
	],
	output: './metrics/',
	filename: 'metrics.json',
	express: {
		port: 3412
	}
}).parse();
```

#### Output example
```javascript
{
    "metrics": {
        "Arial": {
            "_fontSize": 24,
            "_textBaseline": "alphabetic",
            "actualBoundingBoxAscent": 0,
            "actualBoundingBoxDescent": 24,
            "actualBoundingBoxLeft": 0,
            "actualBoundingBoxRight": 93,
            "alphabeticBaseline": 0,
            "emHeightAscent": 0,
            "emHeightDescent": 0,
            "fontBoundingBoxAscent": 22,
            "fontBoundingBoxDescent": 5,
            "hangingBaseline": -17.600000381469727,
            "ideographicBaseline": 5,
            "width": 93.375
        },
        "Roboto": {
                    "_fontSize": 24,
                    "_textBaseline": "alphabetic",
                    "actualBoundingBoxAscent": 0,
                    "actualBoundingBoxDescent": 24,
                    "actualBoundingBoxLeft": 0,
                    "actualBoundingBoxRight": 85,
                    "alphabeticBaseline": 0,
                    "emHeightAscent": 0,
                    "emHeightDescent": 0,
                    "fontBoundingBoxAscent": 22,
                    "fontBoundingBoxDescent": 6,
                    "hangingBaseline": -17.600000381469727,
                    "ideographicBaseline": 6,
                    "width": 85.30078125
                }
    },
    "src": [
        {
            "fontFamily": "Arial"
        },
        {
			"fontFamily": "Roboto",
			"src": "https://fonts.gstatic.com/s/roboto/v15/sTdaA6j0Psb920Vjv-mrzH-_kf6ByYO6CLYdB4HQE-Y.woff2"
		}
    ]
}
```

