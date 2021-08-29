var userConvosByMonth = require('../util/user-convos-by-month');

const userConvosByMonthData = userConvosByMonth.data;

const USER_IDS_TO_NAME = userConvosByMonth.userIdsToName;
const NEW_CONVO_WINDOW = 3 * 60 * 60

const rootPath = require('./path');
const path = require('path');

// takes in array of convo objects and returns responseTimes object
// with total response times and number of responses
function calculateMessageLengths(userId, convo) {

  var wordCount = 0;
  var numMessages = 0;

  // loop thru each message in convo for the day
  for (var i = 1; i < convo.length; i++) {
    var message = convo[i];
    if (message.user == userId) {
      wordCount += message.text.split(" ").length;
      numMessages++;
    }
  }

  var messageLengths = { wordCount: wordCount, numMessages: numMessages }
  return messageLengths;
}


/// START OF MAIN FUNCTION ///

const allUserMessageLengthsByMonth = []

userConvosByMonthData.forEach(user => {
  convosByMonth = user.convosByYearMonth;

  const messageLengthsData = {};
  messageLengthsData["2019"] = {};
  messageLengthsData["2020"] = {};

  for (var year = 2019; year <= 2020; year++) {
    for (var month = 1; month <= 12; month++) {

      messageLengthsData[year][month] = {};

      if (convosByMonth[year] == null || convosByMonth[year][month] == null) {
        continue;
      }
      var convosThatMonth = convosByMonth[year][month];

      totalWordCount = 0;
      totalMessages = 0;

      convosThatMonth.forEach(convoPath => {
        // calculate response times for each conversation
        var convo = require(convoPath);
        var messageLengths = calculateMessageLengths(user.userId, convo);
        
        totalWordCount += messageLengths.wordCount;
        totalMessages += messageLengths.numMessages;
      });

      if (totalMessages == 0) {
        messageLengthsData[year][month]["avgWordCount"] = 0;
        messageLengthsData[year][month]["messages"] = 0;
      } else {
        // final metric in minutes
        messageLengthsData[year][month]["avgWordCount"] = (totalWordCount / totalMessages).toFixed(1);
        messageLengthsData[year][month]["messages"] = totalMessages;
      }
    }
  }

  userId = user.userId;
  var userMessageLengthsByMonth = { user: USER_IDS_TO_NAME[userId], messageLengthsData }
  allUserMessageLengthsByMonth.push(userMessageLengthsByMonth);
})

const fs = require('fs');
var messageLengthsByMonthJson = JSON.stringify(allUserMessageLengthsByMonth, null, 2);
// fs.writeFileSync('/Users/kevinsun/Desktop/messageLengthsByMonth.json', messageLengthsByMonthJson);

exports.data = allUserMessageLengthsByMonth;

//    [
//      {
//        "user": "Kevin",
//        "convosByYearMonth": {
//           "2020": {
//              "01": {
//                 "avgResponseTime": 5.7,
//                 "responses": 10
//               }
//            }
//         }   
//      },
//      {
//        "user": "Alice",
//        "convosByYearMonth": {
//            .....
//         }
//      }
//    ]