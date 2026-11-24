"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Menu } from "lucide-react";

import { Button } from "@truckbuck/ui/button";

import type { MobileNavProps } from "./mobile-nav-sheet";

const MobileNavSheet = dynamic(() => import("./mobile-nav-sheet"), { ssr: false });

/** Menu button below 1024px. The drawer's code loads on first tap. */
export function MobileNav(props: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const [requested, setRequested] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  return (
    <>
      <Button
        ref={button}
        variant="ghost"
        size="icon"
        aria-label={props.labels.open}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="xl:hidden"
        onClick={() => {
          setRequested(true);
          setOpen(true);
        }}
      >
        <Menu aria-hidden="true" />
      </Button>
      {requested ? (
        <MobileNavSheet
          {...props}
          open={open}
          onOpenChange={setOpen}
          returnFocus={() => button.current?.focus()}
        />
      ) : null}
    </>
  );
}
