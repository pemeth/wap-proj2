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

function buildRequestURL() {
    let url = "http://localhost:3000";

    const type = $("#type_select option:selected").val();
    url = url.concat("/");
    url = url.concat(type);
    const country = $("#country_select option:selected").val();
    url = url.concat("/");
    url = url.concat(country);

    const date_from = parseDate($("#date_from").val());
    if (date_from !== '') {
        url = url.concat("/");
        url = url.concat(date_from);
    }
    const date_to = parseDate($("#date_to").val());
    if (date_to !== '') {
        url = url.concat("/");
        url = url.concat(date_to);
    }

    return url;
}

function buildRequestURLTests() {
    let url = "http://localhost:3000/tests";

    const country = $("#country_select option:selected").val();
    url = url.concat("/");
    url = url.concat(country);

    return url;
}

$(document).ready(function() {
    $("#category_selector_hospital").click(function() {
        d3.select("#category_hospital").classed("hidden", false);
        d3.select("#category_tests").classed("hidden", true);
    });
});

$(document).ready(function() {
    $("#category_selector_tests").click(function() {
        d3.select("#category_tests").classed("hidden", false);
        d3.select("#category_hospital").classed("hidden", true);
    });
});

$(document).ready(function() {
    $("#send_request").click(function() {
        hospitalPlot();
    });

    // Tests have a different data format, so the plot will be different.
    $("#send_request_tests").click(function() {
        testsPlot();
    });
});

function hospitalPlot() {
    const url = buildRequestURL();

    var margin = {top: 30, right: 30, bottom: 70, left: 60},
        width = d3.select("#dataviz svg").node().getBoundingClientRect().width - margin.left - margin.right,
        height = d3.select("#dataviz svg").node().getBoundingClientRect().height - margin.top - margin.bottom;

    // Remove the previous barplot.
    d3.select("#dataviz svg g").remove();

    // Append the object that will hold the barplot.
    var svg = d3.select("#dataviz svg")
        .append("g")
            .attr("transform",
                  "translate(" + margin.left + "," + margin.top + ")");

    d3.json(url)
        .then(function(data) {
            let x = d3.scaleBand()
                .range([0,width])
                .domain(data.map(function(d) { return d.date; }))
                .paddingOuter(0.2);
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
            var y = d3.scaleLinear()
                .domain([0, max])
                .range([ height, 0]);
            svg.append("g")
                .call(d3.axisLeft(y));

            // Bars
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
                    .attr("class", "bar")
                    .on("mouseover", function(d) {
                        // On mouseover, show the tooltip.
                        // TODO: maybe figure out how to show it at the mouse's position
                        var matrix = this.getScreenCTM()
                            .translate(+this.getAttribute("cx"),
                                +this.getAttribute("cy"));

                        d3.select("#tooltip")
                            .style("left", (matrix.e) + "px")
                            .style("top", (matrix.f + 300) + "px")
                            .select("#value")
                            .text(d3.select(this).attr("date"));
                        d3.select("#tooltip").classed("hidden", false);
                   })
                   .on("mouseout", function() {
                        d3.select("#tooltip").classed("hidden", true);
                   });

        });
}

function testsPlot() {
    var margin = {top: 30, right: 30, bottom: 70, left: 60},
        width = d3.select("#dataviz svg").node().getBoundingClientRect().width - margin.left - margin.right,
        height = d3.select("#dataviz svg").node().getBoundingClientRect().height - margin.top - margin.bottom;

    // Remove the previous barplot.
    d3.select("#dataviz svg g").remove();

    var svg = d3.select("#dataviz svg")
        .append("g")
            .attr("transform",
                  "translate(" + margin.left + "," + margin.top + ")");

    // The API returns multiple datapoints for each week, so we need
    // to pick one client side. This returns the type of data the user
    // wants to see.
    const data_point = d3.select("#data_point").node().value;

    const url = buildRequestURLTests();

    console.log(url);
    d3.json(url)
        .then(function(data) {
            let x = d3.scaleBand()
                .range([0,width])
                .domain(data.map(function(d) { return d.year_week; }))
                .paddingOuter(0.2);
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
             * @function getValue
             * @param obj an object of the incoming json.
             *
             * Float values are serialized as strings in the JSON. This function returns a float
             * or int based on how the value of the data point (accessed by `data_point`)
             * in the object is serialized.
             */
            const getValue = obj => {
                return (typeof obj[data_point] === "string" ? parseFloat(obj[data_point]) : obj[data_point]);
            };

            // Maximum value based on user selected datapoint (data type).
            const max = d3.max(data, d => getValue(d));
            var y = d3.scaleLinear()
                .domain([0, max])
                .range([ height, 0]);
            svg.append("g")
                .call(d3.axisLeft(y));

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
                    .attr("class", "bar")
                    .on("mouseover", function(d) {
                        // On mouseover, show the tooltip.
                        // TODO: same as in hospitalPlot()
                        var matrix = this.getScreenCTM()
                            .translate(+this.getAttribute("cx"),
                                +this.getAttribute("cy"));

                        d3.select("#tooltip")
                            .style("left", (matrix.e) + "px")
                            .style("top", (matrix.f + 300) + "px")
                            .select("#value")
                            .text(d3.select(this).attr("date"));
                        d3.select("#tooltip").classed("hidden", false);
                   })
                   .on("mouseout", function() {
                        d3.select("#tooltip").classed("hidden", true);
                   });
        });
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