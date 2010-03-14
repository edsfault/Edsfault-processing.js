#!/usr/bin/env python
# Processing LALR parser injector; MIT License (c) 2010 notmasteryet
import sys, string, os, tempfile
from xml.sax import parse
from xml.sax.handler import ContentHandler
from optparse import OptionParser

def convertGrammar(source, target):
    handler = GrammarReader()
    sourceFile = open(source)
    try:
      parse(sourceFile, handler)
    finally:
      sourceFile.close()

    grammar = handler.createGrammar()

    targetFile = open(target, "w")
    try:
      JSGrammar().export(targetFile, grammar)
    finally:
      targetFile.close()

Parts = ["lalrParser.js", "processingCompiler.js"]

def buildProcessing(processingIn, xmlGrammar, partsPath, processingOut):
    lines = None
    inFile = open(processingIn)
    try:
      lines = inFile.readlines()
    finally:
      inFile.close()

    i=0
    while i < len(lines) and lines[i].find("Processing.parse = ") < 0:
          i += 1
    if i < len(lines):
       indent = ' ' * lines[i].find("Processing.parse = ")
       endOfFunction = indent + "};"
       i += 1
       while i < len(lines) and lines[i].strip('\r\n') != endOfFunction:
             lines.pop(i)

       lines.insert(i, indent + "  return compileProcessing(parseLalr(processingGrammar, aCode), p);\n");

       i = len(lines) - 1      
       while lines[i].find('}') != 0:
         i -= 1 

       for part in Parts:
           lines.insert(i, "/* Included: " + part + " */\n")
           i += 1

           addonLines = None
           partFile = open(os.path.join(partsPath, part))
           try:
               addonLines = partFile.readlines()
           finally:
               partFile.close()

           if addonLines[-1].rfind('\n') < 0:
               addonLines[-1] += '\n'
           for line in addonLines:
               lines.insert(i, line)
               i += 1

       tempOsHandle, tempFile = tempfile.mkstemp()
       try:
               os.close(tempOsHandle)
               lines.insert(i, "/* Inculded: Processing grammar converted from XML */\n")
               i += 1

               convertGrammar(xmlGrammar, tempFile)
               partFile = open(tempFile)
               try:
                  addonLines = partFile.readlines()
               finally:
                  partFile.close()
  
               if addonLines[-1].rfind('\n') < 0:
                  addonLines[-1] += '\n'
               for line in addonLines:
                  lines.insert(i, line)
                  i += 1

       finally:
          os.remove(tempFile)

    outFile = open(processingOut, "w")
    try:
      outContent = string.join(lines, "").replace('\r', "")
      outFile.write(outContent)
    finally:
      outFile.close()


class JSGrammar:
    def export(self, writer, grammar):
            writer.write("/* Automatically generated grammar for LALR(1) parser */\n")
            writer.write("\n")
            writer.write("var processingGrammar = {\n")
            writer.write(" symbols: [\n")
            for s in grammar.symbols:
                writer.write(" \"" + s.name + "\",\n")
            writer.write(" ],\n")
            writer.write(" rules: [\n")
            for r in grammar.rules:
                writer.write(" {n:" + str(r.nonTerminalIndex) + ",c:" + str(len(r.symbolIndicies)) +  "},\n")
            writer.write(" ],\n")
            writer.write(" charSets: [\n")
            for s in grammar.charSets:    
                chars = []
                for i in sorted(s):
                    chars.append(str(i))         
                cs = string.join(chars, ",")
                writer.write(" [" + cs + "],\n")
            writer.write(" ],\n")
            writer.write(" dfaTable: [\n")
            for t in grammar.dfaTable:
                tableEntries = []
                for i in t.edges:
                  tableEntries.append("{cs:" + str(i.charSetIndex) + ",t:" + str(i.target) + "}");            
                es = string.join(tableEntries, ",")
                writer.write(" {a:" + str(t.acceptSymbol) + ",e:[" + es + "]},\n")
            writer.write(" ],\n")
            writer.write(" dfaTableInitialState: " + str(grammar.dfaTableInitialState) + ",\n")
            writer.write(" lalrTable: [\n")
            for t in grammar.lalrTable:
                actions = []
                for i in t.actions:
                    actions.append("{k:" + str(i.kind) + ",s:" + str(i.symbolIndex) + ",v:" + str(i.value) + "}")
                es = string.join(actions, ",")
                writer.write(" [" + es + "],\n")
            writer.write(" ],\n")
            writer.write(" lalrTableInitialState: " + str(grammar.lalrTableInitialState) +"\n")

            writer.write("};\n")


class GrammarReader(ContentHandler):
    def createGrammar(self):
        grammar = Grammar()
        grammar.startSymbol = self.startSymbol
        grammar.symbols = self.symbols
        grammar.rules = self.rules
        grammar.charSets = self.charSets
        grammar.dfaTable = self.dfaTable
        grammar.dfaTableInitialState = self.dfaTableInitialState
        grammar.lalrTable = self.lalrTable
        grammar.lalrTableInitialState = self.lalrTableInitialState
        return grammar      

    def startElement(self, name, attrs): 
        if name == 'Parameter':
           if attrs.get('Name', "") == 'Start Symbol':
              self.startSymbol = attrs.get('Value', "")
        elif name == 'SymbolTable':
           self.symbols = []
        elif name == 'Symbol':
           self.symbol = Symbol()
           self.symbol.name = attrs.get('Name', "")
           self.symbol.kind = int(attrs.get('Kind', ""))
           self.symbols.append(self.symbol)
        elif name == 'RuleTable':
           self.rules = []
        elif name == 'Rule':
           self.currentRule = Rule()
           self.currentRule.nonTerminalIndex = int(attrs.get('NonTerminalIndex', ""))
           self.currentRule.symbolIndicies = []
           self.rules.append(self.currentRule)
        elif name == 'RuleSymbol':
           self.currentRule.symbolIndicies.append(int(attrs.get('SymbolIndex', "")))
        elif name == 'CharSetTable':
           self.charSets = []
        elif name == 'CharSet':
           self.currentCharSet = set()
           self.charSets.append(self.currentCharSet)
        elif name == 'Char':
           self.currentCharSet.add(int(attrs.get('UnicodeIndex', "")))
        elif name == 'DFATable':
           self.dfaTable = []
           self.dfaTableInitialState = int(attrs.get('InitialState', ""))
        elif name == 'DFAState':
           self.currentDfaState = DFAState()
           self.currentDfaState.edges = []
           self.currentDfaState.acceptSymbol = int(attrs.get('AcceptSymbol', ""))
           self.dfaTable.append(self.currentDfaState)
        elif name == 'DFAEdge':
           self.edge = DFAEdge()
           self.edge.charSetIndex = int(attrs.get('CharSetIndex', ""))
           self.edge.target = int(attrs.get('Target', ""))
           self.currentDfaState.edges.append(self.edge)
        elif name == 'LALRTable':
           self.lalrTable = []
           self.lalrTableInitialState = int(attrs.get('InitialState', ""))
        elif name == 'LALRState':
           self.currentLalrState = LALRState()
           self.currentLalrState.actions = []
           self.lalrTable.append(self.currentLalrState)
        elif name == 'LALRAction':
           self.action = LALRAction()
           self.action.kind = int(attrs.get('Action', ""))
           self.action.symbolIndex = int(attrs.get('SymbolIndex', ""))
           self.action.value = int(attrs.get('Value', ""))
           self.currentLalrState.actions.append(self.action)

class Symbol:
    pass

class SymbolKind:
    NonTerminal = 0
    Terminal = 1
    Whitespace = 2
    EOF = 3
    CommentStart = 4
    CommentEnd = 5
    CommentLine = 6
    Error = 7
    def parse(s):
        return { 'NonTerminal':0, 'Terminal':1, 'Whitespace':2, 'EOF':3, 'CommentStart':4, 'CommentEnd':5, 'CommentLine':6, 'Error':7 }[s]

class LALRActionKind:
   Shift = 1
   ReduceRule = 2
   Goto = 3
   def parse(s):
       return { 'Shift':1, 'ReduceRule':2, 'Goto':3 }[s]

class Rule:
    pass

class DFAState:
    def findEdgeByChar(self, ch, table):
        for e in self.edges:
            if ch in table[e.charSetIndex]:
               return e
        else:
            return None

class DFAEdge:
    pass

class LALRState:
    def findSymbolByIndex(self, symbolIndex):
        for symbol in self.actions:
            if symbol.symbolIndex == symbolIndex:
               return symbol
        else:
            return None

class LALRAction:
    pass

class Grammar:
    pass

def printUsage():
        print >>sys.stderr, """Usage: %s --convert <xml-grammar> <js-grammar>  or: 
       %s --build  <in.js> <xml-grammar> <parts-path> <out.js>""" % (sys.argv[0], sys.argv[0])
        sys.exit(1)

def main():
    parser = OptionParser()

    parser.add_option("-c", "--convert",
                      action="store_true", dest="convert", default=False,
                      help="convert to js states.")
    parser.add_option("-b", "--build",
                      action="store_true", dest="build", default=False,
                      help="fully build processingjs.")
    options, args = parser.parse_args()

    if len(args) < 1:
        printUsage()

    if options.convert:
        convertGrammar(args[0], args[1])
    elif options.build:
        buildProcessing(args[0], args[1], args[2], args[3])
    else:
        printUsage()

if __name__ == '__main__':
    main()

