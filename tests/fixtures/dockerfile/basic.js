const tagged = dockerfile`
FROM node:24
WORKDIR /app
RUN echo hello;echo world
COPY . .
CMD ["node","index.js"]
`;

const commented = /* dockerfile */ `
FROM node:24
WORKDIR /app
RUN echo hello;echo world
COPY . .
CMD ["node","index.js"]
`;
