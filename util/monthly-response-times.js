var userConvosByMonth = require('../util/user-convos-by-month');

const userConvosByMonthData = userConvosByMonth.data;

const USER_IDS_TO_NAME = userConvosByMonth.userIdsToName;
const NEW_CONVO_WINDOW = 3 * 60 * 60

// takes in array of convo objects and returns responseTimes object
// with total response times and number of responses
function calculateResponseTimes(userId, convo) {
  var responseTimeSum = 0;
  var numReplies = 0;

  // loop thru each message in convo for the day
  for (var i = 1; i < convo.length; i++) {
    var message = convo[i];
    var prevMessage = convo[i - 1];
    
    // if previous message sent more than X hours ago and by different person,
    // current message counts as new hit-up
    if (message.user == userId && message.user != prevMessage.user
      && message.ts - prevMessage.ts <= NEW_CONVO_WINDOW) {
      
      var responseTime = message.ts - prevMessage.ts;
      responseTimeSum += responseTime;
      numReplies++;
    }
  }

  const responseTimes = { responseTimeSum: responseTimeSum, numReplies: numReplies }
  return responseTimes;
}


/// START OF MAIN FUNCTION ///

const allUserResponseTimesByMonth = []

userConvosByMonthData.forEach(user => {
  convosByMonth = user.convosByYearMonth;

  const responseTimesData = {};
  responseTimesData["2019"] = {};
  responseTimesData["2020"] = {};

  for (var year = 2019; year <= 2020; year++) {
    for (var month = 1; month <= 12; month++) {

      responseTimesData[year][month] = {};

      if (convosByMonth[year] == null || convosByMonth[year][month] == null) {
        continue;
      }
      var convosThatMonth = convosByMonth[year][month];

      totalResponseTime = 0;
      totalReplies = 0;

      convosThatMonth.forEach(convoPath => {
        // calculate response times for each conversation
        var convo = require(convoPath);
        var responseTimes = calculateResponseTimes(user.userId, convo);
        
        totalResponseTime += responseTimes.responseTimeSum;
        totalReplies += responseTimes.numReplies;
      });

      if (totalReplies == 0) {
        responseTimesData[year][month]["avgResponseTime"] = 0;
        responseTimesData[year][month]["responses"] = 0;
      } else {
        // final metric in minutes
        responseTimesData[year][month]["avgResponseTime"] = (totalResponseTime / totalReplies / 60).toFixed(1);
        responseTimesData[year][month]["responses"] = totalReplies;
      }
    }
  }

  userId = user.userId;
  var userResponseTimesByMonth = { user: USER_IDS_TO_NAME[userId], responseTimesData }
  allUserResponseTimesByMonth.push(userResponseTimesByMonth);
})

const fs = require('fs');
var responseTimesByMonthJson = JSON.stringify(allUserResponseTimesByMonth, null, 2);
// fs.writeFileSync('/Users/kevinsun/Desktop/responseTimesByMonth.json', responseTimesByMonthJson);

exports.data = allUserResponseTimesByMonth;

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