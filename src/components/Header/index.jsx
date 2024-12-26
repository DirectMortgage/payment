import { Heading, SelectBox, Img } from "./..";
import React from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretDown } from '@fortawesome/free-solid-svg-icons';

const dropDownOptions = [
  { label: "Select Company", value: "0" },
  { label: "Direct Services LLC", value: "2" },
  { label: "Direct Mortgage, Corp", value: "4" },
];

export default function Header({ setCompanyId, ...props }) {

    const handleCompanyChange = (event) => {
        setCompanyId(parseInt(event.value));
      };
  return (
    <header 
        {...props} 
        className={`${props.className} flex sm:flex-col items-center px-[46px] py-4 md:px-5 bg-indigo-400 w-full`}
    >
        <div className="flex items-center w-full">
            <SelectBox
                indicator={<Img src="images/img_arrowdown.svg" alt="Arrow Down" className="h-[18px] w-[18px]" />}
                name="Company Dropdown"
                placeholder={`Direct Mortgage, Corp`}
                options={dropDownOptions}
                onChange={handleCompanyChange}
                className="flex w-[200px] gap-[26px] rounded border border-solid border-black-900 bg-white-a700 px-3 py-1.5 font-inter text-[12px] text-blue_gray-900 md:w-[200px]"
            />
            <div className="flex items-center gap-8 flex-1 ml-[200px]">
            <SelectBox
    indicator={<FontAwesomeIcon icon={faCaretDown} className="text-white-a700 text-xs ml-1  mt-1" />}
    name="Issue Dropdown"
    placeholder="Duplicate payments"
    // options={dropDownOptions}
    classNamePrefix="duplicate-payment-select"
    className="flex w-[180px] rounded-[15px] bg-red-600 px-5 py-0.5 text-[14px] font-semibold text-white-a700 md:w-[180px] mt-1"
  />
                <Heading
                    size="headinglg"
                    as="h2"
                    className="text-[32px] font-bold text-white-a700 md:text-[30px] sm:text-[28px] whitespace-nowrap"
                >
                    Payment Approval
                </Heading>
            </div>
        </div>
    </header>
);
}
