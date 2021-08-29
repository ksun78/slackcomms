const UNIQUE = true;

const rootPath = require('./path');
const path = require('path');

var userConvosByMonth = require('../util/user-convos-by-month');
if (UNIQUE) {
  userConvosByMonth = require('../util/user-convos-by-month-unique');
}

const userConvosByMonthData = userConvosByMonth.data;

const USER_IDS_TO_NAME = userConvosByMonth.userIdsToName;
const NEW_CONVO_WINDOW = 3 * 60 * 60

// takes in array of convo objects and returns influence object with
// convosStarted and convosReceived
function calculateInfluence(userId, convo) {
  var _started = 0;
  var _received = 0;

  // fencepost: first message of the day considered a new hit-up
  var message = convo[0];
  var messageSenderId = message.user;

  if (userId == messageSenderId) {
    _started++;
  } else {
    _received++;
  }

  // record only first hit-up of the convo
  if (UNIQUE) {
    const influence = { conversationsStarted: _started, conversationsReceived: _received }
    return influence;
  }

  // loop thru each message in convo for the day
  for (var i = 1; i < convo.length; i++) {
    var message = convo[i];
    var prevMessage = convo[i - 1];
    
    // if previous message sent more than X hours ago and by different person,
    // current message counts as new hit-up
    if (message.ts - prevMessage.ts > NEW_CONVO_WINDOW) {
      var messageSenderId = message.user;
      if (userId == messageSenderId) {
        _started++;
      } else {
        _received++;
      }
    }
  }

  const influence = { conversationsStarted: _started, conversationsReceived: _received }
  return influence
}


/// START OF MAIN FUNCTION ///

const allUserInfluenceByMonth = []

userConvosByMonthData.forEach(user => {
  convosByMonth = user.convosByYearMonth;

  const influenceData = {};
  influenceData["2019"] = {};
  influenceData["2020"] = {};

  for (var year = 2019; year <= 2020; year++) {
    for (var month = 1; month <= 12; month++) {

      influenceData[year][month] = {};

      if (convosByMonth[year] == null || convosByMonth[year][month] == null) {
        continue;
      }
      var convosThatMonth = convosByMonth[year][month];

      convosThatMonth.forEach(convoPath => {
        // calculate conversations started and received that month
        var convo = require(convoPath);
        var influence = calculateInfluence(user.userId, convo);

        if (influenceData[year][month]["conversationsStarted"] == null) {
          influenceData[year][month] = influence;
        } else {
          influenceData[year][month]["conversationsStarted"] += influence["conversationsStarted"];
          influenceData[year][month]["conversationsReceived"] += influence["conversationsReceived"];
        }

      });
    }
  }

  userId = user.userId;
  var userInfluenceByMonth = { user: USER_IDS_TO_NAME[userId], influenceData }
  allUserInfluenceByMonth.push(userInfluenceByMonth);
})

const fs = require('fs');
var influenceByMonthJson = JSON.stringify(allUserInfluenceByMonth, null, 2);

if (UNIQUE) {
  // fs.writeFileSync('/Users/kevinsun/Desktop/uniqueInfluenceByMonth.json', influenceByMonthJson);
} else {
  // fs.writeFileSync('/Users/kevinsun/Desktop/influenceByMonth.json', influenceByMonthJson);
}

exports.data = allUserInfluenceByMonth;

//    [
//      {
//        "user": "Kevin",
//        "convosByYearMonth": {
//           "2020": {
//             "01": {
//               "conversationsStarted": 5,
//               "conversationsReceived": 10
//             }
//           }
//         }
//      },
//      {
//        "user": "Alice",
//        "convosByYearMonth": {
//            .....
//         }
//      }
//    ]