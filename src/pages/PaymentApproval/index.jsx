import { Helmet } from "react-helmet";
import { Button } from "../../components";
import Header from "../../components/Header";
import PaymentManagementSection from "./PaymentManagementSection";
import React, { useEffect, useState } from "react";

export default function DesktopOnePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && !event.target.closest('.menu-container')) {
        setIsMenuOpen(false);
      }
    };
  
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);
 
  const fnUpdateWinSize = () => {
    console.log("DM Accounting clicked");
    // Add your functionality here
  };

  const fnAddNewPayee = () => {
    console.log("Run Validation clicked");
    // Add your functionality here
  };

  const fnVendorPaymentSplit = () => {
    console.log("Create a Bill Reminder clicked");
    // Add your functionality here
  };

  const fnOpenMenu = () => {
    console.log("Payment Approval History clicked");
    // Add your functionality here
  };
  return (
    <>
      <Helmet>
        <title>Payment Approval and Management | Direct Mortgage Corp</title>
        <meta
          name="description"
          content="Efficiently manage and approve mortgage payments with Direct Mortgage, Corp. Ensure accurate payment splits, track payee history, and handle ACH or check payments securely."
        />
      </Helmet>
      <div
  className="flex w-full flex-col items-center gap-[264px] bg-white-a700 md:gap-[198px] sm:gap-[132px] pb-[80px]"
>
<div className="flex flex-col gap-[18px] self-stretch">
          <Header />

          {/* payment management section */}
          <PaymentManagementSection />
        </div>
        <div className="fixed-footer z-[1000]">
  <div className="mx-auto flex w-full max-w-[1346px] justify-between pl-0 pr-12 md:pl-0 md:pr-5">
    <div className="relative">
      <Button 
        className="flex h-[36px] min-w-[78px] flex-row items-center justify-center rounded-lg border border-solid border-indigo-700 bg-indigo-400 px-[19px] text-center font-inter text-[14px] font-bold text-white-a700"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        Menu
      </Button>
      
      {isMenuOpen && (
        <ul className="absolute bottom-[40px] left-0 w-[300px] rounded-lg border border-gray-200 bg-white shadow-lg z-[1000]"  style={{ backgroundColor: "white" }} >
         
         
          <li className="cursor-pointer px-4 py-2 hover:bg-gray-100 border-b">
            <a href="#" onClick={() => fnVendorPaymentSplit()}>Add Payment Split</a>
          </li>
          <li className="cursor-pointer px-4 py-2 hover:bg-gray-100 border-b">
            <a href="#" onClick={() => fnAddNewPayee()}>Add Payment</a>
          </li>
          <li className="cursor-pointer px-4 py-2 hover:bg-gray-100 border-b">
            <a href="#" onClick={() => fnOpenMenu(3)}>Search for Vendors and Customers</a>
          </li>
          <li className="cursor-pointer px-4 py-2 hover:bg-gray-100 border-b">
            <a href="#" onClick={() => fnOpenMenu(1)}>DM Accounting</a>
          </li>
          <li className="cursor-pointer px-4 py-2 hover:bg-gray-100 border-b">
            <a href="#" onClick={() => fnOpenMenu(2)}>Run Validation</a>
          </li>
          <li className="cursor-pointer px-4 py-2 hover:bg-gray-100 border-b">
            <a href="#" onClick={() => fnOpenMenu(4)}>Create a Bill Reminder</a>
          </li>
          <li className="cursor-pointer px-4 py-2 hover:bg-gray-100 border-b">
            <a href="#" onClick={() => fnOpenMenu(5)}>Payment Approval History</a>
          </li>
          <li className="cursor-pointer px-4 py-2 hover:bg-gray-100">
            <a href="#" onClick={() => fnUpdateWinSize()}>Save Window Size and Position</a>
          </li>
        </ul>
      )}
    </div>

    <Button className="flex h-[36px] min-w-[74px] flex-row items-center justify-center rounded-lg border border-solid border-indigo-700 bg-indigo-400 px-[19px] text-center font-inter text-[14px] font-bold text-white-a700">
      Save
    </Button>
  </div>
</div>
      </div>
    </>
  );
}
