"use client";

import { useState } from "react";

import { Button } from "@truckbuck/ui/button";
import { FilterTag, RemovableTag } from "@truckbuck/ui/tag";
import { Toaster, useToast } from "@truckbuck/ui/toaster";

function ToastButtons() {
  const { toast } = useToast();
  return (
    <div className="flex flex-wrap gap-3">
      <Button
        variant="secondary"
        onClick={() =>
          toast({
            title: "Request received",
            description: "We'll call you back shortly.",
            variant: "success",
          })
        }
      >
        Success toast
      </Button>
      <Button
        variant="secondary"
        onClick={() =>
          toast({
            title: "Couldn't send",
            description: "Check your connection and try again.",
            variant: "danger",
          })
        }
      >
        Error toast
      </Button>
      <Button variant="secondary" onClick={() => toast({ title: "Quote copied", variant: "info" })}>
        Info toast
      </Button>
    </div>
  );
}

export function ToastDemo() {
  return (
    <Toaster>
      <ToastButtons />
    </Toaster>
  );
}

const bodyTypes = ["Open body", "Closed container", "Trailer", "Refrigerated"] as const;

export function TagDemo() {
  const [selected, setSelected] = useState<string[]>(["Closed container"]);
  const [cities, setCities] = useState(["Chennai", "Coimbatore", "Madurai"]);
  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by body type">
        {bodyTypes.map((type) => {
          const pressed = selected.includes(type);
          return (
            <FilterTag
              key={type}
              pressed={pressed}
              onClick={() =>
                setSelected((current) =>
                  pressed ? current.filter((t) => t !== type) : [...current, type],
                )
              }
            >
              {type}
            </FilterTag>
          );
        })}
      </div>
      <ul className="flex flex-wrap gap-2" aria-label="Selected cities">
        {cities.map((city) => (
          <li key={city}>
            <RemovableTag
              removeLabel={`Remove ${city}`}
              onRemove={() => setCities((current) => current.filter((c) => c !== city))}
            >
              {city}
            </RemovableTag>
          </li>
        ))}
      </ul>
    </div>
  );
}
