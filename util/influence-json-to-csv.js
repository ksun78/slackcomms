/*** Converts input json files to csv ***/

const monthly_influence = require('./monthly-influence');
const json = monthly_influence.data;

var USER_LIMIT = 8; // or json.length
const MIN_CONVERSATIONS_STARTED = 0;


// for writing to a file using a stream, otherwise csv string gets too long
const fs = require('fs');
const rootPath = require('./path');
const path = require('path');

const writePath = path.join(rootPath, "public/data", "influenceByMonth.csv");
// clear file before writing
fs.writeFile(writePath, '', () => {});
var stream = fs.createWriteStream(writePath, {flags:'a'});


// create column names of csv and start adding rows
stream.write('Name,Year,Month,Conversations Started,Conversations Received\n');

var i;
for (i = 0; i < USER_LIMIT; i++) {  
  var person = json[i];
  const userName = person.user;
  const influenceData = person.influenceData;
  const data2019 = influenceData['2019'];
  const data2020 = influenceData['2020'];

  addRowsToCsvForYear(userName, data2019, "2019");
  addRowsToCsvForYear(userName, data2020, "2020");
};

function addRowsToCsvForYear(name, yearData, year) {
  for (var month = 1; month <= 12; month++) {


    var monthStats = yearData[month]
    if (monthStats["conversationsStarted"] == null) {
      // no data for that month
      var row = name + "," + year + "," + month + ",0," + "0\n";
      stream.write(row);
    } else {
      if (monthStats["conversationsStarted"] < MIN_CONVERSATIONS_STARTED) {
        USER_LIMIT++;
        break;
      }
      const started = monthStats["conversationsStarted"];
      const received = monthStats["conversationsReceived"];

      var row = name + "," + year + "," + month + "," + started + "," + received + "\n";
      stream.write(row);
    }
  }
}

// optional but felt cool doing this
stream.end()
