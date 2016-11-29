# Font metrics parser

Parsing tool that renders required fonts on canvas and returns fontMetrics data.

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
* express {Object} Express options
  * port {Number} Express port
* nightmare {Object} Nightmare options. Accepts any options that are valid for Nightmare initialization.
  * show {Boolean} Show browser window. Default: `false`

## Returns
JSON data

#### Example
```javascript

```


## Example
- TBD
