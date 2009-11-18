/* 
   Processing Compiler: Processing -> JavaScript

   License       : MIT
   Developer     : notmasteryet 
*/

function compileProcessing(ast) {
    preprocessProcessing(ast);
    collectGlobalStatements(ast);
    splitExpressions(ast);
    defineContextSymbols(ast, null);
    
    var context = new Object();        
    var s = "";  // "/*\n" + out(ast, "") + " */\n";
    if (ast.n == "CompilationUnit") {
        s += outGlobalDeclarations(ast.first().children, context);
    }
    return s;
}

function outGlobalDeclarations(declarations, context) {
    var s = "";
    // output global variables
    for (var i = 0; i < declarations.length; ++i) {
        var declaration = declarations[i].first();
        if(declaration.match(["GlobalMemberDeclaration", "ClassMemberDeclaration", "FieldDeclaration"])) {
            var fieldDeclaration = declaration.first().first();
            var fieldType = fieldDeclaration.children[fieldDeclaration.children.length - 3];
            var variableDeclarators = fieldDeclaration.children[fieldDeclaration.children.length - 2];
            var names = new Array();
            for (var j = 0; j < variableDeclarators.children.length; ++j) {
                var name = getVariableDeclaratorName(variableDeclarators.children[j]);
                if (variableDeclarators.children[j].outDefault) {
                    name += " = " + outDefaultValue(fieldType, context);
                }
                names.push(name);
            }
            s += "var " + names.join(", ") + ";\n";
        }
    }

    // output global functions
    for (var i = 0; i < declarations.length; ++i) {
        var declaration = declarations[i].first();
        if (declaration.match(["GlobalMemberDeclaration",
        "ClassMemberDeclaration", "MethodDeclaration"])) {
            var methodDeclaration = declaration.first().first();
            s += outGlobalMethod(methodDeclaration, context);
        }
    }

    // output classes
     for (var i = 0; i < declarations.length; ++i) {
        var declaration = declarations[i].first();
        if (declaration.n == "ClassDeclaration") {
            s += outClass(declaration, context);
        }
    }
                   
    return s;
}

function outClass(classDeclaraton, context) {
    var i = classDeclaraton.first().n == "Modifiers" ? 2 : 1;
    var className = classDeclaraton.children[i].text;
    context.className = className;
    context.superName = undefined;
    if (classDeclaraton.children[i + 1].n == "Super") {
        context.superName = getReferenceTypeName(classDeclaraton.children[i + 1].children[1].first(), context);
    }

    var classBody = classDeclaraton.children[classDeclaraton.children.length - 1];
    var s = "function " + className + "() {with(this){\n";
    // declare fields
    if (context.superName != undefined) {
        s += "  var __self=this;function superMethod(){extendClass(__self,arguments," + context.superName + ");}\n";
        s += "  extendClass(this, " + context.superName + ");"
    }
    
    for (var j = 0; j < classBody.children[1].children.length; ++j) {
        var member = classBody.children[1].children[j].first();
        if (member.n == "ClassMemberDeclaration") {
            if (member.first().n == "FieldDeclaration") {
                var fieldDeclaration = member.first();
                var fieldType = fieldDeclaration.children[fieldDeclaration.children.length - 3];
                var variableDeclarators = fieldDeclaration.children[fieldDeclaration.children.length - 2];

                for (var k = 0; k < variableDeclarators.children.length; ++k) {
                    var fieldName = getVariableDeclaratorName(variableDeclarators.children[k]);
                    if (variableDeclarators.children[k].children.length == 1)
                        s += "this." + fieldName + " = " + outDefaultValue(fieldType, context) + ";\n";
                    else
                        s += "this." + fieldName + " = " + outVariableInitializer(variableDeclarators.children[k].children[2], context) + ";\n";
                }
            } else {
                s += outClassMethod(member.first(), context);
            }            
        }
    }

    for (var j = 0; j < classBody.children[1].children.length; ++j) {
        var member = classBody.children[1].children[j].first();
        if (member.n == "ConstructorDeclaration") {
            s += outConstructor(member, context);
        }
    }    
    
    s += "}}";
    return s;
}

function outGlobalMethod(method, context) {
  var declaratorIndex = method.first().first().n == "Modifiers" ? 2 : 1;
  var declarator = method.first().children[declaratorIndex];
  while (declarator.first().n == "MethodDeclarator") {
      declarator = declarator.first();
  }
  var methodName = declarator.first().text;
  var methodParameters = declarator.children.length > 3 ?
    declarator.children[2].children : [];

  var parameters = new Array();
  for (var i = 0; i < methodParameters.length; ++i) {
      parameters.push(getVariableDeclaratorName(methodParameters[i].children[1]));
  }
  var s = "Processing." + methodName + " = function " + methodName + "(" +
    parameters.join(", ") + ") {"
  s += outMethodBody(method.children[1], context);
  s += "};\n";
  return s;
}

function outConstructor(constructor, context) {
    var declaratorIndex = constructor.first().n == "Modifiers" ? 1 : 0;
    var declarator = constructor.children[declaratorIndex];
    var methodParameters = declarator.children.length > 3 ?
        declarator.children[2].children : [];

    var parameters = new Array();
    for (var i = 0; i < methodParameters.length; ++i) {
        parameters.push(getVariableDeclaratorName(methodParameters[i].children[1]));
    }
    var s = "if (arguments.length == " + parameters.length + ") {\n";
    for(var i=0;i<parameters.length;++i) {
        s += "var " + parameters[i] + " = arguments[" + i + "];\n";
    }
    
    var body = constructor.children[constructor.children.length - 1];
    if (body.children[1].n == "ExplicitConstructorInvocation") {
        var name = body.children[1].first().text == "this" ? context.className : "superMethod";
        var args = new Array();
        if (body.children[1].children[2].n == "ArgumentList") {

            for (var i = 0; i < body.children[1].children[2].children.length; ++i) {
                args.push(outAnyExpression(body.children[1].children[2].children[i], context));
            }
            s += name + "(" + args.join(", ") + ");\n";
        }
    }

    if (body.children[body.children.length - 2].n == "BlockStatements") {
        var methodBody = createAst(["MethodBody", "Block"],
        [createToken('{'), body.children[body.children.length - 2], createToken('}')]);
        s += outMethodBody(methodBody, context);
    }
    s += "}\n";
    return s;
}

function outClassMethod(method, context) {
    var declaratorIndex = method.first().first().n == "Modifiers" ? 2 : 1;
    var declarator = method.first().children[declaratorIndex];
    while (declarator.first().n == "MethodDeclarator") {
        declarator = declarator.first();
    }
    var methodName = declarator.first().text;
    var methodParameters = declarator.children.length > 3 ?
    declarator.children[2].children : [];

    var parameters = new Array();
    for (var i = 0; i < methodParameters.length; ++i) {
        parameters.push(getVariableDeclaratorName(methodParameters[i].children[1]));
    }
    var s = "addMethod(this, \"" + methodName + "\", function " + methodName + "(" +
    parameters.join(", ") + ") {"
    s += outMethodBody(method.children[1], context);
    s += "});\n";
    return s;
}

function outMethodBody(methodBody, context) {
    var savedStatesOperation = context.statesOperation;
    delete context.statesOperation;

    var body = "var $this=this;\n" +
        outBlockContent(methodBody.first(), context);

    var states = findStates(methodBody.first());
    for (var i = 0; i < states.length; ++i) {
        body += outMethodBodyInState(methodBody, states[i], context);
    }
    if (savedStatesOperation != undefined)
        context.statesOperation = savedStatesOperation;
    return body;
}

function outMethodBodyInState(methodBody, stateName, context) {
    var s = "function " + stateName + "State(context) { with(context) {";
    context.statesOperation = { operation: "find", name: stateName };
    s += outBlockContent(methodBody.first(), context);
    return s + "}}\n";
}

function findStates(ast) {
    var queue = [ast];
    var names = [];
    while (queue.length > 0) {
        var current = queue.shift();
        if (current.match("BlockStatement") && current.generated != undefined) {
            names.push(current.generated.name);
        }
        if (current.constructor == AstNode &&
            current.n != "Expression" && current.n != "MethodBody" && current.n != "ConstuctorBody") {
            for (var i = 0; i < current.children.length; ++i)
                queue.push(current.children[i]);            
        }
    }
    return names;
}

function outBlockContent(block, context) {
    var content = new Array();
    if (block.children.length > 2) {
        for (var i = 0; i < block.children[1].children.length; ++i) {
            var s = outBlockStatement(block.children[1].children[i], context);
            if(s != undefined) content.push(s);
        }
    }
    if(content.length > 0)
        return "\n" + content.join("\n") + "\n";
    else
        return "";
}

function outBlockStatement(statement, context) {    
    if (statement.first().n == "Statement") {
        return outStatement(statement.first(), context);
    } else {
        if (context.statesOperation != undefined) {
            if (context.statesOperation.operation == "find") {
                var name = statement.generated.name;
                if (name == context.statesOperation.name) {
                    context.statesOperation.operation = "found";
                }
                return undefined;
            }
        }         
        var localVariableDeclaration = statement.first().first();
        var s = outLocalVariableDeclaration(localVariableDeclaration, context) + ";";
        if (statement.generated != undefined) {
            var name = statement.generated.name;
            s += " if(" + name + " == $async) return $async.push(" + name + "State, $this, {" + 
                outContextVariables(statement.generated.context) + "}, \"" + name + "\");";
        }
        return s;
    }
}

function outContextVariables(context) {
    var stack = [];
    for (var p = context; p; p = p.next)
        stack.push(p.name + ":" + p.name);
    return stack.join(", ");
}

function outLocalVariableDeclaration(localVariableDeclaration, context) {
    var variableType = localVariableDeclaration.children[localVariableDeclaration.children.length - 2];
    var variableDeclarators = localVariableDeclaration.children[localVariableDeclaration.children.length - 1].children;
    var items = new Array();
    for (var i = 0; i < variableDeclarators.length; ++i) {
        var variableName = getVariableDeclaratorName(variableDeclarators[i]);
        if (variableDeclarators[i].children.length > 1) {
            items.push(variableName + " = " + outVariableInitializer(variableDeclarators[i].children[2], context));
        } else {
            items.push(variableName /* + " = " + outDefaultValue(variableType, context) */);
        }
    }
    return "var " + items.join(", ");
}

function outDefaultValue(type, context) {
    if (type.first().n == "ReferenceType") {
        return "null";
    } else if (type.first().first().n == "NumericType") {
        return "0";
    } else {
        return "false";
    }    
}

function outVariableInitializer(initializer, context) {
    if (initializer.first().n == "Expression") {
        return outAnyExpression(initializer.first(), context);
    } else {
        var items = new Array();
        if (initializer.first().children[1].n == "VariableInitializers") {
            for (var i = 0; i < initializer.first().children[1].children.length; ++i) {
                items.push(outVariableInitializer(initializer.first().children[1].children[i], context));
            }
        }
        return "[" + items.join(", ") + "]";
    }
}

function outStatement(statement, context) {
    if (statement.first().n == "StatementWithoutTrailingSubstatement") {
        if (context.statesOperation != undefined &&
            context.statesOperation.operation == "find") {
            switch(statement.first().first().n)
            {
                case "EmptyStatement":
                case "ExpressionStatement":
                case "BreakStatement":
                case "ContinueStatement":
                case "ReturnStatement":
                    return undefined;
            }
        }
        return outStatementWithoutTrailingSubstatement(statement.first(), context);
    } else {
        switch (statement.first().n) {
            case "IfThenStatement":
            case "IfThenElseStatement":
            case "IfThenElseStatementNoShortIf":
                return outIfStatement(statement.first(), context);
            case "WhileStatement":
            case "WhileStatementNoShortIf":
                return outWhileStatement(statement.first(), context);
            case "ForStatement":
            case "ForStatementNoShortIf":
                return outForStatement(statement.first(), context);
        }
    }
}

function outIfStatement(statement, context) {
    if (context.statesOperation != undefined &&
            context.statesOperation.operation == "find") {
        var s0 = outStatement(statement.children[4], context);
        if (context.statesOperation.operation == "find" &&
            statement.children.length > 5) {
            s0 = outStatement(statement.children[6], context);
        }
        if (context.statesOperation.operation == "found")
            return s0;
        return undefined;
    }

    var s = "if (" + outAnyExpression(statement.children[2], context) + ") ";
    s += outStatement(statement.children[4], context);
    if (statement.children.length > 5) {
        s += " else " + outStatement(statement.children[6], context);
    }
    return s;
}

var autoWhileId = 0;

function outWhileStatement(statement, context) {
    if (context.statesOperation != undefined &&
            context.statesOperation.operation == "find") {
        var s0 = outStatement(statement.children[4], context);
        if (context.statesOperation.operation == "find") return undefined;
        var whileFlag = "$autoWhile" + (autoWhileId++);
        var s = "var " + whileFlag + " = false;\ndo {\n" + s0 + "} while((" + whileFlag + "=true),false);\n";
        return s + "if(" + whileFlag + ") {\n" +
            "while (" + outAnyExpression(statement.children[2], context) + ") " +
                outStatement(statement.children[4], context) +
            "}\n";
    }
    
    return "while (" + outAnyExpression(statement.children[2], context) + ") " +
        outStatement(statement.children[4], context);
}

function outForStatement(statement, context) {
    var forArguments = [];
    for (var i = 0; i < statement.children.length; ++i) {
        switch (statement.children[i].n) {
            case "ForInit":
            case "ForUpdate":
                if (statement.children[i].first().n == "LocalVariableDeclaration") {
                    forArguments.push(outLocalVariableDeclaration(statement.children[i].first(), context));
                } else {
                    var list = statement.children[i].first();
                    var s0 = "";
                    for (var j = 0; j < list.children.length; ++j) {
                        s0 += outAnyExpression(list.children[j], context);
                    }
                    forArguments.push(s0);
                }
                break;
            case "Expression":
                forArguments.push( outAnyExpression(statement.children[i], context) );
                break;
        }
    }

    if (context.statesOperation != undefined &&
            context.statesOperation.operation == "find") {
        var s0 = outStatement(statement.children[statement.children.length - 1], context);
        if (context.statesOperation.operation == "find") return undefined;
        var whileFlag = "$autoWhile" + (autoWhileId++);
        var s = "var " + whileFlag + " = false;\ndo {\n" + s0 + "} while((" + whileFlag + "=true),false);\n";
        forArguments[0] = forArguments[2];
        return s + "if(" + whileFlag + ") {\n" +
            "for (" + forArguments.join("; ") + ") " +
            outStatement(statement.children[statement.children.length - 1], context) +
            "}\n";
    }

    var s = "for (" + forArguments.join("; ") + ") ";
    s += outStatement(statement.children[statement.children.length - 1], context);
    return s;
}

function outStatementWithoutTrailingSubstatement(statement, context) {
    var simpleStatement = statement.first();
    switch (simpleStatement.n) {
        case "Block": return "{" + outBlockContent(simpleStatement, context) + "}";
        case "EmptyStatement": return ";";
        case "ExpressionStatement": return outAnyExpression(simpleStatement.first(), context) + ";";
        case "BreakStatement": return "break;";
        case "ContinueStatement": return "continue";
        case "ReturnStatement": return outReturnStatement(simpleStatement, context);
        case "TryStatement": return outTryStatement(simpleStatement, context);
        case "SwitchStatement": return outSwitchStatement(simpleStatement, context);
        case "DoStatement": return outDoStatement(simpleStatement, context);
    }
}

function outDoStatement(statement, context) {
    if (context.statesOperation != undefined &&
            context.statesOperation.operation == "find") {
        var s0 = outStatement(statement.children[1], context);
        if (context.statesOperation.operation == "find") return undefined;
        var whileFlag = "$autoWhile" + (autoWhileId++);
        var s = "var " + whileFlag + " = false;\ndo {\n" + s0 + "} while((" + whileFlag + "=true),false);\n";
        return s + "if(" + whileFlag + ") {\n" +
            "while (" + outAnyExpression(statement.children[4], context) + ") " +
                outStatement(statement.children[1], context) +
            "}\n";
    }

    return "do " + outStatement(statement.children[1], context) + " while (" + outAnyExpression(statement.children[4], context) + ");";
}

function outSwitchStatement(statement, context) {
    var block = statement.children[4];

    if (context.statesOperation != undefined &&
            context.statesOperation.operation == "find") {

        if (block.children[1].n == "SwitchBlockStatementGroups") {
            var s1 = "";
            for (var i = 0; i < block.children[1].children.length; ++i) {
                var group = block.children[1].children[i];
                for (var j = 0; j < group.children[1].children.length; ++j) {
                    s1 += outBlockStatement(group.children[1].children[j], context) + "\n";
                }
                if (context.statesOperation.operation != "find") {
                    return "do { " + s1 + " } while(false);";
                }
            }
        }
        return undefined;
    }
    
    var s = "switch (" + outAnyExpression(statement.children[2], context) + ") {\n";
    if (block.children[1].n == "SwitchBlockStatementGroups") {
        for (var i = 0; i < block.children[1].children.length; ++i) {
            var group = block.children[1].children[i];
            for (var j = 0; j < group.first().children.length; ++j) {
                s += outSwitchLabel(group.first().children[j], context) + "\n";
            }
            for (var j = 0; j < group.children[1].children.length; ++j) {
                s += outBlockStatement(group.children[1].children[j], context) + "\n";
            }
        }
    }
    if (block.children[block.children.length - 2].n == "SwitchLabels") {
        var list = block.children[block.children.length - 2];
        for (var j = 0; j < list.children.length; ++j) {
            s += outSwitchLabel(list.children[j], context) + "\n";
        }        
    }
    s += "}";
    return s;
}

function outSwitchLabel(label, context) {
    if (label.first().n == "case")
        return "case " + outAnyExpression(label.children[1]) + ":";
    else
        return "default:";
}

function outTryStatement(tryStatement, context) {
    
    if (context.statesOperation != undefined &&
            context.statesOperation.operation == "find") {
        var s0 = outBlockContent(tryStatement.children[1], context);
        if (context.statesOperation.operation == "find") return undefined;

        return "try {" + s0 + "} " +
            outCatchStatements(tryStatement, context);
    }

    return "try {" + outBlockContent(tryStatement.children[1], context) + "} " +
        outCatchStatements(tryStatement, context);
}

function outCatchStatements(tryStatement, context) {
    var catches = new Array();
    for (var i = 0; i < tryStatement.children[2].children.length; ++i) {
        var catchStatement = tryStatement.children[2].children[i];
        var parameterName = catchStatement.children[2].children[1].first().text;
        catches.push(
            "catch (" + parameterName + ") {" + outBlockContent(catchStatement.children[4], context) + "}");
    }
    return catches.join(" ");
}

function outReturnStatement(returnStatement, context) {
    if (returnStatement.children.length > 2)
        return "return " + outAnyExpression(returnStatement.children[1]) + ";";
    else
        return "return;";
}

function outAnyExpression(expression, context) {
    switch (expression.n) {
        case "Expression":
        case "ConstantExpression":
        case "PostfixExpression":
        case "StatementExpression":
        case "AssignmentExpression":
        case "LeftHandSide":
        case "PostfixExpression":
        case "Primary":
            return outAnyExpression(expression.first(), context);
        case "Assignment":
            return outAnyExpression(expression.first(), context) +
                " " + expression.children[1].first().text + " " +
                outAnyExpression(expression.children[2]);
        case "ConditionalExpression":
            if (expression.children.length > 1) {
                return outAnyExpression(expression.first(), context) + " ? " +
                outAnyExpression(expression.children[2], context) + " : " +
                outAnyExpression(expression.children[4], context);
            } else {
                return outAnyExpression(expression.first(), context);
            }
            
        case "ConditionalOrExpression":
        case "ConditionalAndExpression":
        case "ExclusiveOrExpression":
        case "InclusiveOrExpression":
        case "AndExpression":
        case "EqualityExpression":
        case "ShiftExpression":
        case "AdditiveExpression":
        case "MultiplicativeExpression":
            if (expression.children.length > 1) {
                return outAnyExpression(expression.first(), context) +
                    " " + expression.children[1].text + " " +
                    outAnyExpression(expression.children[2], context);
            } else {
                return outAnyExpression(expression.first(), context);
            }
        case "RelationalExpression":
            if (expression.children.length > 1) {
                if (expression.children[1].text == "instanceof") {
                    return outAnyExpression(expression.first(), context) +
                    ".contructor == " +
                    getReferenceTypeName(expression.children[2], context);
                }
                else {
                    return outAnyExpression(expression.first(), context) +
                    " " + expression.children[1].text + " " +
                    outAnyExpression(expression.children[2], context);
                }
            } else {
                return outAnyExpression(expression.first(), context);
            }
        case "UnaryExpression":
        case "UnaryExpressionNotPlusMinus":
            if (expression.children.length == 1) {
                return outAnyExpression(expression.first(), context);
            } else {
                return expression.first().text + 
                    outAnyExpression(expression.children[1], context);
            }
        case "CastExpression":
            return outCastExpression(expression, context);            
        case "PreIncrementExpression":
        case "PreDecrementExpression":
            return expression.first().text +
                    outAnyExpression(expression.children[1], context);
        case "PostIncrementExpression":
        case "PostDecrementExpression":
            return outAnyExpression(expression.first(), context) +
                expression.children[1].text;
        case "MethodInvocation":
            return outMethodInvocation(expression, context);
        case "ClassInstanceCreationExpression":
            return outClassInstanceCreationExpression(expression, context);
        case "Name":
            return getFullName(expression, context);
        case "PrimaryNoNewArray":
            if (expression.first().n == "Literal") {
                return getLiteral(expression.first());
            } else if (expression.first().n == "this") {
                return "this";
            } else if (expression.first().n == "(") {
                return "(" + outAnyExpression(expression.children[1], context) + ")";
            } else {
                return outAnyExpression(expression.first(), context);
            }
        case "ArrayCreationExpression":
            return outArrayCreationExpression(expression, context);
        case "FieldAccess":
            if (expression.first().n == "Primary") {
                return outAnyExpression(expression.first(), context) + "." + expression.children[2].text;
            }
            return ""; // ???
        case "ArrayAccess":
            return outAnyExpression(expression.first(), context) + "[" +
                outAnyExpression(expression.children[2], context) + "]";
    }
}

function outArrayCreationExpression(expression, context) {
    var dims = expression.children[2];
    var args = new Array();
    for (var i = 0; i < dims.children.length; ++i) {
        args.push(outAnyExpression(dims.children[i].children[1], context));
    }
    return "new ArrayList(" + args.join(", ") + ")";
}

function getLiteral(literal) {
    var value = literal.toString();
    if (literal.first().n == "ColorLiteral") {
        return "DefaultColor(0x" + value.substr(1, 2) + ", 0x" + value.substr(3, 2) + ", 0x" + value.substr(5, 2) + ")";
    } else if (literal.first().n == "FloatPointLiteral") {
        return value.replace(/[fFdD]$/, "");
    } else if (literal.first().n == "IntegerLiteral") {
        return value.replace(/[lL]$/, "");
    } else if (literal.first().n == "CharLiteral") {
        return eval(value).charCodeAt(0) + " /* " + value + " */ ";
    }
    return value;    
}

function getIdentifierFromName(expression, context) {
    if (expression.first().n == "SimpleName")
        return expression.first().first().text;
    else
        return expression.first().children[2].text;
}

function getFullName(expression, context) {
    if (expression.first().n == "SimpleName")
        return expression.first().first().text;
    else
        return getFullName(expression.first().first(), context) +
            "." + expression.first().children[2].text;
}

function outClassInstanceCreationExpression(expression, context) {
    if (expression.first().n == "ColorInstanceCreation")
        return outMethodInvocation(expression.first(), context);     

    var className = getReferenceTypeName(expression.children[1], context);
    var arguments = new Array();
    var i = expression.children.length - 2;
    if (expression.children[i].n == "ArgumentList") {
        for (var j = 0; j < expression.children[i].children.length; ++j) {
            arguments.push(outAnyExpression(expression.children[i].children[j], context));
        }
    }
    return "new " + className + "(" + arguments.join(", ") + ")";
}

function outMethodInvocation(expression, context) {
    var i = expression.children.length - 2;
    var arguments = new Array();
    if(expression.children[i].n == "ArgumentList") {
        for (var j = 0; j < expression.children[i].children.length; ++j) {
            arguments.push(outAnyExpression(expression.children[i].children[j], context));
        }
        i -= 2;
    } else if(expression.children[i].n == "Expression") {
        arguments.push(outAnyExpression(expression.children[i], context));
        i -= 2;
    } else {
      --i;
    }

    var methodName = getMethodName(expression);
    return methodName + "(" + arguments.join(", ") + ")";
}

function getMethodName(methodInvocation, context) {
    var i = methodInvocation.children.length - 2;
    if (methodInvocation.children[i].n == "ArgumentList") {
        i -= 2;
    } else if (methodInvocation.children[i].n == "Expression") {
        i -= 2;
    } else {
        --i;
    }
    
    if (methodInvocation.first().n == "Name") {
        return getFullName(methodInvocation.first(), context);
    } else if (methodInvocation.first().n == "Primary") {
        return outAnyExpression(methodInvocation.first(), context) + "."
            + methodInvocation.children[2].text;
    } else {
        return methodInvocation.children[i].toString();
    }
}

function outCastExpression(expression, context) {
    var castName = expression.children[1].toString();
    if (castName == 'boolean' || castName == 'byte' || castName == 'char'
        || castName == 'float' || castName == 'int') {
        return castName + "(" + outAnyExpression(expression.children[expression.children.length - 1], context) + ")";
    } else {
        return outAnyExpression(expression.children[expression.children.length - 1], context);
    }
}

function getReferenceTypeName(type, context) {
    if (type.first().n == "ClassOrInterfaceType") {
        return getIdentifierFromName(type.first().first(), context);
    } else if (type.first().n == "Name") {
        return getIdentifierFromName(type.first(), context);
    } else if (type.first().n == "ArrayType") {
        return getReferenceTypeName(type.first(), context);
    } else {
        return type.first().toString(); 
    }
}

function getVariableDeclaratorName(v) {
    while(v.n != "VariableDeclaratorId") {
        v = v.first();
    }
    while (v.first().n == "VariableDeclaratorId") {
        v = v.first();
    }
    return v.first().text;
}

function out(p, ind) {
    if (p.text != undefined) {
        return ind + p.n + ": \'" + p.toString() + "\'\n";
    } else {
        var s = ind + p.n + ':\n';
        for (var i = 0; i < p.children.length; ++i) {
            s += out(p.children[i], ind + "  ");
        }
        return s;
    }
}

function preprocessProcessing(ast) {
    switch (ast.n) {
        case "ImportDeclarations":
            collectChildren(ast, "ImportDeclaration"); break;
        case "GlobalDeclarations":
            collectChildren(ast, "GlobalDeclaration"); break;
        case "Modifiers":
            collectChildren(ast, "Modifier", " "); break;
        case "ClassBodyDeclarations":
            collectChildren(ast, "ClassBodyDeclaration"); break;
        case "VariableDeclarators":
            collectChildren(ast, "VariableDeclarator", ", "); break;
        case "ArgumentList":
            collectChildren(ast, "Expression", ", "); break;
        case "DimExprs":
            collectChildren(ast, "DimExpr"); break;
        case "StatementExpressionList":
            collectChildren(ast, "StatementExpression", ", "); break;
        case "SwitchLabels":
            collectChildren(ast, "SwitchLabel"); break;
        case "SwitchLabels":
            collectChildren(ast, "SwitchLabel"); break;
        case "SwitchBlockStatementGroups":
            collectChildren(ast, "SwitchBlockStatementGroup"); break;
        case "BlockStatements":
            collectChildren(ast, "BlockStatement"); break;
        case "FormalParameterList":
            collectChildren(ast, "FormalParameter", ", "); break;
        case "ClassTypeList":
            collectChildren(ast, "ClassType", ", "); break;
        case "VariableInitializers":
            collectChildren(ast, "VariableInitializer", ", "); break;
        case "Catches":
            collectChildren(ast, "CatchClause"); break;
        case "Statement":
        case "StatementNoShortIf":
            if (ast.first().n == "StatementWithoutTrailingSubstatement" &&
                ast.first().first().n == "EmptyStatement") {
                var emptyStatement = ast.first().first();
                ast.first().children[0] = createAst("Block",
                    [createToken('{'), createToken('}')]);
            }
            break;
    }

    if (ast.constructor == AstNode) {
        for (var i = 0; i < ast.children.length; ++i) {
            preprocessProcessing(ast.children[i]);
        }
    }

    switch (ast.n) {
        case "Block":
            if (ast.children.length < 3) {
                var emptyStatements = createAst("BlockStatements", []);
                var lastBracket = ast.children.pop();
                ast.children.push(emptyStatements);
                ast.children.push(lastBracket);
            }
            break;               
        case "PostfixExpression":
            if (ast.first().match(["Primary", "PrimaryNoNewArray", "MethodInvocation"])) {
                var mi = ast.first().first().first();
                var methodName = getMethodName(mi);
                if (methodName.match(/\.length$/) && mi.children[mi.children.length - 2].n == '(') {
                    // has no arguments and name ends with ".length"
                    if (mi.first().n == "Name") {
                        ast.children[0] = mi.first();
                    } else {
                        mi.children.pop(); // )
                        mi.children.pop(); // (
                        ast.first().first().children[0] =
                            createAst("FieldAccess", mi.children);
                    }
                }
            }
            break;
    }
}

function collectChildren(ast, itemName, delimiter) {
    var collectionName = ast.n;
    var collection = new Array();
    var p = ast;
    var back = undefined;
    do {
        
        var next = null;
        var item = null;

        for (var i = 0; i < p.children.length; ++i) {
            var child = p.children[i];
            if (child.n == itemName) {
                if (back == undefined) { back = next == null; }
                item = child;
            } else if (child.n == collectionName) {
                next = child;
            }            
        }
        if (item != null) {
            if (back) collection.push(item); else collection.unshift(item);
        }
        p = next;
    } while (p != null);
    ast.children = collection;
    ast.delimiter = delimiter;
}

function collectGlobalStatements(root) {
    var globalStatements = [];
    var declarations = root.first().children;
    for (var i = 0; i < declarations.length; ++i) {
        var declaration = declarations[i].first();
        if (declaration.match(["GlobalMemberDeclaration", "ClassMemberDeclaration", "FieldDeclaration"])) {
            var fieldDeclaration = declaration.first().first();
            var fieldType = fieldDeclaration.children[fieldDeclaration.children.length - 3];
            var variableDeclarators = fieldDeclaration.children[fieldDeclaration.children.length - 2];
            for (var j = 0; j < variableDeclarators.children.length; ++j) {
                var variableDeclarator = variableDeclarators.children[j];
                var name = getVariableDeclaratorName(variableDeclarator.first());
                if (variableDeclarator.children.length > 1) {
                    var variableInitializer = variableDeclarator.children.pop();
                    variableDeclarator.children.pop();
                    if (variableInitializer.first().match("Expression")) {
                        var leftSide = createAst(["LeftHandSide", "Name", "SimpleName"], 
                        [createToken("Identifier", name)]);
                        var expressionStatement = createAst(["StatementExpression", "Assignment"],
                        [leftSide, createAst("AssignmentOperator", [createToken('=')]), variableInitializer.first().first()]);
                        var statement = createAst(["BlockStatement", "Statement",
                        "StatementWithoutTrailingSubstatement", "ExpressionStatement"],
                        [expressionStatement, createToken(';')]);
                        globalStatements.push(statement);
                    } else if (variableInitializer.first().match("ArrayInitializer")) {
                        // TODO
                    }
                } else {
                    variableDeclarator.outDefault = true;
                }                
            }
        } else if (declaration.n == "GlobalStatement") {
            var statement = declaration.first();
            removeAt(declarations, i--);
            globalStatements.push(createAst("BlockStatement", [statement]));
        }
    }

    var setupMethod = null;
    for (var i = 0; i < declarations.length; ++i) {
        var declaration = declarations[i].first();
        if (declaration.match(["GlobalMemberDeclaration",
        "ClassMemberDeclaration", "MethodDeclaration"])) {
            var methodDeclaration = declaration.first().first();
            var declaratorIndex = methodDeclaration.first().first().n == "Modifiers" ? 2 : 1;
            var declarator = methodDeclaration.first().children[declaratorIndex];
            while (declarator.first().n == "MethodDeclarator") {
                declarator = declarator.first();
            }
            var methodName = declarator.first().text;
            if(methodName == "setup") setupMethod = declaration;
        }
    }

    if (setupMethod == null) {
        var header = createAst("MethodHeader", [
            createToken('void'),
            createAst("MethodDeclarator", [
                createToken("Indentifier", "setup"), createToken('('), createToken(')')
            ])]);
        var body = createAst(["MethodBody", "Block"], [createToken('{'), createAst("BlockStatements", []), createToken('}')]);
        setupMethod = createAst(["GlobalMemberDeclaration",
        "ClassMemberDeclaration", "MethodDeclaration"],
        [header, body]);
        declarations.push(createAst("GlobalDeclaration", [setupMethod]));
    }

    var bodyStatements = setupMethod.first().first().children[1].first().children[1];
    bodyStatements.children = concatArrays(globalStatements, bodyStatements.children);
    
    return globalStatements;
}

function removeAt(array, index) {    
    var i = index;
    while (i < array.length - 1) {
        array[i] = array[i + 1];
        i++;
    }
    if (i < array.length) array.pop();
}

var autoId = 0;

function splitExpressions(ast, parent) {
    var inserts = undefined;
    switch (ast.n)
    {
    case "Expression":
        switch(parent.n) { // TODO while, do, for expressions
        case "WhileStatement":
        case "WhileStatementNoShortIf":
        case "DoStatement":
        case "ForStatement":
        case "ForStatementNoShortIf":        
            return undefined;
        }
        break;
    case "BlockStatements":
        for (var i = 0; i < ast.children.length; ++i) {
            if (ast.children[i].match(["BlockStatement", "Statement",
                "StatementWithoutTrailingSubstatement",
                "ExpressionStatement", "StatementExpression", "MethodInvocation"])) {
                
                var mi = ast.children[i].first().first().first().first().first();
                inserts = splitExpressions(mi);
                
                var newId = "$auto" + (autoId++);
                ast.children[i] = createTempResultVariable(newId, mi);
            }
            else {
                inserts = splitExpressions(ast.children[i], ast);
            }
            if (inserts != undefined) {
                var inserted = inserts.length;
                ast.children = insertInArray(ast.children, i, inserts);
                i += inserted;
            }
        }
        return undefined;
    case "FieldDeclaration": // TODO in class field
    case "Catches": // TODO in catches
        return undefined; 
}
    
    if (ast.constructor == AstNode) {
        scan1:
        for (var i = 0; i < ast.children.length; ++i) {
            var inserts0 = splitExpressions(ast.children[i], ast);
            if (inserts0 != undefined) {
                if (inserts == undefined)
                    inserts = inserts0;
                else
                    inserts = concatArrays(inserts, inserts0);
            }

            switch (ast.n) { // TODO other parts of logic expression
            case "ConditionalExpression":
            case "ConditionalOrExpression":
            case "ConditionalAndExpression":
                break scan1;    
            }
        }

        for (var i = 0; i < ast.children.length; ++i) {
            if (ast.match(["PostfixExpression", "Primary", "PrimaryNoNewArray", "MethodInvocation"])) {
                var mi = ast.first().first().first();
                
                if (mi.first().n == "ConversionName") continue; // conversions always return sych value
                
                var newId = "$auto" + (autoId++);

                ast.children[0] = createAst(["Name", "SimpleName"],
                    [createToken("Identifier", newId)]);

                var newStatement = createTempResultVariable(newId, mi);

                if (inserts == undefined) inserts = [];
                inserts.push(newStatement);
            }
        }
        return inserts;
    }

    function createTempResultVariable(newId, mi, isNew) {
        var rightSide = createAst(["Expression", "AssignmentExpression", "ConditionalExpression",
                    "ConditionalOrExpression", "ConditionalAndExpression",
                    "InclusiveOrExpression", "ExclusiveOrExpression",
                    "AndExpression", "EqualityExpression", "RelationalExpression",
                    "ShiftExpression", "AdditiveExpression", "MultiplicativeExpression",
                    "UnaryExpression", "PostfixExpression", "Primary", "PrimaryNoNewArray"], [mi]);
        var declarator = createAst("VariableDeclarator", [
                    createAst("VariableDeclaratorId", [createToken("Identifier", newId)]),
                    createToken("="),
                    createAst("VariableInitializer", [rightSide])
                ]);
        var declarators = createAst("VariableDeclarators", [declarator]);
        declarators.delimiter = ", ";
        var type = createAst(["Type", "ReferenceType", "ClassOrInterfaceType",
                "Name", "SimpleName"], [createToken("Identifier", "Object")]);
        var newStatement = createAst(["BlockStatement", "LocalVariableDeclarationStatement"],
                [createAst("LocalVariableDeclaration", [type, declarators]), createToken(';')]);
        newStatement.generated = { type: "var", name: newId, isNew: (isNew == true) };
        return newStatement;
    }
}

function defineContextSymbols(ast, last) {
    var current = last;
    switch (ast.n) {
        case "AssignmentExpression":
            return last;
        case "MethodBody":
        case "ConstructorBody":
            current = null;
            break;
        case "BlockStatement":
            if (ast.generated != undefined) {
                ast.generated.context = last;
            }
            break;
        case "VariableDeclarator":
            var name = getVariableDeclaratorName(ast);
            return { name: name, next: last };
    }
    if (ast.constructor == AstNode) {            
        for (var i = 0; i < ast.children.length; ++i) {
            current = defineContextSymbols(ast.children[i], current);
        }
    }
    if (ast.n == "BlockStatements")
        return last;
    else
        return current;
}

function insertInArray(array, index, items) {
    var results = [];
    var i = 0;
    while(i < index)
        results.push(array[i++]);
    for (var j = 0; j < items.length;  ++j)
        results.push(items[j]);
    while (i < array.length)
        results.push(array[i++]);
    return results;
}

function concatArrays() {
    var result = [];
    for (var i = 0; i < arguments.length; i++) {
        var item = arguments[i];
        for (var j = 0; j < item.length; ++j)
            result.push(item[j]);
    }
    return result;
}

function createAst(name, children) {
    if (typeof name == "string")
        return new AstNode(name, undefined, undefined, undefined, children, undefined);
    else {
        var p = children;
        while (name.length > 1) {
            p = [createAst(name.pop(), p)];
        }
        return new createAst(name.pop(), p);
    }
}
function createToken(token, text) {
    return new Token(token, undefined, undefined, undefined, text == undefined ? token : text);
}
