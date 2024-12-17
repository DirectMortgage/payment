import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Select from "react-dropdown-select";
import { Heading } from "../Heading";
import Close from '../../components/Images/close.png';
import Add from '../../components/Images/add.png';

const shapes = {
  round: "rounded",
};

const variants = {
  fill: {
    white_A700: "bg-white-a700 text-black-900",
  },
};

const sizes = {
  sm: "h-[48px] pl-2.5 text-[16px]",
  xs: "h-[24px] px-2.5 text-[14px]",
};

const GroupSelect = ({
  className = "",
  options = [],
  value = "",
  onChange = () => {},
  name = "",
  labelKey = "VendorName",
  valueKey = "VendorId",
  sessionid ="",
  placeholder = "Search for vendor",
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
  ...restProps
}) => {
  const [customOptions, setCustomOptions] = useState([]);

  useEffect(() => {
    const additionalOptions = [
      {
        label: "Add Payment Split",
        value: "add-payment-split",
        icon: Add,
        onClick: () => {
         
         const URL = "https://www.directcorp.com/FeeCollection/Presentation/Webforms/VendorPaymentSplit.aspx?SessionId=" + sessionid +"&VendorId="+VendorId+"&EmpNum=32182"+"&CID=4";

          window.open(URL, "", "width=1200,height=1200,resizable=yes,scrollbars=yes");
        },
      },
      {
        label: "Remove Row",
        value: "remove-row",
        icon: Close,
        onClick: () => {
            handleRemove(RowId)
        },
      },
    ];

    setCustomOptions(additionalOptions);
  }, []);

  const allOptions = [...options, ...customOptions];

  const handleChange = (selected) => {
    if (selected && selected.length > 0) {
      const selectedOption = selected[0];
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

  return (
    <>
      <Select
        options={validatedOptions}
        name={name}
        placeholder={placeholder}
        clearable={true}
        searchable={true}
        labelField={labelKey}
        valueField={valueKey}
        values={value ? [value] : []} // Change value to values and ensure it's an array
        onChange={handleChange}
        disabled={loading}
        className={`${className} w-full flex cursor-pointer items-center flex-direction-column justify-center border border-solid bg-white-a700 rounded ${
          shape && shapes[shape]
        } ${variant && (variants[variant]?.[color] || variants[variant])} ${
          size && sizes[size]
        }`}
        dropdownGap={0}
        searchInputProps={{
          style: {
            width: '100%',
            minWidth: '200px',
            padding: '8px',
            border: 'none',
            outline: 'none'
          }
        }}
        {...restProps}
      />
      
      {!!label && (
        <Heading as="h4" className="text-[14px] mt-[5px] font-semibold text-black-900">
          {label}
        </Heading>
      )}

<div className="custom-options-container">
  {customOptions.map((option, index) => (
    <div
      key={index}
      className="custom-option px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
      onClick={option.onClick}
    >
      {option.icon && <img src={option.icon} alt="" className={`w-4 h-4 mr-2 ${option.value === 'remove-row' ? 'filter-red' : ''}`}  />}
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
      VendorId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
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
};

export { GroupSelect };