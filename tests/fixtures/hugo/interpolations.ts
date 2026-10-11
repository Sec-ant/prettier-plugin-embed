const generated: string = hugo`
---
title: ${getFirstValue({ items: [1, 2], enabled: true })}
---
# Heading

Hello ${getSecondValue(/* label */ { value: input })}

{{< figure src="image.jpg" >}}
`;
