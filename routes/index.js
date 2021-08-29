// must require express in every file, even routes
const express = require('express');

// used to set routes. We will export this, then app.js will 
// require this so it can use it directly (with 'use' kewyord) to determine routes
const router = express.Router();

// ////////////////////////////////
// //////// RESPONSE TIMES ////////
// ////////////////////////////////

// const userResponseTimeData = require('../util/response-times');
// const responseTimeData = userResponseTimeData.data;
// console.log(responseTimeData);


// /////////////////////////////////
// //////// CHARACTER COUNT ////////
// /////////////////////////////////

// const userMessageLengthData = require('../util/message-lengths');
// const messageLengthData = userMessageLengthData.data;
// console.log(messageLengthData);

// console.log("Done");

/////////////////////////////////
////////// INFLUENCE ////////////
/////////////////////////////////

// const userInfluences = require('../util/influence');
// const userInfluenceData = userInfluences.data;
// console.log(userInfluenceData);



//////////////////////////////////////////
////////// INFLUENCE BY MONTH ////////////
//////////////////////////////////////////

/// *** To toggle uniqueness go to monthly-influence.js *** ///
// const userInfluenceByMonth = require('../util/monthly-influence');
// const userInfluenceByMonthData = userInfluenceByMonth.data;
// console.log(userInfluenceByMonthData);


///////////////////////////////////////////////
////////// RESPONSE TIMES BY MONTH ////////////
///////////////////////////////////////////////

// const userResponseTimesByMonth = require('../util/monthly-response-times');
// const userResponseTimesByMonthData = userResponseTimesByMonth.data;
// console.log(userResponseTimesByMonthData);


////////////////////////////////////////////////
////////// MESSAGE LENGTHS BY MONTH ////////////
////////////////////////////////////////////////

// const userMessageLengthsByMonth = require('../util/monthly-message-lengths');
// const userMessageLengthsByMonthData = userMessageLengthsByMonth.data;
// console.log(userMessageLengthsByMonthData);


//// ONLY INCLUDING FILE SO IT CAN RUN AND CREATE CSV FILE TO PARSE /////
require('../util/influence-json-to-csv');




////////// ROUTING //////////

// if we have a get request to '/' url, we will deal with it with the arrow function
router.get('/', (req, res, next) => {
  // send back as a response the pug file
  res.render("index", {title: "Home"});
  
});

// expose the blueprint we've created above so app.js can put it into use
exports.routes = router;


