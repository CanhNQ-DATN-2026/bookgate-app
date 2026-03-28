import React from "react";
import { Navbar } from "./Navbar";
import { ChatWidget } from "./ChatWidget";

export function Layout({ children }) {
  return (
    <div className="layout">
      <Navbar />
      <div className="main-content">{children}</div>
      <ChatWidget />
    </div>
  );
}
