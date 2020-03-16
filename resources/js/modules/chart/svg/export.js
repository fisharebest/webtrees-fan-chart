/**
 * See LICENSE.md file for further details.
 */

// import * as d3 from "./../../d3";
// import Svg from "./../svg";
// import Geometry, {MATH_DEG2RAD, MATH_RAD2DEG} from "./geometry";

const MIN_HEIGHT  = 500;
const MIN_PADDING = 10;   // Minimum padding around view box

/**
 * The class handles all the text and path elements.
 *
 * @author  Rico Sonntag <mail@ricosonntag.de>
 * @license https://opensource.org/licenses/GPL-3.0 GNU General Public License v3.0
 * @link    https://github.com/magicsunday/webtrees-fan-chart/
 */
export default class Export
{
    /**
     * Constructor.
     *
     * @param {HTMLElement} svg
     * @param {HTMLElement} visual The application configuration
     */
    constructor(svg, visual)
    {
        this._svg    = svg;
        this._visual = visual;
    }

    copyStylesInline(destinationNode, sourceNode)
    {
        var containerElements = ['svg', 'g'];

        for (var cd = 0; cd < destinationNode.childNodes.length; ++cd) {
            var child = destinationNode.childNodes[cd];

            if (containerElements.indexOf(child.tagName) !== -1) {
                this.copyStylesInline(child, sourceNode.childNodes[cd]);
                continue;
            }

            var computedStyle = window.getComputedStyle(sourceNode.childNodes[cd], null);

    //                    var computedStyle = sourceNode.childNodes[cd].currentStyle
    //                        || ((sourceNode.childNodes[cd] instanceof Element) && window.getComputedStyle(sourceNode.childNodes[cd]));

            if (computedStyle === null) {
                continue;
            }

            for (var i = 0; i < computedStyle.length; ++i) {
                var style = computedStyle[i];

                child.style.setProperty(style, computedStyle.getPropertyValue(style));
            }
        }
    }

    triggerDownload (imgURI, fileName)
    {
        var evt = new MouseEvent('click', {
            view: window,
            bubbles: false,
            cancelable: true
        });

        var a = document.createElement('a');

        a.setAttribute('download', fileName);
        a.setAttribute('href', imgURI);
        a.setAttribute('target', '_blank');
        a.dispatchEvent(evt);
    }

    calculateViewBox(svg, area)
    {
        // Get bounding boxes
        var svgBoundingBox    = area.getBBox();
        var clientBoundingBox = area.getBoundingClientRect();

        // View box should have at least the same width/height as the parent element
        var viewBoxWidth  = Math.max(clientBoundingBox.width, svgBoundingBox.width);
        var viewBoxHeight = Math.max(clientBoundingBox.height, svgBoundingBox.height, MIN_HEIGHT);

        // Calculate offset to center chart inside svg
        var offsetX = (viewBoxWidth - svgBoundingBox.width) / 2;
        var offsetY = (viewBoxHeight - svgBoundingBox.height) / 2;

        // Adjust view box dimensions by padding and offset
        var viewBoxLeft = Math.ceil(svgBoundingBox.x - offsetX - MIN_PADDING);
        var viewBoxTop  = Math.ceil(svgBoundingBox.y - offsetY - MIN_PADDING);

        // Final width/height of view box
        viewBoxWidth  = Math.ceil(viewBoxWidth + (MIN_PADDING * 2));
        viewBoxHeight = Math.ceil(viewBoxHeight + (MIN_PADDING * 2));

        // Return calculated view box
        return [
            viewBoxLeft,
            viewBoxTop,
            viewBoxWidth,
            viewBoxHeight
        ];
    }

    svgToImage()//width, height)
    {

        // Works with latest Chrome, Firefox
        // -> Not with FF 45.0.2


        var fileName = 'test.png';

        var newSvg = this._svg.cloneNode(true);
//                var copy   = area.cloneNode(true);
//                newSvg.appendChild(copy);

//console.log(newSvg);

        this.copyStylesInline(newSvg, this._svg);

        var canvas = document.createElement('canvas');
        var bbox   = this._visual.getBoundingClientRect();

        newSvg.setAttribute('width', bbox.width);
        newSvg.setAttribute('height', bbox.height);
        newSvg.setAttribute('viewBox', this.calculateViewBox(newSvg, this._visual));

//                $('#fan_chart').append(newSvg);

//console.log(area.getBBox());
//console.log(area.getBoundingClientRect());
//console.log(svg.getBBox());
//console.log(svg.getBoundingClientRect());

        canvas.width  = Math.ceil(bbox.width);
        canvas.height = Math.ceil(bbox.height);

        var ctx = canvas.getContext('2d');

        ctx.fillStyle = "rgb(255,255,255)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

//                ctx.clearRect(0, 0, canvas.width, canvas.height);

        var data    = (new XMLSerializer()).serializeToString(newSvg);
        var DOMURL  = window.URL || window.webkitURL || window;
        var svgBlob = new Blob([ data ], { type: 'image/svg+xml;charset=utf-8' });
        var url     = DOMURL.createObjectURL(svgBlob);
        var img     = new Image();


        let that = this;

        img.onload = function () {
            ctx.drawImage(img, 0, 0);

            DOMURL.revokeObjectURL(url);

            if ((typeof navigator !== 'undefined') && navigator.msSaveOrOpenBlob) {
                var blob = canvas.msToBlob();
                navigator.msSaveOrOpenBlob(blob, fileName);
            } else {
                var imgURI = canvas
                    .toDataURL('image/png')
                    .replace('image/png', 'image/octet-stream');

                that.triggerDownload(imgURI, fileName);
            }

//                  document.removeChild(canvas);
        };

        img.src = url;
    }

//            this.config.svg.attr('viewBox', [
//                -809, -445, this.config.width, this.config.height
//            ]);

}
