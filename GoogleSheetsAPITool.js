// Client ID and API key from the Developer Console
var CLIENT_ID = '128400325033-30rktdc13vu3rgk7dgqodiov0qtu5ttr.apps.googleusercontent.com';

// Array of API discovery doc URLs for APIs used by the quickstart
var DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
var SCOPES = "https://www.googleapis.com/auth/spreadsheets.readonly";

var authorizeButton = document.getElementById('authorize-button');
var signoutButton = document.getElementById('signout-button');

/**
 *  On load, called to load the auth2 library and API client library.
 */
function handleClientLoad() {
    gapi.load('client:auth2', initClient);
}

/**
 *  Initializes the API client library and sets up sign-in state
 *  listeners.
 */
function initClient() {
    gapi.client.init({
        discoveryDocs: DISCOVERY_DOCS,
        clientId: CLIENT_ID,
        scope: SCOPES
    }).then(function () {
        // Listen for sign-in state changes.
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

        // Handle the initial sign-in state.
        updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
        authorizeButton.onclick = handleAuthClick;
        signoutButton.onclick = handleSignoutClick;
    });
}

/**
 *  Called when the signed in status changes, to update the UI
 *  appropriately. After a sign-in, the API is called.
 */
function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
        authorizeButton.style.display = 'none';
        signoutButton.style.display = 'block';
        fetchPeopleFromSpreadsheet();
    } else {
        authorizeButton.style.display = 'block';
        signoutButton.style.display = 'none';
    }
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick(event) {
    gapi.auth2.getAuthInstance().signIn();
}

/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick(event) {
    gapi.auth2.getAuthInstance().signOut();
}

function makePerson(labels, row) {
    var personObject = {};
    for (var i = 0; i < labels.length; i++) {
        personObject[labels[i]] = row[i];
    }
    return personObject;
}

function fetchPeopleFromSpreadsheet() {
    jsonObject = [];
    gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: '13AqbYSAQae9WSInM7dK5heqHahk4yT2zg21iHXroHRE',
        range: 'Sheet1!A1:Z',
    }).then(function (response) {
        var range = response.result;
        if (range.values.length > 0) {
            var lablesRow = range.values[0];
            for (i = 1; i < range.values.length; i++) {
                var row = range.values[i];
                jsonObject.push(makePerson(lablesRow, row));
            }
        } else {
            alert('No data found.');
        }
    }, function (response) {
        alert('Error: ' + response.result.error.message);
    });
}