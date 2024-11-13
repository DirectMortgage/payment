import { Helmet } from "react-helmet";
import { Button } from "../../components";
import Header from "../../components/Header";
import PaymentManagementSection from "./PaymentManagementSection";
import React from "react";

export default function DesktopOnePage() {
  return (
    <>
      <Helmet>
        <title>Payment Approval and Management | Direct Mortgage Corp</title>
        <meta
          name="description"
          content="Efficiently manage and approve mortgage payments with Direct Mortgage, Corp. Ensure accurate payment splits, track payee history, and handle ACH or check payments securely."
        />
      </Helmet>
      <div className="flex w-full flex-col items-center gap-[264px] bg-white-a700 md:gap-[198px] sm:gap-[132px]">
        <div className="flex flex-col gap-[18px] self-stretch">
          <Header />

          {/* payment management section */}
          <PaymentManagementSection />
        </div>
        <div className="mx-auto mb-1 flex w-full max-w-[1346px] justify-between gap-5 self-stretch md:px-5">
          <Button className="flex h-[36px] min-w-[78px] flex-row items-center justify-center rounded-lg border border-solid border-indigo-700 bg-indigo-400 px-[19px] text-center font-inter text-[14px] font-bold text-white-a700">
            Menu
          </Button>
          <Button className="flex h-[36px] min-w-[74px] flex-row items-center justify-center rounded-lg border border-solid border-indigo-700 bg-indigo-400 px-[19px] text-center font-inter text-[14px] font-bold text-white-a700">
            Save
          </Button>
        </div>
      </div>
    </>
  );
}
