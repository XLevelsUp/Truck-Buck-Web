"use client";

import {
  type ComponentProps,
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "../lib/utils";
import { fieldControlVariants } from "./input";
import { Spinner } from "./spinner";

export interface ComboboxOption {
  value: string;
  label: string;
  /** Secondary line, e.g. "Tamil Nadu" under "Chennai" or "6 tonnes · 17 ft". */
  description?: string;
  /** Decorative icon shown before the label. */
  icon?: ReactNode;
  disabled?: boolean;
}

export interface ComboboxProps extends Omit<
  ComponentProps<"input">,
  "value" | "defaultValue" | "onChange" | "size" | "children"
> {
  options: readonly ComboboxOption[];
  /** Selected option value (controlled). */
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null, option: ComboboxOption | null) => void;
  /** Text in the input (controlled). Use with `filter={false}` for server-side search. */
  inputValue?: string;
  onInputChange?: (text: string) => void;
  /** Client-side filter. Pass `false` when `options` are already filtered (async search). */
  filter?: false | ((option: ComboboxOption, query: string) => boolean);
  loading?: boolean;
  /** Icon inside the field, before the text (e.g. a map pin). Decorative. */
  leadingIcon?: ReactNode;
  emptyMessage?: ReactNode;
  loadingMessage?: string;
  /** Accessible name of the popup list (i18n). Default "Suggestions". */
  listLabel?: string;
  /** Screen-reader announcement for the result count (i18n). */
  resultsMessage?: (count: number) => string;
}

const defaultFilter = (option: ComboboxOption, query: string) =>
  option.label.toLowerCase().includes(query.trim().toLowerCase());

/**
 * Editable combobox (WAI-ARIA 1.2 "list autocomplete") for truck types,
 * cities and address search. A value must come from the list: on blur the
 * text reverts to the selected option. Submits `name` via a hidden input.
 */
export function Combobox({
  options,
  value: valueProp,
  defaultValue = null,
  onValueChange,
  inputValue: inputValueProp,
  onInputChange,
  filter = defaultFilter,
  loading = false,
  leadingIcon,
  emptyMessage = "No matches",
  loadingMessage = "Searching…",
  listLabel = "Suggestions",
  resultsMessage = (count) => `${count} ${count === 1 ? "result" : "results"} available`,
  className,
  name,
  disabled,
  id: idProp,
  onBlur,
  onKeyDown,
  ...inputProps
}: ComboboxProps) {
  const generated = useId();
  const id = idProp ?? `combobox-${generated}`;
  const listboxId = `${id}-listbox`;

  const [internalValue, setInternalValue] = useState<string | null>(defaultValue);
  const value = valueProp === undefined ? internalValue : valueProp;
  const selected = options.find((o) => o.value === value) ?? null;

  const [internalText, setInternalText] = useState(selected?.label ?? "");
  const text = inputValueProp ?? internalText;
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const listRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const visible = useMemo(() => {
    // Show everything when the text is just the current selection.
    if (!filter || text === selected?.label) return options;
    return options.filter((option) => filter(option, text));
  }, [filter, options, selected?.label, text]);

  const activeOption = visible[activeIndex];

  useEffect(() => {
    if (!open || activeIndex < 0) return;
    listRef.current
      ?.querySelector(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  function setText(next: string) {
    if (inputValueProp === undefined) setInternalText(next);
    onInputChange?.(next);
  }

  // On a slow phone people start typing before the page hydrates. That text
  // lives only in the DOM, so adopt it once on mount instead of losing it.
  useEffect(() => {
    const input = inputRef.current;
    const typed = input?.value ?? "";
    if (!input || typed === "" || typed === text) return;
    queueMicrotask(() => {
      setText(typed);
      if (document.activeElement === input) setOpen(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount only
  }, []);

  function select(option: ComboboxOption | null) {
    if (valueProp === undefined) setInternalValue(option?.value ?? null);
    onValueChange?.(option?.value ?? null, option);
    setText(option?.label ?? "");
    setOpen(false);
    setActiveIndex(-1);
  }

  function move(delta: 1 | -1) {
    if (!open) {
      setOpen(true);
      return;
    }
    if (visible.length === 0) return;
    let next = activeIndex;
    for (let i = 0; i < visible.length; i++) {
      next = (next + delta + visible.length) % visible.length;
      if (!visible[next]?.disabled) break;
    }
    setActiveIndex(next);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        move(1);
        break;
      case "ArrowUp":
        event.preventDefault();
        move(-1);
        break;
      case "Enter":
        if (open && activeOption && !activeOption.disabled) {
          event.preventDefault();
          select(activeOption);
        }
        break;
      case "Escape":
        if (open) {
          event.preventDefault();
          setOpen(false);
          setActiveIndex(-1);
        } else if (text) {
          event.preventDefault();
          select(null);
        }
        break;
      default:
        break;
    }
  }

  const showList = open && !disabled;

  return (
    <div data-slot="combobox" className={cn("relative", className)}>
      <div className="relative">
        {leadingIcon ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground [&_svg]:size-5"
          >
            {leadingIcon}
          </span>
        ) : null}
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={showList}
          aria-controls={listboxId}
          aria-activedescendant={
            showList && activeOption ? `${id}-option-${activeOption.value}` : undefined
          }
          disabled={disabled}
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onClick={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          onBlur={(event) => {
            onBlur?.(event);
            setOpen(false);
            setActiveIndex(-1);
            // A typed string that wasn't picked from the list is not a value.
            if (text !== (selected?.label ?? "")) setText(selected?.label ?? "");
          }}
          className={cn(fieldControlVariants(), "pr-10", leadingIcon ? "pl-10" : undefined)}
          {...inputProps}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground"
        >
          {loading ? <Spinner className="size-5" /> : <ChevronDown className="size-5" />}
        </span>
      </div>

      {name ? <input type="hidden" name={name} value={value ?? ""} /> : null}

      <ul
        ref={listRef}
        id={listboxId}
        role="listbox"
        aria-label={listLabel}
        hidden={!showList}
        className="absolute inset-x-0 top-full z-popover mt-1 max-h-72 overflow-y-auto rounded-lg border bg-surface p-1 text-surface-foreground shadow-lg"
      >
        {visible.map((option, index) => (
          // eslint-disable-next-line jsx-a11y/click-events-have-key-events -- keyboard selection is handled on the input (aria-activedescendant pattern); options never take focus.
          <li
            key={option.value}
            id={`${id}-option-${option.value}`}
            role="option"
            data-index={index}
            aria-selected={option.value === value}
            aria-disabled={option.disabled || undefined}
            // Keep focus in the input while clicking an option.
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              if (!option.disabled) select(option);
            }}
            onMouseMove={() => setActiveIndex(index)}
            className={cn(
              "flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-3 py-2",
              index === activeIndex && "bg-primary-soft text-primary-soft-foreground",
              option.disabled && "cursor-not-allowed opacity-50",
            )}
          >
            {option.icon ? (
              <span aria-hidden="true" className="shrink-0 [&_svg]:size-5">
                {option.icon}
              </span>
            ) : null}
            <span className="grid flex-1">
              <span className="font-medium">{option.label}</span>
              {option.description ? (
                <span
                  className={cn(
                    "text-sm",
                    index === activeIndex
                      ? "text-primary-soft-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {option.description}
                </span>
              ) : null}
            </span>
            {option.value === value ? <Check aria-hidden="true" className="size-4" /> : null}
          </li>
        ))}
        {visible.length === 0 ? (
          <li role="presentation" className="px-3 py-3 text-muted-foreground">
            {loading ? loadingMessage : emptyMessage}
          </li>
        ) : null}
      </ul>

      <span role="status" aria-live="polite" className="sr-only">
        {showList ? (loading ? loadingMessage : resultsMessage(visible.length)) : ""}
      </span>
    </div>
  );
}
