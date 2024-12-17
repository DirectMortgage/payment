import { Img, Text, Button, SelectBox, Heading, Radio, RadioGroup, Input,Checkbox } from "../../components";
import { CloseSVG } from "../../components/Input/close.jsx";
import { ReactTable } from "../../components/ReactTable";
import { createColumnHelper } from "@tanstack/react-table";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencil } from '@fortawesome/free-solid-svg-icons';
import uploadPdfImage from '../../components/Images/upload-pdf.png';
import OpenPdfImage from '../../components/Images/open_in_new.png';
import Close from '../../components/Images/close.png';
import {
  handleAPI,
  queryStringToObject,
  handleGetSessionData,
  getCurrentTimeAndDate,
  formatAsHTML,
} from "../../components/CommonFunctions/CommonFunction.js";
import React, { useEffect, useState } from "react";
import Table from "../../components/Table/Table.js";

let SessionId;

const tableData = [
  {
    payeeHeader: "CrossCheck Compliance ",
    totalHeader: "$0.00",
    glAccountHeader: "0-",
    departmentHeader: "",
    invoiceDateHeader: "",
    invoiceNumberHeader: "",
    memoHeader: "",
    paidHeader: "images/img_instagram.svg",
    imagesHeader: "Upload",
    paymentDetails: "Date Last Paid: 10/28/2022\nAmount Paid: $8,383.23",


  },
  {
    payeeHeader: "Gift Hounds",
    paymentDetails: "Date Last Paid: 10/28/2022\nAmount Paid: $702.98",
    totalHeader: "$2.00",
    glAccountHeader: "6010 -Advertising",
    departmentHeader: "",
    invoiceDateHeader: "",
    invoiceNumberHeader: "",
    memoHeader: "",
    paidHeader: "images/img_lock.svg",
    imagesHeader: "Upload",
  },
  {
    payeeHeader: "HubSpot Inc.",
    paymentDetails: "Date Last Paid: None\nAmount Paid: None",
    totalHeader: "$12,471.01",
    glAccountHeader: "6010 -Advertising",
    departmentHeader: "910 - Tripp Branch",
    invoiceDateHeader: "10/24/2022",
    invoiceNumberHeader: "9592219",
    memoHeader: "DMC Oct 2022",
    paidHeader: "images/img_instagram.svg",
    imagesHeader: "Upload",
  },
  // {
  //   payeeHeader: "HUD",
  //   paymentDetails: "Process HUD",
  //   paymentInfo: "Date Last Paid: 10/25/2024\nAmount Paid: $9,457.00",
  //   totalHeader: "$7,835.80",
  //   glAccountHeader: "2033 -HUD Premiums Payable",
  //   departmentHeader: ".",
  //   invoiceDateHeader: "10/31/2024",
  //   invoiceNumberHeader: "FHA UFMIP - 515836",
  //   memoHeader: "515836 - Edward Gonzalez",
  //   paidHeader: "images/img_instagram.svg",
  //   imagesHeader: "Upload",
  // },
  // {
  //   payeeHeader: "VA",
  //   paymentDetails: "Process VA",
  //   paymentInfo: "Date Last Paid: 10/18/2024\nAmount Paid: $2,500.00",
  //   totalHeader: "$4,825.00",
  //   glAccountHeader: "2031 - VA Funding Fee Payable",
  //   departmentHeader: ".",
  //   invoiceDateHeader: "10/31/2024",
  //   invoiceNumberHeader: "VA Funding Fee - 512932",
  //   memoHeader: "512932 - Joseph Yeates",
  //   paidHeader: "images/img_instagram.svg",
  //   imagesHeader: "Upload",
  //   viewImageText: "View Image",
  //   fulfillmentText: "Fulfillment",
  // },
];



const PaymentManagementSection = () => {
  const [searchBarValue, setSearchBarValue] = React.useState("");
  const [rawXmlData, setRawXmlData] = useState("");
  const [rowData, setRowData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [glAccounts, setGLAccounts] = useState([]);
  const [expandedRows, setExpandedRows] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [dropDownOptions, setDropDownOptions] = useState([]);
  const [editingRows, setEditingRows] = useState({});

  let queryString = queryStringToObject();
  
  //let FromPipeline = queryString["FromPipeline"];
  SessionId = queryString["SessionID"];


  
  const GetVendorPaymentApprovalData = async (CompanyId, UserId) => {
    setIsLoading(true); // Set loading when starting the request
    
    let obj = {
      CompanyId: CompanyId, 
      UserId: UserId,
    };
  
    try {
      const response = await handleAPI({
        name: "GetVendorPaymentApprovalData",
        params: obj,
      });
  
      if (!response || response.trim() === "{}" || response.trim() === "[]") {
        setRowData([]);
        setRawXmlData("");
      } else {
        const parsedResponse = JSON.parse(response);
        let responseJson = parsedResponse?.Table?.[0]?.VendorPayment || "";
  
        if (responseJson) {
          responseJson = JSON.parse(responseJson);
          const processedData = processPaymentInfo(responseJson.VendorPayment[0]?.PaymentInfo || []);
          const htmlString = responseJson.VendorPayment[7].BankDetails;
          const vendors =  responseJson.VendorPayment[1].Vendors;
          const dropDownOptions = formatDropdownOptions(htmlString);
          setDropDownOptions(dropDownOptions);
          setVendors(vendors);
          setGLAccounts(responseJson.VendorPayment[6].Accounts)
          setRowData(JSON.parse(processedData));
          console.log(JSON.parse(processedData))
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
  const processPaymentInfo = (paymentInfo) => {
      const rowData = paymentInfo.map((full) => {
      const Entity_Name = full.Entity_Name.replace(/&amp;/g, "&").replace(/amp;/g, "");
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
        LastPaidDetails: full.LastPaidDetails.replace("Amount", "<br/> Amount"),
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
        imagesHeader: "Upload",
      };
    });
  
    return JSON.stringify(rowData);
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
  
  // useEffect to load data when the component mounts
  useEffect(() => {
    const LoadData = async () => {
      GetVendorPaymentApprovalData(4, 32182); // Replace with the actual CompanyId and UserId
    };
    LoadData();
  }, []); // Empty dependency array means it runs once when the component mounts
  const handleImageClick = (LinkId) => {
    // Handle the click event here
    const URL = "../../../NewDMAcct/GetUploadedImage.aspx?CompanyId=" + 4 + "&LinkId=" + LinkId;
   


    //window.open(URL);
    window.open(URL, "", "width=1200,height=1200,resizable=yes,scrollbars=yes");
  };
  const handleRemove = (rowId) =>{
   
    const updatedData = rowData.filter(row => row.RowId !== rowId);
    setRowData(updatedData);

  }
  function formatDropdownOptions(htmlString) {
    // Create a temporary DOM element
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    const options = doc.getElementsByTagName('option');
    
    // Convert HTMLCollection to array and map to desired format
    return Array.from(options).map(option => ({
      label: option.textContent,
      value: option.getAttribute('value'),
      // Optional: include additional attributes if needed
      checkNum: option.getAttribute('CheckNum'),
      selected: option.getAttribute('Selected') === 'Selected'
    }));
  }
  const [columns,setColumns] = useState([ 
    {
        field: "Payee",
        //editable: false,//(rowData) => rowData.paymentDetails === "",
        editable: false, // Change this to true
        editor: (options) => options.editorCallback(options.value), // Add this line
        'data-field': "Payee",
        header: () => (
            <Text size="textmd" as="p" className="pb-0.5 pl-4 pt-2.5 text-left text-[14px] font-normal leading-[18px] text-black-900">
                <span>
                    <>Payee<br /></>
                </span>
                <span className="text-[10px]">(pay history)</span>
            </Text>
        ),
        style: { 
          width: '192px', 
          padding: '0.5rem',
          whiteSpace: 'normal',
          wordWrap: 'break-word'
      },
      body: (rowData) => {
        const formattedText = rowData?.LastPaidDetails 
            ? rowData.LastPaidDetails.replace(/<b>/g, '').replace(/<\/b>/g, '')
            : '';
            const handlePayeeClick = (VendorId,rowData,rowIndex) => {
              setEditingRows((prevState) => ({
                ...prevState,
                [rowIndex]: false, // Enable editing for the specific row
            }));
            //rowData.isEditing = false; // Set the row's edit state
            InsertVendorInfo(SessionId,VendorId)
            // const URL = "../../../NewDMAcct/CustomerVendorOptions.aspx?SessionId=" + SessionId;
             const URL = "https://www.directcorp.com/NewDMAcct/CustomerVendorOptions.aspx?SessionId=" + SessionId;

             window.open(URL, "", "width=1200,height=1200,resizable=yes,scrollbars=yes");
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

            return (
              <div className="flex flex-col items-start justify-center h-full px-4">
                <Heading size="headingmd" as="h1" className="text-[14px] font-semibold text-indigo-700">
                <span 
            onClick={(e) => handlePayeeClick(rowData.VendorId,rowData,rowData.RowId)}
            className="cursor-pointer hover:underline"
          >
            {rowData.Payee}
          </span>
                  <FontAwesomeIcon icon={faPencil} className="ml-1 text-[10px] text-gray-600"  onClick={(e) => handleEditClick(e, rowData, rowData.RowId)} />
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
        'data-field': "TotalAmount",
        header: () => (
            <Text size="textmd" as="p" className="py-3.5 text-left text-[14px] font-normal text-black-900">
                Total
            </Text>
        ),
        style: { 
          width: '86px', 
          padding: '0.5rem',
          whiteSpace: 'normal',
          wordWrap: 'break-word'
      },
        body: (rowData) => (
            <Text as="p" className="text-[14px] font-normal text-black-900">
                {rowData.TotalAmount}
            </Text>
        )
    },
    {
        field: "GLAccount",
        'data-field': "GLAccount",
        header: () => (
            <Text size="textmd" as="p" className="py-3.5 text-left text-[14px] font-normal text-black-900">
                G/L Account
            </Text>
        ),
        style: { 
          width: '116px', 
          padding: '0.5rem',
          whiteSpace: 'normal',
          wordWrap: 'break-word'
      },
        body: (rowData) => (
            <Text size="textmd" as="p" className="text-[14px] font-normal text-black-900">
                {rowData.GLAccount}
            </Text>
        )
    },
    {
        field: "ClassName",
        'data-field': "ClassName",
        header: () => (
            <Text size="textmd" as="p" className="pb-3 pt-4 text-left text-[14px] font-normal text-black-900">
                Department
            </Text>
        ),
        style: { 
          width: '96px', 
          padding: '0.5rem',
          whiteSpace: 'normal',
          wordWrap: 'break-word'
      },
        body: (rowData) => (
            <Text size="textmd" as="p" className="text-[14px] font-normal text-black-900">
                {rowData.ClassName}
            </Text>
        )
    },
    {
        field: "InvoiceDate",
        'data-field': "InvoiceDate",
        header: () => (
            <Text size="textmd" as="p" className="py-3.5 text-left text-[14px] font-normal text-black-900">
                Invoice Date
            </Text>
        ),
        style: { 
          width: '90px', 
          padding: '0.5rem',
          whiteSpace: 'normal',
          wordWrap: 'break-word'
      },
        body: (rowData) => (
            <Text size="textmd" as="p" className="text-[14px] font-normal text-black-900">
                {rowData.InvoiceDate}
            </Text>
        )
    },
    {
        field: "Invoice",
        'data-field': "Invoice",
        header: () => (
            <Text size="textmd" as="p" className="py-3.5 pl-1 text-left text-[14px] font-normal text-black-900">
                Invoice #
            </Text>
        ),
        style: { 
          width: '96px', 
          padding: '0.5rem',
          whiteSpace: 'normal',
          wordWrap: 'break-word'
      },
        body: (rowData) => (
            <Text size="textmd" as="p" className="text-[14px] font-normal text-black-900">
                {rowData.Invoice}
            </Text>
        )
    },
    {
        field: "Memo",
        'data-field': "Memo",
        header: () => (
            <Text size="textmd" as="p" className="py-3.5 text-left text-[14px] font-normal text-black-900">
                Memo
            </Text>
        ),
        style: { 
          width: '96px', 
          padding: '0.5rem',
          whiteSpace: 'normal',
          wordWrap: 'break-word'
      },
        body: (rowData) => (
            <Text size="textxs" as="p" className="text-[14px] font-normal text-black-900">
                {rowData.Memo}
            </Text>
        )
    },
    {
      field: "paymentMethodHeader",
      'data-field': "paymentMethodHeader",
      editable: false,
      header: () => (
          <Text size="textmd" as="p" className="pb-3 pt-4 text-left text-[14px] font-normal text-black-900">
              Payment Method
          </Text>
      ),
      style: { width: '136px' },
      body: (rowData) => (
          <div className="flex">
              <div className="flex gap-1 py-0.5">
                  <input
                      type="radio"
                      id={`ach-${rowData.RowId}`}
                      name={`payment-${rowData.RowId}`}
                      value="ach"
                      checked={rowData.PayACH === true}
                      onChange={() => {
                          setExpandedRows(prev => [...prev, rowData]);
                          rowData.PayACH = true;
                      }}
                  />
                  <label 
                      htmlFor={`ach-${rowData.RowId}`}
                      className="text-[12px] text-black-900"
                  >
                      ACH
                  </label>
              </div>
  
              <div className="ml-2.5 flex gap-1 py-0.5">
                  <input
                      type="radio"
                      id={`check-${rowData.RowId}`}
                      name={`payment-${rowData.RowId}`}
                      value="check"
                      checked={rowData.PayACH === false}
                      onChange={() => {
                          rowData.PayACH = false;
                      }}
                  />
                  <label
                      htmlFor={`check-${rowData.RowId}`}
                      className="text-[12px] text-black-900"
                  >
                      Check
                  </label>
              </div>
          </div>
      )
  },
    {
        field: "MarkPaid",
        'data-field': "MarkPaid",
        editable: false,
        header: () => (
            <Text size="textmd" as="p" className="py-3.5 text-left text-[14px] font-normal text-black-900">
                Paid
            </Text>
        ),
        style: { width: '44px' },
        body: (rowData) => (
            <div className="flex">
                <Checkbox 
                    label=""
                    name="item"
                    onChange={(e) => console.log('Checked:', e.target.checked)}
                    className="text-gray-800"
                />
            </div>
        )
    },
    {
        field: "imagesHeader",
        'data-field': "imagesHeader",
        editable: false,
        header: () => (
            <Text size="textmd" as="p" className="pb-3 pt-4 text-left text-[14px] font-normal text-black-900">
                Images
            </Text>
        ),
        style: { width: '100px' },
        body: (rowData) => (
            <div className="flex justify-center rounded border border-dashed border-indigo-700 bg-indigo-400_33">
                <Heading as="h2" className="self-end text-[12px] font-semibold text-black-900">
                    {rowData.imagesHeader}
                </Heading>
            </div>
        )
    },
    {
      field: "image",
      'data-field': "image",
      editable: false,
      header: () => (
        <Text size="headingmd" as="h1" className="text-[12px] font-semibold text-indigo-700">
        <span 
      // onClick={handlePayeeClick}
      className="cursor-pointer hover:underline"
      >
        {'View All PDF'}
        </span>
        </Text>
    ),
      style: { width: '100px' },
      body: (rowData) => {
        return (
          <div className="flex gap-2 justify-center items-center">
             {rowData.FileCount > 0 && (
            <img 
              src={uploadPdfImage} 
              alt="Upload"
              style={{ width: '30px', height: '30px', objectFit: 'contain' }}
              className="cursor-pointer"
              onClick={() => handleImageClick(rowData.LinkId)}
            />
          )}
            {rowData.FileCount > 1 && (
              <img 
                src={OpenPdfImage}
                alt="Open Image"
                className="cursor-pointer"
                style={{ width: '25px', height: '25px', objectFit: 'contain' }}
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
      }
    }
    
  ])
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
  const addRow = () => {
  const newRow = createNewRow();  // Create an empty row
  setRowData((prevData) => [newRow, ...prevData]);  // Add the empty row to the table
  
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
          paginator
          isLoading={isLoading}
          tableData={rowData}
          accounts={glAccounts}
          vendors={vendors}
          columns={columns}
          sessionid= {SessionId}
          editingRows = {editingRows}
          expandedRows={expandedRows}
          setExpandedRows={setExpandedRows}
          handleRemove = {handleRemove}
          footerContent = {  <div className="flex items-center border-b border-solid border-gray-600 py-2.5 md:flex-col" style={{ paddingLeft: '110px' }}>
            {/* Left section remains unchanged */}
            <div className="flex w-[20%] flex-col gap-2 md:w-full">
              <div className="flex flex-wrap justify-end gap-[25px]">
                <Text as="p" className="font-inter text-[12px] font-normal text-black-900"  style={{ marginRight: '27px' }}>
                  Total bills:{" "}
                </Text>
                <Heading as="p" className="font-inter text-[12px] font-semibold text-black-900">
                  $97,105.78
                </Heading>
              </div>
              <div className="flex flex-wrap justify-end gap-6">
                <Text as="p" className="font-inter text-[12px] font-normal text-black-900" style={{ marginRight: '27px' }}>
                  <span>Bills marked to pay&nbsp;</span>
                  <span className="font-bold">(1):</span>
                </Text>
                <Heading as="p" className="font-inter text-[12px] font-semibold text-black-900">
                  $0.00{" "}
                </Heading>
              </div>
            </div>
        
            {/* Right section with adjusted sizes */}
            <div className="flex flex-1 items-end justify-end gap-8 px-14 md:self-stretch md:px-5 sm:flex-col ml-4"   style={{ left: '-200px', position: 'relative' }}>
    <div className="flex w-[25%] flex-col items-start justify-center gap-0.5 sm:w-full">
      <Text as="p" className="font-inter text-[14px] font-normal text-black-900 mb-1">
        Pay From Account
      </Text>
      <SelectBox
        indicator={<Img src="payment/images/img_arrowdown.svg" alt="Arrow Down" className="h-[18px] w-[18px]" />}
        name="Account Dropdown"
        placeholder={`1091 - Goldenwest Checking`}
        options={dropDownOptions}
        className="flex h-[42px] w-full min-w-[250px] gap-[26px] rounded border border-solid border-black-900 bg-white-a700 px-3 py-1.5 font-inter text-[14px] text-blue_gray-900"
      />
    </div>
    <Button
      leftIcon={<Img src="payment/images/img_arrowright.svg" alt="Arrow Right" className="h-[18px] w-[18px]" />}
      className="flex h-[38px] min-w-[118px] flex-row items-center justify-center gap-2.5 rounded-lg border border-solid border-indigo-700 bg-indigo-400 px-[19px] text-center font-inter text-[12px] font-bold text-white-a700"
    >
      Pay ACH
    </Button>
  </div>
          </div>}
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
    </>
  );
}
export default PaymentManagementSection;