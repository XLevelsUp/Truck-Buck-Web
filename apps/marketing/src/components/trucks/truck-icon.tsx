import {
  ContainerTruckIcon,
  LcvIcon,
  McvIcon,
  MiniTruckIcon,
  OpenBodyIcon,
  PickupIcon,
  ReeferTruckIcon,
  TrailerIcon,
  type TruckIconProps,
} from "@truckbuck/ui/truck-icons";

/**
 * Catalogue icon_key → truck-class icon. A component (not a lookup table)
 * so React never sees a component "created" during render.
 */
export function TruckClassIcon({ iconKey, ...props }: TruckIconProps & { iconKey: string }) {
  switch (iconKey) {
    case "mini":
      return <MiniTruckIcon {...props} />;
    case "pickup":
      return <PickupIcon {...props} />;
    case "mcv":
      return <McvIcon {...props} />;
    case "container":
      return <ContainerTruckIcon {...props} />;
    case "open":
      return <OpenBodyIcon {...props} />;
    case "trailer":
      return <TrailerIcon {...props} />;
    case "reefer":
      return <ReeferTruckIcon {...props} />;
    default:
      return <LcvIcon {...props} />;
  }
}
