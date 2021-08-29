////////////////////////////////
//////// RESPONSE TIMES ////////
////////////////////////////////

const MAX_TIME_BETWEEN_RESPONSE_SECONDS = 3 * 60 * 60; // in seconds -- 3 hours currently

const rootPath = require('../util/path');
const path = require('path');
const dir = require('node-dir');

const dmIDs = [];
const userIDs = [];
// map user IDs to name
const userIDsToName = {};

// get DMs in json format and make array of DM IDs
const dmsPath = path.join(rootPath, "shopbzr", "dms.json");
const dms = require(dmsPath);
dms.forEach(dm => {
  if (dm['members'][0] != "USLACKBOT" && dm['members'][1] != "USLACKBOT") {
    dmIDs.push(dm.id);
  }
});

// get users in json format and make array of user IDs
const usersPath = path.join(rootPath, "shopbzr", "users.json");
const users = require(usersPath);
users.forEach(user => {
  if (!user.is_bot) {
    userIDs.push(user.id);
    userIDsToName[user.id] = user.profile.real_name
  }
})

// gets all DMs that a user is in
function getUserDMs(user) {
  var userDMs = [];
  dms.forEach(dm => {
    if (dm.members.includes(user)) {
      userDMs.push(dm.id);
    }
  })
  return userDMs;
}

// gets the average response time for a user and a DM they're in
// total response time for each day / number of days they talked for
const bzrPath = path.join(rootPath, "shopbzr");

function getUserDMResponseTime(userID, dmID) {
  const dmPath = path.join(bzrPath, dmID);
  const allConvos = dir.files(dmPath, {sync: true});

  var replies = 0;
  var convoResponseTime = 0;
  // for each DM file in the DM folder, process response times
  allConvos.forEach(convo => {
    var dailyConvo = require(convo);
    var i;
    for (i = 1; i < dailyConvo.length; i++) {
      var previousMessage = dailyConvo[i - 1];
      var currentMessage = dailyConvo[i]
      // check if this was a response to the last
      // and only count it if it's less than 3 hours
      if (currentMessage.user == userID && currentMessage.user != previousMessage.user
          && currentMessage.ts - previousMessage.ts <= MAX_TIME_BETWEEN_RESPONSE_SECONDS) {

        var responseTime = currentMessage.ts - previousMessage.ts;
        convoResponseTime += responseTime;
        replies++;
      }
    }
  });

  return { convoResponseTime: convoResponseTime, numReplies: replies }
}

const allUserResponseTimeData = {userData: []};

// Get response times for each user
// for each user, get all the DMs they are in
//  for each DM they are in, get a list of all files in that dm
//    read each file, adding up the response times
//    define a response times method that will give a response time
//    after passed in user id and DM id
userIDs.forEach(userID => {
  // get all DMs this user is a part of
  var dmIDs = getUserDMs(userID);

  var userResponseTimeData = {userID: userID, responseTimes: []};

  var i;
  for (i = 0; i < dmIDs.length; i++) {
    var responseTimeData = getUserDMResponseTime(userID, dmIDs[i]);
    userResponseTimeData['responseTimes'].push(responseTimeData);
  }

  allUserResponseTimeData['userData'].push(userResponseTimeData);
});

function calculateUserTotalAvgResponseTime(userData) {
  var totalResponseTimeForUser = 0;
  var totalRepliesForUser = 0;
  var responseTimes = userData.responseTimes;
  responseTimes.forEach(responseTime => {
    totalResponseTimeForUser += responseTime.convoResponseTime;
    totalRepliesForUser += responseTime.numReplies;
  })
  if (totalRepliesForUser == 0) {
    return 0;
  }
  return (totalResponseTimeForUser / totalRepliesForUser / 60).toFixed(1);
}

function calculateUserAvgResponseTimeByChannel(userData) {
  var channelsTotalAvgResponseTime = 0;
  var convos = 0;

  var responseTimes = userData.responseTimes;
  responseTimes.forEach(responseTime => {
    if (responseTime.numReplies != 0) {
      var channelAvgResponseTime = responseTime.convoResponseTime / responseTime.numReplies;
      channelsTotalAvgResponseTime += channelAvgResponseTime;
      convos++;
    }
  })
  if (convos == 0) {
    return 0;
  }
  return (channelsTotalAvgResponseTime / convos / 60).toFixed(1);
}

const userResponseTimeData = [];

allUserResponseTimeData['userData'].forEach(data => {
  var userResponseTime = {};
  userResponseTime['name'] = userIDsToName[data.userID];
  userResponseTime['totalAverageResponseTime'] = calculateUserTotalAvgResponseTime(data);
  userResponseTime['averageResponseTimeByChannel'] = calculateUserAvgResponseTimeByChannel(data);
  userResponseTimeData.push(userResponseTime);
})

// write to file
const fs = require('fs');
var responseTimeJson = JSON.stringify(userResponseTimeData, null, 2);
// fs.writeFileSync('/Users/kevinsun/Desktop/user-response-times.json', responseTimeJson);

exports.data = userResponseTimeData;
