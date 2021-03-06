/**
 * Created by Ed on 13/05/2017.
 */

// team colours and badges for use in graphs and webpage
// [0] = team's home colour, [1] = team's away colour, [2] = team badge img

const TEAM_COLORS = {
    'Arsenal': ['#e60005','#f1ff3a','arsenal.png'],
    'Aston Villa': ['#660032','#e7cd00','aston_villa.png'],
    'Bournemouth': ['#e72022','#2d268f','bournemouth.png'],
    'Chelsea': ['#2b468d', '#f4e321', 'chelsea.png'],
    'Crystal Palace': ['#005cbb', '#f9d602', 'crystal_palace.png'],
    'Everton': ['#264391','red','everton.png'],
    'Leicester': ['#1050a7', '#edb234', 'leicester.png'],
    'Liverpool': ['#de0d22', '#1d1e23', 'liverpool.png'],
    'Manchester City': ['#4e96c2', '#d2fd6f', 'man_city.png'],
    'Manchester Utd': ['#990116','#242428', 'man_utd.png'],
    'Newcastle Utd': ['#1c1c1c', '#ebcc00', 'newcastle.png'],
    'Norwich City': ['#f0d547', '#178365', 'norwich.png'],
    'Southampton': ['#c70125', '#31b24d', 'southampton.png'],
    'Stoke City': ['#e81938', '#0485c4', 'stoke.png'],
    'Sunderland': ['#be000e', '#003190', 'sunderland.png'],
    'Swansea City': ['#cad0e0', '#23235f', 'swansea.png'],
    'Tottenham': ['#d7d8da','#5ca4eb','spurs.png'],
    'Watford': ['#e1d312', '#0f1219', 'watford.png'],
    'West Brom': ['#1e2743', '#cb333b', 'west_brom.png'],
    'West Ham': ['#7c2540', '#46c0d5', 'west_ham.png']
};


queue()
    .defer(d3.json, "/dataDashboard/PLData")
    .await(makeGraphs);
 
function makeGraphs(error, jsonData) {

//Create a Crossfilter instance

    var ndx = crossfilter(jsonData);

//Define Dimensions

    var matchweekDim = ndx.dimension(function (d) {
        return d['matchweek'];
    });

    var teamDim = ndx.dimension(function (d) {
        return d['team'];
    });

    var homeAwayDim = ndx.dimension(function (d) {
        if (d['home'] === 'TRUE') {
            return 'Home';
        } else {
            return 'Away';
        }
    });

    var totalShotsForDim = ndx.dimension(function (d) {
        return d['total_shots_for'];
    });

    var totalShotsAgainstDim = ndx.dimension(function (d) {
        return d['total_shots_against'];
    });

//calculate metrics

    var totalGoalsForByDate = matchweekDim.group().reduceSum(function (d) {
        return d['goals_for'];
    });

    var totalGoalsAgainstByDate = matchweekDim.group().reduceSum(function (d) {
        return d['goals_against'];
    });

    var meanAttendance = ndx.groupAll().reduce(
        function (p, v) {
            ++p.n;
            p.tot += v['attendance'];
            return p;
        },
        function (p, v) {
            --p.n;
            p.tot -= v['attendance'];
            return p;
        },
        function () {
            return {n: 0, tot: 0};
        }
    );

    var shotsToGoalsScored = ndx.groupAll().reduce(
        function (p, v) {
            p.goalsScored += v['goals_for'];
            p.shotsFor += v['total_shots_for'];
            return p;
        },
        function (p, v) {
            p.goalsScored -= v['goals_for'];
            p.shotsFor -= v['total_shots_for'];
            return p;
        },
        function () {
            return {goalsScored: 0, shotsFor: 0};
        }
    );

    var totalGoalsFor = ndx.groupAll().reduceSum(function (d){
        return d['goals_for'];
    });

    var totalGoalsAgainst = ndx.groupAll().reduceSum(function (d){
        return d['goals_against'];
    });

    var shotsToGoalsConceded = ndx.groupAll().reduce(
        function (p, v) {
            p.goalsConceded += v['goals_against'];
            p.shotsAgainst += v['total_shots_against'];
            return p;
        },
        function (p, v) {
            p.goalsConceded -= v['goals_against'];
            p.shotsAgainst -= v['total_shots_against'];
            return p;
        },
        function () {
            return {goalsConceded: 0, shotsAgainst: 0};
        }
    );

    var totalShotsFor = ndx.groupAll().reduceSum(function (d){
        return d['total_shots_for'];
    });

    var totalShotsAgainst = ndx.groupAll().reduceSum(function (d){
        return d['total_shots_against'];
    });

    var totalYellowCards = ndx.groupAll().reduceSum(function (d){
        return d['yellow_cards_for'];
    });

    var totalRedCards = ndx.groupAll().reduceSum(function (d){
        return d['red_cards_for'];
    });


// groups
    var teamGroup = teamDim.group();
    var totalShotsForGroup = totalShotsForDim.group();
    var totalShotsAgainstGroup = totalShotsAgainstDim.group();
    var homeAwayGroup = homeAwayDim.group();
    var matchweekGroup = matchweekDim.group();

//min and max values to be used in charts
    var minWeek = matchweekDim.bottom(1)[0]['matchweek'] - 1;
    var maxWeek = matchweekDim.top(1)[0]['matchweek'] + 1;

    var minShotsFor = totalShotsForDim.bottom(1)[0]['total_shots_for'];
    var maxShotsFor = totalShotsForDim.top(1)[0]['total_shots_for'];

    var minShotsAgainst = totalShotsAgainstDim.bottom(1)[0]['total_shots_against'];
    var maxShotsAgainst = totalShotsAgainstDim.top(1)[0]['total_shots_against'];

// set initial widths based on screen size
    var goalsChartWidth = $(".goals-chart-container").width();
    var pieChartWidth = $(".pie-chart-container").width();
    var shotsChartsWidth = $(".shots-chart-container").width();

// define charts
    var goalsChart = dc.barChart("#goals-chart");
    var totalShotsForChart = dc.barChart("#shots-for-chart");
    var totalShotsAgainstChart = dc.barChart("#shots-against-chart");
    var pieChart = dc.pieChart("#home-away-goals-chart");

// number displays and datatable
    var avgAttendanceND = dc.numberDisplay("#avg-attendance");

    var totalShotsForND = dc.numberDisplay("#total-shots-for");
    var totalGoalsForND = dc.numberDisplay("#total-goals-for");
    var shotsToGoalsScoredND = dc.numberDisplay("#shots-to-goals-scored");

    var totalShotsAgainstND = dc.numberDisplay("#total-shots-against");
    var totalGoalsAgainstND = dc.numberDisplay("#total-goals-against");
    var shotsToGoalsConcededND = dc.numberDisplay("#shots-to-goals-conceded");

    var yellowCardsND = dc.numberDisplay("#yellow-cards");
    var redCardsND = dc.numberDisplay("#red-cards");

    var goalsScoredTab = dc.dataTable("#goals-scored-table");

// create filter (Arsenal) on page load, remove option to select all teams
    selectField = dc.selectMenu('#menu-select')
        .dimension(teamDim)
        .group(teamGroup)
        .filter("Arsenal")
        .promptText("")
        .on('renderlet', function () {
            $("select.dc-select-menu option:empty").remove();
        });

//remove key from selectField dropdown
    selectField.title(function (d) {
        return d.key;
    });


// initial chart setup
    goalsChart
        .width(goalsChartWidth)
        .height(250)
        .margins({top: 10, right: 50, bottom: 30, left: 50})
        .dimension(matchweekDim)
        .group(totalGoalsForByDate, "SCORED")
        .stack(totalGoalsAgainstByDate, "CONCEDED")
        .ordinalColors(["#b2131a","#efff2b"])
        .transitionDuration(500)
        .x(d3.scale.linear().domain([minWeek, maxWeek]))
        .legend(dc.legend().x(200).y(0).itemHeight(13).gap(5))
        .elasticY(true)
        .xAxisLabel("Matchweek")
        .centerBar(true)
        .yAxis().ticks(2);

    pieChart
        .height(250)
        .width(pieChartWidth)
        .radius(100)
        .innerRadius(40)
        .transitionDuration(1000)
        .dimension(homeAwayDim)
        .group(homeAwayGroup)
        .ordinalColors(["#efff2b", "#b2131a"])
        .legend(dc.legend().x(10).y(10).itemHeight(10).gap(5).legendText(function (d, i) {
            return d.name.toUpperCase();
        }));

    totalShotsForChart
        .width(shotsChartsWidth)
        .height(200)
        .margins({top: 10, right: 30, bottom: 30, left: 30})
        .dimension(totalShotsForDim)
        .group(totalShotsForGroup)
        .ordinalColors(["#b2131a"])
        .transitionDuration(500)
        .x(d3.scale.linear().domain([minShotsFor, maxShotsFor]))
        .elasticY(true)
        .xAxisLabel("Number of shots")
        .yAxisLabel("Number of games")
        .yAxis().ticks(4);

    totalShotsAgainstChart
        .width(shotsChartsWidth)
        .height(200)
        .margins({top: 10, right: 30, bottom: 30, left: 30})
        .dimension(totalShotsAgainstDim)
        .group(totalShotsAgainstGroup)
        .ordinalColors(["#efff2b"])
        .transitionDuration(500)
        .x(d3.scale.linear().domain([minShotsAgainst, maxShotsAgainst]))
        .centerBar(true)
        .elasticY(true)
        .xAxisLabel("Number of shots")
        .yAxisLabel("Number of games")
        .yAxis().ticks(4);

    avgAttendanceND
        .formatNumber(d3.format("d"))
        .valueAccessor(function (d) {
            if (d.n === 0) {
                return 0;
            } else {
                return Math.round(d.tot / d.n);
            }
        })
        .group(meanAttendance)
        .transitionDuration(0);

    totalShotsForND
        .valueAccessor(function (d) {
            return d;
        })
        .group(totalShotsFor)
        .formatNumber(d3.format("d"))
        .transitionDuration(0);

    totalGoalsForND
        .valueAccessor(function (d) {
            return d;
        })
        .group(totalGoalsFor)
        .formatNumber(d3.format("d"))
        .transitionDuration(0);

    shotsToGoalsScoredND
        .formatNumber(d3.format(",%"))
        .valueAccessor(function (d) {
            if (d.goalsScored === 0 || d.shotsFor === 0) {
                return 0;
            } else {
                return (d.goalsScored / d.shotsFor)
            }
        })
        .group(shotsToGoalsScored)
        .transitionDuration(0);

    totalShotsAgainstND
        .valueAccessor(function (d) {
            return d;
        })
        .group(totalShotsAgainst)
        .formatNumber(d3.format("d"))
        .transitionDuration(0);

    totalGoalsAgainstND
        .valueAccessor(function (d) {
            return d;
        })
        .group(totalGoalsAgainst)
        .formatNumber(d3.format("d"))
        .transitionDuration(0);

    shotsToGoalsConcededND
        .formatNumber(d3.format(",%"))
        .valueAccessor(function (d) {
            if (d.goalsConceded === 0) {
                return 0;
            } else {
                return (d.goalsConceded / d.shotsAgainst)
            }
        })
        .group(shotsToGoalsConceded)
        .transitionDuration(0);

    yellowCardsND
        .valueAccessor(function (d) {
            return d;
        })
        .group(totalYellowCards)
        .formatNumber(d3.format("d"))
        .transitionDuration(0);

    redCardsND
        .valueAccessor(function (d) {
            return d;
        })
        .group(totalRedCards)
        .formatNumber(d3.format("d"))
        .transitionDuration(0);

    goalsScoredTab
        .dimension(matchweekDim)
        .group(function (d) {
            return null
        })
        .columns([
            function (d) {
                return d['matchweek'];
            },
            function (d) {
                return d['opponent'];
            },
            function (d) {
                return d['goal_details_for'];
            },
            function (d) {
                return d['goal_details_against'];
            },
        ])
        .sortBy(function (d) {
            return +d['matchweek'];
        })
        .size(370)
        .width(500)
        .height();


    dc.renderAll();

// change colours and badge img based on team selection
    $("#menu-select").change(function () {
        var selectedTeam = selectField.filter();
        var teamHomeColour = TEAM_COLORS[selectedTeam][0];
        var teamAwayColour = TEAM_COLORS[selectedTeam][1];
        var teamBadge = TEAM_COLORS[selectedTeam][2];
                $('#team-badge').attr('src', 'static/img/' + teamBadge).attr('height', '200px').attr('width', '170px');
        goalsChart
            .ordinalColors([teamHomeColour, teamAwayColour]);
        pieChart
            .ordinalColors([ teamAwayColour, teamHomeColour]);
        totalShotsForChart
            .ordinalColors([teamHomeColour]);
        totalShotsAgainstChart
            .ordinalColors([teamAwayColour]);
        dc.renderAll();
    });

// listen for browser resize & run chart resize function
    $(window).on("resize", chartResize);

// function to resize chart based on bootstrap container/page width
    function chartResize() {
        var goalsChartWidth = $(".goals-chart-container").width();
        var pieChartWidth = $(".pie-chart-container").width();
        var shotsChartsWidth = $(".shots-chart-container").width();
        goalsChart
            .width(goalsChartWidth);
        pieChart
            .width(pieChartWidth);
        totalShotsForChart
            .width(shotsChartsWidth);
        totalShotsAgainstChart
            .width(shotsChartsWidth);
        dc.renderAll();
    }

}



