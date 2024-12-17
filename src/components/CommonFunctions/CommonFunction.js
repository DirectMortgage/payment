import React, { useState } from "react";

const handleAPI = async ({
  name,
  params,
  method,
  body,
  requestOptions = null,
}) => {
  let url = "../../../LoginCredentialsAPI/api/";
  if (window.location.href.indexOf("localhost") != -1) {
    url = "https://www.solutioncenter.biz/LoginCredentialsAPI/api/";
  }
  if (requestOptions) {
    url = `../../../`;
    if (window.location.href.indexOf("localhost") != -1) {
      url = `https://www.solutioncenter.biz/`;
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
    UpdateFlag: FormName === "/DWLandingPage/DisplayColumns" ? 1 : 0,
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
};