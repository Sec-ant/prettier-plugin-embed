import { CoreCategoryType, SupportOption } from "prettier";
export const embeddedOption: SupportOption = {
  category: "Global" satisfies CoreCategoryType,
  type: "string",
  array: true,
  default: [{ value: ["xml", "svg"] }],
  description:
    "Config embedded XML formatting. This requires @prettier/plugin-xml",
};
