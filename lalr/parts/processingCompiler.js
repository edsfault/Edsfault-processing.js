/* 
   Processing Compiler: Processing -> JavaScript

   License       : MIT
   Developer     : notmasteryet 
*/

function compileProcessing(ast) {
    preprocessProcessing(ast);

    var context = new Object();
    var s = "";  // "/*\n" + out(ast, "") + " */\n";
    if (ast.n == "CompilationUnit") {
        s += outGlobalDeclarations(ast.children[0].children, context);
    }
    return s;
}

function outGlobalDeclarations(declarations, context) {
    context.globals = declarations;
    
    var s = "";
    // output global variables
    for (var i = 0; i < declarations.length; ++i) {
        var declaration = declarations[i].children[0];
        if(declaration.n == "GlobalMemberDeclaration" && 
        declaration.children[0].n == "ClassMemberDeclaration" &&
        declaration.children[0].children[0].n == "FieldDeclaration") {
            var fieldDeclaration = declaration.children[0].children[0];
            var variableDeclarators = fieldDeclaration.children[fieldDeclaration.children.length - 2];
            var names = new Array();
            for (var j = 0; j < variableDeclarators.children.length; ++j) {
                names.push(getVariableDeclaratorName(variableDeclarators.children[j]));                
            }
            s += "var " + names.join(", ") + ";\n";
        }
    }

    // output global functions
    for (var i = 0; i < declarations.length; ++i) {
        var declaration = declarations[i].children[0];
        if (declaration.n == "GlobalMemberDeclaration" &&
        declaration.children[0].n == "ClassMemberDeclaration" &&
        declaration.children[0].children[0].n == "MethodDeclaration") {
            var methodDeclaration = declaration.children[0].children[0];
            s += outGlobalMethod(methodDeclaration, context);
        }
    }

    if (!context.isGlobalsInitialized) {
        s += "Processing.setup = function setup() {"
        s += outGlobalInit(context);
        s += "};\n";
    }

    // output classes
     for (var i = 0; i < declarations.length; ++i) {
        var declaration = declarations[i].children[0];
        if (declaration.n == "ClassDeclaration") {
            s += outClass(declaration, context);
        }
    }
                   
    return s;
}

function outClass(classDeclaraton, context) {
    var i = classDeclaraton.children[0].n == "Modifiers" ? 2 : 1;
    var className = classDeclaraton.children[i].text;
    context.className = className;
    context.superName = undefined;
    if (classDeclaraton.children[i + 1].n == "Super") {
        context.superName = getReferenceTypeName(classDeclaraton.children[i + 1].children[1].children[0], context);
    }

    var classBody = classDeclaraton.children[classDeclaraton.children.length - 1];
    var s = "function " + className + "() {with(this){\n";
    // declare fields
    if (context.superName != undefined) {
        s += "  var __self=this;function superMethod(){extendClass(__self,arguments," + context.superName + ");}\n";
        s += "  extendClass(this, " + context.superName + ");"
    }
    
    for (var j = 0; j < classBody.children[1].children.length; ++j) {
        var member = classBody.children[1].children[j].children[0];
        if (member.n == "ClassMemberDeclaration") {
            if (member.children[0].n == "FieldDeclaration") {
                var fieldDeclaration = member.children[0];
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
                s += outClassMethod(member.children[0], context);
            }            
        }
    }

    for (var j = 0; j < classBody.children[1].children.length; ++j) {
        var member = classBody.children[1].children[j].children[0];
        if (member.n == "ConstructorDeclaration") {
            s += outConstructor(member, context);
        }
    }
    
    
    s += "}}";
    return s;
}

function outGlobalMethod(method, context) {
  var declaratorIndex = method.children[0].children[0].n == "Modifiers" ? 2 : 1;
  var declarator = method.children[0].children[declaratorIndex];
  while (declarator.children[0].n == "MethodDeclarator") {
      declarator = declarator.children[0];
  }
  var methodName = declarator.children[0].text;
  var methodParameters = declarator.children.length > 3 ?
    declarator.children[2].children : [];

  var parameters = new Array();
  for (var i = 0; i < methodParameters.length; ++i) {
      parameters.push(getVariableDeclaratorName(methodParameters[i].children[1]));
  }
  var s = "Processing." + methodName + " = function " + methodName + "(" +
    parameters.join(", ") + ") {"
  if (methodName == "setup") {      
      s += outGlobalInit(context);
  }
  s += outBlockContent(method.children[1].children[0], context);
  s += "};\n";
  return s;
}

function outConstructor(constructor, context) {
    var declaratorIndex = constructor.children[0].n == "Modifiers" ? 1 : 0;
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
        var name = body.children[1].children[0].text == "this" ? context.className : "superMethod";
        var args = new Array();
        if (body.children[1].children[2].n == "ArgumentList") {

            for (var i = 0; i < body.children[1].children[2].children.length; ++i) {
                args.push(outAnyExpression(body.children[1].children[2].children[i], context));
            }
            s += name + "(" + args.join(", ") + ");\n";
        }
    }

    if (body.children[body.children.length - 2].n == "BlockStatements") {
        var statements = body.children[body.children.length - 2].children;
        for (var i = 0; i < statements.length; ++i) {
            s += outBlockStatement(statements[i], context) + "\n";
        }
    }
    s += "}\n";
    return s;
}

function outClassMethod(method, context) {
    var declaratorIndex = method.children[0].children[0].n == "Modifiers" ? 2 : 1;
    var declarator = method.children[0].children[declaratorIndex];
    while (declarator.children[0].n == "MethodDeclarator") {
        declarator = declarator.children[0];
    }
    var methodName = declarator.children[0].text;
    var methodParameters = declarator.children.length > 3 ?
    declarator.children[2].children : [];

    var parameters = new Array();
    for (var i = 0; i < methodParameters.length; ++i) {
        parameters.push(getVariableDeclaratorName(methodParameters[i].children[1]));
    }
    var s = "addMethod(this, \"" + methodName + "\", function " + methodName + "(" +
    parameters.join(", ") + ") {"
    s += outBlockContent(method.children[1].children[0], context);
    s += "});\n";
    return s;
}

function outGlobalInit(context) {
    context.isGlobalsInitialized = true;
    
    var s = "\n";
    var declarations = context.globals;
    for (var i = 0; i < declarations.length; ++i) {
        var declaration = declarations[i].children[0];
        if (declaration.n == "GlobalMemberDeclaration" &&
        declaration.children[0].n == "ClassMemberDeclaration" &&
        declaration.children[0].children[0].n == "FieldDeclaration") {
            var fieldDeclaration = declaration.children[0].children[0];
            var fieldType = fieldDeclaration.children[fieldDeclaration.children.length - 3];
            var variableDeclarators = fieldDeclaration.children[fieldDeclaration.children.length - 2];
            for (var j = 0; j < variableDeclarators.children.length; ++j) {
                var name = getVariableDeclaratorName(variableDeclarators.children[j].children[0]);
                if (variableDeclarators.children[j].children.length > 1) {
                    s += name + " = " + outVariableInitializer(variableDeclarators.children[j].children[2], context) + ";\n";
                } else {
                    s += name + " = " + outDefaultValue(fieldType, context) + ";\n";
                }
            }
        } else if (declaration.n == "GlobalStatement") {
            s += outStatement(declaration.children[0], context) + "\n";
        }
    }

    return s;
}

function outBlockContent(block, context) {
    var content = new Array();
    if (block.children.length > 2) {        
        for(var i=0;i<block.children[1].children.length;++i) {
            content.push(
                outBlockStatement(block.children[1].children[i], context));
        }
    }
    if(content.length > 0)
        return "\n" + content.join("\n") + "\n";
    else
        return "";
}

function outBlockStatement(statement, context) {
    if (statement.children[0].n == "Statement") {
        return outStatement(statement.children[0], context);
    } else {
        var localVariableDeclaration = statement.children[0].children[0];
        return outLocalVariableDeclaration(localVariableDeclaration, context) + ";";
    }
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
    if (type.children[0].n == "ReferenceType") {
        return "null";
    } else if (type.children[0].children[0].n == "NumericType") {
        return "0";
    } else {
        return "false";
    }    
}

function outVariableInitializer(initializer, context) {
    if (initializer.children[0].n == "Expression") {
        return outAnyExpression(initializer.children[0], context);
    } else {
        var items = new Array();
        if (initializer.children[0].children[1].n == "VariableInitializers") {
            for (var i = 0; i < initializer.children[0].children[1].children.length; ++i) {
                items.push(outVariableInitializer(initializer.children[0].children[1].children[i], context));
            }
        }
        return "[" + items.join(", ") + "]";
    }
}

function outStatement(statement, context) {
    if(statement.children[0].n == "StatementWithoutTrailingSubstatement") {
        return outStatementWithoutTrailingSubstatement(statement.children[0]);
    } else {
        switch (statement.children[0].n) {
            case "IfThenStatement":
            case "IfThenElseStatement":
            case "IfThenElseStatementNoShortIf":
                return outIfStatement(statement.children[0], context);
            case "WhileStatement":
            case "WhileStatementNoShortIf":
                return outWhileStatement(statement.children[0], context);
            case "ForStatement":
            case "ForStatementNoShortIf":
                return outForStatement(statement.children[0], context);
        }
    }
}

function outIfStatement(statement, context) {
    var s = "if (" + outAnyExpression(statement.children[2], context) + ") ";
    s += outStatement(statement.children[4], context);
    if (statement.children.length > 5) {
        s += " else " + outStatement(statement.children[6], context);
    }
    return s;
}

function outWhileStatement(statement, context) {
    return "while (" + outAnyExpression(statement.children[2], context) + ") " +
        outStatement(statement.children[4], context);
}

function outForStatement(statement, context) {
    var s = "for (";
    for (var i = 0; i < statement.children.length; ++i) {
        switch (statement.children[i].n) {
            case ";": s += "; "; break;
            case "ForInit":
            case "ForUpdate":
                if (statement.children[i].children[0].n == "LocalVariableDeclaration") {
                    s += outLocalVariableDeclaration(statement.children[i].children[0], context);
                } else {
                    var list = statement.children[i].children[0];
                    for (var j = 0; j < list.children.length; ++j) {
                        s += outAnyExpression(list.children[j], context);
                    }
                }
                break;
            case "Expression":
                s += outAnyExpression(statement.children[i], context);
                break;
        }
    }
    s += ") ";
    s += outStatement(statement.children[statement.children.length - 1], context);
    return s;
}

function outStatementWithoutTrailingSubstatement(statement, context) {
    var simpleStatement = statement.children[0];
    switch (simpleStatement.n) {
        case "Block": return "{" + outBlockContent(simpleStatement, context) + "}";
        case "EmptyStatement": return ";";
        case "ExpressionStatement": return outAnyExpression(simpleStatement.children[0], context) + ";";
        case "BreakStatement": return "break;";
        case "ContinueStatement": return "continue";
        case "ReturnStatement": return outReturnStatement(simpleStatement, context);
        case "TryStatement": return outTryStatement(simpleStatement, context);
        case "SwitchStatement": return outSwitchStatement(simpleStatement, context);
        case "DoStatement": return outDoStatement(simpleStatement, context);
    }
}

function outDoStatement(statement, context) {
    return "do " + outStatement(statement.children[1],context) + " while (" + outAnyExpression(statement.children[4], context) + ");";
}

function outSwitchStatement(statement, context) {
    var s = "switch (" + outAnyExpression(statement.children[2], context) + ") {\n";
    var block = statement.children[4];
    if (block.children[1].n == "SwitchBlockStatementGroups") {
        for (var i = 0; i < block.children[1].children.length; ++i) {
            var group = block.children[1].children[i];
            for (var j = 0; j < group.children[0].children.length; ++j) {
                s += outSwitchLabel(group.children[0].children[j], context) + "\n";
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
    if (label.children[0].n == "case")
        return "case " + outAnyExpression(label.children[1]) + ":";
    else
        return "default:";
}

function outTryStatement(tryStatement, context) {
    var catches = new Array();
    for (var i = 0; i < tryStatement.children[2].children.length; ++i) {
        var catchStatement = tryStatement.children[2].children[i];
        var parameterName = catchStatement.children[2].children[1].children[0].text;
        catches.push(
            "catch (" + parameterName + ") {" + outBlockContent(catchStatement.children[4], context) + "}");
    }
    return "try {" + outBlockContent(tryStatement.children[1], context) + "} " + catches.join(" ");
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
            return outAnyExpression(expression.children[0], context);
        case "Assignment":
            return outAnyExpression(expression.children[0], context) +
                " " + expression.children[1].children[0].text + " " +
                outAnyExpression(expression.children[2]);
        case "ConditionalExpression":
            if (expression.children.length > 1) {
                return outAnyExpression(expression.children[0], context) + " ? " +
                outAnyExpression(expression.children[2], context) + " : " +
                outAnyExpression(expression.children[4], context);
            } else {
                return outAnyExpression(expression.children[0], context);
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
                return outAnyExpression(expression.children[0], context) +
                    " " + expression.children[1].text + " " +
                    outAnyExpression(expression.children[2], context);
            } else {
                return outAnyExpression(expression.children[0], context);
            }
        case "RelationalExpression":
            if (expression.children.length > 1) {
                if (expression.children[1].text == "instanceof") {
                    return outAnyExpression(expression.children[0], context) +
                    ".contructor == " +
                    getReferenceTypeName(expression.children[2], context);
                }
                else {
                    return outAnyExpression(expression.children[0], context) +
                    " " + expression.children[1].text + " " +
                    outAnyExpression(expression.children[2], context);
                }
            } else {
                return outAnyExpression(expression.children[0], context);
            }
        case "UnaryExpression":
        case "UnaryExpressionNotPlusMinus":
            if (expression.children.length == 1) {
                return outAnyExpression(expression.children[0], context);
            } else {
                return expression.children[0].text + 
                    outAnyExpression(expression.children[1], context);
            }
        case "CastExpression":
            return outCastExpression(expression, context);            
        case "PreIncrementExpression":
        case "PreDecrementExpression":
            return expression.children[0].text +
                    outAnyExpression(expression.children[1], context);
        case "PostIncrementExpression":
        case "PostDecrementExpression":
            return outAnyExpression(expression.children[0], context) +
                expression.children[1].text;
        case "MethodInvocation":
            return outMethodInvocation(expression, context);
        case "ClassInstanceCreationExpression":
            return outClassInstanceCreationExpression(expression, context);
        case "Name":
            return getFullName(expression, context);
        case "PrimaryNoNewArray":
            if (expression.children[0].n == "Literal") {
                return getLiteral(expression.children[0]);
            } else if (expression.children[0].n == "this") {
                return "this";
            } else if (expression.children[0].n == "(") {
                return "(" + outAnyExpression(expression.children[1], context) + ")";
            } else {
                return outAnyExpression(expression.children[0], context);
            }
        case "ArrayCreationExpression":
            return outArrayCreationExpression(expression, context);
        case "FieldAccess":
            if (expression.children[0].n == "Primary") {
                return outAnyExpression(expression.children[0], context) + "." + expression.children[2].text;
            }
        case "ArrayAccess":
            return outAnyExpression(expression.children[0], context) + "[" +
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
    if (literal.children[0].n == "ColorLiteral") {
        return "DefaultColor(0x" + value.substr(1, 2) + ", 0x" + value.substr(3, 2) + ", 0x" + value.substr(5, 2) + ")";
    } else if (literal.children[0].n == "FloatPointLiteral") {
        return value.replace(/[fFdD]$/, "");
    } else if (literal.children[0].n == "IntegerLiteral") {
        return value.replace(/[lL]$/, "");
    } else if (literal.children[0].n == "CharLiteral") {
        return eval(value).charCodeAt(0) + " /* " + value + " */ ";
    }
    return value;    
}

function getIdentifierFromName(expression, context) {
    if (expression.children[0].n == "SimpleName")
        return expression.children[0].children[0].text;
    else
        return expression.children[0].children[2].text;
}

function getFullName(expression, context) {
    if (expression.children[0].n == "SimpleName")
        return expression.children[0].children[0].text;
    else
        return getFullName(expression.children[0].children[0], context) +
            "." + expression.children[0].children[2].text;
}

function outClassInstanceCreationExpression(expression, context) {
    if (expression.children[0].n == "ColorInstanceCreation")
        return outMethodInvocation(expression.children[0], context);     

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
    var methodName;
    if (expression.children[0].n == "Name") {
        methodName = getFullName(expression.children[0], context);
    } else if (expression.children[0].n == "Primary") {
        methodName = outAnyExpression(expression.children[0], context) + "."
            + expression.children[2].text;
    } else {
        methodName = expression.children[i].toString();
    }

    if (methodName.match(/\.length$/) && arguments.length == 0) {
        return methodName;
    }

    return methodName + "(" + arguments.join(", ") + ")";
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
    if (type.children[0].n == "ClassOrInterfaceType") {
        return getIdentifierFromName(type.children[0].children[0], context);
    } else if (type.children[0].n == "Name") {
        return getIdentifierFromName(type.children[0], context);
    } else if (type.children[0].n == "ArrayType") {
        return getReferenceTypeName(type.children[0], context);
    } else {
        return type.children[0].toString(); 
    }
}


function getVariableDeclaratorName(v) {
    while(v.n != "VariableDeclaratorId") {
        v = v.children[0];
    }
    while (v.children[0].n == "VariableDeclaratorId") {
        v = v.children[0];
    }
    return v.children[0].text;
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
    }

    if (ast.constructor == AstNode) {
        for (var i = 0; i < ast.children.length; ++i) {
            preprocessProcessing(ast.children[i]);
        }
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