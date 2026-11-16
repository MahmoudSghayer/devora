import type {StackLine} from '@/lib/stack';

export interface MapNode {
  id: string;
  name: string;
  /** one honest line: what Devora uses it for */
  use: string;
  /** simple-icons SVG path (24x24), absent when the tool has no mark */
  path?: string;
  /** monogram shown instead of a logo */
  mono?: string;
  /** stage position in % */
  x: number;
  y: number;
}

export interface MapGroup {
  id: string;
  label: string;
  /** Tailwind text / stroke token classes for the group accent */
  tone: string;
  stroke: string;
  depth: number;
  labelX: number;
  labelY: number;
  lines: StackLine[];
  nodes: MapNode[];
}

export interface MapProps {
  groups: MapGroup[];
  /** stage box in SVG units + hub position */
  stage: {w: number; h: number; hub: {x: number; y: number}};
  hubLabel: string;
  hint: string;
  listAria: string;
}
