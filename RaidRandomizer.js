// Source: http://www.bennadel.com/blog/1504-Ask-Ben-Parsing-CSV-Strings-With-Javascript-Exec-Regular-Expression-Command.htm
// This will parse a delimited string into an array of
// arrays. The default delimiter is the comma, but this
// can be overriden in the second argument.
function CSVToArray(strData, strDelimiter) {
    // Check to see if the delimiter is defined. If not,
    // then default to comma.
    strDelimiter = (strDelimiter || ",");
    // Create a regular expression to parse the CSV values.
    var objPattern = new RegExp((
    // Delimiters.
    "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +
    // Quoted fields.
    "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
    // Standard fields.
    "([^\"\\" + strDelimiter + "\\r\\n]*))"), "gi");
    // Create an array to hold our data. Give the array
    // a default empty first row.
    var arrData = [[]];
    // Create an array to hold our individual pattern
    // matching groups.
    var arrMatches = null;
    // Keep looping over the regular expression matches
    // until we can no longer find a match.
    while (arrMatches = objPattern.exec(strData)) {
        // Get the delimiter that was found.
        var strMatchedDelimiter = arrMatches[1];
        // Check to see if the given delimiter has a length
        // (is not the start of string) and if it matches
        // field delimiter. If id does not, then we know
        // that this delimiter is a row delimiter.
        if (strMatchedDelimiter.length && (strMatchedDelimiter != strDelimiter)) {
            // Since we have reached a new row of data,
            // add an empty row to our data array.
            arrData.push([]);
        }
        // Now that we have our delimiter out of the way,
        // let's check to see which kind of value we
        // captured (quoted or unquoted).
        if (arrMatches[2]) {
            // We found a quoted value. When we capture
            // this value, unescape any double quotes.
            var strMatchedValue = arrMatches[2].replace(
            new RegExp("\"\"", "g"), "\"");
        } else {
            // We found a non-quoted value.
            var strMatchedValue = arrMatches[3];
        }
        // Now that we have our value string, let's add
        // it to the data array.
        arrData[arrData.length - 1].push(strMatchedValue);
    }
    // Return the parsed data.
    return (arrData);
}

function CSV2JSON(csv) {
    var array = CSVToArray(csv);
    var objArray = [];
    for (var i = 1; i < array.length; i++) {
        objArray[i - 1] = {};
        for (var k = 0; k < array[0].length && k < array[i].length; k++) {
            var key = array[0][k];
            objArray[i - 1][key] = array[i][k]
        }
    }

    var json = JSON.stringify(objArray);
    var str = json.replace(/},/g, "},\r\n");

    return str;
}

function randomizeArray(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

$(document).ready(function () {
    $("#myfile").on("change", function (changeEvent) {
        for (var i = 0; i < changeEvent.target.files.length; ++i) {
            (function (file) {
                var loader = new FileReader();
                loader.onload = function (loadEvent) {
                    if (loadEvent.target.readyState != 2)
                        return;
                    if (loadEvent.target.error) {
                        alert("Error while reading file " + file.name + ": " + loadEvent.target.error);
                        return;
                    }
                    run($.parseJSON(CSV2JSON(loadEvent.target.result)));
                };
                loader.readAsText(file);

            })(changeEvent.target.files[i]);
        }
    });
});


function run(jsonObject) {
    var comp = vgComp; //TODO: change to currently selected "comp" dropdown on UI

    //randomize roles
    var randomRoles = randomizeArray(comp.compOrder);
    var randomPeople = randomizeArray(jsonObject);

    //for each role go through each person
    for (var roleNum = 0; roleNum < randomRoles.length; roleNum++) {
        for (var personNum = 0; personNum < randomPeople; randomPeople++) {

        }
    }

    //find suitable role (check 3s, then 2s, then 1s)
    //if no role found, pick random role and replace... add replaced person to end of person list
    //stop loop after 50 loops or all roles filled
};



var vgComp = {
    ChronoTank: ['chronotank'],
    OffChrono: ['zerker chrono'],
    Healer: ['magi druid'],
    CondiDruid: ['condi druid'],
    StrengthCondiPS: ['condi PS'],
    DisciplineCondiPS: ['condi PS'],
    CondiDPSOne: ['condi ranger', 'condi thief', 'condi engi', 'condi tempest'],
    CondiDPSTwo: ['condi ranger', 'condi thief', 'condi engi', 'condi tempest'],
    GeneralDPSOne: ['condi ranger', 'condi thief', 'condi engi', 'condi tempest', 'DH', 'staff tempest', 'x/wh tempest'],
    GeneralDPSTwo: ['condi ranger', 'condi thief', 'condi engi', 'condi tempest', 'DH', 'staff tempest', 'x/wh tempest'],
    compOrder: ['ChronoTank', 'OffChrono', 'Healer', 'CondiDruid', 'StrengthCondiPS', 'DisciplineCondiPS', 'CondiDPSOne', 'CondiDPSTwo', 'GeneralDPSOne', 'GeneralDPSTwo']
};
