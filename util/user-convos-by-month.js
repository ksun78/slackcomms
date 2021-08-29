const rootPath = require('./path');
const path = require('path');
const dir = require('node-dir');

const DMS_PATH = path.join(rootPath, "shopbzr", "dms.json");
const DMs = require(DMS_PATH);
const USERS_PATH = path.join(rootPath, "shopbzr", "users.json");
const USERS = require(USERS_PATH);
const BZR_PATH = path.join(rootPath, "shopbzr");

// return list of user IDs, and map of user ids to names
function setupUsersLists() {
  const userIDs = [];
  const userIDsToName = {};
  USERS.forEach(user => {
    if (!user.is_bot) {
      userIDs.push(user.id);
      userIDsToName[user.id] = user.profile.real_name
    }
  });
  return {userIDs: userIDs, userIDsToName: userIDsToName };
}

// get all DMs (object) that a user is in
function getUserDms(userId) {
  var userDms = [];
  DMs.forEach(dm => {
    if (dm.members.includes(userId) && dm['members'][0] != "USLACKBOT" && dm['members'][1] != "USLACKBOT") {
      userDms.push(dm);
    }
  })
  return userDms;
}

// returns a list of objects with month, year, and path information about a conversation
//  {
//    year: 2020,
//    month: 1,
//    path: ".../DM9876989/2020-01-23.json",
//  }
function formatDates(dmList) {
  const conversations = [];

  dmList.forEach(dm => {
    const dmPath = path.join(BZR_PATH, dm.id);
    const allConvos = dir.files(dmPath, {sync: true});

    allConvos.forEach(convoFile => {
      
      // get date info
      const parts = convoFile.split('/');
      const fileName = parts[parts.length - 1];
      const leftSide = fileName.split('.')[0];
      const leftSideParts = leftSide.split('-');
      const year = leftSideParts[0];
      const month = leftSideParts[1];

      var conversation = { year: year, month: month, path: convoFile }
      conversations.push(conversation);
    })
  });

  return conversations;
}

// takes in an object with date and path information for a DM's daily conversation
// and sorts each into it's own year, month category with the path
// for reference - object returned by formatDates() method
function sortDmsIntoYearsMonths(userDmsWithDate) {
  const convosByYearMonth = {};
  userDmsWithDate.forEach(dmDateObject => {
    var year = dmDateObject.year;
    var month = dmDateObject.month;
    month = month.replace(/^0+/, '');

    if (convosByYearMonth[year] == null) {
      convosByYearMonth[year] = {};
    }
    if (convosByYearMonth[year][month] == null) {
      convosByYearMonth[year][month] = [];
    }
    convosByYearMonth[year][month].push(dmDateObject.path);
  });
  
  return convosByYearMonth;
}

function formatUserConversationsByMonth(userIdList, userIdsToName) {
  const userConvosByYearMonth = [];
  userIdList.forEach(userId => {
    const userDms = getUserDms(userId);
    const dmsBasicFormat = formatDates(userDms);
    const convosByYearMonth = sortDmsIntoYearsMonths(dmsBasicFormat);
    var userConvoByYearMonth = { userId: userId, convosByYearMonth: convosByYearMonth }

    userConvosByYearMonth.push(userConvoByYearMonth);
  });

  return userConvosByYearMonth;
}

//    [
//      {
//        "user": "Kevin",
//        "convosByYearMonth": {
//           "2020": {
//             "01": [
//                "DM1234567",
//                "DM7654321"
//              ],
//             "02": [
//                "DM2222222",
//                "DM3333333"
//              ]
//           "2019": {
//             "01": [
//                "DM1233212"
//              ],
//              "02": [ 
//                ... 
//              ]
//            }
//      },
//      {
//        "user": "Alice",
//        "convosByYearMonth": {
//            .....
//         }
//      }
//    ]

const userInfo = setupUsersLists();
const userIDs = userInfo.userIDs;
const userIDsToName = userInfo.userIDsToName;
const userConvosByYearMonth = formatUserConversationsByMonth(userIDs, userIDsToName);

exports.data = userConvosByYearMonth;
exports.userIdsToName = userIDsToName;

const fs = require('fs');
var userConvosByMonth = JSON.stringify(userConvosByYearMonth, null, 2);
// fs.writeFileSync('/Users/kevinsun/Desktop/userConvosByMonth.json', userConvosByMonth);