import React, { useState } from "react";

const handleAPI = async ({
  name,
  params,
  method,
  body,
  requestOptions = null,
}) => {
  let url = "";
  if (name === "GetSessionData" || name === "GetSetWindowSize") {
    url = "../../../GenericAPI/api/";
  } else {
    url = "../../../LoginCredentialsAPI/api/";
  }
  if (window.location.href.indexOf("localhost") != -1) {
    if (name === "GetSessionData" || name === "GetSetWindowSize") {
      url = "https://www.solutioncenter.biz/GenericAPI/api/";
    } else {
      url = "https://www.solutioncenter.biz/LoginCredentialsAPI/api/";
    }
  }
  if (requestOptions && name !== "Payment_UploadFilesdocs") {
    url = `../../../`;
    if (window.location.href.indexOf("localhost") != -1) {
      url = `https://www.solutioncenter.biz/LoginCredentialsAPI/api/`;
    }
  }
  params = Object.keys(params)
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  try {
    return fetch(
      `${url}${name}?${params}`,
      requestOptions
        ? requestOptions
        : {
            method: method || "POST",
            mode: "cors",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: body,
          }
    )
      .then(async function (response) {
        let res = await response.json();

        return res;
      })
      .catch(function (err) {
        console.log(`Error from handleAPI ====>  ${name}`);
      });
  } catch (error) {}
};

const fnGetIndex = (obj, key, value) => {
  let index = obj.findIndex((e) => e[key] == value);
  if (value == "Key") index = obj.findIndex((e) => e[key]);
  return index;
};
const queryStringToObject = (queryString) => {
  if (!queryString) queryString = window.location.href;
  queryString = queryString.split("?")[1];
  const params = new URLSearchParams(queryString);
  let result = {};
  for (const [key, value] of params) {
    result[key] = value.replace("#", "");
  }
  result["SessionId"] = result["SessionId"] || result["SessionID"];
  return result;
};
let queryString = queryStringToObject();
const sessionid = queryString["SessionId"];
const uniqueByGridId = (array, key) => {
  const seen = new Set();
  const result = [];

  for (let i = array.length - 1; i >= 0; i--) {
    const item = array[i];
    const keyValue = item[key];

    if (!seen.has(keyValue)) {
      seen.add(keyValue);
      result.push(item);
    }
  }

  // Reverse to maintain the original order
  const uniqueArray = result.reverse();

  return uniqueArray;
};

const handleSaveWindowSize = async (SessionId, FormName) => {
  let { innerWidth, innerHeight, screenX, screenY } = window;
  let viewPosition = {
    Width: innerWidth,
    Height: innerHeight,
    CurrentView: 0,
    Left: screenX,
    Top: screenY,
  };
  var obj = {
    SessionId: SessionId,
    ViewJson: JSON.stringify(viewPosition),
    // UpdateFlag: 0,
    UpdateFlag: FormName === "/Payment/" ? 1 : 0,
    FormID: 0,
    FormName: FormName,
  };
  return await handleAPI({
    name: "GetSetWindowSize", //SaveWindowSize
    params: obj,
  }).then((response) => {
    return JSON.parse(response || "{}");
  });
};
const fnOpenWindow = async (link, FormName, SessionId) => {
  const { SessionId: iSessionId } = queryStringToObject();
  SessionId = SessionId ? SessionId : iSessionId;
  let hostName = "../../../";
  if (window.location?.href?.indexOf("localhost") != -1)
    hostName = "https://www.directcorp.com/";

  link = `${hostName}${link}`;
  let position = await handleSaveWindowSize(SessionId, FormName);
  let Width = position?.Width;
  let Height = position?.Height;
  let Left = position?.Left;
  let Top = position?.Top;

  window.open(
    link,
    "",
    "resizable=yes,top=" +
      Top +
      ",left=" +
      Left +
      ",width=" +
      Width +
      "px,height=" +
      Height +
      "px,resizable=1,scrollbars=yes"
  );
};
function cleanUrl(url) {
  return decodeURIComponent(url)
    .replace(/&amp;apos;/g, "")
    .replace(/&amp;/g, "&")
    .replace(/'/g, "");
}

const handleCheckRights = async (EmpNum, SessionId) => {
  await handleAPI({
    name: "Pages/DirectDefault/GetRightsData;",
    params: { EmpNum, SessionId },
    requestOptions: true,
  }).then((response) => {
    console.log("Rights ==>", response);
    return response;
  });
};

const findIndexByKey = (array, key) => {
  return array.findIndex((item) => item.hasOwnProperty(key));
};

const handleGetSessionData = async (strSessionId, SessVarName) => {
  let obj = { strSessionId, SessVarName };
  let response = await handleAPI({
    name: "GetSessionData",
    params: obj,
  }).then((response) => {
    if (["Output", undefined, null, "", "0"].includes(response))
      handleRedirectLoginPage();
    else return response;
  });
  return response;
};
const handleRedirectLoginPage = () => {
  let hostName = "../../../";
  if (window.parent.location.href.indexOf("localhost") != -1)
    hostName = "https://www.directcorp.com/";
  let url = `${hostName}default.asp?ErrorVal=17`;
  window.parent.location.href = url;
  return;
};
const getCurrentTimeAndDate = () => {
  const today = new Date();

  // Get hours, minutes and AM/PM
  let currHour = today.getHours();
  let currMins = today.getMinutes();
  let strAMPM = "AM";

  if (currHour > 11) strAMPM = "PM";
  if (currHour > 12) currHour -= 12;
  if (currHour === 0) currHour = 12;
  if (currMins < 10) currMins = "0" + currMins;

  const currTime = `${currHour}:${currMins} ${strAMPM}`;

  // Get date
  let currDate = today.getDate();
  if (currDate < 10) currDate = "0" + currDate;

  // Get month
  let currMonth = today.getMonth() + 1; // Months are 0-indexed
  if (currMonth < 10) currMonth = "0" + currMonth;

  const currDay = `${currMonth}/${currDate}/${today
    .getFullYear()
    .toString()
    .substr(2, 2)}`;

  return { currTime, currDay };
};
const formatAsHTML = (notes) => {
  return notes
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
};
const handleShowUploadingStatus = (selector) => {
  document.querySelector('label[for="' + selector + '"] svg').style.display =
    "";
  document.querySelector('label[for="' + selector + '"] span').textContent =
    "Uploading...";
  document
    .querySelector('label[for="' + selector + '"]')
    .classList.remove("primary");
  document.querySelector('label[for="' + selector + '"]').classList.add("dark");
};
const cleanValue = (value = 0) => {
  value = (value ?? "")
    .toString()
    .replaceAll("(", "")
    .replaceAll(")", "")
    .replaceAll("$", "")
    .replaceAll("%", "")
    .replaceAll(",", "");

  return Number(value);
};
const formatDate = (date) => {
  if (date === "" || !date) return "";
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear().toString();

  let [month, day, year] = date.split("/");

  if (!day) {
    day = month;
    month = currentDate.getMonth() + 1;
  }

  const parsedMonth = parseInt(month);
  const parsedDay = parseInt(day);

  const isValidMonth =
    !isNaN(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12;
  const isValidDay = !isNaN(parsedDay) && parsedDay >= 1 && parsedDay <= 31;

  if (!isValidMonth || !isValidDay) {
    const formattedCurrentMonth = (currentDate.getMonth() + 1)
      .toString()
      .padStart(2, "0");
    const formattedCurrentDay = currentDate
      .getDate()
      .toString()
      .padStart(2, "0");
    return `${formattedCurrentMonth}/${formattedCurrentDay}/${currentYear}`;
  }

  if (year && year.length === 2) {
    year = currentYear.slice(0, 2) + year;
  } else if (!year) {
    year = currentYear;
  }

  const formattedMonth = parsedMonth.toString().padStart(2, "0");
  const formattedDay = parsedDay.toString().padStart(2, "0");

  return `${formattedMonth}/${formattedDay}/${year}`;
};
const formatCurrency = (value) => {
  let num = parseFloat(
      (value || "").toString().replace("$", "").replace(",", "")
    )
      ?.toFixed(2)
      .toString(),
    numParts = num.split("."),
    dollars = numParts[0],
    cents = numParts[1] || "",
    sign = num == (num = Math.abs(num));
  dollars = dollars.replace(/\$|\,/g, "");
  if (isNaN(dollars)) dollars = "0";
  dollars = dollars.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  let val = "$" + ((sign ? "" : "-") + dollars + (cents ? "." + cents : ".00"));
  val = val.replaceAll("--", "");
  if (val == "$-0.00") val = "$0.00";
  return val;
};
const FormatValueforCalc = (val) => {
  if (val === "" || val === null || val === undefined) return 0;

  val = val.toString();
  val = val.replace(/\$/g, "").replace(/,/g, "").replace(/%/g, "");

  if (val.includes("(")) {
    // Negative value
    val = val.replace(/\(/g, "").replace(/\)/g, "");
    return -1 * parseFloat(val);
  }

  return parseFloat(val).toFixed(2);
};
const formatSpecialCharacters = (text) => {
  const entitiesMap = {
    "&amp;": "&",
    "amp;": "&",
    "&apos;": "'",
    "&quot;": '"',
    "&lt;": "<",
    "&gt;": ">",
    "&copy;": "©",
    "&reg;": "®",
    "&euro;": "€",
    "&pound;": "£",
    "&yen;": "¥",
    "&cent;": "¢",
    "&sect;": "§",
    "&deg;": "°",
    "&ndash;": "–",
    "- ": "",
    "&mdash;": "—",
    "&trade;": "™",
    "&hellip;": "…",
    "&#169;": "©",
    "&#174;": "®",
  };

  // Replace HTML entities using the map
  let formattedText = text.replace(
    /&[a-zA-Z#0-9]+;/g,
    (entity) => entitiesMap[entity] || entity
  );

  // Replace \n with <br> tags for HTML, or leave as newlines for plain text
  formattedText = formattedText
    .replace(/\n/g, "<br>")
    .replaceAll("amp;", "&")
    .replace(/•/g, "•&nbsp;&nbsp;"); // For HTML display

  return formattedText;
};
export {
  handleAPI,
  fnGetIndex,
  queryStringToObject,
  uniqueByGridId,
  getCurrentTimeAndDate,
  handleCheckRights,
  findIndexByKey,
  handleSaveWindowSize,
  handleGetSessionData,
  cleanUrl,
  formatAsHTML,
  fnOpenWindow,
  handleShowUploadingStatus,
  cleanValue,
  formatCurrency,
  FormatValueforCalc,
  formatSpecialCharacters,
  formatDate,
};
