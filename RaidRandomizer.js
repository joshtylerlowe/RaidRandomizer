﻿$(document).ready(function () {
    $('#compSelect').on("change", function () {
        fetchCompFromSpreadsheet($('#compSelect').val());
    });

});

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

var maxBuildTries = 100;
var buildingTries = 0;
var compToUse;
var hasDoneInitialValidation = false;
var minimumConfidence
var maximumConfidence
function run() {

    var raidComp = {};
    var comp = compToUse;

    buildingTries++;

    if (hasDoneInitialValidation == false) {
        minimumConfidence = $('#minConfidence').val();
        maximumConfidence = $('#maxConfidence').val();
        if (isValidConfidence(parseInt(minimumConfidence, 10), parseInt(maximumConfidence, 10)) == false) {
            alert('invalid min/max confidence settings... must be a percentage number between 1 and 100 with maximum greater than minimum')
            return;
        } else {
            hasDoneInitialValidation = true;
        }
    }

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
    if (buildingTries >= maxBuildTries){
        alert("could not build a comp above the ability threshold after " + buildingTries + " tries");
        buildingTries = 0;
        hasDoneInitialValidation = false;
        return;
    }

    var compAbility = compAbilityTotal(raidComp);
    var totalPossibleAbility = randomRoles.length * 3;
    var compConfidence = Math.floor((compAbility / totalPossibleAbility) * 100);

    if(compConfidence > maximumConfidence || compConfidence < minimumConfidence || compIsFull(raidComp, randomRoles.length) == false) {
        run();
        return;
    } else {
        console.log("found comp after " + buildingTries + " tries");
        buildingTries = 0;
        hasDoneInitialValidation = false;

        //build copy/paste-able text for assigning roles
        var discordText = buildRaidCompTextDiscord(raidComp, randomRoles.sort());
        var gw2Text = buildRaidCompTextGW2(raidComp, randomRoles.sort());
        var displayText =
            '<div style="font-size:20px;font-weight:bold;">Discord:</div>' +
            discordText +
            '<div style="font-size:20px;font-weight:bold;">GW2:</div>' +
            gw2Text;

        displayText +=
            '<div>' +
            'Confidence: ' + compConfidence + '% (' + compAbility + '/' + totalPossibleAbility + ')' +
            '</div>';

        $('.mainContent').html(displayText);
    }
};

function isValidConfidence(min, max) {
    var isMinValid = min < 100 && min >= 0;
    var isMaxValid = max <= 100 && max > 0;
    var isMaxGreater = min < max;
    return isMinValid && isMaxValid && isMaxGreater;
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

function buildRaidCompTextDiscord(comp, compArray) {
    var displayText = '';
    
    for (var i = 0; i < compArray.length; i++) {
        var compElement = compArray[i];

        displayText +=
            '<div>' +
            compElement + ': ' + comp[compElement].name + ' (' + comp[compElement].profession + ')' +
            '</div>';
    }

    return displayText;
}

function buildRaidCompTextGW2(comp, compArray) {
    var displayText = '';
    var characterCount = 0;
    var pageCount = 1;

    for (var i = 0; i < compArray.length; i++) {
        var compElement = compArray[i];
        var personName = comp[compElement].name;
        var separator = ': ';
        var spacer = ' | ';
        characterCount += compElement.length + personName.length + separator.length + spacer.length;
        if (characterCount > 199) {
            displayText +=
                '<div>---------page ' +
                pageCount++ +
                '-----------</div>';
            characterCount = 0;
        }
        displayText +=
            '<div>' +
            compElement + separator + personName + spacer +
            '</div>';
    }

    return displayText;
}
