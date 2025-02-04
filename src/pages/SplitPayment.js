import { useEffect, useMemo, useRef, useState } from "react";
import { AutoComplete } from "./AutoComplete";
import {
  cleanValue,
  formatCurrency,
  formatSpecialCharacters,
  handleAPI,
  handleSaveWindowSize,
  queryStringToObject,
} from "components/CommonFunctions/CommonFunction";
import { Spinner } from "components/CommonFunctions/Accessories";
import { Button } from "components";

const groupByKey = (input, key) => {
  let data = input.reduce((acc, currentValue) => {
    let groupKey = currentValue[key];
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(currentValue);
    return acc;
  }, {});
  return data;
};
const getValue = ({ value, format }) => {
  return format === "currency" ? formatCurrency(value) : value;
};
const Input = ({ type, name, placeholder, value, onChange, format }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <input
      className="border-[1px] border-[#333333] rounded-[5px] p-[10px] text-[#333333] "
      type={type}
      name={name}
      placeholder={placeholder}
      value={isFocused ? value : getValue({ value, format })}
      onChange={onChange}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    />
  );
};

const splitTypeOptions = [
    { TypeOption: "0", TypeDesc: "Select Type" },
    { TypeOption: "1", TypeDesc: "Funded - All" },
    { TypeOption: "2", TypeDesc: "NewLoan - All" },
    { TypeOption: "3", TypeDesc: "Funded - Retail" },
    { TypeOption: "4", TypeDesc: "NewLoan - Retail" },
    { TypeOption: "5", TypeDesc: "Funded - Wholesale" },
    { TypeOption: "6", TypeDesc: "NewLoan - Wholesale" },
  ],
  fields = [
    {
      label: "Payee",
      name: "payee",
      type: "autoComplete",
      placeholder: "Search Payee",
      labelKey: "Entity_Name",
      valueKey: "VendorId",
    },
    {
      name: "account",
      label: "G/L Account",
      placeholder: "Search G/L Account",
      type: "autoComplete",
      labelKey: "accountName",
      valueKey: "account",
    },
    {
      name: "totalAmount",
      label: "Total Amount",
      type: "text",
      placeholder: "Total Amount",
      format: "currency",
    },
    {
      label: "Invoice #",
      name: "invoice",
      type: "text",
      placeholder: "Invoice #",
      format: "number",
    },
    {
      label: "Memo",
      name: "memo",
      type: "text",
      placeholder: "Memo",
    },
    {
      label: "Split Type",
      name: "splitType",
      type: "select",
      placeholder: "Split Type",
    },
  ],
  {
    SessionId,
    SessionID,
    VendorId: vendorId,
    CID: companyId,
    EmpNum: empNumber,
    VendorPaymentDetailId = "",
    VendorPaymentId = "",
  } = queryStringToObject(),
  sessionId = SessionId || SessionID;

const SplitPayment = () => {
  const [details, setDetails] = useState({
      payee: vendorId || "",
      account: "",
      totalAmount: "",
      invoice: "",
      memo: "",
      splitType: "",
    }),
    [payeeOptions, setPayeeOptions] = useState([]),
    [accountOptions, setAccountOptions] = useState([]),
    [dragging, setDragging] = useState(false),
    [files, setFiles] = useState([]),
    [processingStatus, setProcessingStatus] = useState([]),
    [isMenuOpen, setIsMenuOpen] = useState(false),
    menuRef = useRef(null);

  const [debouncedSearchInput, setDebouncedSearchInput] = useState("");

  const isDisableSave = useMemo(() => {
    const {
      payee = "",
      account = "",
      totalAmount = "",
      splitType = "",
    } = details;

    return (
      !payee.trim() ||
      !account.trim() ||
      !totalAmount.trim() ||
      !splitType.trim() ||
      processingStatus.includes("Uploading")
    );
  }, [details, processingStatus]);

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

  const handleGetPayeeDetails = () => {
    handleAPI({
      name: "getPayeeDetails",
      params: { companyId, vendorId },
      apiName: "LoginCredentialsAPI",
      method: "GET",
    })
      .then((response) => {
        //
        response = formatSpecialCharacters(response);
        setPayeeOptions(JSON.parse(response));
        handleDetailsChange({
          target: { name: "payee", value: JSON.parse(response)[0] },
        });
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  };
  useEffect(() => {
    if (companyId && vendorId > 1) handleGetPayeeDetails();
    if (companyId) handleGetAccountDetails();
  }, [companyId, vendorId]);

  const handleGetAccountDetails = () => {
    handleAPI({
      name: "getCompanyAccounts",
      params: { companyId },
      apiName: "LoginCredentialsAPI",
      method: "GET",
    })
      .then((response) => {
        let iAccountOptions = [];
        try {
          iAccountOptions = JSON.parse(
            JSON["parse"](response)["Table"][0]["Column1"]
          );
          iAccountOptions = iAccountOptions.map((item) => {
            item["accountName"] =
              item["Account_Id"] + " - " + item["Account_Name"].trim();
            return item;
          });
        } catch (error) {}
        setAccountOptions(iAccountOptions);
        handleDetailsChange({
          target: { name: "accountOptions", value: iAccountOptions },
        });
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  };

  useEffect(() => {
    const searchInput = details["payeeSearch"] || "";

    const debounceTimeout = setTimeout(() => {
      setDebouncedSearchInput(searchInput);
    }, 300);
    return () => clearTimeout(debounceTimeout);
  }, [details["payeeSearch"]]);

  useEffect(() => {
    if (debouncedSearchInput.length > 2) {
      handleDetailsChange({
        target: { name: "payeeSearchStatus", value: true },
      });

      handleAPI({
        name: "searchPayeeDetails",
        params: { companyId, searchText: debouncedSearchInput },
      })
        .then((response) => {
          let iPayeeOptions = [];
          if (response) {
            response = formatSpecialCharacters(response);
            iPayeeOptions = groupByKey(JSON.parse(response), "category");
            iPayeeOptions = Object.keys(iPayeeOptions).reduce((acc, key) => {
              acc = [
                ...acc,
                {
                  label: key,
                  options: iPayeeOptions[key],
                },
              ];
              return acc;
            }, []);
          }
          return iPayeeOptions;
        })
        .catch((error) => {
          console.error("Error fetching data:", error);
        })
        .finally(() => {
          setTimeout(() => {
            handleDetailsChange({
              target: { name: "payeeSearchStatus", value: false },
            });
          }, 3000);
        });
    }
  }, [debouncedSearchInput]);

  const handleAccountSearch = async (searchText = "") => {
    return searchText.length <= 2
      ? []
      : await handleAPI({
          name: "searchAccountDetails",
          params: { companyId, searchText: searchText },
        })
          .then((response) => {
            let iPayeeOptions = groupByKey(JSON.parse(response), "category");
            iPayeeOptions = Object.keys(iPayeeOptions).reduce((acc, key) => {
              // acc = [
              //   ...acc,
              //   {
              //     label: key,
              //     options: iPayeeOptions[key],
              //   },
              // ];
              acc = [...acc, { Entity_Name: key, VendorId: -1 }];
              return acc;
            }, []);
          })
          .catch((error) => {
            console.error("Error fetching data:", error);
          });
  };

  const handleSearch = async (searchText = "") => {
    return searchText.length <= 2
      ? []
      : await handleAPI({
          name: "searchPayeeDetails",
          params: { companyId, searchText: searchText },
        }).then((response) => {
          response = formatSpecialCharacters(response);

          let iPayeeOptions = groupByKey(JSON.parse(response), "category");
          iPayeeOptions = Object.keys(iPayeeOptions).reduce((acc, key) => {
            // acc = [
            //   ...acc,
            //   {
            //     label: key,
            //     options: iPayeeOptions[key],
            //   },
            // ];
            acc = [...acc, { Entity_Name: key, VendorId: -1 }];
            acc = [...acc, ...iPayeeOptions[key]];
            return acc;
          }, []);

          return iPayeeOptions;
        });
  };

  const handleDetailsChange = (params) => {
    try {
      if (params["target"]["name"] === "payee") {
        const { VendorId, Account_Id, Account_Name, Entity_Name } =
          params["target"]["value"];
        let account = (Account_Id + " - " + Account_Name).trim();
        if (account == "0 -") account = account.replaceAll("0 -", "");
        params = [
          { name: "VendorId", value: VendorId },
          { name: "account", value: account },
          { name: "accountName", value: account },
          { name: "Account_Name", value: Account_Name },
          { name: "Account_Id", value: Account_Id },
          { name: params["target"]["name"] + "Name", value: Entity_Name },
          {
            name: params["target"]["name"] + "Options",
            value: [params["target"]["value"]],
          },
        ];
      } else if (params["target"]["name"] === "account") {
        const { Account_Id, Account_Name } = params["target"]["value"],
          account = (Account_Id + " - " + Account_Name).trim();
        if (account == "0 -") account = account.replaceAll("0 -", "");
        params = [
          {
            name: "Account_Id",
            value: Account_Id,
          },
          { name: "Account_Name", value: Account_Name },
          { name: "accountName", value: account },
        ];
      }

      const iDetails = Array.isArray(params)
        ? params.reduce((acc, { name, value }) => {
            if (typeof value === "string")
              value = (value || "").toString()?.trim();
            acc[name] = value;
            return acc;
          }, {})
        : { [params.target.name]: params.target.value };

      setDetails((prevDetails) => {
        return { ...prevDetails, ...iDetails };
      });
    } catch (error) {
      console.error("Error in handleDetailsChange:", error);
    }
  };

  const handleSave = () => {
    handleProcessingStatus("Saving");
    const {
      VendorId,
      Account_Id,
      totalAmount,
      invoice,
      memo,
      splitType,
      ScanDocId = "",
    } = details;

    const xmlInput = `<VendorDetail VendorPaymentId='${VendorPaymentId}' AccountId='${Account_Id}' VendorId='${VendorId}' TotalAmount='${totalAmount}' InvoiceNo='${invoice}' Memo='${memo}' ImageId='${ScanDocId}' SplitType='${splitType}'></VendorDetail>`;
    // return;
    handleAPI({
      name: "saveVendorSplit",
      params: { xmlInput },
      apiName: "LoginCredentialsAPI",
    }).then((response) => {
      console.log(response);
      try {
        const button = window.opener.document.querySelector(
          "#refresh-payment-data-all"
        );
        button.setAttribute("data-company-id", companyId);
        button.setAttribute("data-emp-id", empNumber);
        // button.setAttribute("data-VendorPaymentId", VendorPaymentId);

        button.click();
      } catch (error) {}
      handleProcessingStatus("Saving", false);
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFileUpload(droppedFiles);
  };

  const handleFileUpload = (selectedFiles) => {
    const acceptedFileTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/heic",
      "image/heif",
    ];

    const filteredFiles = selectedFiles.filter((file) =>
      acceptedFileTypes.includes(file.type)
    );
    setFiles((prevFiles) => [...prevFiles, ...filteredFiles]);
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    // handleFileUpload(selectedFiles);
    onFileDrop({ files: selectedFiles });
  };
  const handleProcessingStatus = (status, isAdd = true) => {
    setProcessingStatus((prevProcessingStatus) => {
      return isAdd
        ? [...prevProcessingStatus, status]
        : prevProcessingStatus.filter((item) => item !== status);
    });
  };
  const onFileDrop = ({ files }) => {
    handleProcessingStatus("Uploading");
    if (files.length) {
      let details = {
          LoanId: empNumber,
          DocTypeId: VendorPaymentId,
          sessionid: sessionId,
          viewtype: 23,
          category: VendorPaymentDetailId,
          description: "",
          usedoc: 1,
          entityid: 0,
          entitytypeid: 0,
          uploadsource: empNumber,
          conditonid: 0,
        },
        index = 1;

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
              if (index === files.length) {
                console.log("All files uploaded successfully", ScanDocId);
                handleDetailsChange({
                  target: { name: "ScanDocId", value: ScanDocId },
                });
                handleProcessingStatus("Uploading", false);
              }
            }
            index++;
          })
          .catch((e) => console.error("Error form UploadFilesdocs ====> ", e));
      });
    }
  };
  return (
    <div
      className="w-[600px] p-8 gap-[36px] rounded-[10px] flex justify-self-center justify-center mt-5 flex-col"
      style={{ boxShadow: "0px 8px 24px 0px rgba(0, 0, 0, 0.25)" }}
    >
      <div className="flex flex-col items-center justify-center">
        <h1 className="text-[26px] font-bold">Add Payment Split</h1>
      </div>
      <div className="flex flex-col gap-[24px] w-full">
        {fields.map(
          (
            { label, name, type, placeholder, format, labelKey, valueKey },
            index
          ) => (
            <div key={index} className="flex flex-col gap-[10px]">
              <label className="text-[#333333]">{label}</label>
              {type === "select" ? (
                <select
                  className="border-[1px] border-[#333333] rounded-[5px] p-[10px] text-[#333333]"
                  name={name}
                  placeholder={placeholder}
                  onChange={(event) => handleDetailsChange(event)}
                >
                  {splitTypeOptions.map(({ TypeOption, TypeDesc }, index) => (
                    <option key={index} value={TypeOption}>
                      {TypeDesc}
                    </option>
                  ))}
                </select>
              ) : type === "autoComplete" ? (
                <AutoComplete
                  className="text-[#333333] auto-complete"
                  name={name}
                  handleSearch={
                    name === "payee" ? handleSearch : handleAccountSearch
                  }
                  onChange={handleDetailsChange}
                  loading={details["payeeSearchStatus"] || false}
                  loadingMessage="Searching..."
                  options={details[name + "Options"] || []}
                  placeholder={placeholder}
                  value={details[name + "Name"] || ""}
                  labelKey={labelKey}
                  valueKey={valueKey}
                />
              ) : (
                <Input
                  type={type}
                  name={name}
                  format={format}
                  placeholder={placeholder}
                  value={details[name] || ""}
                  onChange={handleDetailsChange}
                />
              )}
            </div>
          )
        )}
      </div>
      <div className="">
        Image
        <div
          className={`border-[1px] border-dashed ${
            dragging ? "border-[#FF9800]" : "border-[#295B9A]"
          } rounded-md mt-1 flex flex-col justify-center items-center bg-[#508BC933]`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            id="file-upload"
            type="file"
            style={{ display: "none" }}
            onChange={
              !processingStatus.includes("Uploading")
                ? handleFileChange
                : () => {}
            }
            accept=".pdf,.jpg,.jpeg,.png,.gif,.heic,.heif"
            multiple
          />
          <label
            htmlFor="file-upload"
            className="button cursor-pointer p-5 w-full text-center"
          >
            {processingStatus.includes("Uploading") ? (
              <>
                <Spinner text="Uploading..." size="xxs" />
              </>
            ) : (
              <>Upload</>
            )}
          </label>
        </div>
      </div>
      <div className="flex justify-center gap-[24px]">
        <button
          className={`border-[2px] text-[#fff] rounded-[8px] px-7 py-2 ${
            isDisableSave || processingStatus.includes("Saving")
              ? "bg-[#6c757d] border-[#444d55] cursor-not-allowed"
              : "bg-[#508BC9] border-[#295B9A] cursor-pointer"
          }`}
          onClick={handleSave}
          disabled={isDisableSave || processingStatus.includes("Saving")}
        >
          {processingStatus.includes("Saving") ? (
            <Spinner text="Saving" size="xxs" color="#6c757d" />
          ) : (
            <>Save</>
          )}
        </button>
        <button
          className="border-[#508BC9] border-[3px] text-[#508BC9] rounded-[8px] px-7 py-2 "
          onClick={() => window.close()}
        >
          Cancel
        </button>
      </div>

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
                <li className="cursor-pointer px-4 py-2 hover:bg-gray-100">
                  <a
                    href="#"
                    onClick={() => {
                      setIsMenuOpen(false);
                      handleSaveWindowSize(
                        sessionId,
                        "/FeeCollection/Presentation/Webforms/VendorPaymentSplit.aspx"
                      );
                    }}
                  >
                    Save Window Size and Position
                  </a>
                </li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplitPayment;
