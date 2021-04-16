$(document).ready(function(){
    $("#send_request").click(function() {
        let url = "http://localhost:3000";
        const type = $("#type_select option:selected").val();
        url = url.concat("/");
        url = url.concat(type);
        const country = $("#country_select option:selected").val();
        url = url.concat("/");
        url = url.concat(country);

        var margin = {top: 30, right: 30, bottom: 70, left: 60},
            width = 460 - margin.left - margin.right,
            height = 400 - margin.top - margin.bottom;

        // append the svg object to the body of the page
        var svg = d3.select("#dataviz")
            .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
            .append("g")
                .attr("transform",
                      "translate(" + margin.left + "," + margin.top + ")");

        d3.json(url.concat("/1/11/2020/13/12/2020")) // TODO the dates are hardcoded for debugging purposes
            .then(function(data) {
                let x = d3.scaleBand()
                    .range([0,width])
                    .domain(data.map(function(d) { return d.date; }))
                    .padding(0.2);
                svg.append("g")
                    .attr("transform", "translate(0," + height + ")")
                    .call(d3.axisBottom(x))
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
                svg.selectAll("mybar")
                    .data(data)
                    .enter()
                    .append("rect")
                        .attr("x", function(d) { return x(d.date); })
                        .attr("y", function(d) { return y(d.value); })
                        .attr("width", x.bandwidth())
                        .attr("height", function(d) { return height - y(d.value); })
                        .attr("fill", "#69b3a2")
            });
    });
});