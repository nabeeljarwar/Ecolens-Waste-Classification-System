export interface CampusLocation {
  name: string;
  latitude: number;
  longitude: number;
  binTypes: string; // e.g. "All types" or specific bin type
}

/**
 * Real coordinates for MUET Jamshoro campus locations.
 * Coordinates sourced from approximate map positions.
 */
export const muetBinLocations: CampusLocation[] = [
  {
    name: "Dept. of Software Engineering",
    latitude: 25.4063,
    longitude: 68.2585,
    binTypes: "All types",
  },
  {
    name: "Administration Building",
    latitude: 25.4075,
    longitude: 68.2575,
    binTypes: "dynamic", // will use the scanned item's bin type
  },
  {
    name: "Central Library",
    latitude: 25.4080,
    longitude: 68.2590,
    binTypes: "All types",
  },
  {
    name: "MUET Cafe",
    latitude: 25.4058,
    longitude: 68.2570,
    binTypes: "dynamic",
  },
  {
    name: "Student Teacher Center (STC)",
    latitude: 25.4070,
    longitude: 68.2560,
    binTypes: "All types",
  },
  {
    name: "Gymnasium",
    latitude: 25.4050,
    longitude: 68.2555,
    binTypes: "dynamic",
  },
];
