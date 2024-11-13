import { Img, Text, Button, SelectBox, Heading, Radio, RadioGroup, Input } from "../../components";
import { CloseSVG } from "../../components/Input/close.jsx";
import { ReactTable } from "../../components/ReactTable";
import { createColumnHelper } from "@tanstack/react-table";
import React from "react";

const dropDownOptions = [
  { label: "Option1", value: "option1" },
  { label: "Option2", value: "option2" },
  { label: "Option3", value: "option3" },
];
const tableData = [
  {
    payeeHeader: "CrossCheck Compliance ",
    totalHeader: "$0.00",
    glAccountHeader: "0-",
    departmentHeader: ".",
    invoiceDateHeader: ".",
    invoiceNumberHeader: ".",
    memoHeader: ".",
    paidHeader: "images/img_instagram.svg",
    imagesHeader: "Upload",
    paymentDetails: "Date Last Paid: 10/28/2022\nAmount Paid: $8,383.23",
  },
  {
    payeeHeader: "Gift Hounds",
    paymentDetails: "Date Last Paid: 10/28/2022\nAmount Paid: $702.98",
    totalHeader: "$2.00",
    glAccountHeader: "6010 -Advertising",
    departmentHeader: ".",
    invoiceDateHeader: ".",
    invoiceNumberHeader: ".",
    memoHeader: ".",
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
  {
    payeeHeader: "HUD",
    paymentDetails: "Process HUD",
    paymentInfo: "Date Last Paid: 10/25/2024\nAmount Paid: $9,457.00",
    totalHeader: "$7,835.80",
    glAccountHeader: "2033 -HUD Premiums Payable",
    departmentHeader: ".",
    invoiceDateHeader: "10/31/2024",
    invoiceNumberHeader: "FHA UFMIP - 515836",
    memoHeader: "515836 - Edward Gonzalez",
    paidHeader: "images/img_instagram.svg",
    imagesHeader: "Upload",
  },
  {
    payeeHeader: "VA",
    paymentDetails: "Process VA",
    paymentInfo: "Date Last Paid: 10/18/2024\nAmount Paid: $2,500.00",
    totalHeader: "$4,825.00",
    glAccountHeader: "2031 - VA Funding Fee Payable",
    departmentHeader: ".",
    invoiceDateHeader: "10/31/2024",
    invoiceNumberHeader: "VA Funding Fee - 512932",
    memoHeader: "512932 - Joseph Yeates",
    paidHeader: "images/img_instagram.svg",
    imagesHeader: "Upload",
    viewImageText: "View Image",
    fulfillmentText: "Fulfillment",
  },
];

export default function PaymentManagementSection() {
  const [searchBarValue, setSearchBarValue] = React.useState("");
  const tableColumns = React.useMemo(() => {
    const tableColumnHelper = createColumnHelper();
    return [
      tableColumnHelper.accessor("payeeHeader", {
        cell: (info) => (
          <div className="flex flex-col items-center justify-center px-1.5">
            <Heading size="headingmd" as="h1" className="text-[14px] font-semibold text-indigo-700">
              {info.getValue()}
            </Heading>
            <Text size="textxs" as="p" className="text-[10px] font-normal leading-[13px] text-black-900">
              {info.row.original.paymentDetails}
            </Text>
          </div>
        ),
        header: (info) => (
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
        meta: { width: "192px" },
      }),
      tableColumnHelper.accessor("totalHeader", {
        cell: (info) => (
          <Text as="p" className="text-[12px] font-normal text-black-900">
            {info.getValue()}
          </Text>
        ),
        header: (info) => (
          <Text size="textmd" as="p" className="py-3.5 text-left text-[14px] font-normal text-black-900">
            Total
          </Text>
        ),
        meta: { width: "86px" },
      }),
      tableColumnHelper.accessor("glAccountHeader", {
        cell: (info) => (
          <Text size="textmd" as="p" className="text-[14px] font-normal text-black-900">
            {info.getValue()}
          </Text>
        ),
        header: (info) => (
          <Text size="textmd" as="p" className="py-3.5 text-left text-[14px] font-normal text-black-900">
            G/L Account
          </Text>
        ),
        meta: { width: "116px" },
      }),
      tableColumnHelper.accessor("departmentHeader", {
        cell: (info) => (
          <Text size="textmd" as="p" className="text-[14px] font-normal text-black-900">
            {info.getValue()}
          </Text>
        ),
        header: (info) => (
          <Text size="textmd" as="p" className="pb-3 pt-4 text-left text-[14px] font-normal text-black-900">
            Department
          </Text>
        ),
        meta: { width: "96px" },
      }),
      tableColumnHelper.accessor("invoiceDateHeader", {
        cell: (info) => (
          <Text size="textmd" as="p" className="text-[14px] font-normal text-black-900">
            {info.getValue()}
          </Text>
        ),
        header: (info) => (
          <Text size="textmd" as="p" className="py-3.5 text-left text-[14px] font-normal text-black-900">
            Invoice Date
          </Text>
        ),
        meta: { width: "90px" },
      }),
      tableColumnHelper.accessor("invoiceNumberHeader", {
        cell: (info) => (
          <Text size="textmd" as="p" className="text-[14px] font-normal text-black-900">
            {info.getValue()}
          </Text>
        ),
        header: (info) => (
          <Text size="textmd" as="p" className="py-3.5 pl-1 text-left text-[14px] font-normal text-black-900">
            Invoice #
          </Text>
        ),
        meta: { width: "96px" },
      }),
      tableColumnHelper.accessor("memoHeader", {
        cell: (info) => (
          <Text size="textxs" as="p" className="text-[10px] font-normal text-black-900">
            {info.getValue()}
          </Text>
        ),
        header: (info) => (
          <Text size="textmd" as="p" className="py-3.5 text-left text-[14px] font-normal text-black-900">
            Memo
          </Text>
        ),
        meta: { width: "96px" },
      }),
      tableColumnHelper.accessor("paymentMethodHeader", {
        cell: (info) => (
          <RadioGroup name="paymentmethodgroup" className="flex">
            <Radio value="ach" label="ACH" className="flex gap-1 py-0.5 text-[12px] text-black-900" />
            <Radio value="check" label="Check" className="ml-2.5 flex gap-1 py-0.5 text-[12px] text-black-900" />
          </RadioGroup>
        ),
        header: (info) => (
          <Text size="textmd" as="p" className="pb-3 pt-4 text-left text-[14px] font-normal text-black-900">
            Payment Method
          </Text>
        ),
        meta: { width: "136px" },
      }),
      tableColumnHelper.accessor("paidHeader", {
        cell: (info) => (
          <div className="flex">
            <Img src={info.getValue()} alt="Instagram Image" className="h-[18px]" />
          </div>
        ),
        header: (info) => (
          <Text size="textmd" as="p" className="py-3.5 text-left text-[14px] font-normal text-black-900">
            Paid
          </Text>
        ),
        meta: { width: "44px" },
      }),
      tableColumnHelper.accessor("imagesHeader", {
        cell: (info) => (
          <div className="flex justify-center rounded border border-dashed border-indigo-700 bg-indigo-400_33">
            <Heading as="h2" className="self-end text-[12px] font-semibold text-black-900">
              {info.getValue()}
            </Heading>
          </div>
        ),
        header: (info) => (
          <Text size="textmd" as="p" className="pb-3 pt-4 text-left text-[14px] font-normal text-black-900">
            Images
          </Text>
        ),
        meta: { width: "212px" },
      }),
    ];
  }, []);

  return (
    <>
      {/* payment management section */}
      <div className="flex justify-center px-14 md:px-5">
        <div className="mx-auto w-full max-w-[1166px]">
          <div className="flex items-start sm:flex-col">
            <div className="mb-3.5 flex flex-1 gap-[33px] sm:self-stretch">
              <Button
                leftIcon={<Img src="images/img_grid.svg" alt="Grid" className="h-[18px] w-[18px]" />}
                className="flex h-[38px] min-w-[146px] flex-row items-center justify-center gap-2.5 rounded-lg border border-solid border-indigo-700 bg-indigo-400 px-[19px] text-center font-inter text-[12px] font-bold text-white-a700"
              >
                Add Payment
              </Button>
              <Button
                leftIcon={<Img src="images/img_grid.svg" alt="Grid" className="h-[18px] w-[18px]" />}
                className="flex h-[38px] min-w-[176px] flex-row items-center justify-center gap-2.5 rounded-lg border border-solid border-indigo-700 bg-indigo-400 px-[19px] text-center font-inter text-[12px] font-bold text-white-a700"
              >
                Add Payment Split
              </Button>
            </div>
            <Input
              name="Search Field"
              placeholder={`Search`}
              value={searchBarValue}
              onChange={(e) => setSearchBarValue(e.target.value)}
              suffix={searchBarValue?.length > 0 ? <CloseSVG onClick={() => setSearchBarValue("")} /> : null}
              className="flex h-[36px] w-[16%] items-center justify-center self-end rounded border border-solid border-gray-700 px-2 text-[14px] text-gray-600 sm:w-full sm:self-auto"
            />
          </div>
          <div className="mt-2">
            <ReactTable
              size="xs"
              bodyProps={{ className: "" }}
              headerProps={{ className: "border-gray-600 border-b border-solid" }}
              cellProps={{ className: "border-gray-600 border-b border-solid" }}
              className="md:block md:overflow-x-auto md:whitespace-nowrap"
              columns={tableColumns}
              data={tableData}
            />
            <div className="flex items-center border-b border-solid border-gray-600 py-2.5 md:flex-col">
              <div className="flex w-[20%] flex-col gap-2 md:w-full">
                <div className="flex flex-wrap justify-end gap-[25px]">
                  <Text as="p" className="font-inter text-[12px] font-normal text-black-900">
                    Total bills:{" "}
                  </Text>
                  <Heading as="p" className="font-inter text-[12px] font-semibold text-black-900">
                    $12,660.80
                  </Heading>
                </div>
                <div className="flex flex-wrap justify-center gap-6">
                  <Text as="p" className="font-inter text-[12px] font-normal text-black-900">
                    <span>Bills marked to pay&nbsp;</span>
                    <span className="font-bold">(1):</span>
                  </Text>
                  <Heading as="p" className="font-inter text-[12px] font-semibold text-black-900">
                    $10,562.35{" "}
                  </Heading>
                </div>
              </div>
              <div className="flex flex-1 items-center justify-center gap-8 px-14 md:self-stretch md:px-5 sm:flex-col">
                <div className="flex w-[28%] flex-col items-start justify-center gap-0.5 sm:w-full">
                  <Text as="p" className="font-inter text-[12px] font-normal text-black-900">
                    Pay From Account
                  </Text>
                  <SelectBox
                    indicator={<Img src="images/img_arrowdown.svg" alt="Arrow Down" className="h-[18px] w-[18px]" />}
                    name="Account Dropdown"
                    placeholder={`1091 - Goldenwest Checking`}
                    options={dropDownOptions}
                    className="flex gap-[26px] self-stretch rounded border border-solid border-black-900 bg-white-a700 px-3 py-1.5 font-inter text-[12px] text-blue_gray-900"
                  />
                </div>
                <Button
                  leftIcon={<Img src="images/img_arrowright.svg" alt="Arrow Right" className="h-[18px] w-[18px]" />}
                  className="flex h-[38px] min-w-[118px] flex-row items-center justify-center gap-2.5 self-end rounded-lg border border-solid border-indigo-700 bg-indigo-400 px-[19px] text-center font-inter text-[12px] font-bold text-white-a700 sm:self-auto"
                >
                  Pay ACH
                </Button>
              </div>
            </div>
          </div>
          <div className="py-2.5">
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
          </div>
          <div className="py-2.5">
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
          </div>
        </div>
      </div>
    </>
  );
}
