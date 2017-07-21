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

function fetchRandomReasonablePersonRole(object, roles) {
    var possiblePersonRoles = [];

    for (var i = 0; i < Object.keys(object).length; i++) {
        var key = Object.keys(object)[i];
        if (object[key] > 0 && $.inArray(key, roles) !== -1) {
            possiblePersonRoles.push(key);
        }
    }

    return randomizeArray(possiblePersonRoles)[0];
}

var jsonObject;
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
                    jsonObject = $.parseJSON(CSV2JSON(loadEvent.target.result));
                    $('#myform').hide();
                };
                loader.readAsText(file);

            })(changeEvent.target.files[i]);
        }
    });
});


var buildingTries = 0;
function run() {
    if (!jsonObject) {
        alert('no csv uploaded to read');
        return;
    }

    var raidComp = {};
    var comp = getCompFromName($('#compSelect').val());

    //randomize roles & people
    var randomRoles = randomizeArray(comp.compOrder);
    var randomPeople = randomizeArray(jsonObject);

    //for each role go through each person
    for (var roleNum = 0; roleNum < randomRoles.length; roleNum++) {
        for (var personNum = 0; personNum < randomPeople.length; personNum++) {
            //find suitable role
            var role = randomRoles[roleNum];
            var person = randomPeople[personNum];

            var continueOut = false;
            for (var assignedRolesNum = 0; assignedRolesNum < Object.keys(raidComp).length; assignedRolesNum++) {
                if (raidComp[Object.keys(raidComp)[assignedRolesNum]].name == person.name) {
                    //person already added;
                    continueOut = true;
                    break;
                }
            }
            if (continueOut) {
                continue;
            }

            var randomPersonRole = fetchRandomReasonablePersonRole(person, comp[role]);

            //set person to role
            if (randomPersonRole && randomPersonRole.length > 0) {
                raidComp[role] = { name: person.name, skill: person[randomPersonRole], profession: randomPersonRole };
                break;
            } else {
                //if no role found, pick random role that the person CAN fill and set it
                var replacementRoleFound = false;
                for (var roleRetryNum = 0; roleRetryNum < randomRoles.length; roleRetryNum++) {
                    var availableRetryRoles = comp[randomRoles[roleRetryNum]];
                    for (var x = 0; x < availableRetryRoles.length; x++) {
                        if (person[availableRetryRoles[x]] > 0) {
                            raidComp[randomRoles[roleRetryNum]] = { name: person.name, skill: person[availableRetryRoles[x]], profession: availableRetryRoles[x] };
                            replacementRoleFound = true;
                            break;
                        }
                    }
                    if (replacementRoleFound) {
                        break;
                    }
                }

                if (replacementRoleFound == false) {
                    alert("could not find a place for: " + person.name);
                    return;
                }
            }
        }
    }

    //don't blow up your computer
    if (buildingTries >= 50){
        buildingTries = 0;
        alert("could not build a comp above the ability threshold after " + buildingTries + " tries");
        return;
    }

    //check comp's ability (25+)
    if(compAbilityTotal(raidComp) < 25 || compIsFull(raidComp, comp.compOrder.length) == false) {
        buildingTries++;
        run();
        return;
    } else {
        buildingTries = 0;
        //build copy/paste-able text for assigning roles
        buildRaidCompText(raidComp, comp.compOrder.sort());
    }
};

function getCompFromName(compName) {
    return window[compName];
}

function compAbilityTotal(comp) {
    var sum = 0;
    for (var prop in comp) {
        sum += parseInt(comp[prop].skill);
    }
    return sum;
}

function compIsFull(comp, desiredLength) {
    return Object.keys(comp).length == desiredLength;
}

function buildRaidCompText(comp, compArray) {
    var displayText = '';

    for (var i = 0; i < compArray.length; i++) {
        var compElement = compArray[i];
        if (!comp[compElement]) {
            debugger;
        }
        displayText +=
            '<div>' +
            compElement.split(/(?=[A-Z])/).join(" ") + ': ' + comp[compElement].name + '(' + comp[compElement].profession + ')';
            '</div>';
    }

    var ability = compAbilityTotal(comp);
    var totalPossibleAbility = compArray.length;

    displayText +=
        '<div>' +
        'Confidence: ' + Math.floor((ability/(totalPossibleAbility*3)) * 100) + '% (' + ability + '/' + (totalPossibleAbility*3) + ')'
        '</div>';

    $('.mainContent').html(displayText);
}


var vgComp = {
    ChronoTank: ['chronotank'],
    OffChrono: ['zerker chrono'],
    HealerOne: ['magi druid'],
    HealerTwo: ['magi druid', 'condi druid'],
    StrengthPS: ['condi PS'],
    DisciplinePS: ['condi PS'],
    CondiDPSOne: ['condi ranger', 'condi thief', 'condi engi', 'condi tempest'],
    CondiDPSTwo: ['condi ranger', 'condi thief', 'condi engi', 'condi tempest'],
    GeneralDPSOne: ['condi ranger', 'condi thief', 'condi engi', 'condi tempest', 'DH', 'staff tempest', 'x/wh tempest'],
    GeneralDPSTwo: ['condi ranger', 'condi thief', 'condi engi', 'condi tempest', 'DH', 'staff tempest', 'x/wh tempest'],
    compOrder: ['ChronoTank', 'OffChrono', 'HealerOne', 'HealerTwo', 'StrengthPS', 'DisciplinePS', 'CondiDPSOne', 'CondiDPSTwo', 'GeneralDPSOne', 'GeneralDPSTwo']
};

var gorsComp = {
    ChronoTank: ['chronotank'],
    OffChrono: ['zerker chrono'],
    HealerOne: ['magi druid'],
    HealerTwo: ['magi druid'],
    StrengthPS: ['condi PS'],
    DisciplinePS: ['condi PS'],
    OrbEleOne: ['staff tempest'],
    OrbEleTwo: ['staff tempest'],
    DPSOne: ['condi ranger', 'condi thief', 'condi engi', 'condi tempest', 'DH', 'staff tempest', 'x/wh tempest'],
    DPSTwo: ['condi ranger', 'condi thief', 'condi engi', 'condi tempest', 'DH', 'staff tempest', 'x/wh tempest'],
    compOrder: ['ChronoTank', 'OffChrono', 'HealerOne', 'HealerTwo', 'StrengthPS', 'DisciplinePS', 'OrbEleOne', 'OrbEleTwo', 'DPSOne', 'DPSTwo']
};

var sabComp = {
    ChronoOne: ['chronotank', 'zerker chrono'],
    ChronoTwo: ['chronotank', 'zerker chrono'],
    Healer: ['magi druid'],
    FlakKiter: ['magi druid'],
    StrengthPS: ['condi PS'],
    DisciplinePS: ['condi PS'],
    OddCannons: ['staff tempest', 'x/wh tempest'],
    EvenCannons: ['staff tempest', 'x/wh tempest'],
    DPSOne: ['condi ranger', 'condi thief', 'condi engi', 'condi tempest', 'DH', 'staff tempest', 'x/wh tempest'],
    DPSTwo: ['condi ranger', 'condi thief', 'condi engi', 'condi tempest', 'DH', 'staff tempest', 'x/wh tempest'],
    compOrder: ['ChronoOne', 'ChronoTwo', 'Healer', 'FlakKiter', 'StrengthPS', 'DisciplinePS', 'OddCannons', 'EvenCannons', 'DPSOne', 'DPSTwo']
};

var slothComp = {
    ChronoOne: ['chronotank', 'zerker chrono'],
    ChronoTwo: ['chronotank', 'zerker chrono'],
    HealerOne: ['magi druid'],
    HealerTwo: ['magi druid'],
    StrengthPS: ['condi PS'],
    DisciplinePS: ['condi PS'],
    DPSOne: ['condi ranger', 'condi tempest', 'staff tempest', 'x/wh tempest', 'condi reaper'],
    DPSTwo: ['condi ranger', 'condi tempest', 'staff tempest', 'x/wh tempest', 'condi reaper'],
    DPSThree: ['condi ranger', 'condi tempest', 'staff tempest', 'x/wh tempest', 'condi reaper'],
    DPSFour: ['condi ranger', 'condi tempest', 'staff tempest', 'x/wh tempest', 'condi reaper'],
    compOrder: ['ChronoOne', 'ChronoTwo', 'HealerOne', 'HealerTwo', 'StrengthPS', 'DisciplinePS', 'DPSOne', 'DPSTwo', 'DPSThree', 'DPSFour']
};

var trioComp = {
    ChronoOne: ['chronotank', 'zerker chrono'],
    ChronoTwo: ['chronotank', 'zerker chrono'],
    HealerOne: ['magi druid'],
    HealerTwo: ['magi druid', 'condi druid'],
    StrengthPS: ['condi PS'],
    DisciplinePS: ['condi PS'],
    DPSOne: ['condi ranger', 'condi tempest', 'staff tempest', 'x/wh tempest', 'condi reaper', 'condi engi'],
    DPSTwo: ['condi ranger', 'condi tempest', 'staff tempest', 'x/wh tempest', 'condi reaper', 'condi engi'],
    DPSThree: ['condi ranger', 'condi tempest', 'staff tempest', 'x/wh tempest', 'condi reaper', 'condi engi'],
    DPSFour: ['condi ranger', 'condi tempest', 'staff tempest', 'x/wh tempest', 'condi reaper', 'condi engi'],
    compOrder: ['ChronoOne', 'ChronoTwo', 'HealerOne', 'HealerTwo', 'StrengthPS', 'DisciplinePS', 'DPSOne', 'DPSTwo', 'DPSThree', 'DPSFour']
};

var mattComp = {
    ChronoOne: ['chronotank', 'zerker chrono'],
    ChronoTwo: ['chronotank', 'zerker chrono'],
    Auramancer: ['heal tempest'],
    MagiDruid: ['magi druid'],
    CondiDruid: ['condi druid'],
    StrengthPS: ['condi PS'],
    DisciplinePS: ['condi PS'],
    DPSOne: ['condi ranger', 'condi tempest', 'condi reaper', 'condi mes'],
    DPSTwo: ['condi ranger', 'condi tempest', 'condi reaper', 'condi mes'],
    DPSThree: ['condi ranger', 'condi tempest', 'condi reaper', 'condi mes'],
    compOrder: ['ChronoOne', 'ChronoTwo', 'Auramancer', 'MagiDruid', 'CondiDruid', 'StrengthPS', 'DisciplinePS', 'DPSOne', 'DPSTwo', 'DPSThree']
};

var escortComp = {
    ShroomChrono: ['chronotank', 'zerker chrono'],
    OffChrono: ['chronotank', 'zerker chrono'],
    Babysitter: ['magi druid'],
    Healer: ['magi druid', 'condi druid'],
    StrengthPS: ['condi PS'],
    DisciplinePS: ['condi PS'],
    DPSOne: ['condi ranger', 'condi tempest', 'staff tempest', 'x/wh tempest', 'condi reaper', 'condi engi', 'DH'],
    DPSTwo: ['condi ranger', 'condi tempest', 'staff tempest', 'x/wh tempest', 'condi reaper', 'condi engi', 'DH'],
    DPSThree: ['condi ranger', 'condi tempest', 'staff tempest', 'x/wh tempest', 'condi reaper', 'condi engi', 'DH'],
    DPSFour: ['condi ranger', 'condi tempest', 'staff tempest', 'x/wh tempest', 'condi reaper', 'condi engi', 'DH'],
    compOrder: ['ShroomChrono', 'OffChrono', 'Babysitter', 'Healer', 'StrengthPS', 'DisciplinePS', 'DPSOne', 'DPSTwo', 'DPSThree', 'DPSFour']
};

var kcComp = {
    ChronoTank: ['chronotank'],
    OffChrono: ['zerker chrono'],
    HealerOne: ['magi druid'],
    HealerTwo: ['magi druid'],
    StrengthPS: ['condi PS'],
    DisciplinePS: ['condi PS'],
    DPSOne: ['staff tempest', 'DH'],
    DPSTwo: ['staff tempest'],
    DPSThree: ['staff tempest'],
    DPSFour: ['staff tempest'],
    compOrder: ['ChronoTank', 'OffChrono', 'HealerOne', 'HealerTwo', 'StrengthPS', 'DisciplinePS', 'DPSOne', 'DPSTwo', 'DPSThree', 'DPSFour']
};

var xeraComp = {
    ChronoTank: ['chronotank'],
    OffChrono: ['zerker chrono'],
    HealerOne: ['magi druid'],
    HealerTwo: ['magi druid'],
    StrengthPS: ['condi PS'],
    DisciplinePS: ['condi PS'],
    OrbEleLeft: ['staff tempest'],
    OrbEleRight: ['staff tempest'],
    DPSOne: ['staff tempest', 'x/wh tempest', 'condi ranger'],
    DPSTwo: ['staff tempest', 'x/wh tempest', 'condi ranger'],
    compOrder: ['ChronoTank', 'OffChrono', 'HealerOne', 'HealerTwo', 'StrengthPS', 'DisciplinePS', 'OrbEleLeft', 'OrbEleRight', 'DPSOne', 'DPSTwo']
};

var cairnComp = {
    ChronoOne: ['chronotank', 'zerker chrono'],
    ChronoTwo: ['chronotank', 'zerker chrono'],
    HealerOne: ['magi druid'],
    HealerTwo: ['magi druid'],
    StrengthPS: ['condi PS'],
    DisciplinePS: ['condi PS'],
    DPSOne: ['condi ranger', 'condi tempest', 'condi reaper', 'condi engi', 'condi thief', 'condi mes'],
    DPSTwo: ['condi ranger', 'condi tempest', 'condi engi', 'condi thief', 'condi mes'],
    DPSThree: ['condi ranger', 'condi tempest', 'condi thief', 'condi mes'],
    DPSFour: ['condi ranger', 'condi tempest', 'condi thief', 'condi mes'],
    compOrder: ['ChronoOne', 'ChronoTwo', 'HealerOne', 'HealerTwo', 'StrengthPS', 'DisciplinePS', 'DPSOne', 'DPSTwo', 'DPSThree', 'DPSFour']
};

var moComp = {
    ChronoOne: ['chronotank', 'zerker chrono'],
    ChronoTwo: ['chronotank', 'zerker chrono'],
    HealerOne: ['magi druid', 'condi druid'],
    HealerTwo: ['magi druid', 'condi druid'],
    StrengthPS: ['condi PS'],
    DisciplinePS: ['condi PS'],
    EpiReaper: ['condi reaper'],
    DPSOne: ['condi ranger', 'condi tempest', 'condi reaper', 'condi engi', 'condi thief'],
    DPSTwo: ['condi ranger', 'condi tempest', 'condi engi', 'condi thief'],
    DPSThree: ['condi ranger', 'condi tempest', 'condi thief'],
    compOrder: ['ChronoOne', 'ChronoTwo', 'HealerOne', 'HealerTwo', 'StrengthPS', 'DisciplinePS', 'EpiReaper', 'DPSOne', 'DPSTwo', 'DPSThree']
};

var samComp = {
    ChronoOne: ['chronotank', 'zerker chrono'],
    ChronoTwo: ['chronotank', 'zerker chrono'],
    HealerOne: ['magi druid'],
    HealerTwo: ['magi druid'],
    StrengthPS: ['condi PS'],
    DisciplinePS: ['condi PS'],
    DPSOne: ['condi ranger', 'condi tempest', 'condi reaper', 'condi engi', 'condi thief'],
    DPSTwo: ['condi ranger', 'condi tempest', 'condi thief'],
    DPSThree: ['condi ranger', 'condi tempest', 'condi thief'],
    DPSFour: ['condi ranger', 'condi tempest', 'condi thief'],
    compOrder: ['ChronoOne', 'ChronoTwo', 'HealerOne', 'HealerTwo', 'StrengthPS', 'DisciplinePS', 'DPSOne', 'DPSTwo', 'DPSThree', 'DPSFour']
};

var deimosComp = {
    ChronoTank: ['chronotank'],
    OffChrono: ['zerker chrono'],
    OilKiter: ['magi druid'],
    Healer: ['magi druid'],
    HandKiter: ['hand kite rev'],
    StrengthPS: ['condi PS'],
    DisciplinePS: ['condi PS'],
    DPSOne: ['condi ranger'],
    DPSTwo: ['condi ranger'],
    DPSThree: ['condi ranger'],
    compOrder: ['ChronoTank', 'OffChrono', 'OilKiter', 'Healer', 'HandKiter', 'StrengthPS', 'DisciplinePS', 'DPSOne', 'DPSTwo', 'DPSThree']
};

var w1Comp = {
    ChronoTank: ['chronotank'],
    OffChrono: ['zerker chrono'],
    GroupHealer: ['magi druid'],
    ObjectiveHealer: ['magi druid'],
    StrengthPS: ['condi PS'],
    DisciplinePS: ['condi PS'],
    CondiDPSOne: ['condi ranger'],
    CondiDPSTwo: ['condi ranger'],
    EleOne: ['staff tempest', 'x/wh tempest'],
    EleTwo: ['staff tempest', 'x/wh tempest'],
    compOrder: ['ChronoTank', 'OffChrono', 'GroupHealer', 'ObjectiveHealer', 'StrengthPS', 'DisciplinePS', 'CondiDPSOne', 'CondiDPSTwo', 'EleOne', 'EleTwo']
};
