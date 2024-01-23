import type { NginxOptions } from "prettier-plugin-nginx";
import type { OmitIndexSignature } from "type-fest";

export interface PluginNginxOptions
  extends Partial<OmitIndexSignature<NginxOptions>> {}
