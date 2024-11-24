import { AbstractParser, EnclosingContext } from "../../constants";
import Parser from 'tree-sitter';
import Python from 'tree-sitter-python';

export class PythonParser implements AbstractParser {
  private parser: Parser;

  constructor() {
    this.parser = new Parser();
    this.parser.setLanguage(Python);
  }

  findEnclosingContext(file: string, lineStart: number, lineEnd: number): EnclosingContext {
    const tree = this.parser.parse(file);
    let smallestEnclosingContext: any = null;
    let smallestSize = Infinity;

    const traverse = (node: Parser.SyntaxNode) => {
      const startLine = node.startPosition.row + 1;
      const endLine = node.endPosition.row + 1;
      const size = endLine - startLine;

      // Skip nodes that can't contain our target lines
      if (startLine > lineEnd || endLine < lineStart) {
        return;
      }

      const relevantTypes = [
        'function_definition',
        'class_definition',
        'if_statement',
        'for_statement',
        'while_statement'
      ];

      // Check if this is a relevant node type and contains our target lines
      if (relevantTypes.includes(node.type) && startLine <= lineStart && lineEnd <= endLine) {
        let name = '';
        
        switch (node.type) {
          case 'function_definition': {
            const nameNode = node.childForFieldName('name');
            if (nameNode) {
              name = nameNode.text;
              // Check if this is a nested function by looking at the block structure
              const blockParent = node.parent;
              if (blockParent?.type === 'block') {
                const functionParent = blockParent.parent;
                if (functionParent?.type === 'function_definition') {
                  // This is a nested function
                  smallestSize = size;
                  smallestEnclosingContext = {
                    type: node.type,
                    name,
                    startLine,
                    endLine
                  };
                } else if (size < smallestSize) {
                  // Not nested, only use if smaller
                  smallestSize = size;
                  smallestEnclosingContext = {
                    type: node.type,
                    name,
                    startLine,
                    endLine
                  };
                }
              }
            }
            break;
          }
          case 'if_statement': {
            const condition = node.children.find(child => 
              child.type === 'comparison_operator'
            );
            if (condition && size <= smallestSize) {
              name = `if ${condition.text}`;
              smallestSize = size;
              smallestEnclosingContext = {
                type: node.type,
                name,
                startLine,
                endLine
              };
            }
            break;
          }
          case 'for_statement': {
            const identifier = node.children.find(child => child.type === 'identifier');
            const inKeyword = node.children.find(child => child.type === 'in');
            const iterator = node.children.find(child => 
              child.type === 'call' && 
              child.startPosition.row === inKeyword?.endPosition.row
            );
            if (identifier && iterator && size < smallestSize) {
              name = `for ${identifier.text} in ${iterator.text}`;
              smallestSize = size;
              smallestEnclosingContext = {
                type: node.type,
                name,
                startLine,
                endLine
              };
            }
            break;
          }
          default: {
            const nameNode = node.childForFieldName('name');
            if (nameNode && size < smallestSize) {
              name = nameNode.text;
              smallestSize = size;
              smallestEnclosingContext = {
                type: node.type,
                name,
                startLine,
                endLine
              };
            }
          }
        }
      }

      // Process children after checking the current node
      for (const child of node.children) {
        traverse(child);
      }
    };

    traverse(tree.rootNode);

    return {
      enclosingContext: smallestEnclosingContext
    };
  }

  dryRun(file: string): { valid: boolean; error: string } {
    try {
      const tree = this.parser.parse(file);
      const hasSyntaxErrors = tree.rootNode.hasError; // Accessing property without parentheses

      if (hasSyntaxErrors) {
        return {
          valid: false,
          error: "Syntax errors detected in the Python code."
        };
      }

      return {
        valid: true,
        error: ""
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        valid: false,
        error: errorMessage
      };
    }
  }

  public parseForDebug(code: string): Parser.SyntaxNode {
    const tree = this.parser.parse(code);
    return tree.rootNode;
  }
}
