/**
 * This module contains functions for the example client-side application
 * utilizing the server-side API. Though it is not part of the API server,
 * it is included in the automatically generated documentation for
 * completeness' sake.
 * @module client/script
 * @author Patrik Nemeth <xnemet04@stud.fit.vutbr.cz>
 */

/**
 * Parse dates in the ISO format and return them in the API call format.
 * @param {string} date is the input date in ISO format.
 * @returns {string} the same date, only in the valid API call format.
 */
function parseDate(date) {
    const sections = date.split("-");
    let sections_new = [];

    for (let item of sections) {
        if (item.startsWith('0')) {
            // If starts with 0, remove it.
            item = item.substring(1);
        }
        sections_new.push(item);
    }

    return sections_new.reverse().join('/');
}

/**
 * Builds a valid API call URL for the 'hospital' category (ICU and hospital bed
 * occupancy) based on user selections.
 * @returns {string} a valid API call URL.
 */
function buildRequestURL() {
    let url = "http://localhost:3000";

    const type = $("#type_select option:selected").val();
    url = url.concat("/");
    url = url.concat(type);
    const country = $("#country_select option:selected").val();
    url = url.concat("/");
    url = url.concat(country);

    const date_from = parseDate($("#date_from").val());
    const date_to = parseDate($("#date_to").val());

    if (date_from === '' && date_to !== '') {
        // Only end date is specified, return just that day.
        url = url.concat("/");
        url = url.concat(date_to);

        return url;
    }

    if (date_from !== '' && date_to !== '') {
        // Start and end date specified.
        url = url.concat("/");
        url = url.concat(date_from);
        url = url.concat("/");
        url = url.concat(date_to);
    } else if (date_from !== '' && date_to === '') {
        // Only starting date specified.
        url = url.concat("/");
        url = url.concat(date_from);

        // Get today's date.
        let today = new Date();
        today = "/" +
                String(today.getDate()).padStart(2, '0') + "/" +
                String(today.getMonth() + 1).padStart(2, '0') + "/" +
                String(today.getFullYear());

        url = url.concat(today);
    }

    return url;
}

/**
 * Builds a valid API call URL for the 'tests' category based on user selections.
 * @returns {string} a valid API call URL.
 */
function buildRequestURLTests() {
    let url = "http://localhost:3000/tests";

    const country = $("#country_select option:selected").val();
    url = url.concat("/");
    url = url.concat(country);

    const year = $("#tests_year_select option:selected").val(),
        week = $("#tests_week_select option:selected").val();

    if (year !== "all" && week === "whole_year") {
        // Specific year, with every week.
        url = url.concat("/");
        url = url.concat(year);
    }

    if (year !== "all" && week !== "whole_year") {
        // Specific year with specific week
        url = url.concat("/");
        url = url.concat(year);
        url = url.concat("/");
        url = url.concat(week);
    }

    return url;
}

/**
 * Shows the appropriate selection settings for the user
 * based on chosen category ('hospitals' or 'tests').
 */
$(document).ready(function() {
    $("#category_selector_hospital").click(function() {
        d3.select("#category_hospital").classed("hidden", false);
        d3.select("#category_tests").classed("hidden", true);
    });

    $("#category_selector_tests").click(function() {
        d3.select("#category_tests").classed("hidden", false);
        d3.select("#category_hospital").classed("hidden", true);
    });
});

/**
 * Add a `click` event listener to the Submit buttons for each category.
 */
$(document).ready(function() {
    $("#send_request").click(function() {
        hospitalPlot();
    });

    // Tests have a different data format, so the plot will be different.
    $("#send_request_tests").click(function() {
        testsPlot();
    });
});

/**
 * Sends an API call for data specified by user and plots the results.
 * Variant for the hospital beds and ICU occupancy.
 */
function hospitalPlot() {
    const url = buildRequestURL();

    const [svg, width, height] = setUpSVG();

    d3.json(url)
        .then(function(data) {
            const x = setUpXScale(width, data, "date");
            svg.append("g")
                .attr("transform", "translate(0," + height + ")")
                .call(
                    // If the data contains more days than 31, show ticks for the 1.,10. and 20. days of each month.
                    data.length > 31 ? d3.axisBottom(x).tickFormat(x => /202.-..-(01|10|20)/.test(x) ? x : "") : d3.axisBottom(x)
                )
                .selectAll("text")
                    .attr("transform", "translate(-10,0)rotate(-50)")
                    .style("text-anchor", "end");

            const max = d3.max(data, d => d.value);
            const y = setUpYScale(height, max);
            svg.append("g")
                .call(d3.axisLeft(y));

            if (data.length == 0) {
                showNoData();
            }

            // Bars
            // TODO repeated code
            svg.selectAll(".bar")
                .data(data)
                .enter()
                .append("rect")
                    .attr("x", function(d) { return x(d.date); })
                    .attr("y", function(d) { return y(d.value); })
                    .attr("width", x.bandwidth())
                    .attr("height", function(d) { return height - y(d.value); })
                    .attr("fill", "#69b3a2")
                    .attr("date", function(d) { return d.date; })
                    .attr("val", function(d) { return d.value; })
                    .attr("class", "bar")
                    .on("mouseover", function() {
                        setBarMouseOverEvent(this);
                   })
                   .on("mouseout", function() {
                        d3.select("#tooltip").classed("hidden", true);
                   });

        });
}

/**
 * Sends an API call for data specified by user and plots the results.
 * Variant for the covid testing data.
 */
function testsPlot() {
    const [svg, width, height] = setUpSVG();

    // The API returns multiple datapoints for each week, so we need
    // to pick one client side. This returns the type of data the user
    // wants to see.
    const data_point = d3.select("#data_point").node().value;

    const url = buildRequestURLTests();

    console.log(url);
    d3.json(url)
        .then(function(data) {
            const x = setUpXScale(width, data, "year_week");
            svg.append("g")
                .attr("transform", "translate(0," + height + ")")
                .call(
                    // If the data contains more than 10 weeks, show ticks for every 10nth.
                    data.length > 10 ? d3.axisBottom(x).tickFormat(x => /202.-W([12345]0|01)/.test(x) ? x : "") : d3.axisBottom(x)
                )
                .selectAll("text")
                    .attr("transform", "translate(-10,0)rotate(-50)")
                    .style("text-anchor", "end");

            /**
             * Float values are serialized as strings in the JSON. This function returns a float
             * or int based on how the value of the data point (accessed by `data_point`)
             * in the object is serialized.
             * @param obj an object of the incoming json.
             */
            const getValue = obj => {
                return (typeof obj[data_point] === "string" ? parseFloat(obj[data_point]) : obj[data_point]);
            };

            // Maximum value based on user selected datapoint (data type).
            const max = d3.max(data, d => getValue(d));
            const y = setUpYScale(height, max);
            svg.append("g")
                .call(d3.axisLeft(y));

            if (data.length == 0) {
                showNoData();
            }

            svg.selectAll(".bar")
                .data(data)
                .enter()
                .append("rect")
                    .attr("x", function(d) { return x(d.year_week); })
                    .attr("y", function(d) { return y(getValue(d)); })
                    .attr("width", x.bandwidth())
                    .attr("height", function(d) { return height - y(d[data_point]); })
                    .attr("fill", "#69b3a2")
                    .attr("date", function(d) { return d.year_week; })
                    .attr("val", function(d) { return String(getValue(d)); })
                    .attr("class", "bar")
                    .on("mouseover", function() {
                        setBarMouseOverEvent(this);
                   })
                   .on("mouseout", function() {
                        d3.select("#tooltip").classed("hidden", true);
                   });
        });
}

/**
 * Used to set up the mouseover event handler for the individual bar plot bars.
 * This event handles showing the tooltip.
 * @param {{}} obj is the current HTML object, for which to set this event handler for.
 */
function setBarMouseOverEvent(obj) {
    // This is for conpatibility reasons, as getScreenCTM may return
    // a deprecated SVGMatrix even in newer browsers.
    const m = obj.getScreenCTM();
    let matrix = new DOMMatrix([m.a, m.b, m.c, m.d, m.e, m.f])

    // Translate the matrix to point to the top of the current plotbar bar.
    const barX = parseFloat(obj.getAttribute("x")) + parseFloat(obj.getAttribute("width"));
    const barY = parseFloat(obj.getAttribute("y"));
    matrix = matrix.translateSelf(barX, barY);

    d3.select("#tooltip")
        .style("left", (matrix.e + 10) + "px")
        .style("top", (matrix.f + 15) + "px")
        .select("#value")
        .text(d3.select(obj).attr("date") +
            " : " +
            d3.format(".2~f")(d3.select(obj).attr("val")));
    d3.select("#tooltip").classed("hidden", false);
}

/**
 * Deletes the old svg, if needed, and creates a new svg object for the barplots.
 * @returns {Array} an array of the new svg element, its width,
 *  and its height without margins.
 */
function setUpSVG() {
    var margin = {top: 30, right: 30, bottom: 70, left: 60},
        width = d3.select("#dataviz svg").node().getBoundingClientRect().width - margin.left - margin.right,
        height = d3.select("#dataviz svg").node().getBoundingClientRect().height - margin.top - margin.bottom;

    // Remove the previous barplot.
    d3.select("#dataviz svg").selectAll("*").remove();

    var svg = d3.select("#dataviz svg")
        .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

    return [svg, width, height];
}

/**
 * Sets up and returns a d3 linear scale function for the 'y' axis of the barplot.
 * @param {number} height the maximum range onto which to map
 *  the domain - should be the height of the plot.
 * @param {number} max the maximum value in the scale's domain.
 * @returns {Function} the linear scale for the 'y' axis.
 */
function setUpYScale(height, max) {
    const y = d3.scaleLinear()
                .domain([0, max])
                .range([height, 0]);

    return y;
}

/**
 * Sets up and returns a d3 band scale function for the 'x' axis of the barplot.
 * @param {number} width is the maximum range onto which to map
 *  the domain - should be the width of the plot.
 * @param {{}} data is a JSON object parsed by d3 - the domain.
 * @param {string} data_point specifies the name of the property of
 *  the `data` object that will be displayed on the 'x' axis.
 * @returns {Function} the band scale for the 'x' axis.
 */
function setUpXScale(width, data, data_point) {
    const x = d3.scaleBand()
        .range([0,width])
        .domain(data.map(function(d) { return d[data_point]; }))
        .paddingOuter(0.2);

    return x;
}

/**
 * Prints a big "NO DATA" notice into the barplot svg. Called when there
 * is no data to be shown.
 */
 function showNoData() {
    d3.select("svg")
    .append("text")
        .attr("x", "50%")
        .attr("y", "50%")
        .attr("dominant-baseline", "middle")
        .attr("text-anchor", "middle")
        .style("font-size", "xx-large")
        .text("NO DATA");
}

// This client app was developped on firefox, where input type "week" does not work,
// so I just threw this in here.
// From https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/week
$(document).ready(function() {
    for (let i = 1; i <= 53; i++) {
        const val = (i < 10) ? ("0" + i) : i;

        d3.select("#tests_week_select")
            .append("option")
                .attr("value", val)
                .text(val);
    }
});