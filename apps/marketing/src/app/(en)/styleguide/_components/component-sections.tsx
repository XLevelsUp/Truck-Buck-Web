import { ArrowRight, Inbox, MapPin, MessageCircle, Truck } from "lucide-react";

import { Accordion, AccordionItem } from "@truckbuck/ui/accordion";
import { Badge } from "@truckbuck/ui/badge";
import { Button } from "@truckbuck/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@truckbuck/ui/card";
import { Combobox } from "@truckbuck/ui/combobox";
import { DatePicker } from "@truckbuck/ui/date-picker";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@truckbuck/ui/dialog";
import { EmptyState } from "@truckbuck/ui/empty-state";
import { Field } from "@truckbuck/ui/field";
import { Input } from "@truckbuck/ui/input";
import { LogoCloud } from "@truckbuck/ui/logo-cloud";
import { MapContainer } from "@truckbuck/ui/map-container";
import { PhoneInput } from "@truckbuck/ui/phone-input";
import { PriceBreakdown, PriceBreakdownRow } from "@truckbuck/ui/price-breakdown";
import { SegmentedControl } from "@truckbuck/ui/segmented-control";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@truckbuck/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@truckbuck/ui/sheet";
import { Skeleton } from "@truckbuck/ui/skeleton";
import { Stat, StatGroup } from "@truckbuck/ui/stat";
import { StatusTimeline } from "@truckbuck/ui/status-timeline";
import { Stepper } from "@truckbuck/ui/stepper";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@truckbuck/ui/tabs";
import { Tag } from "@truckbuck/ui/tag";
import { Testimonial } from "@truckbuck/ui/testimonial";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@truckbuck/ui/tooltip";
import { TruckCard } from "@truckbuck/ui/truck-card";
import {
  ContainerTruckIcon,
  LcvIcon,
  OpenBodyIcon,
  truckClassIcons,
} from "@truckbuck/ui/truck-icons";

import { TagDemo, ToastDemo } from "./interactive-demos";
import { Demo, Section } from "./layout";

/*
 * Every value below is SAMPLE DATA for the styleguide (shown with a
 * "Sample" badge). Production pages read real data from Supabase.
 */

const truckOptions = truckClassIcons.map(({ key, label, Icon }) => ({
  value: key,
  label,
  icon: <Icon />,
}));

const cityOptions = [
  { value: "chennai", label: "Chennai", description: "Tamil Nadu" },
  { value: "coimbatore", label: "Coimbatore", description: "Tamil Nadu" },
  { value: "bengaluru", label: "Bengaluru", description: "Karnataka" },
  { value: "hyderabad", label: "Hyderabad", description: "Telangana" },
  { value: "kochi", label: "Kochi", description: "Kerala" },
];

const sample = <Badge variant="warning">Sample data</Badge>;

export function ActionsSection() {
  return (
    <Section id="actions" title="Actions">
      <Demo
        title="Button"
        note="cta (amber) is for the one conversion action per view: Get price, Apply to join. primary (blue) is the default action. 44px tall by default; 36px only in dense desktop UI."
      >
        <div className="grid gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="cta">Get price</Button>
            <Button>Request a callback</Button>
            <Button variant="secondary">How it works</Button>
            <Button variant="ghost">Cancel</Button>
            <Button variant="link">Read the FAQ</Button>
            <Button variant="danger">Delete request</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="cta" size="lg">
              Get price <ArrowRight aria-hidden="true" />
            </Button>
            <Button size="md">
              <MessageCircle aria-hidden="true" /> Chat on WhatsApp
            </Button>
            <Button size="sm" variant="secondary">
              Small
            </Button>
            <Button size="icon" variant="secondary" aria-label="Show on map">
              <MapPin aria-hidden="true" />
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="cta" loading>
              Get price
            </Button>
            <Button loading>Sending</Button>
            <Button disabled>Disabled</Button>
            <Button variant="cta" block className="md:w-auto">
              Full width on mobile
            </Button>
          </div>
        </div>
      </Demo>
    </Section>
  );
}

export function FormSection() {
  return (
    <Section
      id="forms"
      title="Form controls"
      description="Every control is at least 44px tall with 16px text (no iOS zoom). Labels sit above; optional fields are marked, required ones are not."
    >
      <Demo title="Input, PhoneInput, Field states">
        <div className="grid gap-6 md:grid-cols-2">
          <Field label="Your name">{(control) => <Input {...control} autoComplete="name" />}</Field>
          <Field label="Mobile number" hint="We'll call this number with your quote.">
            {(control) => <PhoneInput {...control} name="phone" />}
          </Field>
          <Field label="Company name" optional>
            {(control) => <Input {...control} autoComplete="organization" />}
          </Field>
          <Field label="GSTIN" error="Enter a 15-character GSTIN, like 33ABCDE1234F1Z5.">
            {(control) => <Input {...control} defaultValue="33ABCDE" />}
          </Field>
          <Field label="Pickup city" hint="Disabled example">
            {(control) => <Input {...control} disabled defaultValue="Chennai" />}
          </Field>
        </div>
      </Demo>

      <Demo title="Select, Combobox, DatePicker">
        <div className="grid gap-6 md:grid-cols-2">
          <Field label="Truck type">
            {(control) => (
              <Select name="truck">
                <SelectTrigger {...control}>
                  <SelectValue placeholder="Choose a truck" />
                </SelectTrigger>
                <SelectContent>
                  {truckClassIcons.map(({ key, label }) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </Field>
          <Field label="Truck type (searchable)">
            {(control) => <Combobox {...control} options={truckOptions} name="truck-search" />}
          </Field>
          <Field label="From" hint="Address search plugs in here in Phase 4 (Google Places).">
            {(control) => (
              <Combobox
                {...control}
                options={cityOptions}
                leadingIcon={<MapPin />}
                placeholder="City or pickup area"
                name="from"
              />
            )}
          </Field>
          <Field label="Pickup date">{(control) => <DatePicker {...control} name="date" />}</Field>
        </div>
      </Demo>

      <Demo title="Segmented control">
        <div className="grid gap-4">
          <SegmentedControl
            aria-label="Trip type"
            defaultValue="one-way"
            name="trip"
            options={[
              { value: "one-way", label: "One-way" },
              { value: "return", label: "Return trip" },
            ]}
          />
          <SegmentedControl
            aria-label="Load"
            size="sm"
            defaultValue="full"
            options={[
              { value: "full", label: "Full truck" },
              { value: "part", label: "Part load", disabled: true },
            ]}
          />
        </div>
      </Demo>

      <Demo title="Stepper" note="Numbers on mobile, labels from 768px.">
        <div className="grid gap-6">
          <Stepper steps={["Contact", "Fleet", "Documents", "Done"]} current={0} />
          <Stepper steps={["Contact", "Fleet", "Documents", "Done"]} current={2} />
        </div>
      </Demo>
    </Section>
  );
}

export function DisplaySection() {
  return (
    <Section id="display" title="Content and layout">
      <Demo title="Card">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {(["outline", "raised", "muted", "brand"] as const).map((variant) => (
            <Card key={variant} variant={variant}>
              <CardHeader>
                <CardTitle as="h4">{variant}</CardTitle>
                <CardDescription
                  className={variant === "brand" ? "text-surface-brand-foreground" : undefined}
                >
                  Fare up front. Vetted transporters only.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Card body text sits here.</p>
              </CardContent>
              <CardFooter>
                <Button size="sm" variant={variant === "brand" ? "cta" : "secondary"}>
                  Action
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </Demo>

      <Demo title="Badge and Tag">
        <div className="grid gap-6">
          <div className="flex flex-wrap gap-2">
            <Badge>Neutral</Badge>
            <Badge variant="brand">Vetted</Badge>
            <Badge variant="success">Delivered</Badge>
            <Badge variant="warning">Awaiting documents</Badge>
            <Badge variant="danger">Cancelled</Badge>
            <Badge variant="info">In transit</Badge>
            <Badge variant="accent">New</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            <Tag>
              <Truck aria-hidden="true" /> Open body
            </Tag>
            <Tag>GST invoice</Tag>
          </div>
          <TagDemo />
        </div>
      </Demo>

      <Demo title="Tabs">
        <Tabs defaultValue="shippers">
          <TabsList aria-label="FAQ audience">
            <TabsTrigger value="shippers">Shippers</TabsTrigger>
            <TabsTrigger value="transporters">Transporters</TabsTrigger>
            <TabsTrigger value="drivers">Drivers</TabsTrigger>
          </TabsList>
          <TabsContent value="shippers">Questions for businesses booking trucks.</TabsContent>
          <TabsContent value="transporters">
            Questions for fleet owners joining the network.
          </TabsContent>
          <TabsContent value="drivers">Questions about the driver app.</TabsContent>
        </Tabs>
      </Demo>

      <Demo
        title="Accordion"
        note="Native details/summary: works without JavaScript. Same name = one open at a time."
      >
        <Accordion>
          <AccordionItem name="faq" headingLevel={4} title="What is a full truck load (FTL)?">
            You book the whole truck for your goods. Nobody else&apos;s load shares it.
          </AccordionItem>
          <AccordionItem name="faq" headingLevel={4} title="When do I see the fare?">
            Before you confirm. Enter your route and truck type to see it.
          </AccordionItem>
        </Accordion>
      </Demo>

      <Demo title="Skeleton and empty state">
        <div className="grid gap-6 md:grid-cols-2">
          <div aria-busy="true" aria-label="Loading quote" role="status" className="grid gap-3">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
          <EmptyState
            headingLevel={4}
            icon={<Inbox />}
            title="No lanes match"
            description="We don't serve this route yet. Tell us where you ship and we'll call you."
            action={<Button variant="secondary">Request a callback</Button>}
          />
        </div>
      </Demo>

      <Demo title="Stat" note="Requires a source. Never publish a number without one.">
        <div className="grid gap-4">
          {sample}
          <StatGroup>
            <Stat value="1,234" label="Example metric" source="Source: sample data" />
            <Stat value="₹56,789" label="Example amount" source="Source: sample data" />
          </StatGroup>
        </div>
      </Demo>

      <Demo
        title="Testimonial and logo cloud"
        note="Real, consented quotes and permitted logos only. Both render nothing when the data is empty."
      >
        <div className="grid gap-8">
          {sample}
          <Testimonial
            quote="Layout demo only. Live pages show approved customer quotes (NFC-10)."
            name="Customer name"
            role="Role"
            company="Company"
          />
          <LogoCloud
            headingLevel={4}
            title="Example logo row"
            logos={[1, 2, 3, 4, 5, 6].map((n) => ({
              name: `Example client ${n}`,
              logo: (
                <span
                  aria-hidden="true"
                  className="h-8 w-24 rounded-md border-2 border-dashed border-border-strong"
                />
              ),
            }))}
          />
        </div>
      </Demo>
    </Section>
  );
}

export function OverlaySection() {
  return (
    <Section id="overlays" title="Overlays and feedback">
      <Demo title="Dialog, bottom sheet, drawer, tooltip">
        <TooltipProvider>
          <div className="flex flex-wrap gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="secondary">Open dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cancel this request?</DialogTitle>
                  <DialogDescription>We won&apos;t call you about this quote.</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="secondary">Keep request</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button variant="danger">Cancel request</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="secondary">Open bottom sheet</Button>
              </SheetTrigger>
              <SheetContent side="bottom">
                <SheetHeader>
                  <SheetTitle>Which truck do I need?</SheetTitle>
                  <SheetDescription>Pick by what you&apos;re moving.</SheetDescription>
                </SheetHeader>
                <ul className="grid gap-3">
                  {truckClassIcons.slice(2, 5).map(({ key, label, Icon }) => (
                    <li key={key} className="flex items-center gap-3">
                      <Icon />
                      {label}
                    </li>
                  ))}
                </ul>
              </SheetContent>
            </Sheet>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="secondary">Open drawer</Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                  <SheetDescription>Mobile navigation drawer.</SheetDescription>
                </SheetHeader>
              </SheetContent>
            </Sheet>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost">Hover or focus me</Button>
              </TooltipTrigger>
              <TooltipContent>Supplementary hint only</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </Demo>

      <Demo
        title="Toast"
        note="For confirmations after an action. Errors that block a form go inline, not in a toast."
      >
        <ToastDemo />
      </Demo>
    </Section>
  );
}

export function DomainSection() {
  return (
    <Section id="domain" title="TruckBuck components">
      <Demo title="Truck card" note="Specs come from the truck_types table.">
        <div className="grid gap-4">
          {sample}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <TruckCard
              headingLevel={4}
              name="LCV 14–17 ft"
              media={<LcvIcon />}
              summary="Good for: cartons, appliances, furniture."
              specs={[
                { label: "Length", value: "Sample" },
                { label: "Payload", value: "Sample" },
              ]}
              action={
                <Button variant="cta" block>
                  Get price
                </Button>
              }
            />
            <TruckCard
              headingLevel={4}
              name="Container 24 ft+"
              media={<ContainerTruckIcon />}
              badge={<Badge variant="brand">Closed</Badge>}
              specs={[
                { label: "Length", value: "Sample" },
                { label: "Payload", value: "Sample" },
              ]}
            />
            <TruckCard
              headingLevel={4}
              name="Open body"
              media={<OpenBodyIcon />}
              specs={[
                { label: "Length", value: "Sample" },
                { label: "Payload", value: "Sample" },
              ]}
            />
          </div>
        </div>
      </Demo>

      <Demo title="Price breakdown row">
        <div className="grid max-w-md gap-4">
          {sample}
          <PriceBreakdown>
            <PriceBreakdownRow label="Base fare" note="Sample amount" amountPaise={1234500} />
            <PriceBreakdownRow label="Loading and unloading" valueText="Not included" />
            <PriceBreakdownRow label="Tolls" note="Paid at actuals" valueText="At actuals" />
            <PriceBreakdownRow label="Example discount" amountPaise={50000} kind="discount" />
            <PriceBreakdownRow label="Estimated fare" amountPaise={1184500} kind="total" />
          </PriceBreakdown>
        </div>
      </Demo>

      <Demo
        title="Map container"
        note="Reserves space and shows a text route; the real map loads only on interaction (Phase 4)."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <MapContainer label="Route preview before the map loads" fallback="Chennai → Bengaluru" />
          <MapContainer
            label="Route preview, loading"
            fallback="Loading route…"
            loading
            ratio="4/3"
          />
        </div>
      </Demo>

      <Demo title="Status timeline">
        <div className="grid gap-10">
          <StatusTimeline
            current="in_transit"
            details={{
              requested: "Sample time",
              accepted: "Sample time",
              driver_assigned: "Sample driver",
            }}
          />
          <StatusTimeline current="accepted" orientation="responsive" />
        </div>
      </Demo>
    </Section>
  );
}
