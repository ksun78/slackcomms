//////////////////////////////////
//////// CHARACTERS TYPED ////////
//////////////////////////////////

///////// BEGIN SETUP //////////

const rootPath = require('./path');
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

///////// END SETUP //////////



/////// BEGIN CALCULATIONS ////////

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

// first set of functions + function calls


function getUserMessageLength(userID, dmID) {

  const bzrPath = path.join(rootPath, "shopbzr");
  const dmPath = path.join(bzrPath, dmID);
  const allConvos = dir.files(dmPath, {sync: true});
  // const numDays = convos.length;

  var totalCharacters = 0;
  var totalWords = 0;
  var totalMessages = 0;

  // for each DM file in the DM folder, get count of words and characters typed
  allConvos.forEach(convo => {
    var dailyConvo = require(convo);

    var i;
    for (i = 0; i < dailyConvo.length; i++) {
      
      var message = dailyConvo[i];
      if (message.user == userID) {
        totalCharacters += message.text.length;
        totalWords += message.text.split(" ").length;

        totalMessages++;
      }
    }
  });

  return { totalCharacters: totalCharacters, totalWords: totalWords, totalMessages: totalMessages}
}

const allUserMessageLengthData = {userData: []};

// Get message lengths for each user
// for each user, get all the DMs they are in
//  for each DM they are in, get a list of all files in that dm
//    read each file, adding up the response times
//    define a response times method that will give a response time
//    after passed in user id and DM id
userIDs.forEach(userID => {
  // get all DMs this user is a part of
  var dmIDs = getUserDMs(userID);

  var userMessageLengthData = {userID: userID, messageLengths: []};

  var i;
  for (i = 0; i < dmIDs.length; i++) {
    var messageLengthData = getUserMessageLength(userID, dmIDs[i]);
    userMessageLengthData['messageLengths'].push(messageLengthData);
  }

  allUserMessageLengthData['userData'].push(userMessageLengthData);
});


// second set of functions + function calls


function calculateUserTotalAvgCharacterCount(messageLengthData) {
  var totalCharacters = 0;
  var totalMessages = 0;
  var messageLengths = messageLengthData.messageLengths;
  messageLengths.forEach(messageLengths => {
    totalCharacters += messageLengths.totalCharacters;
    totalMessages += messageLengths.totalMessages;
  })
  if (totalMessages == 0) {
    return 0;
  }
  return (totalCharacters / totalMessages).toFixed(1);
}

function calculateUserTotalAvgWordCount(messageLengthData) {
  var totalWords = 0;
  var totalMessages = 0;
  var messageLengths = messageLengthData.messageLengths;
  messageLengths.forEach(messageLengths => {
    totalWords += messageLengths.totalWords;
    totalMessages += messageLengths.totalMessages;
  })
  if (totalMessages == 0) {
    return 0;
  }
  return (totalWords / totalMessages).toFixed(1);
}

function calculateUserAvgCharacterCountByChannel(messageLengthData) {
  var channelsAvgCharacterCountTotal = 0;
  var convos = 0;

  var messageLengths = messageLengthData.messageLengths;
  messageLengths.forEach(messageLength => {
    if (messageLength.totalMessages != 0) {
      var channelAvgCharacterCount = messageLength.totalCharacters / messageLength.totalMessages;
      channelsAvgCharacterCountTotal += channelAvgCharacterCount;
      convos++;
    }
  })
  if (convos == 0) {
    return 0;
  }
  return (channelsAvgCharacterCountTotal / convos).toFixed(1);
}

function calculateUserAvgWordCountByChannel(messageLengthData) {
  var channelsAvgWordCountTotal = 0;
  var convos = 0;

  var messageLengths = messageLengthData.messageLengths;
  messageLengths.forEach(messageLength => {
    if (messageLength.totalMessages != 0) {
      var channelAvgWordCount = messageLength.totalWords / messageLength.totalMessages;
      channelsAvgWordCountTotal += channelAvgWordCount;
      convos++;
    }
  })
  if (convos == 0) {
    return 0;
  }
  return (channelsAvgWordCountTotal / convos).toFixed(1);
}

const userMessageLengthData = [];

allUserMessageLengthData['userData'].forEach(data => {
  var userMessageLength = {};
  userMessageLength['name'] = userIDsToName[data.userID];

  userMessageLength['totalAverageCharacterCount'] = calculateUserTotalAvgCharacterCount(data);
  userMessageLength['averageCharacterCountByChannel'] = calculateUserAvgCharacterCountByChannel(data);
  userMessageLength['totalAverageWordCount'] = calculateUserTotalAvgWordCount(data);
  userMessageLength['averageWordCountByChannel'] = calculateUserAvgWordCountByChannel(data);
  userMessageLengthData.push(userMessageLength);
})

// write to file
const fs = require('fs');
var messageLengthJson = JSON.stringify(userMessageLengthData, null, 2);
// fs.writeFileSync('/Users/kevinsun/Desktop/user-message-lengths.json', messageLengthJson); // commented out because we already have it on desktop

exports.data = userMessageLengthData;

