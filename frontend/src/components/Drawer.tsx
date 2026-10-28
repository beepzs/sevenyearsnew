"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useNavigation } from "../context/NavigationContext";
import { CloseIcon } from "./Icons";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Drawer({ isOpen, onClose }: DrawerProps) {
  const { headerItems } = useNavigation();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "";
        document.removeEventListener("keydown", handleKeyDown);
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [isOpen, onClose]);

  return (
    <div
      className={`drawer ${isOpen ? "is-open" : ""}`}
      id="drawer"
      aria-hidden={!isOpen}
      role="dialog"
      aria-label="Menu"
    >
      <div className="drawer__top">
        <Image
          className="logo-img"
          src="/assets/img/logo.jpg"
          alt="The First Seven Years"
          width={52}
          height={52}
          loading="lazy"
        />
        <button
          className="drawer__close"
          type="button"
          onClick={onClose}
          aria-label="Close menu"
        >
          <CloseIcon />
        </button>
      </div>

      <nav aria-label="Mobile">
        <ul>
          {headerItems.map((item) => (
            <li key={item.id}>
              <Link
                href={item.url}
                target={item.target || "_self"}
                onClick={onClose}
              >
                {item.label}
              </Link>
            </li>
          ))}
          {/* Include medical disclaimer if not already in header */}
          {!headerItems.some((h) => h.url.includes("medical-disclaimer")) && (
            <li>
              <Link href="/medical-disclaimer/" onClick={onClose}>
                Medical disclaimer
              </Link>
            </li>
          )}
        </ul>
      </nav>

      <Link className="btn btn--mint" href="/ask-the-doctor/" onClick={onClose}>
        Ask Dr. Murray a question
      </Link>
    </div>
  );
}
