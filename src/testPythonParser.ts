import { PythonParser } from "./context/language/python-parser";

const pythonParser = new PythonParser();

// Test the findEnclosingContext method
const testFindEnclosingContext = () => {
  const pythonCode = `
def my_function():
    x = 10
    if x > 5:
        print(x)

class MyClass:
    def method(self):
        pass
  `.trim();

  const lineStart = 3; // Start of "if x > 5:"
  const lineEnd = 4;   // End of "print(x)"

  const context = pythonParser.findEnclosingContext(pythonCode, lineStart, lineEnd);
  console.log("Enclosing Context:", JSON.stringify(context, null, 2));
};

// Test the dryRun method
const testDryRun = () => {
  const validCode = `
def valid_function():
    return 42
  `.trim();

  const invalidCode = `
def invalid_function()
    return 42
  `.trim();

  const validResult = pythonParser.dryRun(validCode);
  console.log("Valid Code Test:", validResult);

  const invalidResult = pythonParser.dryRun(invalidCode);
  console.log("Invalid Code Test:", invalidResult);
};

// Additional test cases for nested structures
const testAdditionalFindEnclosingContext = () => {
  const pythonCode = `
def outer_function():
    def inner_function():
        x = 1
        y = 2
    for i in range(10):
        if i > 5:
            print(i)

class OuterClass:
    def method(self):
        x = 1
        return x
  `.trim();

  // Test inner function content
  console.log("\nTest 1: Lines inside inner_function:");
  let context = pythonParser.findEnclosingContext(pythonCode, 3, 3);
  console.log("Expected: inner_function context");
  console.log("Got:", JSON.stringify(context, null, 2));

  // Test if statement inside for loop
  console.log("\nTest 2: Lines inside if statement:");
  context = pythonParser.findEnclosingContext(pythonCode, 7, 7);
  console.log("Expected: if statement context");
  console.log("Got:", JSON.stringify(context, null, 2));

  // Test method in class
  console.log("\nTest 3: Lines inside method:");
  context = pythonParser.findEnclosingContext(pythonCode, 11, 11);
  console.log("Expected: method context");
  console.log("Got:", JSON.stringify(context, null, 2));

  // Print the actual node structure for debugging
  console.log("\nDebug: Node structure:");
  const rootNode = pythonParser.parseForDebug(pythonCode);
  printNodeStructure(rootNode);
};

// Helper function to print node structure
const printNodeStructure = (node: any, depth = 0) => {
  console.log(`${' '.repeat(depth * 2)}${node.type} (${node.startPosition.row + 1}-${node.endPosition.row + 1})`);
  for (const child of node.children) {
    printNodeStructure(child, depth + 1);
  }
};

// Run all tests
testFindEnclosingContext();
testDryRun();
testAdditionalFindEnclosingContext();
