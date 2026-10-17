import type { PluginId } from "./plugins";

export interface ToolVersions {
  embed: string;
  prettier: string;
  plugins?: Record<string, string>;
}

export interface PlaygroundState {
  v: 1;
  code: string;
  config: string;
  plugins: PluginId[];
  compare: boolean;
  versions?: ToolVersions;
}
export interface OptionInfo {
  name: string;
  type: string;
  category?: string;
  description?: string;
  default?: unknown;
  array?: boolean;
  deprecated?: unknown;
  choices?: { value: string | number | boolean; description?: string }[];
}
export interface FormatRequest {
  id: number;
  code: string;
  config: string;
  plugins: PluginId[];
  compare: boolean;
}
export interface FormatResponse {
  id: number;
  output?: string;
  baseline?: string;
  error?: string;
  baselineError?: string;
  warnings: string[];
  duration?: number;
  options?: OptionInfo[];
  versions: ToolVersions;
}
