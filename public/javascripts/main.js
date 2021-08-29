var $ = require('jquery');

var tabButtons = document.querySelectorAll(".display-container .button-container button");
var tabPanels = document.querySelectorAll(".display-container .tab-content");

function showPanel(panelIndex, colorCode) {
  tabButtons.forEach(function(tab) {
    tab.style.backgroundColor = "";
    tab.style.color = "";
  })

  // tabButtons[panelIndex].style.backgroundColor = colorCode;


  tabPanels.forEach(function(panel) {
    panel.style.display = "none";
  })

  tabPanels[panelIndex].style.display = "block";
  tabPanels[panelIndex].style.backgroundColor = colorCode;
}

showPanel(0, "white");

$("#tab0Button").click(function(){
  showPanel(0, "white");
});

$("#tab1Button").click(function(){
  showPanel(1, "white");
});

$("#tab2Button").click(function(){
  showPanel(2, "white");
});

$("#tab3Button").click(function(){
  showPanel(3, "white");
});