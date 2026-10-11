const generated: string = dockerfile`
FROM node:${getFirstValue({ items: [1, 2], enabled: true })}
ENV APP_NAME="${getSecondValue(/* label */ { value: input })}"
RUN echo "$APP_NAME";echo ready
`;
