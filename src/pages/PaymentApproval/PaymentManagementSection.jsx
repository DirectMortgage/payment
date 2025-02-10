import {
  Img,
  Text,
  Button,
  SelectBox,
  Heading,
  Checkbox,
} from "../../components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencil, faRotate } from "@fortawesome/free-solid-svg-icons";
import uploadPdfImage from "../../components/Images/upload-pdf.png";
import OpenPdfImage from "../../components/Images/open_in_new.png";
import PrintIcon from "../../components/Images/Print-Icon.png";
import "primereact/resources/themes/lara-light-blue/theme.css"; // PrimeReact Theme
import {
  handleAPI,
  queryStringToObject,
  handleGetSessionData,
  fnOpenWindow,
  formatCurrency,
  FormatValueforCalc,
  formatSpecialCharacters,
  cleanValue,
} from "../../components/CommonFunctions/CommonFunction.js";
import {
  FileUpload,
  Spinner,
} from "../../components/CommonFunctions/Accessories";
import React, {
  useEffect,
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
  useMemo,
} from "react";
import Table from "../../components/Table/Table.js";
import { Dialog } from "primereact/dialog";
import "react-datepicker/dist/react-datepicker.css";
import { Image } from "primereact/image";

let SessionId;

const PaymentManagementSection = forwardRef(
  (
    {
      companyId,
      validationResult,
      setIsSaveEnabled,
      handleNotification = () => {},
    },
    ref
  ) => {
    const [rowData, setRowData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [glAccounts, setGLAccounts] = useState([]);
    const [Class, setClass] = useState([]);
    const [expandedRows, setExpandedRows] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [dropDownOptions, setDropDownOptions] = useState([]);
    const [editingRows, setEditingRows] = useState({});
    const [totalSubTotal, setTotalSubTotal] = useState(0);
    const [markPaid, setmarkPaid] = useState("");
    const [markedCount, setSelectedCount] = useState(0);
    const [showPaymentSection, setShowPaymentSection] = useState(false);
    const [showSecondRow, setShowSecondRow] = useState(false);
    const [showThirdRow, setShowThirdRow] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState(null);

    const [selectedBank, setSelectedBank] = useState({});
    const [selectedPrintOrder, setSelectedPrintOrder] = useState("0");
    const [checknumber, setChecknumber] = useState("");
    const [printOrder, setPrintOrder] = useState([
      { label: "Back to Front", value: "2" },
      { label: "Front to Back", value: "1" },
    ]);
    const [printSuccess, setIsPrintSuccess] = useState(0);
    const [isLoadingGo, setIsLoadingGo] = useState(false);
    const [isLoadingSave, setIsLoadingSave] = useState(false);
    const [isButtonEnabled, setIsButtonEnabled] = useState(false);
    const tableRef = useRef(null);
    let queryString = queryStringToObject();
    const [EmpId, SetEmpID] = useState("0");
    const empIdRef = useRef(EmpId);

    const isSaveEnabled = useMemo(() => {
      return (
        rowData.length > 0 &&
        rowData.filter(({ Change = 0 }) => Number(Change)).length > 0
      );
    }, [rowData]);

    useEffect(() => {
      setIsSaveEnabled(isSaveEnabled);
    }, [isSaveEnabled]);

    useImperativeHandle(ref, () => ({
      handleAddRow: () => {
        console.log("Table ref:", tableRef.current); // Debug log
        tableRef.current.addRow();
      },
      handleSave: () => {
        tableRef.current.savevendorPayment();
      },
      isSaveEnabled,
    }));
    //let FromPipeline = queryString["FromPipeline"];
    SessionId = queryString["SessionID"];
    useEffect(() => {
      empIdRef.current = EmpId;
      if (EmpId) {
        handleAPI({
          name: "GetUserDetails_Payment",
          method: "GET",
          params: { empId: EmpId },
        }).then((response) => {
          response = JSON.parse(response)["Table"] || [];
          const [{ CheckPrintOrder = 2 }] = response;
          setSelectedPrintOrder(CheckPrintOrder);
        });
      }
    }, [EmpId]);

    useEffect(() => {
      const fetchData = async () => {
        let fetchedEmpNum = queryString["EmpNum"] || "0";

        if (fetchedEmpNum === "0") {
          // fetchedEmpNum =
        }
        await handleGetSessionData(SessionId, "empnum");

        SetEmpID(fetchedEmpNum);

        await GetVendorPaymentApprovalData(companyId, fetchedEmpNum);
      };

      fetchData();
    }, [companyId]);

    const handleRemovePaymentRowData = async ({ VendorPaymentId }) => {
      setRowData((prevRowData) =>
        prevRowData.filter((item) => item.VendorPaymentId != VendorPaymentId)
      );
    };

    const handleGetPaymentRowData = async ({ VendorPaymentId }) => {
      handleAPI({
        name: "VendorMonthlyPaymentByPaymentId",
        params: { VendorPaymentId, companyId },
      }).then((response) => {
        let rRowData = processPaymentInfo(JSON.parse(response)["Table"] || []);
        rRowData = JSON.parse(rRowData).map((item) => {
          if ((item["GLAccount"] || "").startsWith("0-")) {
            item["GLAccount"] = (item["GLAccount"] || "")
              ?.toString()
              ?.replace("0-", "")
              .trim();
          }
          item["Account_Id"] = Number(
            ((item["GLAccount"] || "")?.split("-")[0] || "")?.trim() || 0
          );
          return item;
        });
        setRowData((prevData) => {
          const iPrevData = prevData.map((item) => {
            const row = rRowData.find((row) => item["RowId"] == row["RowId"]);
            if (row) {
              const rdoACH = document.getElementById(
                  `chkACHApproved${item.RowId}`
                ),
                rdoCheck = document.getElementById(
                  `chkPrintChecks${item.RowId}`
                );
              if (rdoACH) row.PayACH = rdoACH.checked;
              if (rdoCheck) row.PayCheck = rdoCheck.checked;

              if (
                item["FileCount"] != row["FileCount"] ||
                item["allFileCount"] != row["allFileCount"]
              ) {
                item["FileCount"] = row["FileCount"];
                item["allFileCount"] = row["allFileCount"];
                item["LinkId"] = row["LinkId"];
                item["Change"] = 1;
              } else item = { ...row, ...item, Change: 1 };
            }
            return item;
          });
          return [...iPrevData];
        });
      });
    };

    const { iSelectedCount, iMarkPaid } = useMemo(() => {
      const selectedRow = rowData.filter(
        ({ PayACH, PayCheck }) => PayCheck || PayACH
      );
      if (selectedRow.length > 0) {
        const selectedAmount = [
          ...new Set(selectedRow.map(({ TotalAmount }) => TotalAmount)),
        ];

        return {
          iMarkPaid: selectedAmount.reduce(
            (acc, item) => acc + cleanValue(item),
            0
          ),
          iSelectedCount: selectedAmount.length,
        };
      } else {
        return { iMarkPaid: 0, iSelectedCount: 0 };
      }
    }, [rowData]);

    const GetVendorPaymentApprovalData = async (
      CompanyId,
      UserId,
      isOnload = true
    ) => {
      if (isOnload) {
        setIsLoading(true); // Set loading when starting the request
        setRowData([]);
        setmarkPaid("");
        setSelectedCount(0);

        setShowPaymentSection(false);
        setShowSecondRow(false);
        setShowThirdRow(false);
        setPaymentMethod(null);
        setSelectedBank({
          value: CompanyId == "4" ? "8" : CompanyId == "2" ? "2" : "0",
        });
        setSelectedPrintOrder("0");
        setChecknumber("");
        //setPrintOrder('0');
        setIsPrintSuccess(0);
      } else {
        setmarkPaid("");
        setSelectedCount(0);
        setShowPaymentSection(false);
        setShowSecondRow(false);
        setShowThirdRow(false);
        setPaymentMethod(null);
        setSelectedBank({
          value: CompanyId == "4" ? "8" : CompanyId == "2" ? "2" : "0",
        });
        setSelectedPrintOrder("0");
        setChecknumber("");
        //setPrintOrder('0');
        setIsPrintSuccess(0);
      }
      let obj = {
        CompanyId: CompanyId,
        UserId: UserId,
      };

      try {
        const response = await handleAPI({
          name: "GetVendorPaymentApprovalData",
          params: obj,
        });

        if (
          (!response || response.trim() === "{}" || response.trim() === "[]") &&
          isOnload
        ) {
          setRowData([]);
        } else {
          const parsedResponse = JSON.parse(response);
          let responseJson = parsedResponse?.Table?.[0]?.VendorPayment || "";

          if (responseJson) {
            responseJson = JSON.parse(responseJson);
            const processedData = processPaymentInfo(
              responseJson.VendorPayment[0]?.PaymentInfo || []
            );
            const htmlString = responseJson.VendorPayment[7].BankDetails;
            const vendors = responseJson.VendorPayment[1].Vendors;
            const dropDownOptions = formatDropdownOptions(htmlString);
            setDropDownOptions(dropDownOptions);

            if (companyId == "4") {
              setSelectedBank(
                dropDownOptions.find((option) => option.value === "8")
              );
              const dropdownList = dropDownOptions.find(
                (option) => option.value === "8"
              );
              setChecknumber(dropdownList.checkNum);
            }
            if (companyId == "2") {
              setSelectedBank(
                dropDownOptions.find((option) => option.value === "2")
              );
              const dropdownList = dropDownOptions.find(
                (option) => option.value === "2"
              );
              setChecknumber(dropdownList.checkNum);
            }
            setVendors(
              JSON["parse"](formatSpecialCharacters(JSON["stringify"](vendors)))
            );
            setClass(responseJson.VendorPayment[5].Class);
            setGLAccounts(responseJson.VendorPayment[6].Accounts);
            const iRowData = JSON.parse(processedData).map((item) => {
              if ((item["GLAccount"] || "").startsWith("0-")) {
                item["GLAccount"] = (item["GLAccount"] || "")
                  ?.toString()
                  ?.replace("0-", "")
                  .trim();
              }
              item["Account_Id"] = Number(
                ((item["GLAccount"] || "")?.split("-")[0] || "")?.trim() || 0
              );
              return item;
            });
            setRowData(iRowData);
            //console.log(iRowData);
            calculateTotalSubTotal(JSON.parse(processedData));
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setRowData([]); // Set empty array on error
      } finally {
        setIsLoading(false); // Always turn off loading when done
      }
    };
    const InsertVendorInfo = async (SessionId, VendorId) => {
      let obj = {
        SessionId: SessionId,
        VendorId: VendorId,
      };

      try {
        const response = await handleAPI({
          name: "InsertVendorInfo",
          params: obj,
        });
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
      }
    };
    const calculateTotalSubTotal = (processedData) => {
      const total = processedData.reduce((accumulator, row) => {
        const subtotal = FormatValueforCalc(row.SubTotal);
        return accumulator + (parseFloat(subtotal) || 0); // Ensure SubTotal is a number
      }, 0);

      setTotalSubTotal(total);
    };
    const processPaymentInfo = (paymentInfo) => {
      const rowData = paymentInfo.map((full) => {
        const Entity_Name = full.Entity_Name.replace(/&amp;/g, "&").replace(
          /amp;/g,
          ""
        );
        const strStatus = `${full.pStatus} Added By: ${full.AddedBy} Added On: ${full.AddedOn}`;

        return {
          Payee: Entity_Name,
          TotalAmount: full.TotalAmount,
          GLAccount: `${full.AccountId}-${full.Account_Name}`,
          ClassName: full.Class_Name,
          SubTotal: full.Amount,
          Invoice: full.RefNo,
          Memo: full.Memo,
          Images: "",
          InvoiceDate: full.InvoiceDate,
          InvoiceDue: full.InvoiceDue,
          Payon: full.Payon,
          Status: `${full.Status} `,
          ChangeLog: "",
          Delete: "",
          RowId: full.RowId,
          VendorPaymentId: full.VendorPaymentId,
          VendorPaymentDetailId: full.VendorPaymentDetailId,
          PayCheck: "",
          VendorId: full.VendorId,
          VendorStatusMsg: full.VendorStatusMsg,
          VendorApproved: full.VendorApproved,
          VendorStatus: full.VendorStatus,
          AccountingVendorStatusMsg: full.AccountingVendorStatusMsg,
          VendorErrMsg: full.VendorErrMsg,
          ContactFileId: full.ContactFileId,
          OtherId: full.OtherId,
          AccountId: full.Account_Id,
          TermsDays: full.TermsDays,
          AccountName: full.Account_Name,
          Reviewed: full.Reviewed,
          EntityType: full.EntityType,
          LastPaidDetails: full.LastPaidDetails.replace(
            "Amount",
            "<br/> Amount"
          ),
          EntityAddress: full.EntityAddress,
          FileExists: full.FileExists,
          FileCount: full.FileCount,
          allFileCount: full.allFileCount,
          LinkId: full.LinkId,
          FulfillmentURL: full.FulfillmentURL,
          Class: full.Class,
          ServiceRequestId: full.ServiceRequestId,
          ACHApproved: full.ACHApproved,
          AddedBy: full.AddedBy,
          AccountFormId: full.AccountFormId,
          AcctFormType: full.AcctFormType,
          BillPaymentId: full.BillPaymentId,
          AddedOn: full.AddedOn,
          pStatus: full.pStatus,
          AppraisalURL: full.AppraisalURL,
          ACHApprovedDetail: full.ACHApprovedDetail,
          imagesHeader: "Upload",
        };
      });

      return JSON.stringify(rowData);
    };
    const createNewRow = () => {
      return {
        Payee: "", // Empty string for Payee
        TotalAmount: "", // Empty string for TotalAmount
        GLAccount: "", // Empty string for GLAccount
        ClassName: "", // Empty string for ClassName
        SubTotal: "", // Empty string for SubTotal
        Invoice: "", // Empty string for Invoice
        Memo: "", // Empty string for Memo
        Images: "", // Empty string for Images
        InvoiceDate: "", // Empty string for InvoiceDate
        InvoiceDue: "", // Empty string for InvoiceDue
        Payon: "", // Empty string for Payon
        Status: "", // Empty string for Status
        RowId: Date.now(), // Generate a unique RowId based on timestamp
        VendorPaymentId: Date.now(), // Empty string for VendorPaymentId
        VendorPaymentDetailId: "", // Empty string for VendorPaymentDetailId
        imagesHeader: "Upload",
        // Add other fields as empty or default values
      };
    };
    const handleAllImageClick = ({
      VendorPaymentDetailId,
      VendorPaymentId,
      RowId,
      VendorId,
    }) => {
      let URL =
        "../../../FeeCollection/Presentation/Webforms/VendorPaymentDetailDocuments.aspx?VendorPaymentDetailId=" +
        VendorPaymentDetailId +
        "&SessionId=" +
        SessionId +
        "&CompanyId=" +
        (companyId || 4) +
        "&VendorPaymentId=" +
        VendorPaymentId +
        "&EntityID=" +
        VendorId +
        "&RowId=" +
        RowId;

      if (window.location.host.includes("localhost")) {
        URL = URL.replace("../../../", "https://www.directcorp.com/");
      }
      window.open(
        URL,
        "",
        "width=1200,height=1200,resizable=yes,scrollbars=yes"
      );
    };

    const handleImageClick = (LinkId, RowId) => {
      // Handle the click event here
      let URL =
        "../../../NewDMAcct/GetUploadedImage.aspx?CompanyId=" +
        (companyId || 4) +
        "&LinkId=" +
        LinkId;

      if (window.location.host.includes("localhost")) {
        URL = URL.replace("../../../", "https://www.directcorp.com/");
      }
      window.open(
        URL,
        "",
        "width=1200,height=1200,resizable=yes,scrollbars=yes"
      );
    };
    const [dialogDetails, setDialogDetails] = useState({
      isShow: false,
      title: "",
      message: "",
    });
    const [alertDetails, setAlertDetails] = useState({
      isShow: false,
      title: "",
      message: "",
    });
    const handleRemove = async (rowId) => {
      const { Payee } = rowData.find((row) => row.RowId === rowId);

      setDialogDetails({
        isShow: true,
        title: "Confirmation",
        message: (
          <>
            Are you sure you want to delete the payment record for{" "}
            <b>{Payee}</b>?
          </>
        ),
        rowId,
      });
    };
    const handleRemoveWithConfirmation = async (rowId) => {
      let updatedData = {};
      setRowData((prevRowData) => {
        const recordToRemoveParent = prevRowData.find(
          (row) => row.RowId === rowId
        );

        if (recordToRemoveParent) {
          const { VendorPaymentId } = recordToRemoveParent;

          updatedData = prevRowData.filter(
            (row) => row.VendorPaymentId !== VendorPaymentId
          );
          const recordToRemove = prevRowData.filter(
            (row) => row.VendorPaymentId === VendorPaymentId
          );

          setExpandedRows((prev) =>
            prev.filter((item) => item.RowId === rowId)
          );

          recordToRemove.forEach(
            ({ VendorPaymentId, VendorPaymentDetailId }) => {
              handleAPI({
                name: "DeleteVendorMonthlyRecords",
                params: { VendorPaymentId, VendorPaymentDetailId },
              }).then((response) => {
                //console.log({ VendorPaymentId, VendorPaymentDetailId, response });
              });
            }
          );

          setEditingRows((prev) => {
            delete prev[rowId];
            return prev;
          });
        } else {
          console.error("Record with the given RowId not found");
        }
        return [...updatedData];
      });
    };
    function formatDropdownOptions(htmlString) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlString, "text/html");
      const options = doc.getElementsByTagName("option");

      return Array.from(options).map((option) => ({
        label: option.textContent,
        value: option.getAttribute("value"),
        checkNum: option.getAttribute("CheckNum"),
        selected: option.getAttribute("Selected") === "Selected",
      }));
    }
    const onFileDrop = ({
      files,
      documentDetail,
      target,
      vendorPaymentId,
      vendorPaymentDetailId,
      spinner,
      headerText,
      RowId,
      FileCount,
    }) => {
      const currentEmpId = empIdRef.current;
      if (files.length) {
        let details = {
            LoanId: currentEmpId,
            DocTypeId: vendorPaymentId,
            sessionid: SessionId,
            viewtype: 23,
            category: vendorPaymentDetailId,
            description: "",
            usedoc: 1,
            entityid: 0,
            entitytypeid: 0,
            uploadsource: currentEmpId,
            conditonid: 0,
          },
          index = 1;

        //return

        files.forEach(async (file) => {
          let formData = new FormData();
          formData.append("", file);

          let requestOptions = {
            method: "POST",
            body: formData,
            redirect: "follow",
          };

          await handleAPI({
            name: "Payment_UploadFilesdocs",
            params: details || {},
            requestOptions: requestOptions,
          })
            .then((ScanDocId) => {
              if (ScanDocId) {
                setTimeout(() => {
                  if (spinner && headerText) {
                    spinner.style.display = "none";
                    headerText.textContent = "Uploaded";
                    setTimeout(() => {
                      headerText.textContent = "Upload";
                    }, 300);
                  }
                }, 500);
                if (index === files.length) {
                  handleGetPaymentRowData({ VendorPaymentId: vendorPaymentId });
                }
              }
              index++;
            })
            .catch((e) =>
              console.error("Error form UploadFilesdocs ====> ", e)
            );
        });
      }
    };
    const [viewAllPDFStatus, setViewAllPDFStatus] = useState([]);
    const handleViewAllPDF = async () => {
      setViewAllPDFStatus(["loading"]);

      let selectedRow = rowData.filter(
        ({ PayCheck, PayACH }) => PayCheck || PayACH
      );
      if (selectedRow.length === 0) selectedRow = rowData;

      const linkIds = [
        ...new Set(
          await Promise.all(
            selectedRow
              .map(
                async ({
                  allFileCount = 0,
                  LinkId = "",
                  VendorPaymentDetailId,
                }) => {
                  if (allFileCount > 1) {
                    const multipleLinkId = await handleAPI({
                      name: "vendorPaymentGetScannedDocument",
                      params: { VendorPaymentDetailId, companyId },
                      method: "GET",
                    });
                    return [
                      ...new Set(
                        JSON.parse(multipleLinkId)
                          ["AccDocs"].filter(
                            ({ Usedoc }) => Number(Usedoc) === 1
                          )
                          .map(({ LinkId }) => LinkId)
                      ),
                    ];
                  }
                  return LinkId;
                }
              )
              .flatMap((_) => _)
          )
        ),
      ]
        .filter((_) => _)
        .join(",");

      handleAPI({
        name: "getMergedInvoice",
        params: { linkIds },
        apiName: "LoginCredentialsAPI",
        method: "GET",
      }).then((url) => {
        if (window.location.host.includes("localhost")) {
          url = url.replace("../../../", "https://www.directcorp.com/");
        }
        setTimeout(() => {
          window.open(
            url,
            "_blank",
            "width=1200,height=1200,resizable=yes,scrollbars=yes"
          );
        }, 500);
        setViewAllPDFStatus([]);
      });
    };
    const handleCheckboxChange = (event) => {
      setIsPrintSuccess(event.target.checked ? 1 : 0); // `checked` will be true or false
    };
    const handleTriggerPayee = (selector) => {
      const element = document.getElementById("payee_" + selector);
      if (element) {
        element.click();
      } else {
        setTimeout(() => {
          handleTriggerPayee(selector);
        }, 100);
      }
    };
    useEffect(() => {
      if (rowData.length > 0) {
        const editing = rowData.reduce((acc, item) => {
          if (item.VendorId === 0) {
            acc[item.RowId] = ["Payee"];
            handleTriggerPayee(item.RowId);
          }
          return acc;
        }, {});

        setEditingRows((prevState) => ({
          ...(prevState || {}),
          ...(editing || {}),
        }));
      }
    }, [rowData.length]);

    const iColumns = [
      {
        field: "Payee",
        editable: editingRows[rowData.RowId]?.includes("Payee") || false,
        //editor: (options) => options.editorCallback(options.value), // Add this line
        "data-field": "Payee",
        bodyClassName: "empty-row",
        header: () => (
          <Text
            size="textmd"
            as="p"
            className="pb-0.5 pl-4 pt-2.5 text-left text-[14px] font-normal leading-[18px] text-black-900"
          >
            <span>
              <>
                Payee
                <br />
              </>
            </span>
            <span className="text-[10px]">(pay history)</span>
          </Text>
        ),
        style: {
          width: "192px",
          padding: "0.5rem",
          whiteSpace: "normal",
          wordWrap: "break-word",
        },
        body: (rowData) => {
          const formattedText = rowData?.LastPaidDetails
            ? rowData.LastPaidDetails.replace(/<b>/g, "").replace(/<\/b>/g, "")
            : "";
          const handlePayeeClick = (VendorId, rowData, rowIndex) => {
            console.log({ rowData });

            setEditingRows((prevState) => ({
              ...prevState,
              [rowIndex]: (prevState[rowIndex] || [])?.filter(
                (field) => field !== "Payee"
              ),
            }));
            InsertVendorInfo(SessionId, VendorId);

            fnOpenWindow(
              `/NewDMAcct/CustomerVendorOptions.aspx?SessionID=${SessionId}&VendorPaymentId=${rowData.VendorPaymentId}`,
              "/NewDMAcct/CustomerVendorOptions.aspx",
              SessionId
            );
          };
          const handleEditClick = (e, rowData, rowIndex) => {
            setEditingRows((prevState) => ({
              ...prevState,
              [rowIndex]: [...(prevState[rowIndex] || []), "Payee"],
            }));
          };

          return (
            <div
              className={`flex flex-col items-start justify-center h-full px-4`}
            >
              <Heading
                size="headingmd"
                as="h1"
                className="text-[14px] font-semibold text-indigo-700"
              >
                <span
                  onClick={(e) =>
                    handlePayeeClick(rowData.VendorId, rowData, rowData.RowId)
                  }
                  data-tooltip-id="tooltip"
                  data-tooltip-html={rowData["EntityAddress"]}
                  className="cursor-pointer hover:underline"
                >
                  {rowData.Payee}
                </span>
                <div
                  className="cursor-pointer inline-flex p-[3px]"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if ([32, 13].includes(e.keyCode)) {
                      e.preventDefault();
                      handleTriggerPayee(rowData.RowId);
                    }
                  }}
                  id={"payee_" + rowData.RowId}
                  onClick={(e) => handleEditClick(e, rowData, rowData.RowId)}
                >
                  <FontAwesomeIcon
                    icon={faPencil}
                    className="ml-1 text-[10px] text-gray-600 cursor-pointer"
                  />
                </div>
              </Heading>
              <div
                className="text-[10px] font-normal text-black-900"
                dangerouslySetInnerHTML={{ __html: formattedText }}
              />
            </div>
          );
        },
      },
      {
        field: "TotalAmount",
        "data-field": "TotalAmount",
        sortable: true,
        editable: true,
        header: () => (
          <Text
            size="textmd"
            as="p"
            className="py-3.5 text-left text-[14px] font-normal text-black-900"
          >
            Total
          </Text>
        ),
        style: {
          width: "86px",
          padding: "0.5rem",
          whiteSpace: "normal",
          wordWrap: "break-word",
        },
        body: (rowData) => (
          <Text as="p" className="text-[14px] font-normal text-black-900">
            {formatCurrency(rowData.TotalAmount)}
          </Text>
        ),
        sortFunction: (event) => {
          const { data, field, order } = event;

          const sortedData = [...data].sort((a, b) => {
            const valueA = parseFloat(a[field]?.replace(/[^0-9.-]+/g, "")) || 0;
            const valueB = parseFloat(b[field]?.replace(/[^0-9.-]+/g, "")) || 0;

            // Multiply with "order" to handle ascending/descending
            return order * (valueA - valueB);
          });

          // Return the sorted data
          return sortedData;
        },
      },
      {
        field: "GLAccount",
        "data-field": "GLAccount",
        editable: true,
        header: () => (
          <Text
            size="textmd"
            as="p"
            className="py-3.5 text-left text-[14px] font-normal text-black-900"
          >
            G/L Account
          </Text>
        ),
        style: {
          width: "156px",
          padding: "0.5rem",
          whiteSpace: "normal",
          wordWrap: "break-word",
        },
        body: (rowData) => (
          <Text
            size="textmd"
            as="p"
            className="text-[14px] font-normal text-black-900"
          >
            {rowData.GLAccount}
          </Text>
        ),
      },
      {
        field: "ClassName",
        "data-field": "ClassName",
        editable: true,
        header: () => (
          <Text
            size="textmd"
            as="p"
            className="pb-3 pt-4 text-left text-[14px] font-normal text-black-900"
          >
            Department
          </Text>
        ),
        style: {
          width: "150px",
          padding: "0.5rem",
          whiteSpace: "normal",
          wordWrap: "break-word",
        },
        body: (rowData) => (
          <Text
            size="textmd"
            as="p"
            className="text-[14px] font-normal text-black-900"
          >
            {rowData.ClassName}
          </Text>
        ),
      },
      {
        field: "InvoiceDate",
        "data-field": "InvoiceDate",
        editable: true,
        sortable: true,
        header: () => (
          <Text
            size="textmd"
            as="p"
            className="py-3.5 text-left text-[14px] font-normal text-black-900"
          >
            Invoice Date
          </Text>
        ),
        style: {
          width: "90px",
          padding: "0.5rem",
          whiteSpace: "normal",
          wordWrap: "break-word",
        },
        body: (rowData) => (
          <Text
            size="textmd"
            as="p"
            className="text-[14px] font-normal text-black-900"
          >
            {rowData.InvoiceDate}
          </Text>
        ),
      },
      {
        field: "Invoice",
        "data-field": "Invoice",
        editable: true,
        header: () => (
          <Text
            size="textmd"
            as="p"
            className="py-3.5 pl-1 text-left text-[14px] font-normal text-black-900"
          >
            Invoice #
          </Text>
        ),
        style: {
          width: "96px",
          padding: "0.5rem",
          whiteSpace: "normal",
          wordWrap: "break-word",
        },
        bodyClassName: ({ VendorPaymentId, RowId }) => {
          const isHighlighted = validationResult.some(
            (item) =>
              parseInt(item.vendorPaymentId) === parseInt(VendorPaymentId) &&
              parseInt(item.rowId) === parseInt(RowId)
          );

          return isHighlighted ? "bg-[#FFFF66]" : "";
        },
        body: (rowData) => {
          const bodyStyle = {
            padding: "0.5rem",
            whiteSpace: "normal",
          };
          return (
            <Text
              size="textmd"
              as="p"
              className="text-[14px] font-normal text-black-900"
              style={bodyStyle}
            >
              {rowData.Invoice}
            </Text>
          );
        },
      },
      {
        field: "Memo",
        "data-field": "Memo",
        editable: true,
        header: () => (
          <Text
            size="textmd"
            as="p"
            className="py-3.5 text-left text-[14px] font-normal text-black-900"
          >
            Memo
          </Text>
        ),
        style: {
          width: "120px",
          padding: "0.5rem",
          whiteSpace: "normal",
          wordWrap: "break-word",
        },
        bodyClassName: ({ VendorPaymentId, RowId }) => {
          const isHighlighted = validationResult.some(
            (item) =>
              parseInt(item.vendorPaymentId) === parseInt(VendorPaymentId) &&
              parseInt(item.rowId) === parseInt(RowId)
          );

          return isHighlighted ? "bg-[#FFFF66]" : "";
        },
        body: (rowData) => {
          const bodyStyle = {
            padding: "0.5rem",
            whiteSpace: "normal",
          };

          return (
            <Text
              size="textxs"
              as="p"
              className="text-[14px] font-normal text-black-900"
              style={bodyStyle}
            >
              {rowData.Memo}
            </Text>
          );
        },
      },

      {
        field: "imagesHeader",
        "data-field": "imagesHeader",
        bodyClassName: "empty-row",
        editable: false,
        header: () => (
          <Text
            size="textmd"
            as="p"
            className="pb-3 pt-4 text-left text-[14px] font-normal text-black-900"
          >
            Images
          </Text>
        ),
        style: { width: "100px", minWidth: "80px" },
        body: (rowData) => (
          <FileUpload
            id={`file-upload-${rowData?.RowId}`} // _${rowData.Scandoctype}_${rowData.ID}
            style={{
              fontSize: 12,
              display: "block",
            }}
            className="primary"
            text={
              <div
                id={`spinner-container-${rowData.RowId}`}
                className="flex justify-center rounded border border-dashed border-indigo-700 bg-indigo-400_33"
              >
                <Heading
                  id={`header-text-${rowData.RowId}`}
                  as="h2"
                  className="self-end text-[12px] font-semibold text-black-900"
                >
                  {rowData.imagesHeader || "Upload File"}
                </Heading>
                <FontAwesomeIcon
                  id={`spinner-${rowData.RowId}`}
                  icon={faRotate}
                  className="spinner"
                  color="#508BC9"
                  style={{
                    fontSize: 12,
                    marginLeft: 5,
                    marginTop: 3,
                    display: "none", // Hidden by default
                  }}
                />
              </div>
            }
            index={rowData.index}
            onChange={(event) => {
              // Show spinner and "Uploading..." message

              // setRowData((prevData) =>
              //   prevData.map((row) =>
              //     row.RowId === rowData.RowId ? { ...row, FileCount: 1 } : row
              //   )
              // );

              const spinner = document.getElementById(
                `spinner-${rowData.RowId}`
              );
              const headerText = document.getElementById(
                `header-text-${rowData.RowId}`
              );
              if (spinner && headerText) {
                spinner.style.display = "inline";
                headerText.textContent = "Uploading...";
              }

              const { target } = event;

              // Simulate the file upload
              onFileDrop({
                files: Array.from(target.files),
                documentDetail: rowData.oRequiredDetail,
                target: "viewDocument_" + rowData.ID,
                vendorPaymentId: rowData.VendorPaymentId,
                vendorPaymentDetailId: rowData.VendorPaymentDetailId,
                spinner,
                headerText,
                RowId: rowData.RowId,
                FileCount: rowData.FileCount,
              });

              // Clear the input
              event.target.value = "";
            }}
          />
        ),
      },
      {
        field: "image",
        "data-field": "image",
        bodyClassName: "empty-row",
        editable: false,
        header: () => (
          <span
            onClick={handleViewAllPDF}
            className="cursor-pointer hover:underline flex text-center text-[12px] font-semibold text-indigo-700"
          >
            View All PDF
            {viewAllPDFStatus.includes("loading") && (
              <span className="ml-1">
                <Spinner size="xxs" />
              </span>
            )}
          </span>
        ),
        style: { width: "90px" },
        body: (rowData) => {
          return rowData.allFileCount > 0 || rowData.FileCount > 0 ? (
            <div className="flex gap-2 justify-center items-center">
              {(rowData.FileCount === 0 && rowData.allFileCount > 0) ||
              rowData.allFileCount > 1 ? (
                <Image
                  src={OpenPdfImage}
                  alt="Open Image"
                  onKeyDown={(e) => {
                    if ([32, 13].includes(e.keyCode)) {
                      e.preventDefault();
                      handleAllImageClick(rowData);
                    }
                  }}
                  tabIndex={0}
                  className="w-6 h-6 object-contain cursor-pointer"
                  onClick={() => handleAllImageClick(rowData)}
                />
              ) : (
                rowData.FileCount === 1 && (
                  <Image
                    src={uploadPdfImage}
                    alt="Upload"
                    className="w-6 h-6 object-contain cursor-pointer"
                    onKeyDown={(e) => {
                      if ([32, 13].includes(e.keyCode)) {
                        e.preventDefault();
                        handleImageClick(rowData.LinkId, rowData.RowId);
                      }
                    }}
                    tabIndex={0}
                    onClick={() =>
                      handleImageClick(rowData.LinkId, rowData.RowId)
                    }
                  />
                )
              )}
            </div>
          ) : (
            <span></span>
          );
        },
      },
      {
        field: "paymentMethodHeader",
        "data-field": "paymentMethodHeader",
        bodyClassName: "empty-row",
        editable: false,
        header: () => (
          <Text
            size="textmd"
            as="p"
            className="pb-3 pt-4 text-left text-[14px] font-normal text-black-900"
          >
            Payment Method
          </Text>
        ),
        style: { width: "110px" },
      },
      {
        field: "MarkPaid",
        "data-field": "MarkPaid",
        editable: false,
        header: () => (
          <Text
            size="textmd"
            as="p"
            className="py-3.5 text-left text-[14px] font-normal text-black-900"
          >
            Paid
          </Text>
        ),
        style: { width: "44px" },
        body: (rowData) => (
          <div className="flex">
            <Checkbox
              //tabIndex={0}
              label=""
              name="item"
              id={`chkMarkaspaid${rowData.RowId}`}
              onChange={(e) => {
                setIsSaveEnabled(true);
              }}
              onKeyDown={(e) => {
                if ([32, 13].includes(e.keyCode)) {
                  e.preventDefault();
                  setIsSaveEnabled(true);
                }
              }}
              className="text-gray-800 check-box"
            />
          </div>
        ),
      },
    ];

    const [columns, setColumns] = useState(iColumns);
    useEffect(() => {
      if (validationResult.length > 0 || rowData.length > 0) {
        setColumns([...iColumns]);
      }
    }, [validationResult, viewAllPDFStatus, editingRows, rowData]);

    useEffect(() => {
      if (rowData.length > 0) {
        if (rowData.find(({ Change }) => Change)) {
          setShowSecondRow(false);
          setShowThirdRow(false);
        }
        const iRowData = rowData.find(
          ({ PayACH, PayCheck }) => PayCheck || PayACH
        );
        setPaymentMethod(
          iRowData?.PayACH ? "ach" : iRowData?.PayCheck ? "check" : null
        );
        setTimeout(() => {
          rowData.forEach((row) => {
            const { RowId, PayACH = false, PayCheck = false } = row;
            const rdoACH = document.getElementById(`chkACHApproved${RowId}`),
              rdoCheck = document.getElementById(`chkPrintChecks${RowId}`);
            if (rdoACH && !rdoACH.checked) rdoACH.checked = PayACH;
            if (rdoCheck && !rdoCheck.checked) rdoCheck.checked = PayCheck;
          });
        }, 0);
      }
    }, [rowData]);
    useEffect(() => {
      const handleBeforeUnload = (event) => {
        console.log("handleBeforeUnload");

        // isSaveEnabled &&
        //   setAlertDetails({
        //     isShow: true,
        //     title: "Confirmation",
        //     message: (
        //       <>
        //         <p>
        //           Are you sure you want to leave? All unsaved changes will be
        //           lost.
        //         </p>
        //       </>
        //     ),
        //     footer: (
        //       <>
        //         <button
        //           className="px-5 py-2 rounded-lg border-2 mr-4"
        //           style={{ color: "#3872af", borderColor: "#3872af" }}
        //           onClick={() => {
        //             setAlertDetails({
        //               isShow: false,
        //             });
        //           }}
        //         >
        //           Cancel
        //         </button>
        //         <button
        //           autoFocus={true}
        //           className="bg-[#3872af] px-5 py-2 rounded-lg border-2"
        //           style={{ color: "white", borderColor: "#3872af" }}
        //           onClick={() => {
        //             tableRef.current.savevendorPayment();
        //             setAlertDetails({
        //               isShow: false,
        //             });
        //           }}
        //         >
        //           Save and Leave
        //         </button>
        //       </>
        //     ),
        //   });
        event.returnValue = false;
        return false;
      };

      window.addEventListener(
        "beforeunload",
        isSaveEnabled ? handleBeforeUnload : () => {}
      );

      return () => {
        window.removeEventListener(
          "beforeunload",
          isSaveEnabled ? handleBeforeUnload : () => {}
        );
      };
    }, [isSaveEnabled]);

    const handlePayment = () => {
      if (tableRef.current) {
        const selectedPaymentType = rowData.find(
          (row) => row.PayACH || row.PayCheck
        );
        const paymentFlag = selectedPaymentType?.PayACH ? "ACH" : "CHECK";

        const selectedRow = rowData.filter(({ PayCheck }) => PayCheck),
          inCompletedRow = selectedRow.filter(
            ({ VendorId = 0, TotalAmount = 0, Account_Id = 0, Memo = "" }) => {
              return (
                !VendorId || !Account_Id || !cleanValue(TotalAmount) || !Memo
              );
            }
          );
        if (inCompletedRow.length > 0) {
          setAlertDetails({
            isShow: true,
            title: "Missing Payment Details",
            message: (
              <>
                <p className="mb-5">
                  Please complete the missing payment details for the following
                  transactions.
                </p>
                <ul className="list-none list-inside">
                  {inCompletedRow.map(
                    (
                      {
                        Payee,
                        VendorId = 0,
                        TotalAmount = 0,
                        Account_Id = 0,
                        Memo = "",
                      },
                      index
                    ) => {
                      const missingKey = [];
                      if (!cleanValue(TotalAmount)) missingKey.push("Amount");
                      if (!Account_Id) missingKey.push("G/L Account");
                      if (!Memo) missingKey.push("Memo");

                      return missingKey.length > 0 ? (
                        <li key={index}>
                          <span className="font-semibold mr-1">{Payee}:</span>
                          {missingKey.join(", ")}.
                        </li>
                      ) : (
                        <></>
                      );
                    }
                  )}
                </ul>
              </>
            ),
            footer: (
              <>
                <button
                  autoFocus={true}
                  className="bg-[#3872af] px-5 py-2 rounded-lg border-2"
                  style={{ color: "white", borderColor: "#3872af" }}
                  onClick={() => {
                    setAlertDetails({
                      isShow: false,
                    });
                  }}
                >
                  Close
                </button>
              </>
            ),
          });
        } else {
          tableRef.current.handlePaymentProcess(paymentFlag);
        }
      }
    };
    const handleCheckPaymentGo = () => {
      if (tableRef.current) {
        tableRef.current.ProcessPrintChecks();
      }
    };
    const handleSaveCheckPayment = () => {
      if (tableRef.current) {
        tableRef.current.SavePrintCheckPayment();
      }
    };

    const getButtonLabel = () => {
      return paymentMethod === "ach" ? "Pay ACH" : "Print Checks";
    };

    return (
      <>
        <div className="flex justify-center px-14 md:px-5 ">
          <div className="mx-auto w-full max-w-[1550px]">
            <div className="flex items-start sm:flex-col">
              <div style={{ padding: "0 3em" }}></div>
            </div>
            <div>
              <Table
                ref={tableRef}
                paginator
                setIsSaveEnabled={setIsSaveEnabled}
                isLoading={isLoading}
                tableData={rowData}
                setEditingRows={setEditingRows}
                accounts={glAccounts}
                Class={Class}
                vendors={vendors}
                columns={columns}
                sessionid={SessionId}
                companyId={companyId}
                handleNotification={handleNotification}
                setmarkPaid={setmarkPaid}
                setSelectedCount={setSelectedCount}
                setShowPaymentSection={setShowPaymentSection}
                setShowSecondRow={setShowSecondRow}
                setShowThirdRow={setShowThirdRow}
                setPaymentMethod={setPaymentMethod}
                handleTriggerPayee={handleTriggerPayee}
                selectedBank={selectedBank}
                selectedPrintOrder={selectedPrintOrder}
                BankOptions={dropDownOptions}
                setDropDownOptions={setDropDownOptions}
                checknumber={checknumber}
                setChecknumber={setChecknumber}
                EmpId={EmpId}
                printSuccess={printSuccess}
                editingRows={editingRows}
                expandedRows={expandedRows}
                setExpandedRows={setExpandedRows}
                handleRemove={handleRemove}
                setRowData={setRowData}
                setIsLoadingGo={setIsLoadingGo}
                setIsLoadingSave={setIsLoadingSave}
                getVendorPaymentApprovalData={GetVendorPaymentApprovalData}
                footerContent={
                  <>
                    {/* First Row - Existing Content */}
                    <div className="border-b border-solid border-gray-600">
                      <div className="flex flex-col gap-4 py-2.5">
                        {/* First Row */}
                        <div className="flex items-center">
                          <div className="flex md:w-[310px] lg:w-[310px] w-[335px] flex-col gap-2">
                            <div className="flex flex-wrap justify-end gap-6">
                              <Text
                                as="p"
                                className="font-inter text-[12px] font-normal text-black-900"
                              >
                                Total bills:{" "}
                              </Text>
                              <Heading
                                as="p"
                                className="font-inter text-[12px] font-semibold text-black-900"
                              >
                                {isLoading
                                  ? "$0.00"
                                  : formatCurrency(totalSubTotal)}
                              </Heading>
                            </div>
                            <div className="flex flex-wrap justify-end gap-6">
                              <Text
                                as="p"
                                className="font-inter text-[12px] font-normal text-black-900"
                              >
                                <span>Bills marked to pay&nbsp;</span>
                                <span className="font-bold">
                                  ({iSelectedCount}):
                                </span>
                              </Text>
                              <Heading
                                as="p"
                                className="font-inter text-[12px] font-semibold text-black-900"
                              >
                                {formatCurrency(iMarkPaid || 0)}
                              </Heading>
                            </div>
                          </div>
                          {showPaymentSection && paymentMethod && (
                            <div
                              className="flex items-end justify-end gap-8 md:self-stretch sm:flex-col md:flex-col w-9/12"
                              style={{ position: "relative" }}
                            >
                              <div className="flex flex-col items-start justify-center gap-0.5 w-[250px]">
                                <Text
                                  as="p"
                                  className="font-inter text-[14px] font-normal text-black-900 mb-1"
                                >
                                  Pay From Account
                                </Text>
                                <SelectBox
                                  wClassName="s-wrap w-full"
                                  name="Account Dropdown"
                                  options={dropDownOptions}
                                  value={selectedBank.value}
                                  onChange={(selectedOption) => {
                                    setSelectedBank(selectedOption);
                                    const selectedBankOption =
                                      dropDownOptions?.find(
                                        (option) =>
                                          option?.value ===
                                          selectedOption?.value
                                      ) || {
                                        checkNum: 0,
                                        label: "",
                                        selected: false,
                                        value: "",
                                      };
                                    setChecknumber(
                                      selectedBankOption.checkNum || 0
                                    );
                                  }}
                                  // onChange={setSelectedBank}
                                />
                              </div>
                              <Button
                                onClick={handlePayment}
                                disabled={isButtonEnabled}
                                style={{
                                  cursor: isButtonEnabled
                                    ? "not-allowed"
                                    : "pointer",
                                  opacity: isButtonEnabled ? 0.8 : 1,
                                }}
                                leftIcon={
                                  paymentMethod === "ach" ? (
                                    <Img
                                      src="images/img_arrowright.svg"
                                      alt="Arrow Right"
                                      className="h-[18px] w-[18px]"
                                    />
                                  ) : (
                                    <img
                                      src={PrintIcon}
                                      alt="Print Check"
                                      className="cursor-pointer"
                                      style={{
                                        width: "25px",
                                        height: "25px",
                                        objectFit: "contain",
                                        filter: "brightness(0) invert(1)",
                                      }}
                                    />
                                  )
                                }
                                className="flex h-[38px] min-w-[118px] flex-row items-center justify-center gap-2.5 rounded-lg border border-solid border-indigo-700 bg-indigo-400 px-[19px] text-center font-inter text-[12px] font-bold text-white-a700"
                                data-payment-type={paymentMethod}
                              >
                                {getButtonLabel()}
                              </Button>
                            </div>
                          )}
                        </div>

                        {showSecondRow && (
                          <div className="flex items-center w-full justify-end">
                            <div className="flex items-end gap-4 ">
                              <div className="w-[250px]">
                                <Text
                                  as="p"
                                  className="font-inter text-[14px] font-normal text-black-900 mb-1"
                                >
                                  Check number
                                </Text>
                                <input
                                  type="text"
                                  className="w-full h-[38px] rounded border border-solid border-black-900 bg-white-a700 px-3 py-1 font-inter text-[14px]"
                                  placeholder="Enter Check Number"
                                  value={checknumber}
                                />
                              </div>
                              <div className="flex-col">
                                <Text
                                  as="p"
                                  className="font-inter text-[14px] font-normal text-black-900 mb-1"
                                >
                                  Print Sort Order
                                </Text>
                                <SelectBox
                                  wClassName="s-wrap w-[250px]"
                                  name="Second Dropdown"
                                  options={printOrder}
                                  onChange={({ value }) => {
                                    setSelectedPrintOrder(value);
                                  }}
                                  value={selectedPrintOrder}
                                />
                              </div>
                              <div className="flex items-center gap-8">
                                <div className="min-w-[225px] ml-[20px]">
                                  <Button
                                    disabled={isLoadingGo}
                                    onClick={handleCheckPaymentGo}
                                    className="button h-[38px] min-w-[80px] rounded-lg border border-solid border-indigo-700 bg-indigo-400 px-4 text-center font-inter text-[12px] font-bold text-white-a700 "
                                  >
                                    Go
                                  </Button>
                                  {isLoadingGo && (
                                    <FontAwesomeIcon
                                      icon={faRotate}
                                      className="spinner"
                                      color="#508BC9"
                                      style={{
                                        fontSize: 16,
                                        marginLeft: 5,
                                        marginTop: 3,
                                        animation: "spin 1s linear infinite",
                                      }}
                                    />
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {showThirdRow && (
                          <div className="flex items-center w-full justify-end">
                            <div className="flex items-center gap-8">
                              <Text
                                as="p"
                                className="font-inter text-[14px] font-normal text-black-900"
                              >
                                Did checks print successfully?
                              </Text>
                              <input
                                type="checkbox"
                                checked={printSuccess}
                                onChange={handleCheckboxChange}
                                className="h-5 w-5 rounded border border-solid border-black-900"
                              />
                              <div className="min-w-[225px]">
                                <Button
                                  onClick={handleSaveCheckPayment}
                                  className="h-[38px] min-w-[80px] rounded-lg border border-solid border-indigo-700 bg-indigo-400 px-4 text-center font-inter text-[12px] font-bold text-white-a700"
                                >
                                  Save
                                </Button>
                                {isLoadingSave && (
                                  <FontAwesomeIcon
                                    icon={faRotate}
                                    className="spinner"
                                    color="#508BC9"
                                    style={{
                                      fontSize: 16,
                                      marginLeft: 5,
                                      marginTop: 3,
                                      animation: "spin 1s linear infinite",
                                    }}
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                }
              />
            </div>
          </div>
        </div>
        <div
          id="refresh-payment-data"
          className="none"
          data-company-id=""
          data-emp-id=""
          onClick={(e) => {
            // const companyId = e.target.getAttribute("data-company-id");
            // const empId = e.target.getAttribute("data-emp-id");
            // GetVendorPaymentApprovalData(companyId, empId, false);
            const VendorPaymentId = e.target.getAttribute(
              "data-VendorPaymentId"
            );
            handleGetPaymentRowData({ VendorPaymentId });
          }}
        ></div>
        <div
          id="remove-payment-data"
          className="none"
          data-VendorPaymentId=""
          onClick={(e) => {
            // const companyId = e.target.getAttribute("data-company-id");
            // const empId = e.target.getAttribute("data-emp-id");
            // GetVendorPaymentApprovalData(companyId, empId, false);
            const VendorPaymentId = e.target.getAttribute(
              "data-VendorPaymentId"
            );
            handleRemovePaymentRowData({ VendorPaymentId });
          }}
        ></div>
        <div
          id="refresh-payment-data-all"
          className="none"
          data-company-id=""
          data-emp-id=""
          onClick={(e) => {
            const companyId = e.target.getAttribute("data-company-id");
            const empId = e.target.getAttribute("data-emp-id");
            GetVendorPaymentApprovalData(companyId, empId, false);
          }}
        ></div>
        <Dialog
          modal
          draggable={false}
          position="top"
          className="custom-tailwind-modal"
          header={dialogDetails["title"]}
          visible={dialogDetails["isShow"]}
          headerClassName="p-5"
          footer={
            <>
              <button
                className="px-5 py-2 rounded-lg border-2 mr-4"
                style={{ color: "#3872af", borderColor: "#3872af" }}
                onClick={() => {
                  setDialogDetails({
                    isShow: false,
                  });
                }}
              >
                No
              </button>
              <button
                autoFocus={true}
                className="bg-[#3872af] px-5 py-2 rounded-lg border-2"
                style={{ color: "white", borderColor: "#3872af" }}
                onClick={() => {
                  handleRemoveWithConfirmation(dialogDetails["rowId"]);
                  setDialogDetails({
                    isShow: false,
                  });
                }}
              >
                Yes
              </button>
            </>
          }
          onHide={() => {
            setDialogDetails({
              isShow: false,
              title: "",
              message: "",
            });
          }}
        >
          <p className="mb-5 py-6 px-3 border-y border-solid">
            {dialogDetails["message"]}
          </p>
        </Dialog>
        <Dialog
          modal
          draggable={false}
          position="top"
          className="custom-tailwind-modal"
          header={alertDetails["title"]}
          visible={alertDetails["isShow"]}
          headerClassName="p-5"
          footer={alertDetails["footer"]}
          onHide={() => {
            setAlertDetails({
              isShow: false,
              title: "",
              message: "",
            });
          }}
        >
          <p className="mb-5 py-6 px-3 border-y border-solid">
            {alertDetails["message"]}
          </p>
        </Dialog>
      </>
    );
  }
);
export default PaymentManagementSection;
