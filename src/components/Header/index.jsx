import { Heading, SelectBox, Img } from "./..";
import React from "react";

const dropDownOptions = [
  { label: "Option1", value: "option1" },
  { label: "Option2", value: "option2" },
  { label: "Option3", value: "option3" },
];

export default function Header({ ...props }) {
  return (
    <header {...props} className={`${props.className} flex sm:flex-col items-center px-[46px] md:px-5 bg-indigo-400`}>
      <SelectBox
        indicator={<Img src="images/img_arrowdown.svg" alt="Arrow Down" className="h-[18px] w-[18px]" />}
        name="Company Dropdown"
        placeholder={`Direct Mortgage, Corp.`}
        options={dropDownOptions}
        className="flex w-[16%] gap-[26px] rounded border border-solid border-black-900 bg-white-a700 px-3 py-1.5 font-inter text-[12px] text-blue_gray-900 md:w-full"
      />
      <div className="ml-[86px] mt-2 flex w-[40%] items-start justify-between gap-5 self-end md:ml-0 md:w-full sm:flex-col sm:self-auto">
        <SelectBox
          indicator={<Img src="images/img_arrowdown_white_a700.svg" alt="Arrow Down" className="h-[18px] w-[18px]" />}
          name="Issue Dropdown"
          placeholder={`Duplicate payments`}
          options={dropDownOptions}
          className="mt-2.5 flex w-[36%] gap-1.5 rounded-[10px] bg-red-600 px-5 py-0.5 text-[14px] font-semibold text-white-a700 sm:w-full"
        />
        <Heading
          size="headinglg"
          as="h2"
          className="self-center text-[32px] font-bold text-white-a700 md:text-[30px] sm:text-[28px]"
        >
          Payment Approval
        </Heading>
      </div>
    </header>
  );
}
