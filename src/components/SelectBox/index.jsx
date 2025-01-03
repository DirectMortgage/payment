import React, { useMemo } from "react";
import PropTypes from "prop-types";
import { Heading } from "../Heading";
import Select from "react-select";

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

const SelectBox = React.forwardRef(
  (
    {
      children,
      className = "",
      options = [],
      isMulti = false,
      indicator,
      shape,
      variant = "fill",
      size = "xs",
      color = "",
      value = "",
      valueKey = "value",
      labelKey = "label",
      onChange = () => {},
      name = "",
      label = "",
      loading,
      needSelect = true,
      loadingMessage = "Loading",
      wClassName = "w-full p-[1px]",
      optionWidth = "",
      placeholder = "Select",
      ...restProps
    },
    ref
  ) => {
    const iOption = useMemo(() => {
      return options.map((item) => {
        const { [valueKey]: value, [labelKey]: label } = item;
        return { ...item, value, label };
      });
    }, [options]);
    const iSelected = useMemo(() => {
      try {
        return iOption.filter(({ [valueKey]: iValue }) => iValue == value)[0];
      } catch (e) {
        return {};
      }
    }, [value]);
    return (
      <div className={wClassName}>
        <Select
          ref={ref}
          name={name}
          isSearchable={false}
          value={iSelected}
          placeholder={placeholder}
          options={iOption}
          components={{
            IndicatorSeparator: () => null, // Removes the separator
          }}
          styles={{
            dropdownIndicator: (provided, state) => ({
              ...provided,
              color: state.isFocused ? "#1c1b1f" : "gray",
              transform: state.selectProps.menuIsOpen
                ? "rotate(180deg)"
                : "rotate(0deg)",
              transition: "transform 0.4s ease",
              cursor: "pointer",
              padding: 8,
              width: 30,
            }),
            options: (provided, state) => ({
              ...provided,
              border: "1px solid #6b7280",
            }),
            option: (provided, state) => ({
              ...provided,
              backgroundColor: state.isSelected
                ? "#428bca"
                : state.isFocused
                ? "#e5e7eb"
                : "white",
              color: state.isSelected ? "#fff" : state.isFocused ? "#111" : "",
              cursor: "pointer",
            }),
            valueContainer: (provided, state) => ({
              ...provided,
              padding: "3px 0 3px 2px",
              cursor: "pointer",
            }),
            control: (provided, state) => ({
              ...provided,
              backgroundColor: "white",
              border: "1px solid #6b7280 !important",
              boxShadow: "none",
              borderRadius: "4px",
              padding: "0 0 0 5px",
              cursor: "pointer",
              height: "inherit",
            }),
            singleValue: (provided, state) => ({
              ...provided,
              textWrap: "auto",
              cursor: "pointer",
            }),
            menu: (provided, state) => ({
              ...provided,
              border: "none",
              boxShadow: "none",
              width: optionWidth,
              margin: 0,
            }),
            menuList: (provided, state) => ({
              ...provided,
              padding: 0,
              width: optionWidth,
              margin: 0,
              border: "1px solid #6b7280",
            }),
          }}
          onChange={(selectedOption) => {
            if (selectedOption) {
              onChange({ name, value: selectedOption[valueKey] });
            }
          }}
          className={`${className}`}
          {...restProps}
        >
          {/* {loading ? (
            <option>{loadingMessage}...</option>
          ) : (
            <>
              {needSelect && <option value="">Select</option>}
              {options.map((option, index) => (
                <option key={index} value={option[valueKey]}>
                  {option[labelKey]}
                </option>
              ))}
            </>
          )} */}
        </Select>
        {!!label && (
          <Heading
            as="h4"
            className="text-[14px] mt-[5px] font-semibold text-black-900"
          >
            {label}
          </Heading>
        )}
      </div>
    );
  }
);

SelectBox.propTypes = {
  className: PropTypes.string,
  options: PropTypes.array,
  isSearchable: PropTypes.bool,
  isMulti: PropTypes.bool,
  onChange: PropTypes.func,
  value: PropTypes.any,
  indicator: PropTypes.node,
  shape: PropTypes.oneOf(["round"]),
  size: PropTypes.oneOf(["sm", "xs"]),
  variant: PropTypes.oneOf(["fill"]),
  color: PropTypes.oneOf(["white_A700"]),
  loading: PropTypes.bool,
  loadingMessage: PropTypes.string,
};

export { SelectBox };
