const tagged = hugo`
+++
title = "Example"
tags = ["one","two"]
+++
# Heading

{{< figure src="image.jpg" >}}
`;

const commented = /* hugo */ `
+++
title = "Example"
tags = ["one","two"]
+++
# Heading

{{< figure src="image.jpg" >}}
`;
