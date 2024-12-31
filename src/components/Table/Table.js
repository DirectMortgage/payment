import React, {
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Toast } from "primereact/toast";
import { useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRotate,
  faChevronDown,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { Paginator } from "primereact/paginator";
import AutoCompleteInputBox from "../AutoComplete/AutoComplete";
import { GroupSelect } from "../GroupSelect/index";
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
import {
  handleAPI,
  queryStringToObject,
  handleGetSessionData,
  FormatValueforCalc,
} from "../../components/CommonFunctions/CommonFunction.js";

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
      ...props
    },
    ref
  ) => {
    const toast = useRef(null),
      [globalFilter, setGlobalFilter] = useState(null),
      [rows, setRows] = useState(5),
      [first, setFirst] = useState(0);
    // const [expandedRows, setExpandedRows] = useState([]);
    const [editingCell, setEditingCell] = useState(null);
    const [glAccountOptions, setGlAccountOptions] = useState([
      // Add more GL accounts as needed
    ]);
    const [rowData, setRowData] = useState([]);
    const [sortField, setSortField] = useState(null);
    const [sortOrder, setSortOrder] = useState(null);
    const [selectedRows, setSelectedRows] = useState([]);
    const [totalAmount, setTotalAmount] = useState(0);

    // Sorting handler
    const onSort = (event) => {
      setSortField(event.sortField);
      setSortOrder(event.sortOrder);
    };

    const dataArray = Array.isArray(tableData) ? tableData : [];

    // Store original order of paymentIds
    const paymentIdOrder = [];

    const groupedData = dataArray.reduce((acc, item) => {
      const paymentId = item.VendorPaymentId;
      if (!acc[paymentId]) {
        acc[paymentId] = [];
        paymentIdOrder.push(paymentId); // Track order of paymentIds
      }
      acc[paymentId].push(item);
      return acc;
    }, {});

    // Store original values at the group level
    const fieldMaps = {
      classNameMap: {},
      glAccountMap: {},
      invoiceDateMap: {},
      invoiceMap: {},
      memoMap: {},
      classMap: {},
    };

    // Store the original values first
    Object.entries(groupedData).forEach(([paymentId, rows]) => {
      const firstRow = rows[0];
      fieldMaps.classNameMap[paymentId] = firstRow.ClassName;
      fieldMaps.glAccountMap[paymentId] = firstRow.GLAccount;
      fieldMaps.invoiceDateMap[paymentId] = firstRow.InvoiceDate;
      fieldMaps.invoiceMap[paymentId] = firstRow.Invoice;
      fieldMaps.memoMap[paymentId] = firstRow.Memo;
    });

    const parentRows = Object.entries(groupedData).map(([paymentId, rows]) => {
      const parentRow = rows.reduce((minRow, currentRow) =>
        currentRow.RowId < minRow.RowId ? currentRow : minRow
      );

      // Create a display copy of the parent row
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
    });

    const [localData, setLocalData] = useState(parentRows);
    const [OnloadData, setOnloadData] = useState([]);

    useEffect(() => {
      const sortedParentRows = [...parentRows].sort(
        (a, b) =>
          paymentIdOrder.indexOf(a.VendorPaymentId) -
          paymentIdOrder.indexOf(b.VendorPaymentId)
      );
      // if (OnloadData.length === 0) {

      // const sortedParentRows = [...parentRows].sort((a, b) =>
      //   paymentIdOrder.indexOf(a.VendorPaymentId) - paymentIdOrder.indexOf(b.VendorPaymentId)
      // );

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
      setOnloadData(structuredClone(updatedParentRows));
      // }
      setLocalData(sortedParentRows);
    }, [tableData]);
    const handlePaymentChange = (rowData, value) => {
      // Update the parent row
      rowData.PayACH = value === "ach";
      rowData.PayCheck = value === "check";

      // Update all child rows
      if (groupedData[rowData.VendorPaymentId]) {
        groupedData[rowData.VendorPaymentId].forEach((childRow) => {
          childRow.PayACH = value === "ach";
          childRow.PayCheck = value === "check";
        });
      }
      setLocalData([...localData]);
    };
    const calculateTotal = (selectedRows) => {
      const total = selectedRows.reduce((sum, row) => {
        const subtotal = FormatValueforCalc(row.SubTotal);
        return sum + (parseFloat(subtotal) || 0);
      }, 0);
      setTotalAmount(total);
    };

    // Update your checkbox onChange handler
    const handleCheckboxChange = (row, checked) => {
      let newSelectedRows;
      if (checked) {
        newSelectedRows = [...selectedRows, row];
      } else {
        newSelectedRows = selectedRows.filter((r) => r.RowId !== row.RowId);
      }
      setSelectedRows(newSelectedRows);
      calculateTotal(newSelectedRows);
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
            const hasChildRows = childRows.length > 0;

            // Skip radio buttons for first child row when child rows exist
            if (hasChildRows && rowData === childRows[0]) {
              return null;
            }

            const selectedValue = rowData.PayACH
              ? "ach"
              : rowData.PayCheck
              ? "check"
              : "";
            return (
              <RadioGroup
                name={`payment-${rowData.RowId}`}
                selectedValue={selectedValue}
                onChange={(e) => {
                  if (FilterchildRows.length !== 0) {
                    handlePaymentChange(rowData, e);
                    setExpandedRows((prev) => [...prev, rowData]);
                  }
                  handleCheckboxChange(rowData, true);
                }}
                className="flex gap-2"
              >
                <Radio
                  value="ach"
                  label="ACH"
                  id={`chkACHApproved${rowData.RowId}`}
                  className="text-[12px] text-black-900"
                />
                <Radio
                  value="check"
                  label="Check"
                  id={`chkPrintChecks${rowData.RowId}`}
                  className="text-[12px] text-black-900"
                />
              </RadioGroup>
            );
          },
        };
      }
      return col;
    });

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
          onClick={() => toggleRow(data)}
          className="p-2 hover:bg-gray-100 rounded"
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
          {allRows.map((childRow, index) => (
            <tr key={index} className="p-row justify-between flex">
              <div className="w-[48px] flex-shrink-0"></div>
              {enhancedColumns.map((col, colIndex) => (
                <div
                  key={colIndex}
                  className="p-col"
                  style={{
                    ...(colIndex === 0 && {
                      position: "relative",
                      left: "-8px",
                    }),
                    ...(colIndex === 1 && {
                      position: "relative",
                      left: "2px",
                    }),
                    ...(colIndex === 7 && {
                      position: "relative",
                      left: "12px",
                    }),
                    ...(colIndex === 8 && {
                      position: "relative",
                      left: "13px",
                    }),
                    ...(colIndex === 9 && {
                      position: "relative",
                      left: "10px",
                    }),
                    ...(colIndex === 10 && {
                      position: "relative",
                      left: "5px",
                    }),
                    ...(col.style
                      ? { width: col.style.width, minWidth: col.style.width }
                      : {}),
                  }}
                >
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
                        size="sm"
                        shape="round"
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
                        values={[
                          {
                            Account_Id:
                              parseInt(
                                childRow[col.field]?.split("-")[0]?.trim()
                              ) || 0,
                            label: childRow[col.field] || "",
                          },
                        ]}
                        Account_Id={
                          parseInt(
                            childRow[col.field]?.split("-")[0]?.trim()
                          ) || 0
                        }
                        RowId={childRow.RowId}
                        handleRemove={handleRemove}
                        onChange={(selected) => {
                          const selectedEntityLabel = selected[1];
                          childRow[col.field] = `${selectedEntityLabel.value}`;
                          childRow.Change = 1;
                          setLocalData([...localData]);
                          setEditingCell(null);
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
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCell(`${childRow.RowId}-${col.field}`);
                        }}
                        className="text-[14px] font-normal text-black-900 cursor-pointer"
                      >
                        {childRow[col.field] || ""}
                      </span>
                    )
                  ) : col.field === "TotalAmount" ||
                    col.field === "ClassName" ||
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
                        }}
                        className="text-[12px] font-normal text-black-900 clsGridInput w-full"
                        onBlur={() => setEditingCell(null)}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                    ) : (
                      <span
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
                  ) : col.body ? (
                    col.body(childRow)
                  ) : (
                    childRow[col.field]
                  )}
                </div>
              ))}
            </tr>
          ))}
        </>
      );
    };
    const addRow = () => {
      const newRow = createNewRow();

      if (!groupedData) {
        groupedData = {};
      }

      groupedData[newRow.VendorPaymentId] = [newRow];
      setLocalData((prevData) => [newRow, ...prevData]);

      setTimeout(() => {
        const firstEditableField = "Payee";
        setEditingCell(`${newRow.RowId}-${firstEditableField}`);
      }, 100);
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
    const savevendorPayment = async () => {
      let ChangeXML = "";
      const changedJSON = [];
      const processedData = saveDataWithChildren(localData);
      processedData.forEach((val) => {
        debugger;
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
        let PayACH = 0;

        if (document.getElementById(`chkACHApproved${RowId}`)?.checked) {
          PayACH = 1;
        } else if (document.getElementById(`chkPrintChecks${RowId}`)?.checked) {
          PayACH = 2;
        }

        const ApprovedBy = Status === 0 ? "" : ApprovedBy;

        // Format values
        TotalAmount = FormatValueforCalc(TotalAmount);
        ClassAmount = FormatValueforCalc(ClassAmount);
        const Change = val.Change || "0";

        const result = OnloadData.find((e) => e.RowId === val.RowId);

        if (result && val.Change === 1) {
          const changeobj = {
            VendorPaymentId,
            VendorId,
            VendorPaymentDetailId,
            EntityType,
            ApprovedBy,
            ApprovedOn: "",
          };

          // Compare with OnloadData and add changed fields
          if (FormatValueforCalc(result.TotalAmount) !== TotalAmount) {
            changeobj.TotalAmount = TotalAmount;
          }

          if (result.InvoiceDate !== InvDate) {
            changeobj.InvoiceDate = InvDate;
          }

          if (result.InvoiceDue !== DueDate) {
            changeobj.InvoiceDue = DueDate;
          }

          if (result.Invoice !== RefNo) {
            changeobj.RefNo = RefNo;
          }

          if (result.Memo !== InvNum) {
            changeobj.Memo = InvNum;
          }

          if (result.Payon !== PayOn) {
            changeobj.Payon = PayOn;
          }
          if (result.GLAccount.split("-")[0].trim() !== Accounts) {
            changeobj.AccountId = Accounts;
          }

          if (parseInt(result.Class) !== parseInt(ClassId)) {
            changeobj.Class = ClassId;
          }

          if (FormatValueforCalc(result.SubTotal) !== ClassAmount) {
            changeobj.Amount = ClassAmount;
          }

          if (parseInt(result.Status) !== parseInt(Status)) {
            changeobj.Status = Status;
          }

          if (result.ACHApprovedDetail !== PayACH) {
            changeobj.PayACH = PayACH;
          }

          if (
            result.ACHApprovedDetail === 0 &&
            result.ACHApprovedDetail !== Paid
          ) {
            changeobj.Paid = Paid;
          }

          if (Paid === 1 && result.ACHApprovedDetail !== 3) {
            changeobj.Paid = Paid;
          }

          changedJSON.push(changeobj);
        }

        ChangeXML += `<row VendorPaymentId="${VendorPaymentId}" VendorId="${VendorId}" TotalAmount="${TotalAmount}" InvoiceDate="${InvDate}" InvoiceDue="${DueDate}" RefNo="${RefNo}" Memo="${InvNum}" Payon="${PayOn}" Status="${Status}" ApprovedBy="${ApprovedBy}" ApprovedOn="" VendorPaymentDetailId="${VendorPaymentDetailId}" AccountId="${Accounts}" Class="${ClassId}" Amount="${ClassAmount}" Change="${Change}" Paid="${Paid}" PayACH="${PayACH}" EntityType="${EntityType}"/>`;
      });
      ChangeXML = `<PaymentSave BankAccountId="${8}">${ChangeXML}</PaymentSave>`;

      // Replace quotes for proper formatting
      ChangeXML = ChangeXML.replaceAll('"', "~").replaceAll("~", '\\"');
      const jsonString = JSON.stringify(changedJSON);
      console.log({ ChangeXML, jsonString });
      return;
      let obj = { SaveXml: ChangeXML, changedJSON: jsonString };
      const response = await handleAPI({
        name: "VendorMonthlySave",
        params: {},
        method: "POST",
        body: JSON.stringify(obj),
      });

      if (!response || response.trim() === "{}" || response.trim() === "[]") {
      }
    };
    useImperativeHandle(ref, () => ({
      addRow,
      savevendorPayment,
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
          // Add other fields as empty or default values
        };
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    const expandedColumns = [
      {
        expander: true,
        field: "expand",
        "data-field": "expand",
        body: expandTemplate,
        style: { width: "48px" },
      },
      ...enhancedColumns,
    ];

    const header = (
        <div className="table-header">
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
      //  console.log(options)
      const rowId = options.rowData.RowId;
      const isEditing = editingRows[rowId] ?? false;

      if (!isEditing && !(options.column.props.editable ?? true)) {
        return options.column.props.body(options.rowData);
      }

      if (options.field === "GLAccount") {
        return (
          // <AutoCompleteInputBox
          //     value={options.value}
          //     options={accounts.map(opt => ({
          //       label: `${opt.Account_Id} - ${opt.Account_Name}`,
          //       value: opt.Account_Id
          //   }))}
          //     onSelect={(selectedItem) => {
          //         options.editorCallback(selectedItem.label);
          //     }}
          //     placeholder="Search GL Account"
          //     style={{ margin: 0, border: 'none' }}
          //     inputBoxStyle={{
          //         padding: '2px 8px',
          //         fontSize: '12px',
          //         height: '28px'
          //     }}
          // />

          <GroupSelect
            size="sm"
            shape="round"
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
            values={[
              {
                Account_Id: parseInt(
                  options.rowData.GLAccount.split("-")[0].trim()
                ),
                label: options.value || options.rowData.GLAccount,
              },
            ]}
            Account_Id={parseInt(
              options.rowData.GLAccount.split("-")[0].trim()
            )}
            RowId={options.rowData.RowId}
            handleRemove={handleRemove}
            onChange={(selected) => {
              const selectedEntityLabel = selected[1];

              options.editorCallback(`${selectedEntityLabel.value}`);
              const updatedData = {
                ...options.rowData,
                GLAccount: selectedEntityLabel.value,
              };
              if (options.onRowUpdate) {
                options.onRowUpdate(updatedData);
              }
            }}
            showSearch={true}
            placeholder="Search GL Account"
            showAddPaymentSplit={false}
            showRemoveRow={false}
          />
        );
      }
      if (options.field === "Payee") {
        const hasChildRows = (
          groupedData[options.rowData.VendorPaymentId] || []
        ).some((row) => row.RowId !== options.rowData.RowId);

        if (
          hasChildRows &&
          !expandedRows.some((row) => row.RowId === options.rowData.RowId)
        ) {
          toggleRow(options.rowData);
        }
        const { VendorPaymentDetailId, VendorPaymentId } = options.rowData;
        return (
          <GroupSelect
            size="sm"
            shape="round"
            options={vendors}
            VendorPaymentDetailId={VendorPaymentDetailId}
            VendorPaymentId={VendorPaymentId}
            name="Vendors"
            valueKey="VendorId"
            labelKey="label"
            sessionid={sessionid}
            values={[
              {
                VendorId: options.rowData.VendorId,
                label: options.rowData.Payee,
              },
            ]}
            VendorId={options.rowData.VendorId}
            RowId={options.rowData.RowId}
            companyId={companyId}
            EmpId={EmpId}
            handleRemove={handleRemove}
            showAddPaymentSplit={true} // Control visibility of Add Payment Split
            showRemoveRow={true}
            onChange={(selected) => {
              const selectedEntity = selected[0];
              const selectedEntityLabel = selected[1];

              // Log to verify what's being selected
              console.log("Selected Vendor:", selectedEntity.value);
              console.log("Selected Payee:", selectedEntityLabel.value);

              // Update the Payee value in the editor callback
              options.editorCallback(`${selectedEntityLabel.value}`);

              // Create an updated row data object
              const updatedData = {
                ...options.rowData,
                VendorId: selectedEntity.value,
                Payee: selectedEntityLabel.value,
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

              // Log to verify updated grouped data
              console.log("Updated Grouped Data:", updatedGroupedData);

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

              console.log("Updated Local Data:", updatedLocalData);

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
      }
      if (options.field === "ClassName") {
        console.log(Class);
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
            name="Class"
            valueKey="Class_Id"
            labelKey="label"
            sessionid={sessionid}
            values={[
              {
                Class_Id: parseInt(options.rowData.Class),
                label: options.value,
              },
            ]}
            Class_Id={parseInt(options.rowData.Class)}
            RowId={options.rowData.RowId}
            handleRemove={handleRemove}
            onChange={(selected) => {
              const selectedEntity = selected[0];
              const selectedEntityLabel = selected[1];

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
      }

      return (
        <input
          type="text"
          value={options.value}
          onChange={(e) => options.editorCallback(e.target.value)}
          className="text-[12px] font-normal text-black-900 clsGridInput"
        />
      );
    };
    // const cellEditor = (options) => {
    //   // Make Payee editable for newly added rows by checking if it's a new row
    //   const isNewRow = options.rowData.VendorPaymentDetailId === "";
    //   const isPayeeColumn = options.field === "Payee";

    //   if (isPayeeColumn && isNewRow) {
    //     return (
    //       <input
    //         type="text"
    //         value={options.value || ''}
    //         onChange={(e) => options.editorCallback(e.target.value)}
    //         className="text-[12px] font-normal text-black-900 clsGridInput"
    //       />
    //     );
    //   }

    //   if (!(options.column.props.editable ?? true)) {
    //     return options.column.props.body(options.rowData);
    //   }

    //   return (
    //     <input
    //       type="text"
    //       value={options.value || ''}
    //       onChange={(e) => options.editorCallback(e.target.value)}
    //       className="text-[12px] font-normal text-black-900 clsGridInput"
    //     />
    //   );
    // };

    const onCellEditComplete = (e) => {
      let { rowData, newValue, field } = e;
      rowData[field] = newValue;

      rowData.Change = 1;
    };
    useEffect(() => setRows(row), [row]);
    // Modify how we calculate pagination values
    const totalRecords = parentRows.length; // Only count parent rows
    const start = first + 1;
    const end = Math.min(first + rows, totalRecords);

    // Update how we slice the data for pagination
    const paginatedData = localData.slice(first, first + rows);
    return (
      <div>
        <DataTable
          value={paginatedData}
          expandedRows={expandedRows}
          onRowToggle={(e) => setExpandedRows(e.data)}
          rowExpansionTemplate={rowExpansionTemplate}
          className={
            paginator && isLoading
              ? "empty-page-data-table"
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
              <tbody className="p-datatable-tbody">
                <FontAwesomeIcon
                  icon={faRotate}
                  className="spinner"
                  color="#508bc9"
                  style={{ fontSize: 20 }}
                />
                Loading...
              </tbody>
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
              editor={(options) => cellEditor(options)}
              onCellEditComplete={onCellEditComplete}
            />
          ))}
        </DataTable>
        {paginator && (
          <div className="custom-footer mt-2">
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
        <Toast ref={toast} />
      </div>
    );
  }
);

export default Table;
