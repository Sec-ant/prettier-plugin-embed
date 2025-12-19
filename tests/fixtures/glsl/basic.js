// GLSL - Tag `glsl` test (with formatting issues)
const tagTest = glsl`
attribute vec3 position;uniform mat4 matrix;void main(){gl_Position=matrix*vec4(position,1.0);}
`;

// GLSL - Comment `/* glsl */` test (with formatting issues)
/* glsl */ `
varying vec3 color;void main(){gl_FragColor=vec4(color,1.0);}
`;
