import React from "react";
import PropTypes from "prop-types";

const variants = {
  primary: "checked:bg-indigo-700 checked:border-indigo-700",
};

const sizes = {
  xs: "h-[18px] w-[18px]",
};

const Checkbox = React.forwardRef(
    ({ className = "", name = "", label = "", id = "checkbox_id", variant = "primary", size = "xs", ...restProps }, ref) => {
      return (
        <label className={`flex items-center gap-2 cursor-pointer ${className}`}>
          <input
            className={`
              appearance-none border border-gray-400 focus:ring-0 focus:ring-offset-0
              ${(size && sizes[size]) || ""} 
              ${(variant && variants[variant]) || ""}
              cursor-pointer
            `}
            ref={ref}
            type="checkbox"
            name={name}
            id={id}
            {...restProps}
          />
          <span className="text-sm">{label}</span>
        </label>
      );
    }
  );

Checkbox.propTypes = {
  className: PropTypes.string,
  name: PropTypes.string,
  label: PropTypes.string,
  id: PropTypes.string,
  size: PropTypes.oneOf(["xs"]),
  variant: PropTypes.oneOf(["primary"]),
};

export { Checkbox };