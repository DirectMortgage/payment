import React, { useState, useEffect, useRef, useMemo } from "react";
import PropTypes from "prop-types";
import Select from "react-select";
import { Heading } from "../Heading";
import Close from "../../components/Images/close.png";
import Add from "../../components/Images/add.png";
import { fnOpenWindow } from "../../components/CommonFunctions/CommonFunction.js";

const shapes = {
  round: "rounded",
};

const variants = {
  fill: {
    white_A700: "bg-white-a700 text-black-900",
  },
};

const sizes = {
  sm: "text-[14px]", //48 16px
  xs: "text-[14px]",
};

const GroupSelect = ({
  className = "",
  options = [],
  value = "",
  onChange = () => {},
  name = "",
  labelKey = "VendorName",
  valueKey = "VendorId",
  sessionid = "",
  placeholder = "Search for vendor",
  isClearable = false,
  shape,
  variant = "fill",
  size = "xs",
  color = "",
  label = "",
  loading,
  loadingMessage = "Loading",
  RowId,
  VendorId,
  handleRemove,
  showAddPaymentSplit = false, // Add these new props
  showRemoveRow = false,
  companyId,
  EmpId,
  VendorPaymentDetailId,
  VendorPaymentId,
  defaultMenuIsOpen = true,
  isChildRow = false,
  menuPlacement = "auto",
  ...restProps
}) => {
  const [customOptions, setCustomOptions] = useState([]);

  useEffect(() => {
    const additionalOptions = [];

    if (showAddPaymentSplit) {
      additionalOptions.push({
        label: "Add Payment Split",
        value: "add-payment-split",
        icon: Add,
        onClick: () => {
          if (window["location"]["host"].includes("localhost")) {
            window.open(
              `../Payment/SplitPayment?SessionID=${sessionid}&VendorId=${VendorId}&EmpNum=${EmpId}&CID=${companyId}&VendorPaymentDetailId=${VendorPaymentDetailId}&VendorPaymentId=${VendorPaymentId}`,
              "_blank",
              "width=600,height=800"
            );
          } else {
            fnOpenWindow(
              `../Payment/SplitPayment?SessionID=${sessionid}&VendorId=${VendorId}&EmpNum=${EmpId}&CID=${companyId}&VendorPaymentDetailId=${VendorPaymentDetailId}&VendorPaymentId=${VendorPaymentId}`,
              "/FeeCollection/Presentation/Webforms/VendorPaymentSplit.aspx",
              sessionid
            );
          }
        },
      });
    }

    if (showRemoveRow) {
      additionalOptions.push({
        label: "Remove Row",
        value: "remove-row",
        icon: Close,
        onClick: () => {
          handleRemove(RowId);
        },
      });
    }

    setCustomOptions(additionalOptions);
  }, [showAddPaymentSplit, showRemoveRow]);

  const allOptions = [...options, ...customOptions];

  const handleChange = (selectedOption) => {
    if (selectedOption && Object.keys(selectedOption).length > 0) {
      onChange([
        { name, value: selectedOption[valueKey] },
        { name: name + "_name", value: selectedOption[labelKey] },
      ]);
    }
  };

  const validatedOptions = allOptions
    .map((option) => {
      if (option && option[labelKey] && option[valueKey]) {
        return option;
      }
      return null;
    })
    .filter(Boolean);

  const iValue = useMemo(() => {
    if (validatedOptions.length > 0 && value) {
      return [validatedOptions.find((option) => option[valueKey] === value)];
    }
  }, [value, validatedOptions]);

  const selectRef = useRef(null);

  const handleKeyDown = (e) => {
    const select = selectRef.current;
    if (!select) return;
    if ([32].includes(e.keyCode) && !e.shiftKey) {
      // tab => 9
      //debugger;
      e.preventDefault();
      const currentOption = selectRef.current.state.focusedOption;
      if (currentOption) {
        handleChange(currentOption);
        setMenuIsOpen(false);
        //e.target.blur();
      }
    }
  };
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  return (
    <>
      <Select
        onKeyDown={(event) => handleKeyDown(event)}
        options={validatedOptions}
        name={name}
        placeholder={placeholder}
        isSearchable={true}
        isClearable={isClearable}
        autoFocus={isChildRow}
        menuIsOpen={menuIsOpen}
        onMenuOpen={() => {
          setMenuIsOpen(true);
          if (isChildRow) {
            try {
              const ele = window.event.target.closest("td"),
                eleTr = window.event.target.closest("tr"),
                width = ele.offsetWidth,
                height = ele.offsetHeight;
              ele.style.position = "absolute";
              ele.style.width = width + "px";
              eleTr.style.minHeight = height + "px";
              eleTr.style.height = height + "px";
              // ele.style.border = "none";
            } catch (error) {}
          }
        }}
        onMenuClose={() => {
          setMenuIsOpen(false);
          if (isChildRow) {
            // debugger;
            try {
              const ele = window.event.target.closest("td"),
                eleTr = window.event.target.closest("tr");
              ele.style.position = "";
              ele.style.width = "auto";
              eleTr.style.minHeight = "auto";
              eleTr.style.height = "auto";
              // ele.style.borderTop = "1px solid rgb(127, 127, 127)";
            } catch (error) {}
          }
        }}
        //onFocus={() => (isChildRow ? setMenuIsOpen(true) : null)}
        ref={selectRef}
        labelField={labelKey}
        valueField={valueKey}
        value={iValue}
        menuPlacement={menuPlacement}
        onChange={handleChange}
        disabled={loading}
        className={`${className} block s-dropdown w-full cursor-pointer font-[10px] items-center justify-center border border-solid bg-white-a700 rounded ${
          shape && shapes[shape]
        } ${variant && (variants[variant]?.[color] || variants[variant])} ${
          size && sizes[size]
        }`}
        dropdownGap={0}
        styles={{
          dropdownIndicator: (base, state) => ({
            ...base,
            color: state.isFocused ? "#508bc9" : "gray",
            padding: "3px",
            width: "20px",
            height: "20px",
            alignItems: "center",
            fontSize: "15px",
            transform: state.selectProps.menuIsOpen
              ? "rotate(180deg)"
              : "rotate(0)",
            transition: "transform 0.2s ease",
            ":hover": {
              color: "#508bc9", // Change color on hover
            },
          }),
          clearIndicator: (base) => ({
            ...base,
            color: "red",
            padding: "3px",
            width: "20px",
            alignItems: "center",
            cursor: "pointer",
            height: "20px",
            alignSelf: "center",
            fontSize: "15px",
            ":hover": {
              color: "darkred",
            },
          }),
          indicatorSeparator: (base) => ({
            ...base,
            display: "none",
          }),
          singleValue: (base) => ({
            ...base,
            fontSize: 12,
            whiteSpace: "normal",
            wordWrap: "break-word",
            display: "inline",
            lineHeight: "1.2",
          }),
          placeholder: (base) => ({
            ...base,
            fontSize: 12,
            whiteSpace: "normal",
            wordWrap: "break-word",
            display: "block",
            lineHeight: "1.2",
            position: "absolute",
          }),
          menu: (base) => ({
            ...base,
            fontSize: 12,
            padding: 0,
          }),
        }}
        searchInputProps={{
          style: {
            width: "100%",
            minWidth: "200px",
            padding: "8px",
            border: "none",
            outline: "none",
          },
        }}
        {...restProps}
      />

      {!!label && (
        <Heading
          as="h4"
          className="text-[14px] mt-[5px] font-semibold text-black-900"
        >
          {label}
        </Heading>
      )}

      <div tabIndex={-1} className="custom-options-container">
        {customOptions.map((option, index) => (
          <div
            key={index}
            className="custom-option px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
            onClick={option.onClick}
          >
            {option.icon && (
              <img
                src={option.icon}
                alt=""
                className={`w-4 h-4 mr-2 ${
                  option.value === "remove-row" ? "filter-red" : ""
                }`}
              />
            )}
            {option.label}
          </div>
        ))}
      </div>
    </>
  );
};

GroupSelect.propTypes = {
  className: PropTypes.string,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      VendorId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
      VendorName: PropTypes.string.isRequired,
    })
  ),
  onChange: PropTypes.func,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  shape: PropTypes.oneOf(["round"]),
  size: PropTypes.oneOf(["sm", "xs"]),
  variant: PropTypes.oneOf(["fill"]),
  color: PropTypes.oneOf(["white_A700"]),
  name: PropTypes.string,
  label: PropTypes.string,
  loading: PropTypes.bool,
  loadingMessage: PropTypes.string,
  placeholder: PropTypes.string,
  showAddPaymentSplit: PropTypes.bool,
  showRemoveRow: PropTypes.bool,
};

export { GroupSelect };
