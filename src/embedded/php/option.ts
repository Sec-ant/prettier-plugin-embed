import { CoreCategoryType, SupportOption } from "prettier";
export const embeddedOption: SupportOption = {
  category: "Global" satisfies CoreCategoryType,
  type: "string",
  array: true,
  default: [{ value: ["php"] }],
  description:
    "Specify embedded PHP languages. This requires @prettier/plugin-php",
};
