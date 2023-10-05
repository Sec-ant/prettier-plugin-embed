import { CoreCategoryType, SupportOption } from "prettier";
export const embeddedOption: SupportOption = {
  category: "Global" satisfies CoreCategoryType,
  type: "string",
  array: true,
  default: [{ value: ["sql"] }],
  description:
    "Specify embedded SQL languages. This requires prettier-plugin-sql",
};
