import { CoreCategoryType, SupportOption } from "prettier";
export const embeddedOption: SupportOption = {
  category: "Global" satisfies CoreCategoryType,
  type: "string",
  array: true,
  default: [{ value: [] }],
  description: "Specify embedded languages that will not be formatted.",
};
