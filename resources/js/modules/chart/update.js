/**
 * See LICENSE.md file for further details.
 */

import * as d3 from "./../d3";
import Configuration from "./../configuration";
import Svg from "./svg";
import Gradient from "./gradient";
import Person from "./svg/person";

/**
 * This class handles the visual update of all text and path elements.
 *
 * @author  Rico Sonntag <mail@ricosonntag.de>
 * @license https://opensource.org/licenses/GPL-3.0 GNU General Public License v3.0
 * @link    https://github.com/magicsunday/webtrees-fan-chart/
 */
export default class Update
{
    /**
     * Constructor.
     *
     * @param {Svg}           svg
     * @param {Configuration} configuration The application configuration
     * @param {Hierarchy}     hierarchy
     */
    constructor(svg, configuration, hierarchy)
    {
        this._svg           = svg;
        this._configuration = configuration;
        this._hierarchy     = hierarchy;
        this._gradient      = new Gradient(this._svg, this._configuration);
    }

    /**
     * Update the chart with data loaded from AJAX.
     *
     * @param {string}     url      The update URL
     * @param {function()} callback The callback method to execute after the update
     *
     * @public
     */
    update(url, callback)
    {
        let that = this;

        this._svg.get()
            .selectAll("g.person")
            .on("click", null);

        d3.json(
            url
        ).then((data) => {
            // Initialize the new loaded data
            this._hierarchy.init(data);

            // Flag all elements which are subject to change
            this._svg.get()
                .selectAll("g.person")
                .data(this._hierarchy.nodes)
                .each(function (entry) {
                    let empty  = entry.data.xref === "";
                    let person = d3.select(this);

                    person.classed("remove", empty)
                        .classed("update", !empty && person.classed("available"))
                        .classed("new", !empty && !person.classed("available"));

                    if (!person.classed("new")) {
                        person.selectAll("g.label, title")
                            .classed("old", true);
                    }

                    new Person(that._svg, that._configuration, person, entry);
                });

            // Hide all new labels of not removed elements
            this._svg.get()
                .selectAll("g.person:not(.remove)")
                .selectAll("g.label:not(.old)")
                .style("opacity", 1e-6);

            this._gradient.addColorGroup(this._hierarchy)
                .classed("new", true);

            // Create transition instance
            let t = d3.transition()
                .duration(this._configuration.updateDuration)
                .call(this.endAll, () => this.updateDone(callback));

            // Fade out old arc
            this._svg.get()
                .selectAll("g.person.remove g.arc path")
                .transition(t)
                .style("fill", () => this._configuration.hideEmptySegments ? null : "rgb(235, 235, 235)")
                .style("opacity", () => this._configuration.hideEmptySegments ? 1e-6 : null);

            // Fade in new arcs
            this._svg.get()
                .selectAll("g.person.new g.arc path")
                .transition(t)
                .style("fill", "rgb(250, 250, 250)")
                .style("opacity", () => this._configuration.hideEmptySegments ? 1 : null);

            // Fade out all old labels and color group
            this._svg.get()
                .selectAll("g.person.update g.label.old, g.person.remove g.label.old, g.colorGroup:not(.new)")
                .transition(t)
                .style("opacity", 1e-6);

            // Fade in all new labels and color group
            this._svg.get()
                .selectAll("g.person:not(.remove) g.label:not(.old), g.colorGroup.new")
                .transition(t)
                .style("opacity", 1);
        });
    }

    /**
     * Function is executed as callback after all transitions are done in update method.
     *
     * @param {function()} callback The callback method to execute after the update
     *
     * @private
     */
    updateDone(callback)
    {
        // Remove arc if segments should be hidden
        if (this._configuration.hideEmptySegments) {
            this._svg.get()
                .selectAll("g.person.remove")
                .selectAll("g.arc")
                .remove();
        }

        // Remove styles so CSS classes may work correct, Uses a small timer as animation seems not
        // to be done already if the point is reached
        let t = d3.timer(() => {
            this._svg.get()
                .selectAll("g.person g.arc path")
                .attr("style", null);

            this._svg.get()
                .selectAll("g.person g.label")
                .style("opacity", null);

            t.stop();
        }, 10);

        this._svg.get()
            .selectAll("g.person.new, g.person.update, g.person.remove")
            .classed("new", false)
            .classed("update", false)
            .classed("remove", false)
            .selectAll("g.label.old, title.old")
            .remove();

        this._svg.get()
            .selectAll("g.colorGroup:not(.new)")
            .remove();

        this._svg.get()
            .selectAll("g.colorGroup.new")
            .classed("new", false);

        this._svg.get()
            .selectAll("g.person.available")
            .classed("available", false);

        // Execute callback function after everything is done
        callback();
    }

    /**
     * Helper method to execute callback method after all transitions are done of a selection.
     *
     * @param {Transition} transition D3 transition object
     * @param {function()} callback   Callback method
     *
     * @private
     */
    endAll(transition, callback)
    {
        let n = 0;

        transition
            .on("start", () => ++n)
            .on("end", () => {
                if (!--n) {
                    callback.apply(transition);
                }
            });
    }
}
