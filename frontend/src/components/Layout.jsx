import React from "react";
import { Navbar } from "./Navbar";
import { ChatWidget } from "./ChatWidget";

export function Layout({ children }) {
  return (
    <div className="layout">
      <div className="layout-ambient" aria-hidden="true">
        <span className="layout-orb orb-a" />
        <span className="layout-orb orb-b" />
        <span className="layout-orb orb-c" />
      </div>
      <Navbar />
      <div className="main-content">{children}</div>
      <ChatWidget />
    </div>
  );
}
