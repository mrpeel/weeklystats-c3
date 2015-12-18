/*global window, document, Promise, console, topPagesFilter, topBrowsersFilter, startDate, endDate, ids, lastWeekStartDate, lastWeekEndDate  */
/*global lastYearStartDate, lastYearEndDate, currentWeekdayLabels, last12MonthsLabels,  YearlyDataLabels, allApplicationData, applicationData */
/*global APP_NAMES, APP_LABELS, topBrowsersArray, Masonry, formatDateString, C3StatsChart, assert */


//The element suffixes which are used to differentiate elements for the same data type
var ELEMENT_NAMES = ["lassi", "lassi-spear", "smes", "vicnames", "landata-tpi", "landata-vmt"];


//Holds the indidivudal chart references
var chartRefs = [];
var refreshQueue = [];

//Variable for masonry layout
var msnry;
//Variable to hold the parent element for all chart cards
var parentElement;


/* 
    Set-up the buttons for transforming charts, opening new sections and call the masonry set-up for chart cards
*/
window.onload = function () {
    "use strict";

    parentElement = document.getElementById("masonry-grid");
    createMasonry();

    //Add button listeners
    document.getElementById("show-home").addEventListener("click", showHomeScreen, false);

    document.getElementById("show-overall").addEventListener("click", function () {
        showScreen("overall");
    }, false);
    document.getElementById("show-lassi").addEventListener("click", function () {
        showScreen("lassi");
    }, false);
    document.getElementById("show-lassi-spear").addEventListener("click", function () {
        showScreen("lassi-spear");
    }, false);
    document.getElementById("show-smes").addEventListener("click", function () {
        showScreen("smes");
    }, false);
    document.getElementById("show-vicnames").addEventListener("click", function () {
        showScreen("vicnames");
    }, false);
    document.getElementById("show-landata-tpi").addEventListener("click", function () {
        showScreen("landata-tpi");
    }, false);
    document.getElementById("show-landata-vmt").addEventListener("click", function () {
        showScreen("landata-vmt");
    }, false);

};


/* 
    Set-up the masonry options
*/
function createMasonry() {
    "use strict";

    msnry = new Masonry(parentElement, {
        // options
        "itemSelector": ".card",
        "columnWidth": ".grid-sizer",
        transitionDuration: "0.4s"
            //"gutter": 5 //,
            //"percentPosition": true
    });

    //Refresh charts after layout is complete
    /*msnry.on('layoutComplete', function (items) {
        refreshCharts();
    });*/
}

/* 
    Work through all charts and refresh them
*/
function refreshCharts() {
    "use strict";

    //console.log('Start refresh charts');
    refreshQueue.length = 0;

    for (var cCounter = 0; cCounter < chartRefs.length; cCounter++) {
        refreshQueue.push(cCounter);
    }

    //console.log(refreshQueue);

    window.setTimeout(function () {
        executeRefresh();
    }, 1000);

}

/* 
    Refresh a chart after an interval
*/
function executeRefresh() {
    "use strict";

    if (refreshQueue.length > 0) {
        var chartNum = refreshQueue.shift();

        //console.log('Execute refresh chart ' + chartNum);

        if (typeof chartRefs[chartNum].chart !== "undefined") {
            //console.log('Flushing now');
            chartRefs[chartNum].chart.flush();
        }


        window.setTimeout(function () {
            executeRefresh();
        }, 200);

    } else {
        //Ensure layout is correct after refresh
        msnry.layout();
    }

}

/**
 * Checks if an element with the specified Id exists in the DOM.  If not, a new div element is created.  If a button Id and button function are specified, will also 
 *    add an event listener to the button.
 * @param {node} parentElement -  the parent parentElement to create the new element under
 * @param {string} elementId - the id for the element
 * @param {string} elementClassString - the class(es) to be applied to the element
 * @param {string} elementHTML - the HTML for the element
 * @param {string} buttonId - Optional id of the button to add an event listener for
 * @param {string} transformFunctionType - if a button has been specified, the type of transform to run
 * @param {number} chartRef - the reference number for the chart object
 */
function createElement(elementId, elementClassString, elementHTML, buttonId, transformFunctionType, chartRef) {
    "use strict";

    assert(typeof elementId !== "undefined", 'createElement assert failed - elementId: ' + elementId);
    assert(typeof elementHTML !== "undefined", 'createElement assert failed - elementHTML: ' + elementHTML);
    //Check that a buttoinId and function have been supplied together or not at all
    assert((typeof buttonId !== "undefined" && typeof transformFunctionType !== "undefined" && typeof chartRef === "number") ||
        (typeof buttonId === "undefined" && typeof transformFunctionType === "undefined" && typeof chartRef === "undefined"),
        'createElement assert failed - button parameters: ' + buttonId + ', ' + transformFunctionType + ', ' + chartRef);

    if (document.getElementById(elementId) === null) {
        var newDiv = document.createElement('div');

        newDiv.id = elementId;
        newDiv.className = elementClassString;
        newDiv.innerHTML = elementHTML;

        parentElement.appendChild(newDiv);

        //Tell masonry that the item has been added
        msnry.appended(newDiv);

        //Add a button event listener if required
        if (typeof buttonId !== "undefined") {
            //Use type of transformation to define button click event
            if (transformFunctionType === "transformArea") {
                document.getElementById(buttonId).addEventListener("click", function () {
                    transformArea(chartRef);
                }, false);
            } else if (transformFunctionType === "transformHorizontalStackedGrouped") {
                document.getElementById(buttonId).addEventListener("click", function () {
                    transformHorizontalStackedGrouped(chartRef);
                }, false);
            } else if (transformFunctionType === "transformVerticalStackedGrouped") {
                document.getElementById(buttonId).addEventListener("click", function () {
                    transformVerticalStackedGrouped(chartRef);
                }, false);

            }

        }

    }


}

function clearChartsFromScreen() {
    //Clear the chart references
    chartRefs.length = 0;

    //Remove the items from masonry and the DOM
    while (parentElement.firstChild) {
        //Check if masonry object has been created - if so, remove the element from it
        if (typeof msnry !== "undefined") {
            msnry.remove(parentElement.firstChild);
        }

        parentElement.removeChild(parentElement.firstChild);
    }

    var sizerDiv = document.createElement('div');

    sizerDiv.className = "grid-sizer";
    parentElement.appendChild(sizerDiv);

    if (typeof msnry !== "undefined") {
        msnry.layout();
    }

}

/*
 * Builds the charts for the home screen - the page breakdown and page visits for each app
 */
function showHomeScreen() {

    clearChartsFromScreen();
    buildWeeklyUsersCharts();

}

/*
 * Builds the charts for the overall screen - the page breakdown and page visits for each app
 */
function showScreen(appElementName) {

    clearChartsFromScreen();

    var appGAName = "";

    for (var elementCounter = 0; elementCounter < ELEMENT_NAMES.length; elementCounter++) {
        if (ELEMENT_NAMES[elementCounter] === appElementName) {
            appGAName = APP_NAMES[elementCounter];
            break;
        }
    }

    buildChartsForType(appElementName, appGAName);

    //Set-up button listening events
    document.getElementById("weekly-search-" + appElementName + "-switch-to-per-button").addEventListener("click", function () {
        switchVisibleChart("weekly-search-per-" + appElementName + "-card", ["weekly-search-" + appElementName + "-card"]);
    }, false);

    document.getElementById("weekly-search-" + appElementName + "-switch-to-raw-button").addEventListener("click", function () {
        switchVisibleChart("weekly-search-" + appElementName + "-card", ["weekly-search-per-" + appElementName + "-card"]);
    }, false);

    //Buttons on the activity type absolute number chart
    document.getElementById("weekly-activity-types-" + appElementName + "-switch-to-per-button").addEventListener("click", function () {
        switchVisibleChart("weekly-activity-types-per-" + appElementName + "-card", ["weekly-activity-types-" + appElementName + "-card", "weekly-activities-" + appElementName + "-card",
                            "weekly-activities-per-" + appElementName + "-card"]);
    }, false);
    document.getElementById("weekly-activity-types-" + appElementName + "-switch-to-raw-activities-button").addEventListener("click", function () {
        switchVisibleChart("weekly-activities-" + appElementName + "-card", ["weekly-activity-types-per-" + appElementName + "-card", "weekly-activity-types-" + appElementName + "-card",
                            "weekly-activities-per-" + appElementName + "-card"]);
    }, false);

    //Buttons on the activity type per-visit chart
    document.getElementById("weekly-activity-types-" + appElementName + "-switch-to-raw-button").addEventListener("click", function () {
        switchVisibleChart("weekly-activity-types-" + appElementName + "-card", ["weekly-activity-types-per-" + appElementName + "-card", "weekly-activities-" + appElementName + "-card",
                            "weekly-activities-per-" + appElementName + "-card"]);
    }, false);
    document.getElementById("weekly-activity-types-" + appElementName + "-switch-to-per-activities-button").addEventListener("click", function () {
        switchVisibleChart("weekly-activities-per-" + appElementName + "-card", ["weekly-activity-types-" + appElementName + "-card", "weekly-activity-types-per-" + appElementName + "-card",
                            "weekly-activities-" + appElementName + "-card"]);
    }, false);

    //Buttons on the detailed activities absolute number chart
    document.getElementById("weekly-activities-" + appElementName + "-switch-to-per-button").addEventListener("click", function () {
        switchVisibleChart("weekly-activities-per-" + appElementName + "-card", ["weekly-activity-types-" + appElementName + "-card", "weekly-activity-types-per-" + appElementName + "-card",
                            "weekly-activities-" + appElementName + "-card"]);
    }, false);
    document.getElementById("weekly-activities-" + appElementName + "-switch-to-raw-activity-types-button").addEventListener("click", function () {
        switchVisibleChart("weekly-activity-types-" + appElementName + "-card", ["weekly-activities-" + appElementName + "-card", "weekly-activity-types-per-" + appElementName + "-card",
                            "weekly-activities-per-" + appElementName + "-card"]);
    }, false);

    //Buttons on the detailed activities per-visit chart
    document.getElementById("weekly-activities-" + appElementName + "-switch-to-raw-button").addEventListener("click", function () {
        switchVisibleChart("weekly-activities-" + appElementName + "-card", ["weekly-activity-types-" + appElementName + "-card", "weekly-activity-types-per-" + appElementName + "-card",
                            "weekly-activities-per-" + appElementName + "-card"]);
    }, false);
    document.getElementById("weekly-activities-" + appElementName + "-switch-to-per-activity-types-button").addEventListener("click", function () {
        switchVisibleChart("weekly-activity-types-per-" + appElementName + "-card", ["weekly-activity-types-" + appElementName + "-card", "weekly-activities-" + appElementName + "-card",
                            "weekly-activities-per-" + appElementName + "-card"]);
    }, false);




}

/*
 * Builds the charts for the LASSI screen - the page breakdown and page visits for each app
 */
function switchVisibleChart(visibleElementName, hiddenElementNames) {

    var visibleElement = document.getElementById(visibleElementName);
    var hiddenElement;


    //Remove hidden class from visible element 
    if (typeof visibleElement !== "undefined") {
        visibleElement.classList.remove("hidden");

        //Loop through the chart references to see which one isbeing made visibleCheck if this is the chart being made visible
        for (var chartCounter = 0; chartCounter < chartRefs.length; chartCounter++) {
            //Check if this is the chart being made visible
            if (document.getElementById(chartRefs[chartCounter].pageElement).parentNode.id === visibleElementName) {
                //Immediately re-draw the chart
                chartRefs[chartCounter].chart.flush();
                break;
            }

        }
    }

    //Loop through supplied hidden elements and add hidden class 
    for (var elCounter = 0; elCounter < hiddenElementNames.length; elCounter++) {
        hiddenElement = document.getElementById(hiddenElementNames[elCounter]);

        if (typeof hiddenElement !== "undefined") {
            hiddenElement.classList.add("hidden");
        }
    }

    //Re-run the layout functions
    //refreshCharts();
    msnry.layout();

}

/* 
    Build all weekly user charts - overall, lassi, lassi spear, smes, smes edit, vicnames, landata tpi, landata vmt
      Relies on the daya already being present within:
        allApplicationData.currentWeekUserData
        allApplicationData.lastWeekUserData
        allApplicationData.lastYearMedianUserData
        
        For each app:
        applicationData[appName].currentWeekUserData
        applicationData[appName].lastWeekUserData
        applicationData[appName].lastYearMedianUserData
*/
function buildWeeklyUsersCharts() {
    "use strict";

    var currentWeekArray, lastWeekArray, lastYearArray;
    var columnData = [];
    var nextChartORef = chartRefs.length;

    //Set-up overall chart
    currentWeekArray = ["Week starting " + formatDateString(startDate, "display")];
    lastWeekArray = ["Week starting" + formatDateString(lastWeekStartDate, "display")];
    lastYearArray = ["Median for the last year"];

    Array.prototype.push.apply(currentWeekArray, allApplicationData.currentWeekUserData);
    Array.prototype.push.apply(lastWeekArray, allApplicationData.lastWeekUserData);
    Array.prototype.push.apply(lastYearArray, allApplicationData.lastYearMedianUserData);

    columnData.push(currentWeekdayLabels);
    columnData.push(lastYearArray);
    columnData.push(lastWeekArray);
    columnData.push(currentWeekArray);

    //Create the DOM element 
    createElement('weekly-users-overall-card',
        'card full-width home overall',
        '<div id="weekly-users-overall"></div><button id="weekly-users-overall-button">Change overall weekly users chart</button>',
        'weekly-users-overall-button',
        "transformArea", nextChartORef);

    chartRefs[nextChartORef] = new C3StatsChart(columnData, "weekly-users-overall");
    chartRefs[nextChartORef].createWeekDayAreaChart();



    //Now run through each of the application charts
    for (var appCounter = 0; appCounter < APP_NAMES.length; appCounter++) {
        //Set-up lassi chart
        currentWeekArray = ["Week starting " + formatDateString(startDate, "display")];
        lastWeekArray = ["Week starting" + formatDateString(lastWeekStartDate, "display")];
        lastYearArray = ["Median for the last year"];
        columnData = [];
        var nextChartRef = chartRefs.length;

        Array.prototype.push.apply(currentWeekArray, applicationData[APP_NAMES[appCounter]].currentWeekUserData);
        Array.prototype.push.apply(lastWeekArray, applicationData[APP_NAMES[appCounter]].lastWeekUserData);
        Array.prototype.push.apply(lastYearArray, applicationData[APP_NAMES[appCounter]].lastYearMedianUserData);


        columnData.push(currentWeekdayLabels);
        columnData.push(lastYearArray);
        columnData.push(lastWeekArray);
        columnData.push(currentWeekArray);

        //Create the DOM element 
        createElement('weekly-users-' + ELEMENT_NAMES[appCounter] + '-card',
            'card home ' + ELEMENT_NAMES[appCounter],
            '<div id="weekly-users-' + ELEMENT_NAMES[appCounter] + '"></div><button id="weekly-users-' + ELEMENT_NAMES[appCounter] + '-button">Change ' +
            ELEMENT_NAMES[appCounter] + ' weekly users chart</button>',
            'weekly-users-' + ELEMENT_NAMES[appCounter] + '-button',
            "transformArea", nextChartRef);

        chartRefs[nextChartRef] = new C3StatsChart(columnData, "weekly-users-" + ELEMENT_NAMES[appCounter]);
        chartRefs[nextChartRef].createWeekDayAreaChart();



    }


    refreshCharts();
    msnry.layout();

}


/* 
    Build all charts for each type.  Generates all the charts for the specified type.
  
*/
function buildChartsForType(elementName, appName) {
    "use strict";

    var currentWeekArray, lastWeekArray, lastYearArray, previousYearArray, currentYearArray, dataLabels, seriesLabels;
    var columnData, nextChartORef;
    var cardClasses = "card half-width " + elementName;
    var chartDataArray;

    if (elementName === "overall") {
        chartDataArray = allApplicationData;
    } else {
        chartDataArray = applicationData[appName];
    }

    /* 
    Build the yearly page breakdown chart.  This is ONLY present for the overall chart. Relies on the data already being present within:
        allApplicationData.pageData
        
    */
    if (elementName === "overall") {
        columnData = [];
        nextChartORef = chartRefs.length;

        //Map in values for each page month combination to the series then add to the columnData
        for (var appCounter = 0; appCounter < APP_NAMES.length; appCounter++) {
            //Create data set
            columnData.push([]);
            //Add name for data set
            columnData[columnData.length - 1].push(APP_LABELS[appCounter]);
            //add data set to chart column data
            Array.prototype.push.apply(columnData[columnData.length - 1], chartDataArray.pageData[APP_NAMES[appCounter]]);
        }


        //Create the DOM element 
        createElement('yearly-pages-overall-card',
            cardClasses,
            '<div id="yearly-pages-overall"></div><button id="yearly-pages-overall-button">Change overall yearly pages chart</button>',
            'yearly-pages-overall-button',
            "transformVerticalStackedGrouped", nextChartORef);

        chartRefs[nextChartORef] = new C3StatsChart(columnData, 'yearly-pages-overall', last12MonthsLabels, APP_LABELS);
        chartRefs[nextChartORef].createStackedVerticalBarChart("Percentage of visits");

    }

    /* Build weekly user charts.  Relies on the daya already being present within:
        allApplicationData.currentWeekUserData
        allApplicationData.lastWeekUserData
        allApplicationData.lastYearMedianUserData
            OR
        applicationData[appName].currentWeekUserData
        applicationData[appName].lastWeekUserData
        applicationData[appName].lastYearMedianUserData
    */

    //Set-up overall chart
    columnData = [];
    currentWeekArray = ["Week starting " + formatDateString(startDate, "display")];
    lastWeekArray = ["Week starting " + formatDateString(lastWeekStartDate, "display")];
    lastYearArray = ["Median for the last year"];
    nextChartORef = chartRefs.length;

    Array.prototype.push.apply(currentWeekArray, chartDataArray.currentWeekUserData);
    Array.prototype.push.apply(lastWeekArray, chartDataArray.lastWeekUserData);
    Array.prototype.push.apply(lastYearArray, chartDataArray.lastYearMedianUserData);

    columnData.push(currentWeekdayLabels);
    columnData.push(lastYearArray);
    columnData.push(lastWeekArray);
    columnData.push(currentWeekArray);

    //Create the DOM element 
    createElement('weekly-users-' + elementName + '-card',
        cardClasses,
        '<div id="weekly-users-' + elementName + '"></div><button id="weekly-users-' + elementName + '-button">Change ' + elementName + ' weekly users chart</button>',
        'weekly-users-' + elementName + '-button',
        "transformArea", nextChartORef);

    chartRefs[nextChartORef] = new C3StatsChart(columnData, "weekly-users-" + elementName);
    chartRefs[nextChartORef].createWeekDayAreaChart();


    /* Build current / previous year charts.  Relies on the daya already being present within:
        allApplicationData.thisYearUserData
        allApplicationData.previousYearUserData
            OR
        applicationData[appName].thisYearUserData
        applicationData[appName].previousYearUserData
    */
    columnData = [];
    previousYearArray = ["Previous year"];
    currentYearArray = ["Current year"];
    nextChartORef = chartRefs.length;

    Array.prototype.push.apply(previousYearArray, chartDataArray.previousYearUserData);
    Array.prototype.push.apply(currentYearArray, chartDataArray.thisYearUserData);

    columnData.push(previousYearArray);
    columnData.push(currentYearArray);

    //Create the DOM element 
    createElement('yearly-users-' + elementName + '-card',
        cardClasses,
        '<div id="yearly-users-' + elementName + '"></div>');

    chartRefs[nextChartORef] = new C3StatsChart(columnData, "yearly-users-" + elementName, last12MonthsLabels);
    chartRefs[nextChartORef].createStaticVerticalTwoSeriesBarChart();




    /* Build weekly session duration chart.  Relies on the daya already being present within:
        allApplicationData.currentWeekSessionData
        allApplicationData.lastWeekSessionData
        allApplicationData.lastYearMedianSessionData
            OR
        applicationData[appName].currentWeekSessionData
        applicationData[appName].lastWeekSessionData
        applicationData[appName].lastYearMedianSessionData
    */
    columnData = [];
    nextChartORef = chartRefs.length;

    //Set-up overall chart
    currentWeekArray = ["Week starting " + formatDateString(startDate, "display")];
    lastWeekArray = ["Week starting " + formatDateString(lastWeekStartDate, "display")];
    lastYearArray = ["Median for the last year"];

    Array.prototype.push.apply(currentWeekArray, chartDataArray.currentWeekSessionData);
    Array.prototype.push.apply(lastWeekArray, chartDataArray.lastWeekSessionData);
    Array.prototype.push.apply(lastYearArray, chartDataArray.lastYearMedianSessionData);

    columnData.push(currentWeekdayLabels);
    columnData.push(lastYearArray);
    columnData.push(lastWeekArray);
    columnData.push(currentWeekArray);

    //Create the DOM element 
    createElement('weekly-sessions-' + elementName + '-card',
        cardClasses,
        '<div id="weekly-sessions-' + elementName + '"></div><button id="weekly-sessions-' + elementName + '-button">Change ' + elementName + ' weekly sessions chart</button>',
        'weekly-sessions-' + elementName + '-button',
        "transformArea", nextChartORef);

    chartRefs[nextChartORef] = new C3StatsChart(columnData, "weekly-sessions-" + elementName);
    chartRefs[nextChartORef].createWeekDayAreaChart();

    /* 
      Build visitor return chart.  Relies on the daya already being present within:
          allApplicationData.visitorReturns.data
            OR
        applicationData[appName].visitorReturns.data
    */
    columnData = chartDataArray.visitorReturns.data.slice();
    dataLabels = chartDataArray.visitorReturns.labels.slice();
    seriesLabels = [];
    nextChartORef = chartRefs.length;

    //The first entry in the row contains the label used for the data
    chartDataArray.visitorReturns.data.forEach(function (dataRow) {
        seriesLabels.push(dataRow[0]);
    });


    //Create the DOM element 
    createElement('visitor-return-' + elementName + '-card',
        cardClasses,
        '<div id="visitor-return-' + elementName + '"></div><button id="visitor-return-' + elementName + '-button">Change ' + elementName + ' visitor return chart</button>',
        'visitor-return-' + elementName + '-button',
        "transformHorizontalStackedGrouped", nextChartORef);

    chartRefs[nextChartORef] = new C3StatsChart(columnData, "visitor-return-" + elementName, dataLabels, seriesLabels);
    chartRefs[nextChartORef].createHorizontalBarChart("Time to return");

    /* 
    Build  yearly browser usage charts.  Relies on the daya already being present within:
        allApplicationData.browserData[browserName]
            OR
        applicationData[appName].browserData[browserName]
        
    */
    columnData = [];
    nextChartORef = chartRefs.length;

    //Map in values for each browser month combination to the series then add to the columnData
    for (var bCounter = 0; bCounter < topBrowsersArray.length; bCounter++) {
        //Create data set
        columnData.push([]);
        //Add name for data set
        columnData[columnData.length - 1].push(topBrowsersArray[bCounter]);
        //add data set to chart column data
        Array.prototype.push.apply(columnData[columnData.length - 1], chartDataArray.browserData[topBrowsersArray[bCounter]]);
    }


    //Create the DOM element 
    createElement('yearly-browsers-' + elementName + '-card',
        cardClasses,
        '<div id="yearly-browsers-' + elementName + '"></div><button id="yearly-browsers-' + elementName + '-button">Change ' + elementName + ' yearly browsers chart</button>',
        'yearly-browsers-' + elementName + '-button',
        "transformVerticalStackedGrouped", nextChartORef);

    chartRefs[nextChartORef] = new C3StatsChart(columnData, "yearly-browsers-" + elementName, last12MonthsLabels, topBrowsersArray);
    chartRefs[nextChartORef].createStackedVerticalBarChart("Percentage of visits");

    /* 
    Build weekly horizontal bar graphs for map types.  Relies on the data already being present within:
        allApplicationData.weekMapTypes.data
        allApplicationData.weekMapTypes.labels
            OR
        applicationData[appName].weekMapTypes.data
        applicationData[appName].weekMapTypes.labels
       */

    columnData = chartDataArray.weekMapTypes.data.slice();
    dataLabels = chartDataArray.weekMapTypes.labels.slice();
    seriesLabels = [];
    nextChartORef = chartRefs.length;


    //The first entry in the row contains the label used for the data
    chartDataArray.weekMapTypes.data.forEach(function (dataRow) {
        seriesLabels.push(dataRow[0]);
    });


    //Create the DOM element 
    createElement('weekly-maps-' + elementName + '-card',
        cardClasses,
        '<div id="weekly-maps-' + elementName + '"></div><button id="weekly-maps-' + elementName + '-button">Change ' + elementName + ' weekly map types chart</button>',
        'weekly-maps-' + elementName + '-button',
        "transformHorizontalStackedGrouped", nextChartORef);

    chartRefs[nextChartORef] = new C3StatsChart(columnData, "weekly-maps-" + elementName, dataLabels, seriesLabels);
    chartRefs[nextChartORef].createHorizontalBarChart("Map type");


    /* 
    Build yearly vertical stacked bar graphs of map types.  Relies on the data already being present within:
        allApplicationData.yearSearchTypes.data        
            OR
        applicationData[appName].yearSearchTypes.data
        
        last12MonthsLabels
*/
    columnData = chartDataArray.yearMapTypes.data.slice();
    seriesLabels = [];
    nextChartORef = chartRefs.length;

    //The first entry in the row contains the label used for the data
    chartDataArray.yearMapTypes.data.forEach(function (dataRow) {
        seriesLabels.push(dataRow[0]);
    });


    //Create the DOM element 
    createElement('yearly-maps-' + elementName + '-card',
        cardClasses,
        '<div id="yearly-maps-' + elementName + '"></div><button id="yearly-maps-' + elementName + '-button">Change ' + elementName + ' yearly map types chart</button>',
        'yearly-maps-' + elementName + '-button',
        "transformVerticalStackedGrouped", nextChartORef);

    chartRefs[nextChartORef] = new C3StatsChart(columnData, "yearly-maps-" + elementName, last12MonthsLabels, seriesLabels);
    chartRefs[nextChartORef].createStackedVerticalBarChart("Percentage of map types");



    /* 
    Build weekly horizontal bar graphs of search types with absolute numbers.  Relies on the data already being present within:
        allApplicationData.weekSearchTypes.data
        allApplicationData.weekSearchTypes.labels
            OR
        applicationData[appName].weekSearchTypes.data
        applicationData[appName].weekSearchTypes.labels
        
*/
    columnData = chartDataArray.weekSearchTypes.data.slice();
    dataLabels = chartDataArray.weekSearchTypes.labels.slice();
    seriesLabels = [];
    nextChartORef = chartRefs.length;


    //The first entry in the row contains the label used for the data
    chartDataArray.weekSearchTypes.data.forEach(function (dataRow) {
        seriesLabels.push(dataRow[0]);
    });


    //Create the DOM element 
    createElement('weekly-search-' + elementName + '-card',
        cardClasses + " raw",
        '<div id="weekly-search-' + elementName + '"></div><button id="weekly-search-' + elementName + '-button">Change ' + elementName + ' weekly search chart</button>' +
        '<button id = "weekly-search-' + elementName + '-switch-to-per-button">Switch to per visit values</button>',
        'weekly-search-' + elementName + '-button',
        "transformHorizontalStackedGrouped", nextChartORef);


    chartRefs[nextChartORef] = new C3StatsChart(columnData, "weekly-search-" + elementName, dataLabels, seriesLabels);
    chartRefs[nextChartORef].createHorizontalBarChart("Search type");


    /* 
    Build weekly horizontal bar graphs of search types per visit.  Relies on the data already being present within:
        allApplicationData.weekSearchTypes.dataPerVisit
        allApplicationData.weekSearchTypes.labelsPerVisit
            OR
        applicationData[appName].weekSearchTypes.dataPerVisit
        applicationData[appName].weekSearchTypes.labelsPerVisit
        
*/
    columnData = chartDataArray.weekSearchTypes.dataPerVisit.slice();
    dataLabels = chartDataArray.weekSearchTypes.labelsPerVisit.slice();
    seriesLabels = [];
    nextChartORef = chartRefs.length;


    //The first entry in the row contains the label used for the data
    chartDataArray.weekSearchTypes.data.forEach(function (dataRow) {
        seriesLabels.push(dataRow[0]);
    });


    //Create the DOM element 
    createElement('weekly-search-per-' + elementName + '-card',
        cardClasses + " per-visit hidden",
        '<div id="weekly-search-per-' + elementName + '"></div><button id="weekly-search-per-' + elementName + '-button">Change ' + elementName + ' weekly search chart</button>' +
        '<button id = "weekly-search-' + elementName + '-switch-to-raw-button">Switch to absolute values</button>',
        'weekly-search-per-' + elementName + '-button',
        "transformHorizontalStackedGrouped", nextChartORef);

    chartRefs[nextChartORef] = new C3StatsChart(columnData, "weekly-search-per-" + elementName, dataLabels, seriesLabels);
    chartRefs[nextChartORef].createHorizontalBarChart("Search type");


    /* 
    Build yearly vertical stacked bar graphs of search types.  Relies on the data already being present within:
        allApplicationData.yearSearchTypes.data
            OR
        applicationData[appName].yearSearchTypes.data
                
        last12MonthsLabels
        
        */
    columnData = chartDataArray.yearSearchTypes.data.slice();
    nextChartORef = chartRefs.length;
    seriesLabels = [];

    //The first entry in the row contains the label used for the data
    chartDataArray.yearSearchTypes.data.forEach(function (dataRow) {
        seriesLabels.push(dataRow[0]);
    });


    //Create the DOM element 
    createElement('yearly-search-' + elementName + '-card',
        cardClasses,
        '<div id="yearly-search-' + elementName + '"></div><button id="yearly-search-' + elementName + '-button">Change ' + elementName + ' yearly search chart</button>',
        'yearly-search-' + elementName + '-button',
        "transformVerticalStackedGrouped", nextChartORef);

    chartRefs[nextChartORef] = new C3StatsChart(columnData, "yearly-search-" + elementName, last12MonthsLabels, seriesLabels);
    chartRefs[nextChartORef].createStackedVerticalBarChart("Percentage of searches");


    /* 
    Build weekly horizontal bar graphs of activity types with absolute numbers.  Relies on the data already being present within:
        allApplicationData.weekActivityTypes.data
        allApplicationData.weekActivityTypes.labels
            OR
        applicationData[appName].weekActivityTypes.data
        applicationData[appName].weekActivityTypes.labels
*/
    columnData = chartDataArray.weekActivityTypes.data.slice();
    dataLabels = chartDataArray.weekActivityTypes.labels.slice();
    seriesLabels = [];

    nextChartORef = chartRefs.length;


    //The first entry in the row contains the label used for the data
    chartDataArray.weekActivityTypes.data.forEach(function (dataRow) {
        seriesLabels.push(dataRow[0]);
    });


    //Create the DOM element 
    createElement('weekly-activity-types-' + elementName + '-card',
        cardClasses + " raw",
        '<div id="weekly-activity-types-' + elementName + '"></div><button id="weekly-activity-types-' + elementName + '-button">Change ' +
        elementName + ' weekly activity types chart</button>' +
        '<button id = "weekly-activity-types-' + elementName + '-switch-to-per-button">Switch to per visit values</button>' +
        '<button id = "weekly-activity-types-' + elementName + '-switch-to-raw-activities-button">Switch to detailed activity breakdown</button>',
        'weekly-activity-types-' + elementName + '-button',
        "transformHorizontalStackedGrouped", nextChartORef);

    chartRefs[nextChartORef] = new C3StatsChart(columnData, "weekly-activity-types-" + elementName, dataLabels, seriesLabels);
    chartRefs[nextChartORef].createHorizontalBarChart("Activity type");


    /* 
    Build weekly horizontal bar graphs of activities per visit.  Relies on the data already being present within:
        allApplicationData.weekActivityTypes.dataPerVisit
        allApplicationData.weekActivityTypes.labelsPerVisit
            OR
            applicationData[appName].weekActivityTypes.dataPerVisit
            applicationData[appName].weekActivityTypes.labelsPerVisit            
    */
    columnData = chartDataArray.weekActivityTypes.dataPerVisit.slice();
    dataLabels = chartDataArray.weekActivityTypes.labelsPerVisit.slice();
    seriesLabels = [];
    nextChartORef = chartRefs.length;

    //The first entry in the row contains the label used for the data
    chartDataArray.weekActivityTypes.data.forEach(function (dataRow) {
        seriesLabels.push(dataRow[0]);
    });


    //Create the DOM element 
    createElement('weekly-activity-types-per-' + elementName + '-card',
        cardClasses + " per-visit hidden",
        '<div id="weekly-activity-types-per-' + elementName + '"></div><button id="weekly-activity-types-per-' + elementName +
        '-button">Change ' + elementName + ' weekly activity types chart</button>' +
        '<button id = "weekly-activity-types-' + elementName + '-switch-to-raw-button">Switch to per visit values</button>' +
        '<button id = "weekly-activity-types-' + elementName + '-switch-to-per-activities-button">Switch to detailed activity breakdown</button>',
        'weekly-activity-types-per-' + elementName + '-button',
        "transformHorizontalStackedGrouped", nextChartORef);

    chartRefs[nextChartORef] = new C3StatsChart(columnData, "weekly-activity-types-per-" + elementName, dataLabels, seriesLabels);
    chartRefs[nextChartORef].createHorizontalBarChart("Activity type");




    /* 
    Build weekly horizontal bar graphs of activities with absolute numbers.  Relies on the data already being present within:
        allApplicationData.weekActivities.data
        allApplicationData.weekActivities.labels
            OR
        applicationData[appName].weekActivities.data
        applicationData[appName].weekActivities.labels
        
*/
    columnData = chartDataArray.weekActivities.data.slice();
    dataLabels = chartDataArray.weekActivities.labels.slice();
    seriesLabels = [];
    nextChartORef = chartRefs.length;


    //The first entry in the row contains the label used for the data
    chartDataArray.weekActivities.data.forEach(function (dataRow) {
        seriesLabels.push(dataRow[0]);
    });


    //Create the DOM element 
    createElement('weekly-activities-' + elementName + '-card',
        cardClasses + " details hidden",
        '<div id="weekly-activities-' + elementName + '"></div><button id="weekly-activities-' + elementName +
        '-button">Change ' + elementName + ' weekly activities chart</button>' +
        '<button id = "weekly-activities-' + elementName + '-switch-to-per-button">Switch to per visit values</button>' +
        '<button id = "weekly-activities-' + elementName + '-switch-to-raw-activity-types-button">Switch to activity type breakdown</button>',
        'weekly-activities-' + elementName + '-button',
        "transformHorizontalStackedGrouped", nextChartORef);

    chartRefs[nextChartORef] = new C3StatsChart(columnData, "weekly-activities-" + elementName, dataLabels, seriesLabels);
    chartRefs[nextChartORef].createHorizontalBarChart("Activity");


    /* 
    Build weekly horizontal bar graphs of activities per visit.  Relies on the data already being present within:
        allApplicationData.weekActivities.dataPerVisit
        allApplicationData.weekActivities.labelsPerVisit
            OR
        applicationData[appName].weekActivities.dataPerVisit
        applicationData[appName].weekActivities.labelsPerVisit
        
*/
    columnData = chartDataArray.weekActivities.dataPerVisit.slice();
    dataLabels = chartDataArray.weekActivities.labelsPerVisit.slice();
    seriesLabels = [];
    nextChartORef = chartRefs.length;

    //The first entry in the row contains the label used for the data
    chartDataArray.weekActivities.data.forEach(function (dataRow) {
        seriesLabels.push(dataRow[0]);
    });


    //Create the DOM element 
    createElement('weekly-activities-per-' + elementName + '-card',
        cardClasses + " details-per-visit hidden",
        '<div id="weekly-activities-per-' + elementName + '"></div><button id="weekly-activities-per-' + elementName +
        '-button">Change ' + elementName + ' weekly activities per visit chart</button>' +
        '<button id = "weekly-activities-' + elementName + '-switch-to-raw-button">Switch to absolute values</button>' +
        '<button id = "weekly-activities-' + elementName + '-switch-to-per-activity-types-button">Switch to activity type breakdown</button>',
        'weekly-activities-per-' + elementName + '-button',
        "transformHorizontalStackedGrouped", nextChartORef);

    chartRefs[nextChartORef] = new C3StatsChart(columnData, "weekly-activities-per-" + elementName, dataLabels, seriesLabels);
    chartRefs[nextChartORef].createHorizontalBarChart("Activity");




    /* 
    Build yearly vertical stacked bar graphs of activities.  Relies on the data already being present within:
        allApplicationData.yearActivities.data
        last12MonthsLabels
        
*/
    /*columnData = chartDataArray.yearActivities.data.slice();
    nextChartORef = chartRefs.length;
    seriesLabels = [];

    //The first entry in the row contains the label used for the data
    allApplicationData.yearActivities.data.forEach(function (dataRow) {
        seriesLabels.push(dataRow[0]);
    });


    //Create the DOM element 
    createElement('yearly-activities-overall-card',
        cardClasses,
        '<div id="yearly-activities-overall"></div><button id="yearly-activities-overall-button">Change overall yearly activities chart</button>',
        'yearly-activities-overall-button',
        "transformVerticalStackedGrouped", nextChartORef);

    chartRefs[nextChartORef] = new C3StatsChart(columnData, "yearly-activities-overall", last12MonthsLabels, seriesLabels);
    chartRefs[nextChartORef].createStackedVerticalBarChart("Percentage of activities");*/


    /* 
    Build yearly vertical stacked bar graphs of activity types.  Relies on the data already being present within:
        allApplicationData.yearActivityTypes.data
            OR
        applicationData[appName].yearActivityTypes.data

        last12MonthsLabels
        
*/
    columnData = chartDataArray.yearActivityTypes.data.slice();
    nextChartORef = chartRefs.length;
    seriesLabels = [];

    //Set-up overall chart
    //The first entry in the row contains the label used for the data
    chartDataArray.yearActivityTypes.data.forEach(function (dataRow) {
        seriesLabels.push(dataRow[0]);
    });


    //Create the DOM element 
    createElement('yearly-activity-types-' + elementName + '-card',
        cardClasses,
        '<div id="yearly-activity-types-' + elementName + '"></div><button id="yearly-activity-types-' + elementName + '-button">Change overall yearly activity types chart</button>',
        'yearly-activity-types-' + elementName + '-button',
        "transformVerticalStackedGrouped", nextChartORef);

    chartRefs[nextChartORef] = new C3StatsChart(columnData, "yearly-activity-types-" + elementName, last12MonthsLabels, seriesLabels);
    chartRefs[nextChartORef].createStackedVerticalBarChart("Percentage of activities");




    //Layout the screen with charts
    refreshCharts();
    msnry.layout();


}



function transformArea(chartRefNum) {
    "use strict";

    chartRefs[chartRefNum].transformAreaBar();
}

function transformHorizontalStackedGrouped(chartRefNum) {
    "use strict";

    chartRefs[chartRefNum].transformHorizontalStackedGrouped();

}


function transformVerticalStackedGrouped(chartRefNum) {
    "use strict";

    chartRefs[chartRefNum].transformVerticalStackedGrouped();

}
