// import React, { Fragment, useMemo } from "react";
// import PropTypes from "prop-types";
// import Select from "react-select";
// import { Spinner } from "components/CommonFunctions/Accessories";

// const AutoComplete = ({
//   className = "",
//   options = [],
//   shape,
//   variant = "fill",
//   size = "xs",
//   color = "",
//   value = "",
//   valueKey = "VendorId",
//   labelKey = "VendorName",
//   onChange = () => {},
//   onInputChange = () => {},
//   name = "",
//   label = "",
//   loading,
//   loadingMessage = "Loading",
//   returnAllAttributes = false,
//   autoFocus = false,
//   placeholder = "",
//   searchInput = "",
//   ...restProps
// }) => {
//   const iSelected = useMemo(() => {
//     try {
//       return JSON["parse"](JSON["stringify"](options))
//         .flatMap(({ options: iOptions }) => iOptions)
//         .filter(({ [valueKey]: iValue }) => iValue == value)[0];
//     } catch (e) {
//       return {};
//     }
//   }, [value, options]);

//   const formatGroupLabel = (data) => {
//     return (
//       <div className="flex items-center justify-between text-sm capitalize">
//         <span>{data["label"]}</span>
//         <span className="bg-gray-200 rounded-full text-gray-800 text-xs font-normal leading-none min-w-[1rem] px-2 py-[0.166666rem] text-center">
//           {data.options.length}
//         </span>
//       </div>
//     );
//   };

//   return (
//     <>
//       <Select
//         options={options}
//         name={name}
//         placeholder={placeholder}
//         addPlaceholder={label}
//         clearable={true}
//         searchable={true}
//         // isLoading={loading}
//         onInputChange={onInputChange}
//         labelField={labelKey}
//         valueField={valueKey}
//         searchBy={labelKey}
//         value={iSelected || ""}
//         autoFocus={autoFocus}
//         noOptionsMessage={() =>
//           loading ? (
//             <Spinner
//               size="xxs"
//               text={
//                 <>
//                   Searching for <b>{searchInput}</b>
//                 </>
//               }
//             />
//           ) : null
//         }
//         loadingMessage={() => null}
//         formatGroupLabel={formatGroupLabel}
//         onChange={(selectedOption) => {
//           let params = [
//             {
//               name,
//               value: selectedOption[valueKey],
//             },
//           ];
//           if (returnAllAttributes) {
//             params = [
//               ...params,
//               ...Object.keys(selectedOption).reduce((acc, key) => {
//                 acc.push({ name: key, value: selectedOption[key] });
//                 return acc;
//               }, []),
//             ];
//           }

//           if (selectedOption) {
//             onChange(params);
//           }
//         }}
//         disabled={loading}
//         styles={{
//           options: (provided, state) => ({
//             ...provided,
//             border: "1px solid #6b7280",
//           }),
//           //   option: (provided, state) => ({
//           //     ...provided,
//           //     ...(loading
//           //       ? {
//           //           backgroundColor: state.isSelected
//           //             ? "#white"
//           //             : state.isFocused
//           //             ? "#white"
//           //             : "white",
//           //           color: state.isSelected
//           //             ? "#fff"
//           //             : state.isFocused
//           //             ? "#111"
//           //             : "",
//           //         }
//           //       : {
//           //           backgroundColor: state.isSelected
//           //             ? "#428bca"
//           //             : state.isFocused
//           //             ? "#e5e7eb"
//           //             : "white",
//           //           color: state.isSelected
//           //             ? "#fff"
//           //             : state.isFocused
//           //             ? "#111"
//           //             : "",
//           //           cursor: "pointer",
//           //         }),
//           //   }),
//           control: (provided, state) => ({
//             ...provided,
//             border: "1px solid #6b7280",
//             // backgroundColor: state.isFocused ? "#fff" : "#fff",
//             padding: "0.15rem",
//           }),
//           input: (provided, state) => ({
//             ...provided,
//             border: "none",
//             boxShadow: "none",
//           }),
//         }}
//         className={className}
//         {...restProps}
//       />
//     </>
//   );
// };

// AutoComplete.propTypes = {
//   className: PropTypes.string,
//   options: PropTypes.any,
//   onChange: PropTypes.func,
//   value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
//   shape: PropTypes.oneOf(["round"]),
//   size: PropTypes.oneOf(["sm", "xs"]),
//   variant: PropTypes.oneOf(["fill"]),
//   color: PropTypes.oneOf(["white_A700"]),
//   name: PropTypes.string,
//   label: PropTypes.string,
//   loading: PropTypes.bool,
//   loadingMessage: PropTypes.any,
// };

// export { AutoComplete };
import { Spinner } from "components/CommonFunctions/Accessories";
import React, { useState } from "react";
import AsyncSelect from "react-select/async";

const AutoComplete = ({
  options,
  className,
  valueKey,
  labelKey,
  onChange = () => {},
  returnAllAttributes,
  name,
  value,
  placeholder,
  handleSearch = () => {},
}) => {
  const [loading, setLoading] = useState(false);

  const loadOptions = async (inputValue) => {
    setLoading(true);
    const results = await handleSearch(inputValue);
    setLoading(false);
    return results;
  };
  console.log({ options, value, labelKey, valueKey });

  return (
    <AsyncSelect
      className={className}
      loadOptions={loadOptions}
      defaultOptions={options}
      placeholder={placeholder}
      styles={{
        options: (provided, state) => ({
          ...provided,
          border: "1px solid #6b7280",
        }),
        groupHeading: (provided, state) => ({
          ...provided,
          textTransform: "capitalize",
          fontSize: 18,
          padding: 10,
          color: "#478fca",
          backgroundColor: "#eef4f9",
        }),
        option: (provided, state) => ({
          ...provided,
          backgroundColor: state.isFocused ? "#e5e7eb" : "white",
          color: "#111",
          cursor: "pointer",
        }),
        control: (provided, state) => ({
          ...provided,
          border: "1px solid #6b7280",
          padding: "0.15rem",
        }),
        input: (provided, state) => ({
          ...provided,
          border: "none",
          boxShadow: "none",
        }),
      }}
      noOptionsMessage={() =>
        loading ? <Spinner size="xxs" text="Searching..." /> : null
      }
      loadingMessage={() => <Spinner size="xxs" text="Searching..." />}
      value={options.find((option) => option[valueKey] === value)} // Find selected option by valueKey
      onChange={(selectedOption) => {
        onChange({ name, selectedOption });
      }}
    />
  );
};

export { AutoComplete };
