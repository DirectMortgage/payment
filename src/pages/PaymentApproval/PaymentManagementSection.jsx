import {
  Img,
  Text,
  Button,
  SelectBox,
  Heading,
  Radio,
  RadioGroup,
  Input,
  Checkbox,
} from "../../components";
import { CloseSVG } from "../../components/Input/close.jsx";
import { ReactTable } from "../../components/ReactTable";
import { createColumnHelper } from "@tanstack/react-table";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencil, faRotate } from "@fortawesome/free-solid-svg-icons";
import uploadPdfImage from "../../components/Images/upload-pdf.png";
import OpenPdfImage from "../../components/Images/open_in_new.png";
import Close from "../../components/Images/close.png";
import PrintIcon from "../../components/Images/Print-Icon.png";
import { GroupSelect } from "../../components/GroupSelect/index";
import {
  handleAPI,
  queryStringToObject,
  handleGetSessionData,
  getCurrentTimeAndDate,
  formatAsHTML,
  fnOpenWindow,
  handleShowUploadingStatus,
  formatCurrency,
  FormatValueforCalc,
  formatSpecialCharacters,
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
} from "react";
import Table from "../../components/Table/Table.js";
import DatePicker from "react-datepicker";

import "react-datepicker/dist/react-datepicker.css";

let SessionId;

const PaymentManagementSection = forwardRef(
  ({ companyId, validationResult }, ref) => {
    const [searchBarValue, setSearchBarValue] = React.useState("");
    const [rawXmlData, setRawXmlData] = useState("");
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

    const [selectedBank, setSelectedBank] = useState(null);
    const [selectedPrintOrder, setSelectedPrintOrder] = useState("0");
    const [checknumber, setChecknumber] = useState("");
    const [printOrder, setPrintOrder] = useState([
      { label: "Select", value: "0" },
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

    useImperativeHandle(ref, () => ({
      handleAddRow: () => {
        console.log("Table ref:", tableRef.current); // Debug log
        tableRef.current.addRow();
      },
      handleSave: () => {
        tableRef.current.savevendorPayment();
      },
    }));
    //let FromPipeline = queryString["FromPipeline"];
    SessionId = queryString["SessionID"];
    useEffect(() => {
      empIdRef.current = EmpId;
    }, [EmpId]);

    useEffect(() => {
      const fetchData = async () => {
        let fetchedEmpNum = queryString["EmpNum"] || "0";

        if (fetchedEmpNum === "0") {
          fetchedEmpNum = await handleGetSessionData(SessionId, "empnum");
        }

        SetEmpID(fetchedEmpNum);

        await GetVendorPaymentApprovalData(companyId, fetchedEmpNum);
      };

      fetchData();
    }, [companyId]);

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
        setSelectedBank(null);
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
        setSelectedBank(null);
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
          setRawXmlData("");
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
            if (companyId === "4") {
              setSelectedBank(
                dropDownOptions.find((option) => option.value === "8")
              );
              const dropdownList = dropDownOptions.find(
                (option) => option.value === "8"
              );
              setChecknumber(dropdownList.checkNum);
            }
            if (companyId === "2") {
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
              item["GLAccount"] = item["GLAccount"]?.replace("0-", "").trim();
              return item;
            });
            setRowData(iRowData);
            console.log(iRowData);
            calculateTotalSubTotal(JSON.parse(processedData));
          }
          setRawXmlData(responseJson);
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

    // useEffect to load data when the component mounts
    // useEffect(() => {
    //   const LoadData = async () => {
    //     GetVendorPaymentApprovalData(companyId, 32182); // Replace with the actual CompanyId and UserId
    //   };
    //   LoadData();
    // }, [companyId]);
    const handleImageClick = (LinkId) => {
      // Handle the click event here
      let URL =
        "../../../NewDMAcct/GetUploadedImage.aspx?CompanyId=" +
        4 +
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
    const handleRemove = async (rowId) => {
      // Find the record with the given rowId
      const recordToRemove = rowData.find((row) => row.RowId === rowId);

      if (recordToRemove) {
        const { VendorPaymentId, VendorPaymentDetailId } = recordToRemove;

        const updatedData = rowData.filter(
          (row) => row.VendorPaymentId !== VendorPaymentId
        );
        // console.log(VendorPaymentDetailId)
        setRowData(updatedData);

        let obj = {
          VendorPaymentId: VendorPaymentId,
          VendorPaymentDetailId: VendorPaymentDetailId,
        };

        const response = await handleAPI({
          name: "DeleteVendorMonthlyRecords",
          params: obj,
        });
      } else {
        console.error("Record with the given RowId not found");
      }
    };
    function formatDropdownOptions(htmlString) {
      // Create a temporary DOM element
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlString, "text/html");
      const options = doc.getElementsByTagName("option");

      // Convert HTMLCollection to array and map to desired format
      return Array.from(options).map((option) => ({
        label: option.textContent,
        value: option.getAttribute("value"),
        // Optional: include additional attributes if needed
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
                    // Hide spinner and update text to "Uploaded"
                    spinner.style.display = "none";
                    headerText.textContent = "Uploaded";
                  }
                }, 500);
                // handleSaveScanDocDetails(
                //   ScanDocId,
                //   entityid,
                //   entitytypeid,
                //   iRecId,
                //   index === files.length
                // );
                if (index === files.length) {
                  // handlePostFileUpload({
                  //   target,
                  //   scanDocId: ScanDocId,
                  //   documentDetail,
                  // });
                  // setUploadingStatus((prevUploading) => {
                  //   return [...prevUploading.filter((item) => item !== ID)];
                  // });
                  //  handleTempRefreshDocList(ID);
                  // setProcessingStatus(null);
                  // setTimeout(() => {
                  //   if (!promptFlag) {
                  //     setModalDetails({
                  //       body: (
                  //         <>
                  //           To view this document, click the Uploaded Documents
                  //           tab above
                  //         </>
                  //       ),
                  //       title: "Upload Success",
                  //       show: true,
                  //       footerLeftContent: (
                  //         <>
                  //           <div
                  //             style={{
                  //               display: "flex",
                  //               alignItems: "center",
                  //             }}
                  //           >
                  //             <input
                  //               value={promptFlag}
                  //               type="checkbox"
                  //               id="modal-checkbox"
                  //               style={{ height: 20, width: 20 }}
                  //               onChange={(event) => {
                  //                 setPromptFlag((iPromptFlag) => !iPromptFlag);
                  //                 handleAPI({
                  //                   name: "UpdateUploadPrompt",
                  //                   params: {
                  //                     empId: empNumber,
                  //                     Value: event.target.checked ? 1 : 0,
                  //                   },
                  //                 }).then(() => {});
                  //               }}
                  //             />
                  //             <label
                  //               htmlFor="modal-checkbox"
                  //               style={{
                  //                 cursor: "pointer",
                  //                 marginLeft: 5,
                  //               }}
                  //             >
                  //               <span className="checkmark">
                  //                 Turn off this prompt{" "}
                  //               </span>
                  //             </label>
                  //           </div>
                  //         </>
                  //       ),
                  //     });
                  //   } else {
                  //     handleToast("Document Uploaded Successfully", "success");
                  //   }
                  // }, 500);
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
    const handleViewAllPDF = () => {
      setViewAllPDFStatus(["loading"]);
      const linkIds = [
        ...new Set(rowData.map(({ LinkId = "" }) => LinkId).filter((_) => _)),
      ].join(",");

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
        }, 500);
      }
    };
    useEffect(() => {
      if (rowData.length > 0) {
        // rowData.forEach((item) => {
        //   if (item.VendorId === 0) {
        //     //acc[item.RowId] = true
        //     handleTriggerPayee(item.RowId);
        //   }
        //   //return acc
        // })

        const editing = rowData.reduce((acc, item) => {
          if (item.VendorId === 0) {
            acc[item.RowId] = true;
            handleTriggerPayee(item.RowId);
          }
          return acc;
        }, {});
        console.log("testing");
        setEditingRows((prevState) => ({
          ...prevState,
          ...editing,
        }));
      }
    }, [rowData.length]);

    useEffect(() => {
      console.log(editingRows);
    }, [editingRows]);

    const iColumns = [
      {
        field: "Payee",
        editable: editingRows[rowData.RowId] || false, //(rowData) => rowData.paymentDetails === "",
        //editable: (rowData) => {
        //  return editingRows[rowData.RowId] && rowData.VendorId == 0;
        //}, // Change this to true
        editor: (options) => options.editorCallback(options.value), // Add this line
        "data-field": "Payee",
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
              [rowIndex]: false, // Enable editing for the specific row
            }));
            //rowData.isEditing = false; // Set the row's edit state
            InsertVendorInfo(SessionId, VendorId);

            //const URL = "https://www.directcorp.com/NewDMAcct/CustomerVendorOptions.aspx?SessionId=" + SessionId;

            //window.open(URL, "", "width=1200,height=1200,resizable=yes,scrollbars=yes");

            fnOpenWindow(
              `/NewDMAcct/CustomerVendorOptions.aspx?SessionID=${SessionId}`,
              "/NewDMAcct/CustomerVendorOptions.aspx",
              SessionId
            );
          };
          const handleEditClick = (e, rowData, rowIndex) => {
            setEditingRows((prevState) => ({
              ...prevState,
              [rowIndex]: true, // Enable editing for the specific row
            }));
            //e.stopPropagation();
            // Enable editing for this cell
            // setColumns((previousColumn)=> {previousColumn[0].editable = true
            //   return previousColumn
            // })
            // console.log(columns)
            //debugger
            //  rowData.isEditing = true; // Set the row's edit state
          };
          if (rowData.VendorId === 0 && false) {
            return (
              <GroupSelect
                size="sm"
                shape="round"
                options={vendors}
                VendorPaymentDetailId={rowData.VendorPaymentDetailId}
                VendorPaymentId={rowData.VendorPaymentId}
                name="Vendors"
                valueKey="VendorId"
                labelKey="label"
                sessionid={SessionId}
                values={[
                  {
                    VendorId: rowData.VendorId,
                    label: rowData.Payee,
                  },
                ]}
                VendorId={rowData.VendorId}
                RowId={rowData.RowId}
                companyId={companyId}
                EmpId={EmpId}
                handleRemove={handleRemove}
                showAddPaymentSplit={true}
                showRemoveRow={true}
                onChange={(selected) => {
                  const selectedEntity = selected[0];
                  const selectedEntityLabel = selected[1];
                }}
                loading={isLoading}
                loadingMessage="Loading Payee"
              />
            );
          }
          return (
            <div className="flex flex-col items-start justify-center h-full px-4">
              <Heading
                size="headingmd"
                as="h1"
                className="text-[14px] font-semibold text-indigo-700"
              >
                <span
                  onClick={(e) =>
                    handlePayeeClick(rowData.VendorId, rowData, rowData.RowId)
                  }
                  className="cursor-pointer hover:underline"
                >
                  {rowData.Payee}
                </span>
                <span
                  className="pointer"
                  id={"payee_" + rowData.RowId}
                  onClick={(e) => handleEditClick(e, rowData, rowData.RowId)}
                  //tabIndex={0}
                >
                  <FontAwesomeIcon
                    icon={faPencil}
                    className="ml-1 text-[10px] text-gray-600"
                    //onClick={(e) => handleEditClick(e, rowData, rowData.RowId)}
                  />
                </span>
              </Heading>
              {/* <div className="flex items-center gap-2">
                  <Text size="textxs" as="p" className="text-[10px] font-normal leading-[13px] text-black-900">
                    {rowData.paymentDetails}
                  </Text>
                 
                </div> */}
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
        style: { width: "100px" },
        body: (rowData) => (
          // <div className="flex justify-center rounded border border-dashed border-indigo-700 bg-indigo-400_33">
          //     <Heading as="h2" className="self-end text-[12px] font-semibold text-black-900">
          //         {rowData.imagesHeader}
          //     </Heading>
          // </div>

          <FileUpload
            id={`file-upload-${rowData.RowId}`} // _${rowData.Scandoctype}_${rowData.ID}
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

              setRowData((prevData) =>
                prevData.map((row) =>
                  row.RowId === rowData.RowId ? { ...row, FileCount: 1 } : row
                )
              );

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
        editable: false,
        header: () => (
          <Text
            size="headingmd"
            as="h1"
            className="text-[12px] font-semibold text-indigo-700"
          >
            <span
              onClick={handleViewAllPDF}
              className="cursor-pointer hover:underline flex items-center"
            >
              View All PDF
              {viewAllPDFStatus.includes("loading") && (
                <span className="ml-1">
                  <Spinner size="xxs" />
                </span>
              )}
            </span>
          </Text>
        ),
        style: { width: "130px" },
        body: (rowData) => {
          return (
            <div className="flex gap-2 justify-center items-center">
              {rowData.FileCount === 1 && (
                <img
                  src={uploadPdfImage}
                  alt="Upload"
                  style={{
                    width: "30px",
                    height: "30px",
                    objectFit: "contain",
                  }}
                  className="cursor-pointer"
                  onClick={() => handleImageClick(rowData.LinkId)}
                />
              )}
              {rowData.FileCount > 1 && (
                <img
                  src={OpenPdfImage}
                  alt="Open Image"
                  className="cursor-pointer"
                  style={{
                    width: "25px",
                    height: "25px",
                    objectFit: "contain",
                  }}
                  // onClick={() => handleOpenClick(rowData)}
                  onClick={() => handleImageClick(rowData.LinkId)}
                />
              )}
              {/* <img 
              src={Close} 
              alt="Close"
              style={{ width: '20px', height: '20px', objectFit: 'contain' }}
              className="cursor-pointer"
              onClick={() => handleRemove(rowData.RowId)}
            /> */}
            </div>
          );
        },
      },
      {
        field: "paymentMethodHeader",
        "data-field": "paymentMethodHeader",
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
        style: { width: "136px" },
        //       body: (rowData) => {

        //         const handlePaymentChange = (value) => {
        //           rowData.PayACH = value === "ach";
        //           rowData.PayCheck = value === "check";
        //         };

        //         const selectedValue = rowData.PayACH ? "ach" : rowData.PayCheck ? "check" : "";
        //         return (
        //           <RadioGroup
        //             name={`payment-${rowData.RowId}`}
        //             selectedValue={selectedValue}
        //             onChange={(e) => {
        //               handlePaymentChange(e);
        //               setExpandedRows((prev) => [...prev, rowData]);
        // }}
        //             className="flex gap-2"
        //           >
        //             <Radio
        //               value="ach"
        //               label="ACH"
        //               id={`chkACHApproved${rowData.RowId}`}
        //               className="text-[12px] text-black-900"
        //             />
        //             <Radio
        //               value="check"
        //               label="Check"
        //               id={`chkPrintChecks${rowData.RowId}`}
        //               className="text-[12px] text-black-900"
        //             />
        //           </RadioGroup>
        //         );

        //       }
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
              tabIndex={1}
              label=""
              name="item"
              id={`chkMarkaspaid${rowData.RowId}`}
              onChange={(e) => console.log("Checked:", e.target.checked)}
              className="text-gray-800 check-box"
            />
          </div>
        ),
      },
    ];
    const [columns, setColumns] = useState(iColumns);
    useEffect(() => {
      if (validationResult.length > 0) {
        setColumns([...iColumns]);
      }
    }, [validationResult, viewAllPDFStatus, editingRows, rowData]);
    const handlePayment = () => {
      if (tableRef.current) {
        const selectedPaymentType = rowData.find(
          (row) => row.PayACH || row.PayCheck
        );
        const paymentFlag = selectedPaymentType?.PayACH ? "ACH" : "CHECK";
        console.log(paymentFlag);
        tableRef.current.handlePaymentProcess(paymentFlag);
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

    // const tableColumns = React.useMemo(() => {
    //   const tableColumnHelper = createColumnHelper();
    //   return [
    //     tableColumnHelper.accessor("payeeHeader", {
    //       cell: (info) => (
    //         <div className="flex flex-col items-center justify-center px-1.5">
    //           <Heading size="headingmd" as="h1" className="text-[14px] font-semibold text-indigo-700">
    //             {info.getValue()}
    //           </Heading>
    //           <Text size="textxs" as="p" className="text-[10px] font-normal leading-[13px] text-black-900">
    //             {info.row.original.paymentDetails}
    //           </Text>
    //         </div>
    //       ),
    //       header: (info) => (
    //         <Text
    //           size="textmd"
    //           as="p"
    //           className="pb-0.5 pl-4 pt-2.5 text-left text-[14px] font-normal leading-[18px] text-black-900"
    //         >
    //           <span>
    //             <>
    //               Payee
    //               <br />
    //             </>
    //           </span>
    //           <span className="text-[10px]">(pay history)</span>
    //         </Text>
    //       ),
    //       meta: { width: "192px" },
    //     }),
    //     tableColumnHelper.accessor("totalHeader", {
    //       cell: (info) => (
    //         <Text as="p" className="text-[12px] font-normal text-black-900">
    //           {info.getValue()}
    //         </Text>
    //       ),
    //       header: (info) => (
    //         <Text size="textmd" as="p" className="py-3.5 text-left text-[14px] font-normal text-black-900">
    //           Total
    //         </Text>
    //       ),
    //       meta: { width: "86px" },
    //     }),
    //     tableColumnHelper.accessor("glAccountHeader", {
    //       cell: (info) => (
    //         <Text size="textmd" as="p" className="text-[14px] font-normal text-black-900">
    //           {info.getValue()}
    //         </Text>
    //       ),
    //       header: (info) => (
    //         <Text size="textmd" as="p" className="py-3.5 text-left text-[14px] font-normal text-black-900">
    //           G/L Account
    //         </Text>
    //       ),
    //       meta: { width: "116px" },
    //     }),
    //     tableColumnHelper.accessor("departmentHeader", {
    //       cell: (info) => (
    //         <Text size="textmd" as="p" className="text-[14px] font-normal text-black-900">
    //           {info.getValue()}
    //         </Text>
    //       ),
    //       header: (info) => (
    //         <Text size="textmd" as="p" className="pb-3 pt-4 text-left text-[14px] font-normal text-black-900">
    //           Department
    //         </Text>
    //       ),
    //       meta: { width: "96px" },
    //     }),
    //     tableColumnHelper.accessor("invoiceDateHeader", {
    //       cell: (info) => (
    //         <Text size="textmd" as="p" className="text-[14px] font-normal text-black-900">
    //           {info.getValue()}
    //         </Text>
    //       ),
    //       header: (info) => (
    //         <Text size="textmd" as="p" className="py-3.5 text-left text-[14px] font-normal text-black-900">
    //           Invoice Date
    //         </Text>
    //       ),
    //       meta: { width: "90px" },
    //     }),
    //     tableColumnHelper.accessor("invoiceNumberHeader", {
    //       cell: (info) => (
    //         <Text size="textmd" as="p" className="text-[14px] font-normal text-black-900">
    //           {info.getValue()}
    //         </Text>
    //       ),
    //       header: (info) => (
    //         <Text size="textmd" as="p" className="py-3.5 pl-1 text-left text-[14px] font-normal text-black-900">
    //           Invoice #
    //         </Text>
    //       ),
    //       meta: { width: "96px" },
    //     }),
    //     tableColumnHelper.accessor("memoHeader", {
    //       cell: (info) => (
    //         <Text size="textxs" as="p" className="text-[10px] font-normal text-black-900">
    //           {info.getValue()}
    //         </Text>
    //       ),
    //       header: (info) => (
    //         <Text size="textmd" as="p" className="py-3.5 text-left text-[14px] font-normal text-black-900">
    //           Memo
    //         </Text>
    //       ),
    //       meta: { width: "96px" },
    //     }),
    //     tableColumnHelper.accessor("paymentMethodHeader", {
    //       cell: (info) => (
    //         <RadioGroup name="paymentmethodgroup" className="flex">
    //           <Radio value="ach" label="ACH" className="flex gap-1 py-0.5 text-[12px] text-black-900" />
    //           <Radio value="check" label="Check" className="ml-2.5 flex gap-1 py-0.5 text-[12px] text-black-900" />
    //         </RadioGroup>
    //       ),
    //       header: (info) => (
    //         <Text size="textmd" as="p" className="pb-3 pt-4 text-left text-[14px] font-normal text-black-900">
    //           Payment Method
    //         </Text>
    //       ),
    //       meta: { width: "136px" },
    //     }),
    //     tableColumnHelper.accessor("paidHeader", {
    //       cell: (info) => (
    //         <div className="flex">
    //           <Img src={info.getValue()} alt="Instagram Image" className="h-[18px]" />
    //         </div>
    //       ),
    //       header: (info) => (
    //         <Text size="textmd" as="p" className="py-3.5 text-left text-[14px] font-normal text-black-900">
    //           Paid
    //         </Text>
    //       ),
    //       meta: { width: "44px" },
    //     }),
    //     tableColumnHelper.accessor("imagesHeader", {
    //       cell: (info) => (
    //         <div className="flex justify-center rounded border border-dashed border-indigo-700 bg-indigo-400_33">
    //           <Heading as="h2" className="self-end text-[12px] font-semibold text-black-900">
    //             {info.getValue()}
    //           </Heading>
    //         </div>
    //       ),
    //       header: (info) => (
    //         <Text size="textmd" as="p" className="pb-3 pt-4 text-left text-[14px] font-normal text-black-900">
    //           Images
    //         </Text>
    //       ),
    //       meta: { width: "212px" },
    //     }),
    //   ];
    // }, []);
    const getButtonLabel = () => {
      return paymentMethod === "ach" ? "Pay ACH" : "Print Checks";
    };

    return (
      <>
        <div className="flex justify-center px-14 md:px-5">
          <div className="mx-auto w-full max-w-[1550px]">
            <div className="flex items-start sm:flex-col">
              <div style={{ padding: "0 3em" }}>
                {/* <div className="flex flex-1 gap-[33px] ml-auto mr-2 sm:self-stretch">
        <Button
            leftIcon={<Img src="payment/images/img_grid.svg" alt="Grid" className="h-[18px] w-[18px]" />}
            className="flex h-[38px] min-w-[146px] flex-row items-center justify-center gap-2.5 rounded-lg border border-solid border-indigo-700 bg-indigo-400 px-[19px] text-center font-inter text-[12px] font-bold text-white-a700"
            onClick={addRow}  
        >
            Add Payment
        </Button>
        <Button
            leftIcon={<Img src="payment/images/img_grid.svg" alt="Grid" className="h-[18px] w-[18px]" />}
            className="flex h-[38px] min-w-[176px] flex-row items-center justify-center gap-2.5 rounded-lg border border-solid border-indigo-700 bg-indigo-400 px-[19px] text-center font-inter text-[12px] font-bold text-white-a700"
        >
            Add Payment Split
        </Button>
    </div> */}
              </div>
            </div>
            <div className="-mt-2">
              <div style={{ padding: "0 2em" }}>
                <Table
                  ref={tableRef}
                  paginator
                  isLoading={isLoading}
                  tableData={rowData}
                  setEditingRows={setEditingRows}
                  accounts={glAccounts}
                  Class={Class}
                  vendors={vendors}
                  columns={columns}
                  sessionid={SessionId}
                  companyId={companyId}
                  setmarkPaid={setmarkPaid}
                  setSelectedCount={setSelectedCount}
                  setShowPaymentSection={setShowPaymentSection}
                  setShowSecondRow={setShowSecondRow}
                  setShowThirdRow={setShowThirdRow}
                  setPaymentMethod={setPaymentMethod}
                  selectedBank={selectedBank}
                  selectedPrintOrder={selectedPrintOrder}
                  BankOptions={dropDownOptions}
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
                                  {formatCurrency(totalSubTotal)}
                                </Heading>
                              </div>
                              <div className="flex flex-wrap justify-end gap-6">
                                <Text
                                  as="p"
                                  className="font-inter text-[12px] font-normal text-black-900"
                                >
                                  <span>Bills marked to pay&nbsp;</span>
                                  <span className="font-bold">
                                    ({markedCount}):
                                  </span>
                                </Text>
                                <Heading
                                  as="p"
                                  className="font-inter text-[12px] font-semibold text-black-900"
                                >
                                  {formatCurrency(markPaid)}
                                </Heading>
                              </div>
                            </div>
                            {showPaymentSection && (
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
                                        onClick={() =>
                                          handleImageClick(rowData.LinkId)
                                        }
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

                          {/* Second Row */}
                          {showSecondRow && (
                            <div className="flex items-center w-full justify-end px-[185px]">
                              <div className="flex items-center gap-4 ">
                                <div className="w-[250px]">
                                  <input
                                    type="text"
                                    className="w-full h-[38px] rounded border border-solid border-black-900 bg-white-a700 px-3 py-1 font-inter text-[14px]"
                                    placeholder="Enter Check Number"
                                    value={checknumber}
                                  />
                                </div>
                                <div className="flex items-center gap-8">
                                  <SelectBox
                                    wClassName="s-wrap w-[250px]"
                                    name="Second Dropdown"
                                    options={printOrder}
                                    onChange={setSelectedPrintOrder}
                                  />
                                  <div className="min-w-[115px]">
                                    <Button
                                      onClick={handleCheckPaymentGo}
                                      className="h-[38px] min-w-[80px] rounded-lg border border-solid border-indigo-700 bg-indigo-400 px-4 text-center font-inter text-[12px] font-bold text-white-a700 "
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
                          {/* Third Row */}
                          {showThirdRow && (
                            <div className="flex items-center w-full justify-end px-[185px]">
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
                                <div className="min-w-[115px]">
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
            {/* <div className="py-2.5">
            <div className="mt-1.5 flex justify-center">
              <div className="flex items-center gap-1 rounded border border-solid border-black-900">
                <Text size="textmd" as="p" className="text-[14px] font-normal text-black-900">
                  10
                </Text>
                <Img src="images/img_arrow_down_gray_900.svg" alt="Entries Dropdown" className="h-[18px] w-[18px]" />
              </div>
              <div className="flex flex-1 px-3">
                <Text size="textmd" as="p" className="mt-1 text-[14px] font-normal text-black-900">
                  Entries per page
                </Text>
              </div>
            </div>
          </div> */}
            {/* <div className="py-2.5">
            <div className="flex items-center justify-center">
              <Text size="textmd" as="p" className="mt-1 self-end text-[14px] font-normal text-black-900">
                Showing 1 to 5 of 5 entries
              </Text>
              <div className="flex flex-1 justify-end gap-[13px]">
                <Img src="images/img_forward.svg" alt="Fast Forward Image" className="h-[18px] w-[18px]" />
                <Img src="images/img_arrow_left.svg" alt="Arrow Left Image" className="h-[18px] w-[18px]" />
                <Img src="images/img_arrow_right_gray_900.svg" alt="Arrow Right Image" className="h-[18px] w-[18px]" />
                <Img src="images/img_forward.svg" alt="Fast Forward Image" className="h-[18px] w-[18px]" />
              </div>
            </div>
          </div> */}
          </div>
        </div>
        <div
          id="refresh-payment-data"
          className="none"
          data-company-id=""
          data-emp-id=""
          onClick={(e) => {
            const companyId = e.target.getAttribute("data-company-id");
            const empId = e.target.getAttribute("data-emp-id");
            GetVendorPaymentApprovalData(companyId, empId, false);
          }}
        ></div>
      </>
    );
  }
);
export default PaymentManagementSection;
