import React from "react";
import { useRoutes } from "react-router-dom";
import Home from "pages/Home";
import NotFound from "pages/NotFound";
import Payment from "pages/PaymentApproval";

const ProjectRoutes = () => {
  let element = useRoutes([
    { path: "/", element: <Payment /> },
    { path: "*", element: <NotFound /> },
    // {
    //   path: "desktopone",
    //   element: <DesktopOne />,
    // },
  ]);

  return element;
};

export default ProjectRoutes;
