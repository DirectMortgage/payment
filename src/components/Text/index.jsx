import React from "react";

const sizes = {
  textxs: "text-[10px] font-normal",
  texts: "text-[12px] font-normal",
  textmd: "text-[14px] font-normal",
};

const Text = ({ children, className = "", as, size = "texts", ...restProps }) => {
  const Component = as || "p";

  return (
    <Component className={`text-black-900 font-segoeui ${className} ${sizes[size]}`} {...restProps}>
      {children}
    </Component>
  );
};

export { Text };
