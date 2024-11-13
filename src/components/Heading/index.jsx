import React from "react";

const sizes = {
  headingxs: "text-[11px] font-bold",
  headings: "text-[12px] font-semibold",
  headingmd: "text-[14px] font-semibold",
  headinglg: "text-[32px] font-bold md:text-[30px] sm:text-[28px]",
};

const Heading = ({ children, className = "", size = "headings", as, ...restProps }) => {
  const Component = as || "h6";

  return (
    <Component className={`text-black-900 font-segoeui ${className} ${sizes[size]}`} {...restProps}>
      {children}
    </Component>
  );
};

export { Heading };
