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

// takes in a list of dm paths and tells you if given dm already exists
function dmAlreadyExists(dmPathList, dmPath) {
  var dmIdParts = dmPath.split('/')
  var dmId = dmIdParts[dmIdParts.length - 2];

  for (var dmPath2 of dmPathList) {
    var dmPathParts2 = dmPath2.split('/');
    var dmId2 = dmPathParts2[dmPathParts2.length - 2];

    if (dmId == dmId2) {
      return true;
    }
  }
  return false;
}

// takes in an object with date and path information for a DM's daily conversation
// and sorts each into it's own year, month category with the path
// for reference - object returned by formatDates() method
function sortUniqueDmsIntoYearsMonths(userDmsWithDate) {
  const convosByYearMonth = {};
  userDmsWithDate.forEach(dmDateObject => {
    var year = dmDateObject.year;
    var month = dmDateObject.month;
    month = month.replace(/^0+/, ''); // get rid of leading 0s

    if (convosByYearMonth[year] == null) {
      convosByYearMonth[year] = {};
    }
    if (convosByYearMonth[year][month] == null) {
      convosByYearMonth[year][month] = [];
    }

    // get and check if dmDateObject has a dm that's already been added
    var dmPath = dmDateObject.path;
    existingDmPaths = convosByYearMonth[year][month];
    
    // must be unique
    if (!dmAlreadyExists(existingDmPaths, dmPath)) {
      convosByYearMonth[year][month].push(dmPath);
    }
  });
  
  return convosByYearMonth;
}

function formatUserConversationsByMonth(userIdList, userIdsToName) {
  const userConvosByYearMonth = [];
  userIdList.forEach(userId => {
    const userDms = getUserDms(userId);
    const dmsBasicFormat = formatDates(userDms);
    const convosByYearMonth = sortUniqueDmsIntoYearsMonths(dmsBasicFormat);
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
//                "/DM1234567/2020-01-25.json",
//                "/DM7654321/2020-01-26.json"
//              ],
//             "02": [
//                "/DM2222222/2020-02-25.json",
//                "/DM3333333/2020-02-26.json"
//              ]
//           "2019": {
//             "01": [
//                "/DM1233212/2019-01-27.json"
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
var userConvosByMonthUnique = JSON.stringify(userConvosByYearMonth, null, 2);
// fs.writeFileSync('/Users/kevinsun/Desktop/uniqueUserConvosByMonth.json', userConvosByMonthUnique);