"use client";
import { WEB_APP_NAME } from "@/constant";
import React from "react";

const Title = ({ children }: { children: string }) => {
  return <title>{`${children} | ${WEB_APP_NAME}`}</title>;
};

export default Title;
