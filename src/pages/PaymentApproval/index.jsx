import { Helmet } from "react-helmet";
import { Button } from "../../components";
import Header from "../../components/Header";
import PaymentManagementSection from "./PaymentManagementSection";
import React, { useEffect, useState, useRef } from "react";
import {
  handleAPI,
  queryStringToObject,
  fnOpenWindow,
  handleSaveWindowSize,
} from "../../components/CommonFunctions/CommonFunction.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClose, faRotate } from "@fortawesome/free-solid-svg-icons";
const { CID: iCompanyId = 4 } = queryStringToObject();

export default function DesktopOnePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const [companyId, setCompanyId] = useState(iCompanyId);
  const [validationResult, setValidationResult] = useState([]),
    [isSaveEnabled, setIsSaveEnabled] = useState(false),
    [processingStatus, setProcessingStatus] = useState([]),
    [notification, setNotification] = useState({
      message: "",
      type: "success",
    });

  const paymentSectionRef = useRef(null);
  let SessionId;
  let queryString = queryStringToObject();
  SessionId = queryString["SessionID"] || queryString["SessionId"];

  const addroe = () => {
    console.log("Ref current:", paymentSectionRef.current); // Debug log
    paymentSectionRef.current.handleAddRow();
  };
  const handleNotification = (message, type = "success", isReset = false) => {
    if (isReset) {
      setNotification({ message: "", type: "" });
    } else {
      setNotification({ message, type });
      setTimeout(() => handleNotification("", "", 1), 3500);
    }
    if (message.includes("Saved Successfully.")) {
      setProcessingStatus((prev) => prev.filter((item) => item !== "Saving"));
    }
  };
  const handleSave = () => {
    if (paymentSectionRef.current) {
      setIsSaveEnabled(false);
      setProcessingStatus((prev) => [...prev, "Saving"]);
      paymentSectionRef.current.handleSave();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fnUpdateWinSize = () => {
    handleSaveWindowSize(SessionId, "/Payment/");
  };

  const fnOpenMenu = () => {
    console.log("Payment Approval History clicked");
    // Add your functionality here
  };
  return (
    <>
      <Helmet>
        <title>Payment Approval and Management | Direct Mortgage Corp</title>
        <meta
          name="description"
          content="Efficiently manage and approve mortgage payments with Direct Mortgage, Corp. Ensure accurate payment splits, track payee history, and handle ACH or check payments securely."
        />
      </Helmet>
      <div className="flex w-full flex-col items-center  bg-white-a700 md:gap-[198px] sm:gap-[132px] pb-[80px]">
        <div className="flex flex-col  self-stretch">
          <Header
            setCompanyId={setCompanyId}
            companyId={companyId}
            SessionId={SessionId}
            setValidationResult={setValidationResult}
          />

          {/* payment management section */}
          <PaymentManagementSection
            ref={paymentSectionRef}
            companyId={companyId}
            validationResult={validationResult}
            setIsSaveEnabled={setIsSaveEnabled}
            handleNotification={handleNotification}
          />
        </div>
        <div className="h-[100px] flex w-full"></div>
        <div className="fixed-footer z-[1000]">
          <div className="mx-auto flex w-full max-w-[1346px] justify-between pl-0 pr-12 md:pl-0 md:pr-5">
            <div className="relative" ref={menuRef}>
              <Button
                className="flex h-[36px] min-w-[78px] flex-row items-center justify-center rounded-lg border border-solid border-indigo-700 bg-indigo-400 px-[19px] text-center font-inter text-[14px] font-bold text-white-a700"
                onClick={() => setIsMenuOpen((prev) => !prev)}
              >
                Menu
              </Button>

              {isMenuOpen && (
                <ul
                  className="absolute bottom-[40px] left-0 w-[300px] rounded-lg border border-gray-200 bg-white shadow-lg z-[1000]"
                  style={{ backgroundColor: "white" }}
                >
                  <li className="cursor-pointer px-4 py-2 hover:bg-gray-100 border-b">
                    <a
                      href="#"
                      onClick={() =>
                        fnOpenWindow(
                          `FeeCollection/Presentation/WebForms/NewPaymentApproval.aspx?SessionID=${SessionId}&CID=${companyId}`,
                          "/FeeCollection/Presentation/Webforms/NewPaymentApproval.aspx",
                          SessionId
                        )
                      }
                    >
                      Old Payment Approval
                    </a>
                  </li>
                  <li className="cursor-pointer px-4 py-2 hover:bg-gray-100 border-b">
                    <a
                      href="#"
                      onClick={async () => {
                        const {
                          VendorPaymentDetailId = "",
                          VendorPaymentId = "",
                        } = await handleAPI({
                          name: "insertRecordForSplit",
                          params: { companyId, empId: queryString["EmpNum"] },
                          apiName: "LoginCredentialsAPI",
                        }).then((response) => {
                          return JSON["parse"](
                            JSON["parse"](response)["Table"][0]["VendorData"]
                          )["VendorData"][0]["PaymentInfo"][0];
                        });

                        fnOpenWindow(
                          // `FeeCollection/Presentation/Webforms/VendorPaymentSplit.aspx?SessionID=${SessionId}&VendorId=1&CID=${companyId}`,
                          `../Payment/SplitPayment?SessionID=${SessionId}&VendorId=0&EmpNum=${queryString["EmpNum"]}&CID=${companyId}&VendorPaymentDetailId=${VendorPaymentDetailId}&VendorPaymentId=${VendorPaymentId}`,
                          "/FeeCollection/Presentation/Webforms/VendorPaymentSplit.aspx",
                          SessionId
                        );
                      }}
                    >
                      Add Payment Split
                    </a>
                  </li>
                  <li className="cursor-pointer px-4 py-2 hover:bg-gray-100 border-b">
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        addroe();
                      }}
                    >
                      Add Payment
                    </a>
                  </li>
                  <li className="cursor-pointer px-4 py-2 hover:bg-gray-100 border-b">
                    <a
                      href="#"
                      onClick={() =>
                        fnOpenWindow(
                          `/NewDMAcct/CustomerVendorOptions.aspx?SessionID=${SessionId}`,
                          "/NewDMAcct/CustomerVendorOptions.aspx",
                          SessionId
                        )
                      }
                    >
                      Search for Vendors and Customers
                    </a>
                  </li>
                  {/* <li className="cursor-pointer px-4 py-2 hover:bg-gray-100 border-b">
            <a href="#" onClick={() => fnOpenMenu(1)}>DM Accounting</a>
          </li> */}
                  <li className="cursor-pointer px-4 py-2 hover:bg-gray-100 border-b">
                    <a href="#" onClick={() => fnOpenMenu(2)}>
                      Run Validation
                    </a>
                  </li>
                  <li className="cursor-pointer px-4 py-2 hover:bg-gray-100 border-b">
                    <a
                      href="#"
                      onClick={() =>
                        fnOpenWindow(
                          `FeeCollection/Presentation/WebForms/BillReminder.aspx?SessionID=${SessionId}&CID=${companyId}`,
                          "FeeCollection\\Presentation\\Webforms\\BillReminder.aspx",
                          SessionId
                        )
                      }
                    >
                      Create a Bill Reminder
                    </a>
                  </li>
                  <li className="cursor-pointer px-4 py-2 hover:bg-gray-100 border-b">
                    <a
                      href="#"
                      onClick={() =>
                        fnOpenWindow(
                          `FeeCollection/Presentation/Webforms/NewPaymentApprovalHistory.aspx?SessionID=${SessionId}&CompNum=${companyId}`,
                          "FeeCollection\\Presentation\\Webforms\\NewPaymentApprovalHistory.aspx",
                          SessionId
                        )
                      }
                    >
                      Payment Approval History
                    </a>
                  </li>
                  <li className="cursor-pointer px-4 py-2 hover:bg-gray-100">
                    <a href="#" onClick={() => fnUpdateWinSize()}>
                      Save Window Size and Position
                    </a>
                  </li>
                </ul>
              )}
            </div>

            <div className="flex flex-row-reverse">
              {notification["message"] && (
                <div
                  className={`flex justify-center self-center mr-2 order-2 p-2 border border-solid rounded-md ${
                    notification["type"] === "success"
                      ? "border-[#7bd231] bg-[#dff0d8]"
                      : "border-[#a94442] bg-[#f2dede]"
                  }`}
                >
                  <span
                    className={`text-center font-inter text-[11px] ${
                      notification["type"] === "success"
                        ? "text-[#7bd231]"
                        : "text-[#a94442]"
                    }`}
                  >
                    {notification["message"]}
                    <FontAwesomeIcon
                      onClick={() => handleNotification("", "", 1)}
                      icon={faClose}
                      className="text-600 ml-2 cursor-pointer text-[13px]"
                    />
                  </span>
                </div>
              )}
              <Button
                disabled={!isSaveEnabled || false}
                className="flex h-[36px] min-w-[74px] flex-row items-center justify-center rounded-lg border border-solid border-indigo-700 bg-indigo-400 px-[19px] text-center font-inter text-[14px] font-bold text-white-a700 button"
                onClick={handleSave}
              >
                {processingStatus.includes("Saving") ? (
                  <>
                    <FontAwesomeIcon
                      icon={faRotate}
                      className="text-sm font-bold mr-2 animate-spin"
                    />
                    Saving...
                  </>
                ) : (
                  <>Save</>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
