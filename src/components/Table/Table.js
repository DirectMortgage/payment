import React, {
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
  useMemo,
} from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRotate,
  faChevronDown,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { Paginator } from "primereact/paginator";
import { GroupSelect } from "../GroupSelect/index";
import { Img, Button } from "../../components";
import {
  handleAPI,
  FormatValueforCalc,
  fnOpenWindow,
  formatDate,
  cleanValue,
  removeCurrencyFormatting,
} from "../../components/CommonFunctions/CommonFunction.js";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";
import { PayeeSearch } from "components/GroupSelect/PayeeSearch";

const Table = forwardRef(
  (
    {
      accounts = [],
      vendors = [],
      Class = [],
      tableData = [],
      columns = [],
      sessionid = "",
      companyId,
      EmpId,
      editingRows,
      tableTitle = "",
      paginator = false,
      rowsPerPageOptions = [5, 10, 25, 50, 100],
      row = 50,
      isLoading = false,
      footerContent = <></>,
      expandedRows,
      setExpandedRows,
      handleRemove = () => {},
      getVendorPaymentApprovalData,
      setmarkPaid,
      setSelectedCount,
      setShowPaymentSection,
      setShowSecondRow,
      setShowThirdRow,
      setPaymentMethod,
      selectedBank,
      selectedPrintOrder,
      BankOptions,
      printSuccess,
      setIsLoadingGo,
      setIsLoadingSave,
      setEditingRows = () => {},
      setRowData = () => {},
      handleTriggerPayee = () => {},
      handleNotification = () => {},
      setIsSaveEnabled = () => {},
      checknumber,
      setChecknumber,
      setDropDownOptions,
      ...props
    },
    ref
  ) => {
    const [globalFilter, setGlobalFilter] = useState(null),
      [rows, setRows] = useState(5),
      [first, setFirst] = useState(0),
      [editingCell, setEditingCell] = useState(null),
      [sortField, setSortField] = useState(null),
      [sortOrder, setSortOrder] = useState(null),
      [selectedRows, setSelectedRows] = useState([]),
      [payStatusHtml, setPayStatusHtml] = useState(""),
      [payStatusVendorID, setPayStatusVendorID] = useState(""),
      [hdnpayCheck, sethdnpayCheck] = useState(""),
      [hdnGlo_Hud_VA, sethdnGlo_Hud_VA] = useState(""),
      [hdnBankAcountId, sethdnBankAcountId] = useState(""),
      [localData, setLocalData] = useState([]),
      [OnloadData, setOnloadData] = useState([]),
      [resizeColumn, setResizableColumn] = useState(null);

    const dataArray = useMemo(
      () => (Array.isArray(tableData) && tableData.length > 0 ? tableData : []),
      [tableData, tableData.length]
    );

    const { groupedData, paymentIdOrder, fieldMaps, parentRows } =
      useMemo(() => {
        const paymentIdOrder = [];
        if (OnloadData.length === 0 && dataArray.length > 0) {
          setOnloadData(JSON["parse"](JSON.stringify(dataArray)));
        }
        // Group data by `VendorPaymentId` and track order
        const groupedData = dataArray.reduce((acc, item) => {
          const paymentId = item.VendorPaymentId;
          if (!acc[paymentId]) {
            acc[paymentId] = [];
            paymentIdOrder.push(paymentId); // Track order of paymentIds
          }
          acc[paymentId].push(item);
          return acc;
        }, {});
        // Initialize field maps
        const fieldMaps = {
          classNameMap: {},
          glAccountMap: {},
          invoiceDateMap: {},
          invoiceMap: {},
          memoMap: {},
        };

        // Store the original values at the group level
        Object.entries(groupedData).forEach(([paymentId, rows]) => {
          const firstRow = rows[0];
          fieldMaps.classNameMap[paymentId] = firstRow.ClassName;
          fieldMaps.glAccountMap[paymentId] = firstRow.GLAccount;
          fieldMaps.invoiceDateMap[paymentId] = firstRow.InvoiceDate;
          fieldMaps.invoiceMap[paymentId] = firstRow.Invoice;
          fieldMaps.memoMap[paymentId] = firstRow.Memo;
        });

        // Process parent rows
        const parentRows = Object.entries(groupedData).map(
          ([paymentId, rows]) => {
            const parentRow = rows.reduce((minRow, currentRow) =>
              currentRow.RowId < minRow.RowId ? currentRow : minRow
            );
            // Create a display copy of the parent row
            const displayParentRow = { ...parentRow };

            if (rows.length > 1) {
              displayParentRow.ClassName = "";
              displayParentRow.GLAccount = "";
              // displayParentRow.InvoiceDate = ""; // Commented out as per original logic
              let { Invoice } = displayParentRow;
              Invoice = Invoice.split("-");
              Invoice.pop();
              displayParentRow.Invoice = Invoice.join("-");
              let { Memo } = displayParentRow;
              Memo = Memo.split("-");
              Memo.pop();
              displayParentRow.Memo = Memo.join("-");
              displayParentRow.isParentRow = true;
            }

            return {
              ...displayParentRow,
              originalClassName: fieldMaps.classNameMap[paymentId],
              originalGLAccount: fieldMaps.glAccountMap[paymentId],
              originalInvoiceDate: fieldMaps.invoiceDateMap[paymentId],
              originalInvoice: fieldMaps.invoiceMap[paymentId],
              originalMemo: fieldMaps.memoMap[paymentId],
            };
          }
        );
        return { groupedData, paymentIdOrder, fieldMaps, parentRows };
      }, [dataArray]);

    useEffect(() => {
      if (parentRows.length > 0) {
        if (parentRows.length > 0 && expandedRows.length > 0) {
          setExpandedRows((prevExpandedRows) =>
            prevExpandedRows
              .map((item) => {
                item = parentRows.find(
                  (iItem) => iItem["RowId"] === item["RowId"]
                );
                return item;
              })
              .filter((_) => _)
          );
        }
        setLocalData([...parentRows]);
      }
    }, [parentRows, parentRows.length]);

    useEffect(() => {
      const sortedParentRows = [...parentRows].sort(
        (a, b) =>
          paymentIdOrder.indexOf(a.VendorPaymentId) -
          paymentIdOrder.indexOf(b.VendorPaymentId)
      );

      // Update fields from originalValues if child rows exist
      const updatedParentRows = sortedParentRows.map((row) => {
        const childRows = groupedData[row.VendorPaymentId] || [];
        const hasChildRows = childRows.length > 0;
        const originalValues = hasChildRows ? childRows[0] : {};

        // Update fields
        return {
          ...row,
          ClassName: originalValues?.ClassName || "0",
          SubTotal: originalValues?.SubTotal || "0",
          Invoice: originalValues?.Invoice || "",
          Memo: originalValues?.Memo || "",
          InvoiceDate: originalValues?.InvoiceDate || "",
          GLAccount: originalValues?.GLAccount || "",
        };
      });

      // Set OnloadData with the updated and structured clone of sorted rows

      setLocalData(sortedParentRows);
      setSelectedRows([]);
    }, [tableData]);

    const onSort = (event) => {
      setSortField(event.sortField);
      setSortOrder(event.sortOrder);
    };
    const handlePaymentProcess = (paymentType) => {
      const selectedBankOption = BankOptions?.find(
        (option) => option?.value === selectedBank?.value
      ) || {
        checkNum: 0,
        label: "",
        selected: false,
        value: "",
      };
      if (selectedBankOption.value === "") {
        return;
      }

      if (paymentType === "ACH") {
        savevendorPayment({ showMessage: false });
        setTimeout(() => {
          ProcessACHPayment();
        }, 750);
      }
      if (paymentType === "CHECK") {
        setShowSecondRow(true);
      }
    };
    const ProcessPrintChecks = () => {
      savevendorPayment({ showMessage: false });
      setTimeout(() => {
        ProcessPrintCheckCallBack();
      }, 750);
    };
    const ProcessPrintCheckCallBack = async () => {
      setIsLoadingGo(true);
      let VendorPayArray = [];
      let VendorPaymentId = "";

      const selectedBankOption = BankOptions?.find(
        (option) => option?.value === selectedBank?.value
      ) || {
        checkNum: 0,
        label: "",
        selected: false,
        value: "",
      };

      const checkNum = checknumber || selectedBankOption.checkNum || 0;
      const BankAccount = selectedBankOption.value || 0;

      const selectedRow = tableData.filter(({ PayCheck }) => PayCheck);

      selectedRow.forEach((row) => {
        // Check if VendorPaymentId is not already processed
        if (!VendorPayArray.includes(row.VendorPaymentId)) {
          // Append VendorPaymentId with separator
          VendorPaymentId += `${row.VendorPaymentId}~`;
          VendorPayArray.push(row.VendorPaymentId);
        }
      });

      let obj = {
        VendorPaymentId: VendorPaymentId,
        CheckNum: checkNum,
        BankAccountId: BankAccount,
        PrintOrder: selectedPrintOrder,
        EmpNum: EmpId,
      };
      // return; //-remove
      console.log("VendorPaymentApprovalPrintChecks ===> ", obj);
      const response = await handleAPI({
        name: "VendorPaymentApprovalPrintChecks",
        params: {},
        method: "POST",
        body: JSON.stringify(obj),
      });
      try {
        if (response && response.trim() !== "{}" && response.trim() !== "[]") {
          setShowThirdRow(true);
          setIsLoadingGo(false);
          const currentURL = window.location.href;
          const baseURL = currentURL.split("Payment")[0];

          const finalURL = baseURL + response;

          window.open(
            finalURL,
            "",
            "width=1200,height=1200,resizable=yes,scrollbars=yes"
          );
        }
      } catch (error) {
        setIsLoadingGo(false);
        handleNotification("Error while printing checks.", "error", 0, 6000);
      }
    };
    const handleGetCheckNumber = async ({ accountId }) => {
      try {
        handleAPI({
          name: "getCheckNumber",
          method: "GET",
          params: { companyId, accountId },
        }).then((response) => {
          setDropDownOptions((prevDropDownOptions) => {
            prevDropDownOptions.forEach((item) => {
              if (item.value == accountId) {
                item.checkNum = response;
              }
            });
            return prevDropDownOptions;
          });
          setChecknumber(response);
        });
      } catch (error) {}
    };
    const SavePrintCheckPayment = async () => {
      setIsLoadingSave(true);
      let VendorPayArray = [];
      let VendorPaymentId = "";

      const selectedRow = tableData.filter(({ PayCheck }) => PayCheck);
      selectedRow.forEach((row) => {
        // Check if VendorPaymentId is not already processed
        if (!VendorPayArray.includes(row.VendorPaymentId)) {
          // Append VendorPaymentId with separator
          VendorPaymentId += `${row.VendorPaymentId}~`;
          VendorPayArray.push(row.VendorPaymentId);
        }
      });
      let obj = {
        VendorPaymentId: VendorPaymentId,
        PrintCheckStatus: printSuccess,
        EmpNum: EmpId,
      };

      const response = await handleAPI({
        name: "VendorPaymentMarkPrintChecks",
        params: {},
        method: "POST",
        body: JSON.stringify(obj),
      });
      try {
        if (response && response.trim() !== "{}" && response.trim() !== "[]") {
          setIsLoadingSave(false);
          const selectedBankOption = BankOptions?.find(
            (option) => option?.value === selectedBank?.value
          ) || {
            checkNum: 0,
            label: "",
            selected: false,
            value: "",
          };

          const BankAccount = selectedBankOption.value || 0;
          handleGetCheckNumber({ accountId: Number(BankAccount) });
          getVendorPaymentApprovalData(companyId, EmpId, false);
        }
      } catch (error) {
        setIsLoadingGo(false);
        handleNotification("Error while printing checks.", "error", 0, 6000);
      }
    };
    const ProcessACHPayment = async () => {
      let tBody = "";
      let VendorPayArray = [];
      let VendorPaymentId = "";

      const selectedRow = tableData.filter(({ PayACH }) => PayACH);

      selectedRow.forEach((row) => {
        // Check if VendorPaymentId is not already processed
        if (!VendorPayArray.includes(row.VendorPaymentId)) {
          // Append VendorPaymentId with separator
          VendorPaymentId += `${row.VendorPaymentId}~`;
          const strVendorPaymentId = row.VendorPaymentId.toString();

          // Construct table row
          tBody += `<tr>
        <td>
          <a href="#" 
            RowId="${row.RowId}" 
            VendorId="${row.VendorId}" 
            ContactFileId="0" 
            OtherId="0" 
            ActualVendorStatus="" 
            VendorStatus="" 
            AccountingVendorApproved=0 
            VendorStatusMsg="" 
            onclick="fnOpenPayeeWrapper(this)" 
            VendorStatus="">
            ${row.Payee}
          </a>
        </td>
        <td class="clsACHStatus" id="tdACHStatus${strVendorPaymentId}">
          Processing... 
          <span id="spnACHSpinner${strVendorPaymentId}" style="display:inline-block">
            &nbsp;<i class="glyphicon glyphicon-refresh bigger-150 fa-spin blue"></i>
          </span>
        </td>
        <td id="tdACHResult${strVendorPaymentId}">&nbsp;</td>
        <td id="tdACHOptions${strVendorPaymentId}"></td>
      </tr>`;

          VendorPayArray.push(row.VendorPaymentId);
        }
      });

      setPayStatusHtml(tBody);
      setPayStatusVendorID(VendorPaymentId);
      sethdnBankAcountId(selectedBank.value);

      fnOpenWindow(
        `FeeCollection/Presentation/Webforms/PaymentStaus.aspx?SessionID=${sessionid}&ProcessType=1&CompanyId=${companyId}`,
        "/FeeCollection/Presentation/Webforms/PaymentStaus.aspx",
        sessionid
      );

      const selectedBankOption = BankOptions?.find(
        (option) => option?.value === selectedBank?.value
      ) || {
        checkNum: 0,
        label: "",
        selected: false,
        value: "",
      };

      const BankAccountId = selectedBankOption.value || 0;

      let obj = {
        VendorPaymentId: VendorPaymentId,
        BankAccountId: BankAccountId,
        EmpNum: EmpId,
      };
      console.log("VendorPaymentApprovalACHPayments ===> ", obj);
      // return; //-remove
      const response = await handleAPI({
        name: "VendorPaymentApprovalACHPayments",
        params: {},
        method: "POST",
        body: JSON.stringify(obj),
      });
      if (response && response.trim() !== "{}" && response.trim() !== "[]") {
        //setIsLoadingSave(false);
      }
    };

    const handlePaymentChange = (rowData, value) => {
      // setPaymentMethod(value);
      setShowPaymentSection(true);
      setShowSecondRow(false);
      setShowThirdRow(false);

      // Get all rows including child rows flattened into single array
      //const allRows = [...tableData];

      const rdoACH = document.getElementById(`chkACHApproved${rowData.RowId}`),
        rdoCheck = document.getElementById(`chkPrintChecks${rowData.RowId}`);
      if (rdoACH) rdoACH.checked = value === "ach";
      if (rdoCheck) rdoCheck.checked = value === "check";

      setRowData((prevData) => {
        const data = prevData.map((row) => {
          if (row.VendorPaymentId === rowData.VendorPaymentId) {
            row.PayACH = value === "ach";
            row.PayCheck = value === "check";
            // row.Change = 1;
          } else {
            if (value === "ach") row.PayCheck = false;
            else if (value === "check") row.PayACH = false;
            const radioACH = document.getElementById(
                `chkACHApproved${row.RowId}`
              ),
              radioCheck = document.getElementById(
                `chkPrintChecks${row.RowId}`
              );
            if (radioACH && value === "check") radioACH.checked = false;
            if (radioCheck && value === "ach") radioCheck.checked = false;
          }
          return { ...row };
        });
        return [...data];
      });

      //// Check if there are any existing selections in main or child rows
      //const existingSelections = allRows.find(
      //  (row) => (row.PayACH || row.PayCheck) && row.RowId !== rowData.RowId
      //);

      //// Set the new selection in main data
      //const targetRow = allRows.find((row) => row.RowId === rowData.RowId);
      //if (targetRow) {
      //  targetRow.PayACH = value === "ach";
      //  targetRow.PayCheck = value === "check";

      //  // If this is a parent row, set the same payment method for all its child rows
      //  if (groupedData[rowData.VendorPaymentId]) {
      //    groupedData[rowData.VendorPaymentId].forEach((childRow) => {
      //      childRow.PayACH = value === "ach";
      //      childRow.PayCheck = value === "check";
      //    });
      //  }
      //}

      //// Set the new selection in child rows if it's a child row being selected
      //Object.values(groupedData).forEach((childRows) => {
      //  const targetChildRow = childRows.find(
      //    (row) => row.RowId === rowData.RowId
      //  );
      //  if (targetChildRow) {
      //    targetChildRow.PayACH = value === "ach";
      //    targetChildRow.PayCheck = value === "check";
      //  }
      //});

      //setLocalData([...localData]);
      //updateSelectedRows();
    };

    const handleCheckboxChange = (row, checked) => {
      const childRows = groupedData[row.VendorPaymentId] || [];

      // Get existing payment method
      const existingPaymentMethod = localData.find(
        (r) => r.PayACH || r.PayCheck
      );
      const paymentType = existingPaymentMethod?.PayACH
        ? "ach"
        : existingPaymentMethod?.PayCheck
        ? "check"
        : null;

      if (checked && paymentType) {
        row[paymentType === "ach" ? "PayACH" : "PayCheck"] = true;
        childRows.forEach((childRow) => {
          childRow[paymentType === "ach" ? "PayACH" : "PayCheck"] = true;
        });
      }

      const filteredRows = selectedRows.filter(
        (r) =>
          r.RowId !== row.RowId &&
          !childRows.some((child) => child.RowId === r.RowId)
      );

      const newSelectedRows = checked ? [...filteredRows, row] : filteredRows;

      setSelectedRows(newSelectedRows);
      updateSelectedRows();
    };

    const enhancedColumns = columns.map((col) => {
      if (col.field === "paymentMethodHeader") {
        return {
          ...col,
          body: (rowData) => {
            const childRows = groupedData[rowData.VendorPaymentId] || [];
            const FilterchildRows = childRows.filter(
              (row) => row.RowId !== rowData.RowId
            );

            //const hasChildRows = childRows.length > 0;

            //if (hasChildRows && rowData === childRows[0]) {
            //  console.log({ rowData });

            //  return null; // Skip the first child row
            //}

            if (rowData.VendorId === 166624) {
              return (
                <div className="center-container">
                  <button
                    tabIndex={0}
                    className="btnCustom"
                    onClick={() =>
                      handlePayHUD(
                        rowData.VendorPaymentId,
                        rowData.isParentRow,
                        rowData.VendorPaymentDetailId
                      )
                    }
                  >
                    {rowData.isParentRow ? "Pay All HUD" : "Pay HUD"}
                  </button>
                </div>
              );
            } else if (rowData.VendorId === 167753) {
              return (
                <div className="center-container">
                  <button
                    tabIndex={0}
                    className="btnCustom"
                    onClick={() =>
                      handlePayVA(
                        rowData.VendorPaymentId,
                        rowData.isParentRow,
                        rowData.VendorPaymentDetailId
                      )
                    }
                  >
                    {rowData.isParentRow ? "Pay All VA" : "Pay VA"}
                  </button>
                </div>
              );
            }

            const selectedValue = (childRows[0] || rowData).PayACH
              ? "ach"
              : (childRows[0] || rowData).PayCheck
              ? "check"
              : "";

            return (
              <div className="flex gap-2">
                {rowData.ACHApproved === 2 ? (
                  <span className="whitespace-normal text-center text-red-500 text-xs font-bold">
                    ACH Refused
                  </span>
                ) : (
                  <div className="flex items-center gap-1">
                    <span
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if ([32, 13].includes(e.keyCode)) {
                          e.preventDefault();
                          handlePaymentChange(
                            rowData,
                            selectedValue === "ach" ? null : "ach"
                          );
                          if (FilterchildRows.length !== 0) {
                            setExpandedRows((prev) => [...prev, rowData]);
                          }
                          handleCheckboxChange(rowData, true);
                        }
                      }}
                      className="cursor-pointer rounded-full width-[20px] height-[20px] pl-[3px] pr-[3px] pt-[0px] pb-[2px]"
                    >
                      <input
                        tabIndex={-1}
                        type="radio"
                        id={`chkACHApproved${rowData.RowId}`}
                        name={`payment-${rowData.RowId}`}
                        value="ach"
                        // checked={selectedValue === "ach"}
                        onChange={(e) => {}}
                        onClick={(e) => {
                          handlePaymentChange(
                            rowData,
                            selectedValue === "ach" ? null : "ach"
                          );
                          //if (FilterchildRows.length !== 0) {
                          //  setExpandedRows((prev) => [...prev, rowData]);
                          //}
                          handleCheckboxChange(rowData, true);
                        }}
                        className="cursor-pointer"
                      />
                    </span>
                    <label
                      htmlFor={`chkACHApproved${rowData.RowId}`}
                      className="text-[12px] text-black-900 cursor-pointer"
                    >
                      ACH
                    </label>
                  </div>
                )}

                <div className="flex items-center gap-1">
                  <span
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if ([32, 13].includes(e.keyCode)) {
                        e.preventDefault();
                        handlePaymentChange(
                          rowData,
                          selectedValue === "check" ? null : "check"
                        );
                        //if (FilterchildRows.length !== 0) {
                        //  setExpandedRows((prev) => [...prev, rowData]);
                        //}
                        handleCheckboxChange(rowData, true);
                      }
                    }}
                    className="cursor-pointer rounded-full width-[20px] height-[20px] pl-[2px] pr-[2px] pt-[0px] pb-[2px]"
                  >
                    <input
                      type="radio"
                      tabIndex={-1}
                      id={`chkPrintChecks${rowData.RowId}`}
                      name={`payment-${rowData.RowId}`}
                      value="check"
                      // checked={selectedValue === "check"}
                      onChange={(e) => {}}
                      onClick={(e) => {
                        handlePaymentChange(
                          rowData,
                          selectedValue === "check" ? null : "check"
                        );
                        //if (FilterchildRows.length !== 0) {
                        //  setExpandedRows((prev) => [...prev, rowData]);
                        //}
                        handleCheckboxChange(rowData, true);
                      }}
                      className="cursor-pointer"
                    />
                  </span>
                  <label
                    htmlFor={`chkPrintChecks${rowData.RowId}`}
                    className="text-[12px] text-black-900 cursor-pointer"
                  >
                    Check
                  </label>
                </div>
              </div>

              //<RadioGroup
              //  name={`payment-${rowData.RowId}`}
              //  selectedValue={selectedValue}
              //  onChange={(e) => {
              //    handlePaymentChange(rowData, e);
              //    if (FilterchildRows.length !== 0) {
              //      setExpandedRows((prev) => [...prev, rowData]);
              //    }
              //    handleCheckboxChange(rowData, true);
              //  }}
              //  className="flex gap-2"
              //>
              //  {rowData.ACHApproved === 2 ? (
              //    <span
              //      style={{
              //        color: "red",
              //        fontSize: "12px",
              //        fontWeight: "bold",
              //      }}
              //    >
              //      Refused
              //    </span>
              //  ) : (
              //    <Radio
              //      tabIndex={0}
              //      value="ach"
              //      label="ACH"
              //      id={`chkACHApproved${rowData.RowId}`}
              //      className="text-[12px] text-black-900"
              //    />
              //  )}
              //  <Radio
              //    tabIndex={0}
              //    value="check"
              //    label="Check"
              //    id={`chkPrintChecks${rowData.RowId}`}
              //    className="text-[12px] text-black-900"
              //  />
              //</RadioGroup>
            );
          },
        };
      }
      return col;
    });

    const handlePayHUD = (VendorPaymentId, isPayAll, vendorPaymentDetailId) => {
      savevendorPayment({
        VendorPaymentId,
        isCheck: true,
        isPayAll,
        vendorPaymentDetailId,
        isHudVa: true,
      });
      setTimeout(() => {
        handlePayHUDCallBack(VendorPaymentId);
      }, 750);
    };
    const handlePayHUDCallBack = (VendorPaymentId) => {
      const HudVendorPaymentId = VendorPaymentId + "~";
      sethdnGlo_Hud_VA(HudVendorPaymentId);
      sethdnpayCheck("0");
      //console.log(HudVendorPaymentId)
      fnOpenWindow(
        `FeeCollection/Presentation/Webforms/PaymentStaus.aspx?SessionID=${sessionid}&ProcessType=2&CompanyId=${companyId}`,
        "/FeeCollection/Presentation/Webforms/PaymentStaus.aspx",
        sessionid
      );
    };
    const handlePayVA = (VendorPaymentId, isPayAll, vendorPaymentDetailId) => {
      savevendorPayment({
        VendorPaymentId,
        isCheck: false,
        isPayAll,
        vendorPaymentDetailId,
        isHudVa: true,
      });
      setTimeout(() => {
        handlePayVACallBack(VendorPaymentId);
      }, 750);
    };
    const handlePayVACallBack = (VendorPaymentId) => {
      const VAVendorPaymentId = VendorPaymentId + "~";
      sethdnGlo_Hud_VA(VAVendorPaymentId);
      sethdnpayCheck("1");
      fnOpenWindow(
        `FeeCollection/Presentation/Webforms/PaymentStaus.aspx?SessionID=${sessionid}&ProcessType=3&CompanyId=${companyId}`,
        "/FeeCollection/Presentation/Webforms/PaymentStaus.aspx",
        sessionid
      );
    };
    const updateSelectedRows = () => {
      const selectedRows = [];

      localData.forEach((row) => {
        if (row.PayACH || row.PayCheck) {
          selectedRows.push(row);

          // Get and filter child rows
          const childRow = groupedData[row.VendorPaymentId] || [];
          const childRows = childRow.filter((r) => r.RowId !== row.RowId);

          childRows.forEach((childRow) => {
            childRow.PayACH = row.PayACH;
            childRow.PayCheck = row.PayCheck;
            selectedRows.push(childRow);
          });
        }
      });

      // Handle individually selected child rows
      Object.values(groupedData).forEach((groupChildren) => {
        const filteredChildren = groupChildren.filter(
          (child) =>
            (child.PayACH || child.PayCheck) &&
            !selectedRows.some((r) => r.RowId === child.RowId)
        );
        selectedRows.push(...filteredChildren);
      });

      setSelectedRows(selectedRows);

      const total = selectedRows.reduce((sum, row) => {
        const subtotal = FormatValueforCalc(row.SubTotal);
        return sum + (parseFloat(subtotal) || 0);
      }, 0);

      //  unique count based on VendorPaymentId
      const uniqueVendorPayments = new Set(
        selectedRows.map((row) => row.VendorPaymentId)
      );

      setmarkPaid(total);
      setSelectedCount(uniqueVendorPayments.size);
    };
    const getVendorACHStatus = async ({ vendorId }) => {
      return await handleAPI({
        name: "getVendorACHStatus",
        params: { vendorId },
        method: "GET",
      }).then((response) => {
        return Number(response);
      });
    };
    const toggleRow = (data) => {
      setExpandedRows((prev) => {
        if (prev.some((row) => row.RowId === data.RowId)) {
          return prev.filter((row) => row.RowId !== data.RowId);
        }
        return [...prev, data];
      });
    };

    const expandTemplate = (data) => {
      const rows = groupedData[data.VendorPaymentId] || [];
      const childRows = rows.filter((row) => row.RowId !== data.RowId);

      if (childRows.length === 0) {
        return null;
      }
      return (
        <button
          id={`expand-button-${data.RowId}`}
          tabIndex={0}
          onKeyDown={(e) => {
            if ([32, 13].includes(e.keyCode)) {
              e.preventDefault();
              document.getElementById(`expand-button-${data.RowId}`).click();
            }
          }}
          onClick={() => toggleRow(data)}
          className="p-1 hover:bg-gray-100 rounded"
        >
          {expandedRows.some((row) => row.RowId === data.RowId) ? (
            <FontAwesomeIcon
              icon={faChevronDown}
              className="text-gray-600 transition-transform"
            />
          ) : (
            <FontAwesomeIcon
              icon={faChevronRight}
              className="text-gray-600 transition-transform"
            />
          )}
        </button>
      );
    };

    const rowExpansionTemplate = (data) => {
      // Add safety check
      const rows = groupedData[data.VendorPaymentId] || [];
      const childRows = rows.filter((row) => row.RowId !== data.RowId);
      if (childRows.length === 0) {
        return null;
      }

      const emptyChildRow = {
        ...data,
        PayACH: data.PayACH,
        RowId: data.RowId, // Use timestamp instead of max
        ClassName: fieldMaps.classNameMap[data.VendorPaymentId] || "",
        GLAccount: fieldMaps.glAccountMap[data.VendorPaymentId] || "",
        InvoiceDate: fieldMaps.invoiceDateMap[data.VendorPaymentId] || "",
        Invoice: fieldMaps.invoiceMap[data.VendorPaymentId] || "",
        Memo: fieldMaps.memoMap[data.VendorPaymentId] || "",
        VendorPaymentId: data.VendorPaymentId,
      };

      // Check if empty child row already exists
      const emptyRowExists = rows.some(
        (row) => row.RowId === emptyChildRow.RowId
      );

      if (!emptyRowExists) {
        // Push the empty child row to groupedData
        groupedData[data.VendorPaymentId] = [emptyChildRow, ...childRows];
      }

      const allRows = groupedData[data.VendorPaymentId] || [];

      return (
        <>
          <table className="table-auto w-full">
            <thead>
              <tr>
                {expandedColumns.map((col, i) => (
                  <th
                    key={col.field}
                    style={{
                      width:
                        document.querySelectorAll(".p-resizable-column")[i]
                          .clientWidth ||
                        Number(col.style?.width.replace("px", "")) +
                          // (i > 4 ? -3 : 0) +
                          "px" ||
                        "auto",
                      padding: 0,
                    }}
                    className="text-left bg-gray-100 text-sm border-none font-medium text-black-900"
                  ></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allRows.map((childRow, index) => (
                <tr key={index} className="p-row border-none">
                  <td className="w-[25px] flex-shrink-0 border-none"></td>
                  {enhancedColumns.map((col, colIndex) => (
                    <td key={colIndex} className="p-col border-none">
                      {col.field === "Payee" ? (
                        <div className="flex flex-col items-start justify-center h-full px-4">
                          <div
                            className="text-[10px] font-normal text-black-900"
                            dangerouslySetInnerHTML={{
                              __html:
                                childRow?.LastPaidDetails?.replace(
                                  /<b>/g,
                                  ""
                                ).replace(/<\/b>/g, "") || "",
                            }}
                          />
                        </div>
                      ) : col.field === "GLAccount" ? (
                        editingCell === `${childRow.RowId}-${col.field}` ? (
                          <GroupSelect
                            isChildRow={true}
                            size="sm"
                            shape="round"
                            menuPlacement={
                              index >= allRows.length - 5 ? "top" : "auto"
                            }
                            options={accounts.map((opt) => ({
                              label: `${opt.Account_Id} - ${opt.Account_Name}`,
                              value: opt.Account_Id,
                              Account_Id: opt.Account_Id,
                              Account_Name: opt.Account_Name,
                            }))}
                            name="Account"
                            valueKey="Account_Id"
                            labelKey="label"
                            sessionid={sessionid}
                            value={
                              parseInt(
                                childRow[col.field]?.split("-")[0]?.trim()
                              ) || 0
                            }
                            Account_Id={
                              parseInt(
                                childRow[col.field]?.split("-")[0]?.trim()
                              ) || 0
                            }
                            RowId={childRow.RowId}
                            handleRemove={handleRemove}
                            onChange={(selected) => {
                              const selectedEntityLabel = selected[1];
                              childRow[
                                col.field
                              ] = `${selectedEntityLabel.value}`;
                              childRow.Change = 1;
                              setIsSaveEnabled(true);
                              setLocalData([...localData]);
                              //setEditingCell(null);
                            }}
                            onBlur={() => {
                              //setEditingCell(null);
                            }}
                            showSearch={true}
                            placeholder="Search GL Account"
                            showAddPaymentSplit={false}
                            showRemoveRow={false}
                            style={{
                              margin: 0,
                              border: "none",
                            }}
                          />
                        ) : (
                          <div
                            tabIndex={0}
                            onFocus={(e) => {
                              e.stopPropagation();
                              setEditingCell(`${childRow.RowId}-${col.field}`);
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingCell(`${childRow.RowId}-${col.field}`);
                            }}
                            className="text-[14px] font-normal text-black-900 cursor-pointer"
                          >
                            {childRow[col.field] || ""}
                          </div>
                        )
                      ) : col.field === "ClassName" ? (
                        editingCell === `${childRow.RowId}-${col.field}` ? (
                          <GroupSelect
                            isChildRow={true}
                            size="sm"
                            shape="round"
                            menuPlacement={
                              index >= allRows.length - 5 ? "top" : "auto"
                            }
                            options={Class.map((opt) => ({
                              label: `${opt.label}`,
                              value: opt.Class_Id,
                              Class_Id: opt.Class_Id,
                              Class_Name: opt.Class_Name,
                            }))}
                            name="Class"
                            valueKey="Class_Id"
                            labelKey="label"
                            sessionid={sessionid}
                            value={parseInt(childRow[col.field])}
                            Class_Id={parseInt(childRow[col.field])}
                            RowId={childRow.RowId}
                            handleRemove={handleRemove}
                            onChange={(selected) => {
                              const selectedEntityLabel = selected[1];
                              childRow[
                                col.field
                              ] = `${selectedEntityLabel.value}`;
                              childRow.Change = 1;
                              setLocalData([...localData]);
                              //setEditingCell(null);
                              setIsSaveEnabled(true);
                            }}
                            onBlur={() => {
                              //setEditingCell(null);
                            }}
                            showSearch={true}
                            placeholder="Search Department"
                            showAddPaymentSplit={false}
                            showRemoveRow={false}
                            style={{
                              margin: 0,
                              border: "none",
                            }}
                          />
                        ) : (
                          <div
                            tabIndex={0}
                            onFocus={(e) => {
                              e.stopPropagation();
                              setEditingCell(`${childRow.RowId}-${col.field}`);
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingCell(`${childRow.RowId}-${col.field}`);
                            }}
                            className="text-[14px] font-normal text-black-900 cursor-pointer"
                          >
                            {childRow[col.field] || ""}
                          </div>
                        )
                      ) : col.field === "TotalAmount" ||
                        col.field === "InvoiceDate" ||
                        col.field === "Invoice" ||
                        col.field === "Memo" ? (
                        editingCell === `${childRow.RowId}-${col.field}` ? (
                          <input
                            type="text"
                            value={
                              col.field === "TotalAmount"
                                ? childRow.SubTotal
                                : childRow[col.field] || ""
                            }
                            onChange={(e) => {
                              const newValue = e.target.value;
                              if (col.field === "TotalAmount") {
                                childRow.SubTotal = newValue;
                              } else {
                                childRow[col.field] = newValue;
                              }
                              childRow.Change = 1;
                              setLocalData([...localData]);
                              setIsSaveEnabled(true);
                            }}
                            className="text-[12px] font-normal text-black-900 clsGridInput w-full"
                            onBlur={() => {
                              setEditingCell(null);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                          />
                        ) : (
                          <span
                            tabIndex={0}
                            onFocus={(e) => {
                              e.stopPropagation();
                              setEditingCell(`${childRow.RowId}-${col.field}`);
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingCell(`${childRow.RowId}-${col.field}`);
                            }}
                            className="text-[14px] font-normal text-black-900 cursor-pointer"
                          >
                            {col.field === "TotalAmount"
                              ? childRow.SubTotal
                              : childRow[col.field] || ""}
                          </span>
                        )
                      ) : ["paymentMethodHeader", "MarkPaid"].includes(
                          col.field
                        ) ? (
                        <span
                          className={
                            [166624, 167753].includes(
                              Number(childRow["VendorId"])
                            )
                              ? ""
                              : "pointer-events-none opacity-0"
                          }
                        >
                          {col.body(childRow)}
                        </span>
                      ) : col.body ? (
                        col.body(childRow)
                      ) : (
                        childRow[col.field]
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </>
      );
    };
    const addRow = async () => {
      const newRow = await createNewRow();

      if (!groupedData) {
        groupedData = {};
      }

      groupedData[newRow.VendorPaymentId] = [newRow];
      setRowData((prevData) => [newRow, ...prevData]);
      handleTriggerPayee(newRow.RowId);
      //setTimeout(() => {
      //  const firstEditableField = "Payee";
      //  setEditingCell(`${newRow.RowId}-${firstEditableField}`);
      //}, 100);
    };
    function saveDataWithChildren(localData) {
      let resultArray = [];

      // Process main rows
      localData.forEach((row) => {
        // Get child rows for this VendorPaymentId
        const childRows = groupedData[row.VendorPaymentId] || [];
        const hasChildRows = childRows.length > 0;
        let originalValues = hasChildRows ? childRows[0] : {};

        // Update main row fields if child rows exist
        if (hasChildRows) {
          row.GLAccount = originalValues?.GLAccount || "0";
          row.ClassName = originalValues?.ClassName || "0";
          row.SubTotal = originalValues?.SubTotal || "0";
          row.Invoice = originalValues?.Invoice || "";
          row.Memo = originalValues?.Memo || "";
          row.InvoiceDate = originalValues?.InvoiceDate || "";
        }

        // Push the main row to the result array
        resultArray.push(row);

        // Filter and push changed child rows
        const changedChildRows = childRows.filter(
          (childRow) => childRow.Change === 1 && childRow.RowId !== row.RowId
        );

        if (changedChildRows.length > 0) {
          resultArray = [...resultArray, ...changedChildRows];
        }
      });

      return resultArray;
    }
    const savevendorPayment = async ({
      VendorPaymentId: iVendorPaymentId = "",
      isCheck: iIsCheck = false,
      showMessage = true,
      isPayAll = false,
      vendorPaymentDetailId,
      isHudVa = false,
    } = {}) => {
      let ChangeXML = "";
      const changedJSON = [];
      const processedData =
        (dataArray || []).length > 0
          ? dataArray
          : saveDataWithChildren(localData);

      processedData.forEach((val) => {
        const RowId = val.RowId;
        const childRow = groupedData[val.VendorPaymentId] || [];
        const childRows = childRow.filter((row) => row.RowId !== val.RowId);
        const hasChildRows = childRows.length > 0;
        let originalValues = childRows[0];
        let SplitAccounts = "";
        // Use original values if child rows exist
        //if (hasChildRows) {
        //   SplitAccounts = originalValues.GLAccount.split('-');
        // }
        // else {
        SplitAccounts = val.GLAccount.split("-");
        // }
        let VendorId = val.VendorId;
        let TotalAmount = val.TotalAmount;
        const Accounts = SplitAccounts[0] || "0";

        let ClassName, ClassAmount, RefNo, InvNum, InvDate;
        // if (hasChildRows) {

        //   ClassName = originalValues?.ClassName || '0'
        //   // Form values
        //   ClassAmount = originalValues?.SubTotal || '0';
        //   RefNo = originalValues?.Invoice || '';
        //   InvNum = originalValues?.Memo || '';
        //   InvDate = originalValues?.InvoiceDate || '';
        // }
        // else {

        ClassName = val.ClassName;

        // Form values
        if (hasChildRows) {
          ClassAmount = val.SubTotal;
        } else {
          ClassAmount = TotalAmount;
        }
        RefNo = val.Invoice;
        InvNum = val.Memo;
        InvDate = val.InvoiceDate;

        // }
        const DueDate = val.InvoiceDue;
        const PayOn = val.Payon;
        const VendorPaymentId = val.VendorPaymentId;
        const VendorPaymentDetailId = val.VendorPaymentDetailId;

        // Class handling
        let ClassId = "0";
        Class.some((item) => {
          if (item.Class_Name === ClassName) {
            ClassId = item.Class_Id;
            return true;
          }
          return false;
        });

        // Entity Type handling
        // const EntityType = document.querySelector(`#drpVendors${RowId}`)?.getAttribute("EntityType") ||
        //   (VendorPaymentId !== val.VendorPaymentId ? 0 : undefined);

        let EntityType = "0";
        vendors.some((item) => {
          if (item.VendorId === val.VendorId) {
            EntityType = item.Entity_Type;
            return true;
          }
          return false;
        });

        // Checkbox states
        const Status = document.getElementById(`chkApprove${RowId}`)?.checked
          ? 2
          : 0;
        const Paid = document.getElementById(`chkMarkaspaid${RowId}`)?.checked
          ? 1
          : 0;

        const ApprovedBy = Status === 0 ? "" : ApprovedBy;

        // Format values
        TotalAmount = FormatValueforCalc(TotalAmount);
        ClassAmount = FormatValueforCalc(ClassAmount);
        let Change = (val.Change || 0).toString();

        let PayACH = 0;

        const rdoACH = document.getElementById(`chkACHApproved${RowId}`),
          rdoCheck = document.getElementById(`chkPrintChecks${RowId}`);

        if (rdoACH && rdoACH?.checked) {
          PayACH = 1;
          Change = 1;
          iVendorPaymentId = VendorPaymentId;
          iIsCheck = false;
        } else if (rdoCheck && rdoCheck?.checked) {
          PayACH = 2;
          Change = 1;
          iVendorPaymentId = VendorPaymentId;
          iIsCheck = true;
        }
        if (isHudVa && !isPayAll) {
          if (VendorPaymentDetailId == vendorPaymentDetailId) {
            PayACH = iIsCheck ? 2 : 1;
            Change = 1;
          }
        } else if (VendorPaymentId == iVendorPaymentId) {
          PayACH = iIsCheck ? 2 : 1;
          Change = 1;
        }

        const result = OnloadData.find((e) => e.RowId === val.RowId);

        if (((result && Change == 1) || Paid == 1) && !val.isNewRow) {
          const changeobj = {
            VendorPaymentId,
            VendorId,
            VendorPaymentDetailId,
            EntityType,
            ApprovedBy,
            ApprovedOn: "",
          };

          // Compare with OnloadData and add changed fields
          if (FormatValueforCalc(result.TotalAmount) != TotalAmount) {
            changeobj.TotalAmount = TotalAmount;
          }

          if (result.InvoiceDate != InvDate) {
            changeobj.InvoiceDate = InvDate;
          }

          if (result.InvoiceDue != DueDate) {
            changeobj.InvoiceDue = DueDate;
          }

          if (result.Invoice != RefNo) {
            changeobj.RefNo = RefNo;
          }

          if (result.Memo != InvNum) {
            changeobj.Memo = InvNum;
          }

          if (result.Payon != PayOn) {
            changeobj.Payon = PayOn;
          }
          if (result.GLAccount.split("-")[0].trim() != Accounts) {
            changeobj.AccountId = Accounts;
          }

          if (parseInt(result.Class) != parseInt(ClassId)) {
            changeobj.Class = ClassId;
          }

          if (FormatValueforCalc(result.SubTotal) !== ClassAmount) {
            changeobj.Amount = ClassAmount;
          }

          if (parseInt(result.Status) != parseInt(Status)) {
            changeobj.Status = Status;
          }

          if (result.ACHApprovedDetail != PayACH || (PayACH && Change == 1)) {
            changeobj.PayACH = PayACH;
          }

          if (
            result.ACHApprovedDetail == 0 &&
            result.ACHApprovedDetail != Paid
          ) {
            changeobj.Paid = Paid;
          }

          if (Paid == 1 && result.ACHApprovedDetail != 3) {
            changeobj.Paid = Paid;
          }

          changedJSON.push(changeobj);
        } else if (val.isNewRow) {
          const changeobj = {
            VendorPaymentId,
            VendorId,
            VendorPaymentDetailId,
            EntityType,
            ApprovedBy,
            ApprovedOn: "",
            TotalAmount,
            InvoiceDate: InvDate,
            InvoiceDue: DueDate,
            RefNo: RefNo,
            Memo: InvNum,
            Payon: PayOn,
            AccountId: Accounts,
            Class: ClassId,
            Amount: ClassAmount,
            Status: Status,
            PayACH: PayACH,
            Paid: Paid,
          };
          changedJSON.push(changeobj);
        }
        Change = Paid == 1 ? 1 : Change;
        ChangeXML += `<row VendorPaymentId="${VendorPaymentId}" VendorId="${VendorId}" TotalAmount="${TotalAmount}" InvoiceDate="${InvDate}" InvoiceDue="${DueDate}" RefNo="${RefNo}" Memo="${InvNum}" Payon="${PayOn}" Status="${Status}" ApprovedBy="${ApprovedBy}" ApprovedOn="" VendorPaymentDetailId="${VendorPaymentDetailId}" AccountId="${Accounts}" Class="${ClassId}" Amount="${ClassAmount}" Change="${Change}" Paid="${Paid}" PayACH="${PayACH}" EntityType="${EntityType}"/>`;
      });
      ChangeXML = `<PaymentSave BankAccountId="${selectedBank.value}">${ChangeXML}</PaymentSave>`;
      console.log({ ChangeXML, changedJSON });
      // return; //-remove
      // Replace quotes for proper formatting
      ChangeXML = ChangeXML.replaceAll('"', "~").replaceAll("~", '\\"');
      const jsonString = JSON.stringify(changedJSON);

      let obj = { SaveXml: ChangeXML, changedJSON: jsonString };
      const response = await handleAPI({
        name: "VendorMonthlySave",
        params: {},
        method: "POST",
        body: JSON.stringify(obj),
      });
      let isSaved = false;

      try {
        isSaved =
          !response || response.trim() === "{}" || response.trim() === "[]";
      } catch (error) {}

      if (!isSaved) {
        try {
          isSaved = JSON["parse"](response)["Table"].length > 0;
        } catch (error) {}
      }
      if (isSaved) {
        showMessage && handleNotification("Saved Successfully.");
        setIsSaveEnabled(false);
        setRowData((prevData) => {
          return [
            ...prevData
              .filter(
                ({ RowId }) =>
                  !document.getElementById(`chkMarkaspaid${RowId}`)?.checked
              )
              .map((item) => {
                item.Change = 0;
                item.isNewRow = false;
                return item;
              }),
          ];
        });
        setTimeout(() => {
          document.getElementById("idTriggerDuplicateValidation")?.click();
        }, 1000);
      }
    };

    useImperativeHandle(ref, () => ({
      addRow,
      savevendorPayment,
      handlePaymentProcess,
      ProcessPrintChecks,
      SavePrintCheckPayment,
    }));
    const createNewRow = async () => {
      let obj = {
        CompanyId: companyId,
        UserId: EmpId,
      };
      try {
        // Await the API response
        const response = await handleAPI({
          name: "AddNewPayee",
          params: obj,
        });

        // Extract the RowId and VendorPaymentId from the response
        const parsedResponse = JSON.parse(response);
        let responseJson = parsedResponse?.Table?.[0]?.VendorPayment || "";

        responseJson = JSON.parse(responseJson);
        const processedData = responseJson.VendorPayment[0]?.PaymentInfo[0];
        const RowId = processedData.RowId;
        const VendorPaymentId = processedData.VendorPaymentId;
        const VendorPaymentDetailId = processedData.VendorPaymentDetailId;

        // Return the new row object with the fetched RowId
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
          RowId: RowId, // Set RowId from response or fallback
          VendorPaymentId: VendorPaymentId, // Set VendorPaymentId from response or fallback
          VendorPaymentDetailId: VendorPaymentDetailId,
          ACHApprovedDetail: 0,
          imagesHeader: "Upload",
          Paid: "0",
          PayACH: false,
          ClassAmount: "",
          isNewRow: true,
          RefNo: "",
          AccountId: "",
          Class: "",
          Amount: "",
          // Add other fields as empty or default values
        };
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    const expandedColumns = useMemo(() => {
      return [
        {
          expander: true,
          bodyClassName: "empty-row",
          field: "expand",
          "data-field": "expand",
          body: expandTemplate,
          style: { width: "25px" },
        },
        ...enhancedColumns,
      ].map((item) => {
        const { bodyClassName, field } = item;
        if (
          bodyClassName !== "empty-row" &&
          ["GLAccount", "ClassName"].includes(field)
        ) {
          item["bodyClassName"] = ({ isParentRow }) =>
            isParentRow ? bodyClassName + " empty-row" : bodyClassName;
        }
        return item;
      });
    }, [enhancedColumns, parentRows, tableData]);

    const handleTableHeight = () => {
      try {
        const tableHeight =
          document.querySelector("#main-header")?.offsetHeight +
          document.querySelector(".p-datatable-header")?.offsetHeight +
          document.querySelector(".fixed-footer")?.offsetHeight +
          90;

        document.documentElement.style.setProperty(
          "--table-height",
          window.innerHeight - tableHeight + "px"
        );
      } catch (error) {
        document.documentElement.style.setProperty("--table-height", "auto");
      }
    };
    useEffect(() => {
      window.addEventListener("resize", handleTableHeight);
      return () => {
        window.removeEventListener("resize", handleTableHeight);
      };
    }, []);
    useEffect(() => {
      document.documentElement.style.setProperty("--table-height", "auto");
      handleTableHeight();
    }, [isLoading]);
    handleTableHeight();
    const header = (
        <div className="table-header" id="table-header">
          <h6>{tableTitle}</h6>
          <div className="flex w-full justify-between items-center">
            <div className="flex-start flex gap-2">
              <Button
                leftIcon={
                  <Img
                    src="images/img_grid.svg"
                    alt="Grid"
                    className="h-[18px] w-[18px]"
                  />
                }
                className="flex h-[38px] min-w-[146px] flex-row items-center justify-center gap-2.5 rounded-lg border border-solid border-indigo-700 bg-indigo-400 px-[19px] text-center font-inter text-[12px] font-bold text-white-a700"
                onClick={addRow}
              >
                Add Payment
              </Button>
              {/* <Button
              leftIcon={<Img src="payment/images/img_grid.svg" alt="Grid" className="h-[18px] w-[18px]" />}
              className="flex h-[38px] min-w-[176px] flex-row items-center justify-center gap-2.5 rounded-lg border border-solid border-indigo-700 bg-indigo-400 px-[19px] text-center font-inter text-[12px] font-bold text-white-a700"
            >
              Add Payment Split
            </Button> */}
            </div>
            <div className="flex-end">
              {paginator && (
                <input
                  className="input-field"
                  type="search"
                  onInput={(e) => setGlobalFilter(e.target.value)}
                  placeholder="Search"
                />
              )}
            </div>
          </div>
        </div>
      ),
      footer = () => (
        <div>
          <div>
            <select
              value={rows}
              className="entries-per-page"
              onChange={(e) => setRows(e.target.value)}
            >
              {rowsPerPageOptions.map((rowNumber, i) => (
                <option key={i} value={rowNumber}>
                  {rowNumber}
                </option>
              ))}
            </select>
            entries per page
          </div>
          {totalRecords > 0 ? (
            <p>
              Showing {start} to {end} of {totalRecords} entries
            </p>
          ) : (
            <p>Showing 0 to 0 of 0 entries</p>
          )}
        </div>
      );

    const onPageChange = (event) => {
      setFirst(event.first);
      setRows(event.rows);
    };
    const cellEditor = (options) => {
      //if (editingCell && options.rowData.isParentRow) {
      //  setEditingCell(null);
      //}
      let rowId = options.rowData.RowId,
        rowIndex = tableData.findIndex((x) => x.RowId === rowId),
        rowData = {};

      if (rowIndex === -1) {
        rowData = parentRows.sort(
          (a, b) =>
            paymentIdOrder.indexOf(a.VendorPaymentId) -
            paymentIdOrder.indexOf(b.VendorPaymentId)
        )[options["rowIndex"]];
      } else {
        options["rowIndex"] = rowIndex;
        rowData = tableData[options["rowIndex"]];
      }

      options.rowData = {
        ...options.rowData,
        ...tableData[options["rowIndex"]],
      };
      if (
        ["GLAccount", "ClassName"].includes(options.field) &&
        options.rowData.isParentRow
      ) {
        return <></>;
      }

      const isEditing = editingRows[rowId]?.includes(options.field) ?? false;
      const isEditable =
        options.column.props.editable === undefined ||
        (typeof options.column.props.editable === "function"
          ? options.column.props.editable(rowData)
          : options.column.props.editable);

      // Handle non-editable fields
      if (options.field === "Payee" ? !isEditing : !isEditable) {
        return options.column.props.body(rowData);
      } else if (options.field === "GLAccount") {
        return (
          <GroupSelect
            size="sm"
            shape="round"
            options={accounts.map((opt) => ({
              label: `${opt.Account_Id} - ${opt.Account_Name}`,
              value: opt.Account_Id,
              Account_Id: opt.Account_Id,
              Account_Name: opt.Account_Name,
            }))}
            menuPlacement={
              options.rowIndex >= tableData.length - 5 ? "top" : "auto"
            }
            name="Account"
            valueKey="Account_Id"
            labelKey="label"
            sessionid={sessionid}
            value={rowData.Account_Id}
            Account_Id={rowData.Account_Id}
            RowId={rowData.RowId}
            handleRemove={handleRemove}
            onChange={(selected) => {
              console.log({ selected });

              setRowData((prevData) =>
                prevData.map((row) =>
                  row.RowId === rowData.RowId
                    ? {
                        ...row,
                        Account_Id: selected[0].value,
                        GLAccount: selected[1].value,
                        Change: 1,
                      }
                    : row
                )
              );
              //const selectedEntityLabel = selected[1];

              //options.editorCallback(`${selectedEntityLabel.value}`);
              //const updatedData = {
              //  ...rowData,
              //  GLAccount: selectedEntityLabel.value,
              //};
              //console.log({ updatedData });

              //if (options.onRowUpdate) {
              //  options.onRowUpdate(updatedData);
              //}
            }}
            showSearch={true}
            placeholder="Search GL Account"
            showAddPaymentSplit={false}
            showRemoveRow={false}
          />
        );
      } else if (options.field === "Payee") {
        const hasChildRows = (groupedData[rowData.VendorPaymentId] || []).some(
          (row) => row.RowId !== rowData.RowId
        );

        if (
          hasChildRows &&
          !expandedRows.some((row) => row.RowId === rowData.RowId)
        ) {
          toggleRow(rowData);
        }
        const { VendorPaymentDetailId, VendorPaymentId, Payee = "" } = rowData;

        return (
          <PayeeSearch
            size="sm"
            shape="round"
            options={vendors}
            menuPlacement={
              options.rowIndex >= tableData.length - 5 ? "top" : "auto"
            }
            VendorPaymentDetailId={VendorPaymentDetailId}
            VendorPaymentId={VendorPaymentId}
            name="Vendors"
            valueText={Payee}
            valueKey="VendorId"
            labelKey="label"
            sessionid={sessionid}
            defaultMenuIsOpen={false}
            value={rowData.VendorId}
            VendorId={rowData.VendorId}
            RowId={rowData.RowId}
            companyId={companyId}
            EmpId={EmpId}
            handleRemove={handleRemove}
            showAddPaymentSplit={true} // Control visibility of Add Payment Split
            showRemoveRow={true}
            onChange={async (selected) => {
              if (selected.length > 0 || true) {
                setEditingRows((prev) => {
                  prev[rowData.RowId] = (prev[rowData.RowId] || []).filter(
                    (field) => field !== options.field
                  );
                  return { ...prev };
                });
              }
              const [selectedEntity, selectedEntityLabel] = selected;

              const selectedVendor = vendors.find(
                (vendor) => vendor.VendorId == selectedEntity.value
              );

              options.editorCallback(`${selectedEntityLabel.value}`);

              let account =
                (selectedVendor?.Account_Id || 0) +
                " - " +
                (selectedVendor?.Account_Name || "");
              if (account.startsWith("0 -"))
                account = account.trim().replaceAll("0 -", "");

              const updatedData = {
                ...rowData,
                VendorId: selectedEntity.value,
                Payee: selectedEntityLabel.value,
                GLAccount: account,
                Account_Id: parseInt(selectedVendor?.Account_Id || 0) || "",
                Change: 1,
                ACHApproved: await getVendorACHStatus({
                  vendorId: selectedEntity.value,
                }),
              };

              const updatedGroupedData = { ...groupedData };
              const paymentId = rowData.VendorPaymentId;

              const rRowIndex = tableData.findIndex(
                ({ VendorPaymentId }) => VendorPaymentId == paymentId
              );
              if (rRowIndex !== -1) {
                setRowData((prevRowData) => {
                  prevRowData[rRowIndex] = updatedData;
                  prevRowData[rRowIndex].Change = 1;
                  return [...prevRowData];
                });
                setIsSaveEnabled(true);
              }
              if (updatedGroupedData[paymentId]) {
                updatedGroupedData[paymentId].findIndex(
                  (row) => row.RowId === rowData.RowId
                );

                if (rowIndex !== -1) {
                  updatedGroupedData[paymentId][rowIndex] = updatedData;
                }
              }
              const updatedLocalData = Object.entries(updatedGroupedData).map(
                ([paymentId, rows]) => {
                  const parentRow = rows.reduce((minRow, currentRow) =>
                    currentRow.RowId < minRow.RowId ? currentRow : minRow
                  );

                  const displayParentRow = { ...parentRow };

                  if (rows.length > 1) {
                    displayParentRow.ClassName = "";
                    displayParentRow.GLAccount = "";
                    displayParentRow.InvoiceDate = "";
                    displayParentRow.Invoice = "";
                    displayParentRow.Memo = "";
                  }

                  return {
                    ...displayParentRow,
                    originalClassName: fieldMaps.classNameMap[paymentId],
                    originalGLAccount: fieldMaps.glAccountMap[paymentId],
                    originalInvoiceDate: fieldMaps.invoiceDateMap[paymentId],
                    originalInvoice: fieldMaps.invoiceMap[paymentId],
                    originalMemo: fieldMaps.memoMap[paymentId],
                  };
                }
              );

              const sortedParentRows = [...updatedLocalData].sort(
                (a, b) =>
                  paymentIdOrder.indexOf(a.VendorPaymentId) -
                  paymentIdOrder.indexOf(b.VendorPaymentId)
              );

              setLocalData(sortedParentRows);

              if (options.onRowUpdate) {
                options.onRowUpdate(updatedData);
              }
            }}
            loading={isLoading}
            loadingMessage="Loading Payee"
          />
        );
      } else if (options.field === "ClassName") {
        return (
          <GroupSelect
            size="sm"
            shape="round"
            options={Class.map((opt) => ({
              label: `${opt.label}`,
              value: opt.Class_Id,
              Class_Id: opt.Class_Id,
              Class_Name: opt.Class_Name,
            }))}
            menuPlacement={
              options.rowIndex >= tableData.length - 5 ? "top" : "auto"
            }
            name="Class"
            valueKey="Class_Id"
            labelKey="label"
            sessionid={sessionid}
            value={parseInt(rowData.Class)}
            Class_Id={parseInt(rowData.Class)}
            RowId={rowData.RowId}
            handleRemove={handleRemove}
            onChange={(selected) => {
              const [selectedEntity, selectedEntityLabel] = selected;

              setRowData((prevData) =>
                prevData.map((row) =>
                  row.RowId === rowData.RowId
                    ? {
                        ...row,
                        Class: selectedEntity.value,
                        ClassName: selectedEntityLabel.value,
                        Change: 1,
                      }
                    : row
                )
              );
              return;
              options.editorCallback(`${selectedEntityLabel.value}`);
              const updatedData = {
                ...options.rowData,
                Class: selectedEntity.value,
                ClassName: selectedEntityLabel.value,
              };
              // Update the groupedData by finding the right VendorPaymentId and RowId
              const updatedGroupedData = { ...groupedData };
              const paymentId = options.rowData.VendorPaymentId;

              if (updatedGroupedData[paymentId]) {
                // Find the index of the current row in the grouped data
                const rowIndex = updatedGroupedData[paymentId].findIndex(
                  (row) => row.RowId === options.rowData.RowId
                );

                if (rowIndex !== -1) {
                  // Update the row in groupedData
                  updatedGroupedData[paymentId][rowIndex] = updatedData;
                }
              }
              // Now, update the localData state to reflect the changes
              const updatedLocalData = Object.entries(updatedGroupedData).map(
                ([paymentId, rows]) => {
                  const parentRow = rows.reduce((minRow, currentRow) =>
                    currentRow.RowId < minRow.RowId ? currentRow : minRow
                  );

                  // Create a display copy of the parent row
                  const displayParentRow = { ...parentRow };

                  if (rows.length > 1) {
                    displayParentRow.ClassName = "";
                    displayParentRow.Class = 0;
                    displayParentRow.GLAccount = "";
                    displayParentRow.InvoiceDate = "";
                    displayParentRow.Invoice = "";
                    displayParentRow.Memo = "";
                  }

                  return {
                    ...displayParentRow,
                    originalClassName: fieldMaps.classNameMap[paymentId],
                    originalGLAccount: fieldMaps.glAccountMap[paymentId],
                    originalInvoiceDate: fieldMaps.invoiceDateMap[paymentId],
                    originalInvoice: fieldMaps.invoiceMap[paymentId],
                    originalMemo: fieldMaps.memoMap[paymentId],
                    originalClass: fieldMaps.classMap[paymentId],
                  };
                }
              );

              // Log the updated local data
              console.log("Updated Local Data:", updatedLocalData);

              const sortedParentRows = [...updatedLocalData].sort(
                (a, b) =>
                  paymentIdOrder.indexOf(a.VendorPaymentId) -
                  paymentIdOrder.indexOf(b.VendorPaymentId)
              );

              // Update the state with the new local data
              setLocalData(sortedParentRows);

              // Call onRowUpdate to propagate the updated row data to the parent (if needed)
              if (options.onRowUpdate) {
                options.onRowUpdate(updatedData);
              }
            }}
            showSearch={true}
            placeholder="Search Department"
            showAddPaymentSplit={false}
            showRemoveRow={false}
          />
        );
      } else {
        return (
          <input
            type="text"
            value={
              options.field === "TotalAmount"
                ? removeCurrencyFormatting(options.value) || ""
                : options.value || ""
            }
            onChange={(e) => {
              options.editorCallback(e.target.value);
              setIsSaveEnabled(true);
              setRowData((prevData) => {
                prevData[options.rowIndex][options.field] = e.target.value;
                prevData[options.rowIndex].Change = 1;
                return [...prevData];
              });
            }}
            className="text-[12px] font-normal text-black-900 clsGridInput"
            onBlur={
              options.field === "InvoiceDate"
                ? () => {
                    setTimeout(() => {
                      options.editorCallback(formatDate(options.value));
                      setRowData((prevData) => {
                        prevData[options.rowIndex][options.field] = formatDate(
                          options.value
                        );
                        return [...prevData];
                      });
                    }, 0);
                  }
                : options.field === "TotalAmount"
                ? () =>
                    setTimeout(() => {
                      let value = cleanValue(options.value) || 0;
                      options.editorCallback(Number(value || 0)?.toFixed(2));
                      setRowData((prevData) => {
                        prevData[options.rowIndex][options.field] = Number(
                          value || 0
                        )?.toFixed(2);
                        return [...prevData];
                      });
                    }, 0)
                : () => {}
            }
          />
        );
      }
    };

    const onCellEditComplete = (e) => {
      //let { rowData, newValue, field } = e;
      //rowData[field] = newValue;
      //rowData.Change = 1;
    };

    useEffect(() => setRows(row), [row]);
    // Modify how we calculate pagination values
    const totalRecords = parentRows.length; // Only count parent rows
    const start = first + 1;
    const end = Math.min(first + rows, totalRecords);

    // Update how we slice the data for pagination
    const paginatedData = localData.slice(first, first + rows);

    return (
      <div className="table-wrapper">
        <DataTable
          key={tableData.length}
          resizableColumns
          columnResizeMode="expand"
          showGridlines
          value={paginatedData}
          onColumnResizeEnd={(e) => {
            setResizableColumn(e);
          }}
          expandedRows={expandedRows}
          onRowToggle={(e) => setExpandedRows(e.data)}
          rowExpansionTemplate={rowExpansionTemplate}
          className={
            paginator && isLoading
              ? "empty-page-data-table pb-[5em]"
              : isLoading
              ? "empty-data-table"
              : "data-table"
          }
          paginator={false}
          rows={rows}
          first={first}
          onPage={onPageChange}
          globalFilter={globalFilter}
          emptyMessage="No entries found"
          responsiveLayout="stack"
          breakpoint="768px"
          scrollable
          scrollHeight="flex"
          editMode="cell"
          header={header}
          footer={null}
          loading={isLoading}
          loadingIcon={
            <>
              <div>
                <FontAwesomeIcon
                  icon={faRotate}
                  className="spinner"
                  color="#508bc9"
                  style={{ fontSize: 16, marginRight: 8 }}
                />
                Loading...
              </div>
            </>
          }
          sortField={sortField}
          sortOrder={sortOrder} // Triggered when a column header is clicked for sorting
          onSort={onSort}
          removableSort // Allows sorting to be reset
        >
          {expandedColumns.map((columnProps, index) => (
            <Column
              key={index}
              {...columnProps}
              sortable={columnProps.sortable}
              sortFunction={columnProps.sortFunction}
              editor={cellEditor}
              onCellEditComplete={onCellEditComplete}
            />
          ))}
        </DataTable>
        <Tooltip id="tooltip" place="right" effect="solid" />
        {paginator && (
          <div className="custom-footer">
            <div className="footer-content-wrapper">
              <div className="footer-divider"></div>
              {footerContent}
            </div>
            <div className="pagination-info">{footer()}</div>
            <Paginator
              first={first}
              rows={rows}
              totalRecords={totalRecords}
              rowsPerPageOptions={rowsPerPageOptions}
              onPageChange={onPageChange}
              template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
            />
          </div>
        )}
        <input type="hidden" value={payStatusHtml} id="hdnPayStatusHtml" />
        <input
          type="hidden"
          value={payStatusVendorID}
          id="hdnPayStatusVendorID"
        />
        <input type="hidden" value={EmpId} id="hdnEmpNum" />
        <input type="hidden" value={hdnBankAcountId} id="drpBankAccounts" />
        <input type="hidden" value={hdnGlo_Hud_VA} id="Glo_Hud_VA" />
        <input type="hidden" value={"0"} id="hdnPayStatus" />
        <input type="hidden" value={"5"} id="hdnPaymentType" />
        <input type="hidden" value={hdnpayCheck} id="hdnPayByCheck" />
        <input type="hidden" value={"1"} id="hdnFromReactForm" />
      </div>
    );
  }
);

export default Table;
