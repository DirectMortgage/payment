import { Heading, SelectBox, Img } from "./..";
import { React, useState, useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretDown } from '@fortawesome/free-solid-svg-icons';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import {
    handleAPI,
    queryStringToObject,
    handleGetSessionData,
    fnOpenWindow,
    handleSaveWindowSize,

} from "../../components/CommonFunctions/CommonFunction.js";

const dropDownOptions = [
    { label: "Select Company", value: "0" },
    { label: "Direct Services LLC", value: "2" },
    { label: "Direct Mortgage, Corp", value: "4" },
];

export default function Header({ setCompanyId, companyId, SessionId, setValidationResult, ...props }) {

    const [validationResults, setValidationResults] = useState([]);
    const [EntityInfo, setEntityInfo] = useState([]);
    const [status, setStatus] = useState('');
    const [isLoading, setIsLoading] = useState(true);


    useEffect(() => {
        PaymentValidation();
    }, [companyId]);


    const PaymentValidation = async () => {
        try {
            let obj = { CompNum: companyId, SessionId: SessionId };
            const response = await handleAPI({
                name: "FnRunValidation",
                params: obj,
            });

            if (response && response.trim() !== "{}" && response.trim() !== "[]") {
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(response, "text/xml");
                const resultText = xmlDoc.querySelector("VendorApprovalPayment").getAttribute("ResultText");
                const validationNodes = xmlDoc.querySelectorAll("BizValidationErrors row");
                const duplicateNodes = xmlDoc.querySelectorAll("DuplicateRows row");

                setStatus(resultText);
                setIsLoading(false);

                const validations = Array.from(validationNodes).map((node, index) => ({
                    validation: node.getAttribute("Validation"),
                    validationMessage: node.getAttribute("ValidationMessage")
                }));
                const duplicates = Array.from(duplicateNodes).map((node) => ({
                    rowId: node.getAttribute("RowId"),
                    vendorPaymentId: node.getAttribute("VendorPaymentId"),
                    vendorPaymentDetailId: node.getAttribute("VendorPaymentDetailid"),
                    entityId: node.getAttribute("EntityId"),
                    refNo: node.getAttribute("RefNo"),
                    billId: node.getAttribute("BillId"),
                    EntityName: node.getAttribute("EntityName")
                }));
                setValidationResults(validations);
                setValidationResult(duplicates)
                const uniqueDuplicates = duplicates.reduce((acc, current) => {
                    const duplicate = acc.find(item => item.vendorPaymentId === current.vendorPaymentId);
                    if (!duplicate) {
                        acc.push(current);
                    }
                    return acc;
                }, []);
                setEntityInfo(uniqueDuplicates);
            }
        } catch (error) {
            console.error(error);
            setIsLoading(false);
        }
    };

    const handleCompanyChange = (event) => {
        setCompanyId(parseInt(event.value));
        setIsLoading(true);
        setStatus('loading');
    };
    const [isOpen, setIsOpen] = useState(false);


    const getBackgroundColor = () => {
        if (isLoading) return 'bg-yellow-500';
        return status === "FAIL" ? "bg-red-600" : "bg-green-600";
    };
    const ValidationMessage = () => (
        <div className="text-[14px]">
            {status === "PASS" ? (
                <b>No Duplicate Payments were found.</b>
            ) : (
                <>
                    <b>The following fields need to be updated in Payment Approval: </b><br /><br />
                    {validationResults.map((result, index) => (
                        <div key={index}>
                            {`${index + 1}. ${result.validation}`}<br />
                            {result.validationMessage}<br />

                        </div>
                    ))}
                    {EntityInfo.map((result, index) => (
                        <div className="mt-2">
                            Payee:   {result.EntityName} <br />
                        </div>
                    ))}
                </>
            )}
        </div>
    );

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
                    <div className="relative">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className={`flex items-center w-[180px] rounded-[15px] ${getBackgroundColor()} px-5 py-0.5 text-[14px] font-semibold text-white-a700 md:w-[180px] mt-1`}
                        >
                            <span className="whitespace-nowrap">Duplicate payments</span>
                            {isLoading ? (
                                <FontAwesomeIcon
                                    icon={faSpinner}
                                    className="text-white-a700 text-xs ml-1 animate-spin"
                                />
                            ) : (
                                <FontAwesomeIcon
                                    icon={faCaretDown}
                                    className="text-white-a700 text-xs ml-1"
                                />
                            )}
                        </button>

                        {isOpen && (
                            <div className="coverAll">
                                <button type="button" className="close" onClick={() => setIsOpen(false)}>
                                    <span className="white">×</span>
                                </button>
                                <ValidationMessage />
                            </div>
                        )}
                    </div>
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
