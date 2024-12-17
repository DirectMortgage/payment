import React, { useEffect, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Toast } from "primereact/toast";
import { useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRotate,faChevronDown, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { Paginator } from 'primereact/paginator';
import AutoCompleteInputBox from '../AutoComplete/AutoComplete';
import {GroupSelect} from '../GroupSelect/index';
import { Img, Text, Button, SelectBox, Heading, Radio, RadioGroup, Input,Checkbox } from "../../components";

const Table = ({
  accounts = [],
  vendors = [],
  tableData = [],
  columns = [],
  sessionid = "",
  editingRows,
  tableTitle = "",
  paginator = false,
  rowsPerPageOptions = [5, 10, 25, 50, 100],
  row = 50,
  isLoading = false,
  footerContent = <></>,
  expandedRows, // New prop
  setExpandedRows, // New prop
  handleRemove = ()=>{ },
  ...props
}) => {
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


  const dataArray = Array.isArray(tableData) ? tableData : [];

  const groupedData = dataArray.reduce((acc, item) => {
      const paymentId = item.VendorPaymentId;
      if (!acc[paymentId]) {
          acc[paymentId] = [];
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
      memoMap: {}
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
          displayParentRow.ClassName = '';
          displayParentRow.GLAccount = '';
          displayParentRow.InvoiceDate = '';
          displayParentRow.Invoice = '';
          displayParentRow.Memo = '';
      }
      
      return {
          ...displayParentRow,
          originalClassName: fieldMaps.classNameMap[paymentId],
          originalGLAccount: fieldMaps.glAccountMap[paymentId],
          originalInvoiceDate: fieldMaps.invoiceDateMap[paymentId],
          originalInvoice: fieldMaps.invoiceMap[paymentId],
          originalMemo: fieldMaps.memoMap[paymentId]
      };
  });
  
    const [localData, setLocalData] = useState(parentRows);
    

    useEffect(() => {
      setLocalData(parentRows);  
    }, [tableData]);
  
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
      const childRows = rows.filter(
          (row) => row.RowId !== data.RowId
      );
  
      if (childRows.length === 0) {
          return <div className="w-12"></div>;
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
    const childRows = rows.filter(
        (row) => row.RowId !== data.RowId
    );

    const emptyChildRow = {
        ...data,
        PayACH: data.PayACH,
        RowId: Date.now(), // Use timestamp instead of max
        ClassName: fieldMaps.classNameMap[data.VendorPaymentId] || '',
        GLAccount: fieldMaps.glAccountMap[data.VendorPaymentId] || '',
        InvoiceDate: fieldMaps.invoiceDateMap[data.VendorPaymentId] || '',
        Invoice: fieldMaps.invoiceMap[data.VendorPaymentId] || '',
        Memo: fieldMaps.memoMap[data.VendorPaymentId] || '',
        VendorPaymentId: data.VendorPaymentId 
    };

    const allRows = [emptyChildRow, ...childRows];
    
      
  
      return (
          <>
              {allRows.map((childRow, index) => (
                  <tr key={index} className="p-row justify-between flex">
                      <div className="w-[48px] flex-shrink-0"></div>
                      {columns.map((col, colIndex) => (
                          <div
                              key={colIndex}
                              className="p-col"
                              style={{
                                  ...(colIndex === 0 && {
                                      position: "relative",
                                      left: "-11px",
                                  }),
                                  ...(colIndex === 1 && {
                                      position: "relative",
                                      left: "8px",
                                  }),
                                  ...(colIndex === 7 && {
                                    position: "relative",
                                    left: "4px",
                                }),
                                  ...(colIndex === 8 && {
                                    position: "relative",
                                    left: "11px",
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
                                          dangerouslySetInnerHTML={{ __html: childRow?.LastPaidDetails?.replace(/<b>/g, '').replace(/<\/b>/g, '') || '' }}
                                      />
                                  </div>
                              ) : col.field === "GLAccount" ? (
                                editingCell === `${childRow.RowId}-${col.field}` ? (
                                    <AutoCompleteInputBox
                                        value={childRow[col.field]}
                                        options={accounts.map(opt => ({
                                          label: `${opt.Account_Id} - ${opt.Account_Name}`,
                                          value: opt.Account_Id
                                      }))}
                                        onSelect={(selectedItem) => {
                                            childRow[col.field] = selectedItem.label;
                                            setLocalData([...localData]);
                                            setEditingCell(null);
                                        }}
                                        placeholder="Search GL Account"
                                        style={{ 
                                            margin: 0,
                                            border: 'none'
                                        }}
                                        inputBoxStyle={{ 
                                            padding: '2px 8px',
                                            fontSize: '12px',
                                            height: '28px'
                                        }}
                                        onBlur={() => setTimeout(() => setEditingCell(null), 200)}
                                        
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
                            ) : col.field === "TotalAmount" || col.field === "ClassName" ? (
                                  editingCell === `${childRow.RowId}-${col.field}` ? (
                                      <input
                                          type="text"
                                          value={col.field === "TotalAmount" ? childRow.SubTotal : childRow[col.field] || ""}
                                          onChange={(e) => {
                                              const newValue = e.target.value;
                                              if (col.field === "TotalAmount") {
                                                  childRow.SubTotal = newValue;
                                              } else {
                                                  childRow[col.field] = newValue;
                                              }
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
                                          {col.field === "TotalAmount" ? childRow.SubTotal : childRow[col.field] || ""}
                                      </span>
                                  )
                              ) : (
                                  col.body ? col.body(childRow) : childRow[col.field]
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
    
    // Initialize groupedData if undefined
    if (!groupedData) {
        groupedData = {};
    }
    
    // Add new row to groupedData
    groupedData[newRow.VendorPaymentId] = [newRow];
    
    setLocalData(prevData => [newRow, ...prevData]);

    // Focus first editable cell (adjust field name based on your first editable column)
  setTimeout(() => {
    const firstEditableField = "Payee"; // Change this to your first editable column field
    setEditingCell(`${newRow.RowId}-${firstEditableField}`);
  }, 100);
};
  const createNewRow = () => {
    return {
      Payee: "",  // Empty string for Payee
      TotalAmount: "",  // Empty string for TotalAmount
      GLAccount: "",  // Empty string for GLAccount
      ClassName: "",  // Empty string for ClassName
      SubTotal: "",  // Empty string for SubTotal
      Invoice: "",  // Empty string for Invoice
      Memo: "",  // Empty string for Memo
      Images: "",  // Empty string for Images
      InvoiceDate: "",  // Empty string for InvoiceDate
      InvoiceDue: "",  // Empty string for InvoiceDue
      Payon: "",  // Empty string for Payon
      Status: "",  // Empty string for Status
      RowId: Date.now(),  // Generate a unique RowId based on timestamp
      VendorPaymentId: Date.now(),  // Empty string for VendorPaymentId
      VendorPaymentDetailId: "",  // Empty string for VendorPaymentDetailId
      imagesHeader: "Upload",
      // Add other fields as empty or default values
    };
  };
  
    const expandedColumns = [
        {
            expander: true,
            field: 'expand',
            'data-field': 'expand',
            body: expandTemplate,
            style: { width: '48px' }
        },
        ...columns
    ];

    

    const header = (
      <div className="table-header">
        <h6>{tableTitle}</h6>
        <div className="flex w-full justify-between items-center">
          <div className="flex-start flex gap-2">
            <Button
              leftIcon={<Img src="payment/images/img_grid.svg" alt="Grid" className="h-[18px] w-[18px]" />}
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
    const rowId = options.rowData.RowId;
    const isEditing = editingRows[rowId] ?? false;
    
    if (!isEditing && !(options.column.props.editable ?? true)) {
        return options.column.props.body(options.rowData);
    }

    if (options.field === "GLAccount") {
        return (
            <AutoCompleteInputBox
                value={options.value}
                options={accounts.map(opt => ({
                  label: `${opt.Account_Id} - ${opt.Account_Name}`,
                  value: opt.Account_Id
              }))}
                onSelect={(selectedItem) => {
                    options.editorCallback(selectedItem.label);
                }}
                placeholder="Search GL Account"
                style={{ margin: 0, border: 'none' }}
                inputBoxStyle={{ 
                    padding: '2px 8px',
                    fontSize: '12px',
                    height: '28px'
                }}
            />
        );
    }
    if (options.field === "Payee") {

      const hasChildRows = (groupedData[options.rowData.VendorPaymentId] || []).some(
        (row) => row.RowId !== options.rowData.RowId
      );
    
      if (hasChildRows && !expandedRows.some((row) => row.RowId === options.rowData.RowId)) {
        toggleRow(options.rowData);
      }
      return (
        <GroupSelect
          size="sm"
          shape="round"
          options={vendors}
          name="Vendors"
          valueKey="VendorId"
          labelKey="label"
          sessionid = {sessionid}
          values={[{
            VendorId: options.rowData.VendorId,
            label: options.rowData.Payee
          }]}
          VendorId = {options.rowData.VendorId}
          RowId = {options.rowData.RowId}
          handleRemove = {handleRemove}
          onChange={(selected) => {
            const selectedEntity = selected[0];
    const selectedEntityLabel = selected[1];

    // Log to verify what's being selected
    console.log('Selected Vendor:', selectedEntity.value);
    console.log('Selected Payee:', selectedEntityLabel.value);

    // Update the Payee value in the editor callback
    options.editorCallback(`${selectedEntityLabel.value}`);

    // Create an updated row data object
    const updatedData = { ...options.rowData, VendorId: selectedEntity.value, Payee: selectedEntityLabel.value };

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
    console.log('Updated Grouped Data:', updatedGroupedData);

    // Now, update the localData state to reflect the changes
    const updatedLocalData = Object.entries(updatedGroupedData).map(([paymentId, rows]) => {
      const parentRow = rows.reduce((minRow, currentRow) => 
          currentRow.RowId < minRow.RowId ? currentRow : minRow
      );

      // Create a display copy of the parent row
      const displayParentRow = { ...parentRow };

      if (rows.length > 1) {
        displayParentRow.ClassName = '';
        displayParentRow.GLAccount = '';
        displayParentRow.InvoiceDate = '';
        displayParentRow.Invoice = '';
        displayParentRow.Memo = '';
      }

      return {
        ...displayParentRow,
        originalClassName: fieldMaps.classNameMap[paymentId],
        originalGLAccount: fieldMaps.glAccountMap[paymentId],
        originalInvoiceDate: fieldMaps.invoiceDateMap[paymentId],
        originalInvoice: fieldMaps.invoiceMap[paymentId],
        originalMemo: fieldMaps.memoMap[paymentId]
      };
    });

    // Log the updated local data
    console.log('Updated Local Data:', updatedLocalData);

    // Update the state with the new local data
    setLocalData(updatedLocalData);

    // Call onRowUpdate to propagate the updated row data to the parent (if needed)
    if (options.onRowUpdate) {
      options.onRowUpdate(updatedData);
    }
          }}
          loading={isLoading}
          loadingMessage="Loading Payee"
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
       className={paginator && isLoading ? "empty-page-data-table" : isLoading ? "empty-data-table" : "data-table"}
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
                style={{ fontSize: 16 }}
              />
              Loading...
            </tbody>
          </>
        }
      >
        {expandedColumns.map((columnProps, index) => (
          <Column key={index} {...columnProps} editor={(options) => cellEditor(options)}
          onCellEditComplete={onCellEditComplete} />
        ))}
      </DataTable>
      {paginator && (
        <div className="custom-footer mt-2">
          <div className="footer-content-wrapper">
            <div className="footer-divider"></div>
            {footerContent}
          </div>
          <div className="pagination-info">
            {footer()}
          </div>
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
};

export default Table;