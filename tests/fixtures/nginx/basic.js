// Nginx - Tag `nginx` test (with formatting issues)
const tagTest = nginx`
server{listen 80;server_name example.com;location /{proxy_pass http://backend;}}
`;

// Nginx - Comment `/* nginx */` test (with formatting issues)
/* nginx */ `
upstream backend{server 127.0.0.1:3000;server 127.0.0.1:3001;}
`;
