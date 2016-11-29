# Font metrics parser

Parsing tool that renders required fonts on canvas and returns fontMetrics data. While fontMetrics object

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
fontParser.parse(options);
```

## Options
* parser {Object} Parser options
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

#### Example
```javascript
{
    "Arial": {
        "_fontSize": "24px",
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
    "__initialFonts": [
        {
            "fontFamily": "Arial"
        }
    ]
}
```


## Example
- TBD
