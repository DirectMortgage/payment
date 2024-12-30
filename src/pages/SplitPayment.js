import { useEffect, useState } from "react";
import { AutoComplete } from "./AutoComplete";
import {
  handleAPI,
  queryStringToObject,
} from "components/CommonFunctions/CommonFunction";

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
      labelKey: "Account_Name",
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
    SessionId: sessionId,
    VendorId: vendorId,
    CID: companyId,
    EmpNum: empNumber,
  } = queryStringToObject();

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
    [dragging, setDragging] = useState(false),
    [files, setFiles] = useState([]);

  const [debouncedSearchInput, setDebouncedSearchInput] = useState("");

  useEffect(() => {
    const searchInput = details["payeeSearch"] || "";

    const debounceTimeout = setTimeout(() => {
      setDebouncedSearchInput(searchInput);
    }, 300);
    return () => clearTimeout(debounceTimeout);
  }, [details["payeeSearch"]]);

  useEffect(() => {
    if (debouncedSearchInput.length > 2) {
      setPayeeOptions([]);
      handleDetailsChange({
        target: { name: "payeeSearchStatus", value: true },
      });

      handleAPI({
        name: "searchPayeeDetails",
        params: { companyId, searchText: debouncedSearchInput },
      })
        .then((response) => {
          let iPayeeOptions = groupByKey(JSON.parse(response), "category");
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

          setPayeeOptions(iPayeeOptions);
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

  const handleSearch = async (searchText = "") => {
    return searchText.length == 0
      ? []
      : await handleAPI({
          name: "searchPayeeDetails",
          params: { companyId, searchText: searchText },
        }).then((response) => {
          let iPayeeOptions = groupByKey(JSON.parse(response), "category");
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

          return iPayeeOptions;
        });
  };

  const handleDetailsChange = (params) => {
    if (params["name"] === "payee") {
      const { VendorId, Account_Id, Account_Name } = params["selectedOption"],
        account = Account_Id + "-" + Account_Name;
      params = [
        { name: "VendorId", value: VendorId },
        { name: "account", value: account },
        { name: "Account_Name", value: Account_Name },
        { name: "Account_Id", value: Account_Id },
        { name: params["name"] + "Options", value: [params["selectedOption"]] },
        {
          name: "accountOptions",
          value: [
            {
              label: Account_Name,
              value: [{ Account_Name, Account_Id, account }],
            },
          ],
        },
      ];
    } else if (params["name"] === "account") {
      params = [];
    }

    const iDetails = Array.isArray(params)
      ? params.reduce((acc, { name, value }) => {
          acc[name] = value;
          return acc;
        }, {})
      : { [params.target.name]: params.target.value };
    setDetails((prevDetails) => {
      return { ...prevDetails, ...iDetails };
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
    handleFileUpload(selectedFiles);
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
            { label, name, type, placeholder, required, labelKey, valueKey },
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
                  handleSearch={name === "payee" ? handleSearch : () => {}}
                  onChange={handleDetailsChange}
                  loading={details["payeeSearchStatus"] || false}
                  loadingMessage="Searching..."
                  options={details[name + "Options"] || []}
                  placeholder={placeholder}
                  value={details[name]}
                  labelKey={labelKey}
                  valueKey={valueKey}
                />
              ) : (
                <input
                  className="border-[1px] border-[#333333] rounded-[5px] p-[10px] text-[#333333] "
                  type={type}
                  name={name}
                  placeholder={placeholder}
                  value={details[name] || ""}
                  onChange={(event) => handleDetailsChange(event)}
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
            onChange={handleFileChange}
            accept=".pdf,.jpg,.jpeg,.png,.gif,.heic,.heif"
            multiple
          />
          <label
            htmlFor="file-upload"
            className="button cursor-pointer p-5 w-full text-center"
          >
            Upload
          </label>
        </div>
      </div>
      <div className="flex justify-center gap-[24px]">
        <button className="bg-[#508BC9] border-[#295B9A] border-[2px] text-[#fff] rounded-[8px] px-7 py-2 ">
          Save
        </button>
        <button className="border-[#508BC9] border-[3px] text-[#508BC9] rounded-[8px] px-7 py-2 ">
          Cancel
        </button>
      </div>
    </div>
  );
};

export default SplitPayment;
