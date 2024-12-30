import React from "react";
import { useRoutes } from "react-router-dom";
import NotFound from "pages/NotFound";
import Payment from "pages/PaymentApproval";
import SplitPayment from "pages/SplitPayment";

const ProjectRoutes = () => {
  let element = useRoutes([
    { path: "/", element: <Payment /> },
    { path: "/SplitPayment", element: <SplitPayment /> },
    { path: "*", element: <NotFound /> },
    // {
    //   path: "desktopone",
    //   element: <DesktopOne />,
    // },
  ]);

  return element;
};

export default ProjectRoutes;
