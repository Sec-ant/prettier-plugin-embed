// Ruby - Tag `ruby` test (with formatting issues)
const tagTest = ruby`
def greet(name) puts "Hello, #{name}" end
class User;attr_accessor :name;end
`;

// Ruby - Comment `/* ruby */` test (with formatting issues)
const tagTest2 = /* ruby */ `
def add(a,b) a+b end
`;
