//////////////////////////////////
//////// CHARACTERS TYPED ////////
//////////////////////////////////

///////// BEGIN SETUP //////////

const rootPath = require('./path');
const path = require('path');
const dir = require('node-dir');

const dmIDs = [];
const userIDs = [];
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

// 3 hours is assumed to be the start of a new hit-up
const NEW_CONVO_WINDOW = 3 * 60 * 60
const BZR_PATH = path.join(rootPath, "shopbzr");

// get all DMs (by object) that a user is in
function getUserDms(user) {
  var userDms = [];
  dms.forEach(dm => {
    if (dm.members.includes(user)) {
      userDms.push(dm);
    }
  })
  return userDms;
}

// Gets statistics on how many times a user started a conversation with this person
// and received a conversation initiation from this person, from all days they've talked
// starting a conversation means either 1st of the day or 1st after 3 hours

// sample return:
//
//  {
//    userId:   xxx
//    sent:     x
//    received: x
//  }
//
function getInitiatedAndReceivedStats(userId, dmId) {

  const dmPath = path.join(BZR_PATH, dmId);
  const allConvos = dir.files(dmPath, {sync: true});

  var _started = 0;
  var _received = 0;

  // array of convo files by day with another user
  allConvos.forEach(convo => {
    // contents of that file below,
    // messages in json format as part of array
    var dailyConvo = require(convo);
    
    // fencepost: first message of the day considered a new hit-up
    var message = dailyConvo[0];
    var messageSenderId = message.user;

    if (userId == messageSenderId) {
      _started++;
    } else {
      _received++;
    }

    // loop thru each message in convo for the day
    for (var i = 1; i < dailyConvo.length; i++) {
      var message = dailyConvo[i];
      var prevMessage = dailyConvo[i - 1];
      
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
  });

  var userStartedAndReceived = {user: userId, started: _started, received: _received}
  return userStartedAndReceived;

}

function getTotalSentReceivedCounts(userStartedAndReceived) {
  totalStarted = 0;
  totalReceived = 0;
  userStartedAndReceived.forEach(data => {
    totalStarted += data.started;
    totalReceived += data.received;
  })

  return { started: totalStarted, received: totalReceived }
}

// setup overall structure for holding user influence objects
var allUserInfluenceData = [];

// ** Get message lengths for each user **

// for each user, get all the DMs they are in
//  for each DM they are in, get a list of all files in that dm
//    read each file, adding up the response times
//    define a response times method that will give a response time
//    after passed in user id and DM id
userIDs.forEach(userID => {
  // get all DMs this user is a part of
  var dms = getUserDms(userID);

  var userInfluences = [];

  var i;
  for (i = 0; i < dms.length; i++) {
    // get the user we're sending messages to
    var otherPersonId = null;
    var convoMembers = dms[i].members;
    for (var j = 0; j < convoMembers.length; j++) {
      if (convoMembers[j] != userID) {
        otherPersonId = convoMembers[j];
      }
    }

    // if otherPersonId is still null, it means the conversation was with yourself
    // so we don't need to count initiated/received convos
    if (otherPersonId == null || otherPersonId == 'USLACKBOT') {
      continue;
    }

    // get sent/received counts on individual-by-individual basis and add other user_id to json object
    var userStartedAndReceived = getInitiatedAndReceivedStats(userID, dms[i].id);

    var initiatedAndReceivedStats = {user: userIDsToName[userID], otherPerson: userIDsToName[otherPersonId], started: userStartedAndReceived.started, received: userStartedAndReceived.received }

    userInfluences.push(initiatedAndReceivedStats);
  }

  // take above counts and get sent and received info
  var totalSentReceivedCounts = getTotalSentReceivedCounts(userInfluences);

  var userInfluenceData = {user: userIDsToName[userID], totalStarted: totalSentReceivedCounts.started, totalReceived: totalSentReceivedCounts.received, convosWithStartedAndReceivedCounts: userInfluences };
  // userInfluenceData
  //
  // {
  //    userID: xxx
  //    totalConversationsInitiated:  xxx
  //    totalConversationsReceived: xxx
  //    convosWithSentReceivedCounts:
  //        [
  //          {
  //             user:        xxx0
  //             otherPerson: xxx1
  //             started:       8
  //             received:      9
  //          },
  //          {
  //             user:        xxx0
  //             otherPerson: xxx2
  //             started:       2
  //             received:      3
  //          },
  //
  //          ...
  //        ] 
  // }
  //

  // data with all the convo information for each user, array of objects above
  allUserInfluenceData.push(userInfluenceData);
});

const fs = require('fs');
var influenceJSON = JSON.stringify(allUserInfluenceData, null, 2);
// fs.writeFileSync('/Users/kevinsun/Desktop/influence.json', influenceJSON);

exports.data = allUserInfluenceData;


// CALCULATE TOTALS


