/* 
   JavaScript LALR(1) parser 

   License       : MIT
   Developer     : notmasteryet 
*/

function parseLalr(grammar, source) {
    var scanner = new DfaScanner(source, grammar);
    var input = new Array();
    var states = new Array();
    var state = grammar.lalrTableInitialState;
    var token;
    do {
        token = scanner.readTokenNonWS();
        var currentTokenIndex = token.i;
        var repeat;
        do {
            repeat = false;
            var currentState = grammar.lalrTable[state];
            var action = null;
            for (var i = 0; i < currentState.length; ++i) {
                if (currentState[i].s == currentTokenIndex) {
                    action = currentState[i]; break;
                }
            }
            if (action == null) {
                throw ("Unexpected symbol: " + token.text);
            }

            switch (action.k) {
                case 3: // goto
                    state = action.v;
                    repeat = true;
                    currentTokenIndex = token.i;
                    break;
                case 1: // shift
                    input.push(token);
                    states.push(state);
                    state = action.v;
                    break;
                case 2: // reduce
                    var rule = grammar.rules[action.v];
                    var count = rule.c;
                    var children = new Array();
                    var state0 = 0;
                    for (var i = count - 1; i >= 0; --i) {
                        var t = input.pop();
                        children.unshift(t);
                        state0 = states.pop();
                    }
                    var newSymbol = new AstNode(grammar.symbols[rule.n], 
                        rule.n, children[0].b, children[children.length - 1].e, children, action.v);                    
                    states.push(state0);
                    input.push(newSymbol);
                    state = state0;
                    currentTokenIndex = rule.n;
                    repeat = true;
                    break;
            }                        

        } while (repeat);

    } while (token.i > 0);
    return input.pop();
}

function Token(symbol_, index_, begin_, end_, text_) {
    this.n = symbol_;
    this.i = index_;
    this.b = begin_;
    this.e = end_;
    this.text = text_;
}

function AstNode(symbol_, index_, begin_, end_, children_, rule_) {
    this.n = symbol_;
    this.i = index_;
    this.b = begin_;
    this.e = end_;
    this.children = children_;
    this.r = rule_;
}

Token.prototype.match = function(s) { return this.n == s; };
Token.prototype.toString = function() { return this.text; };
AstNode.prototype.first = function() { return this.children[0]; };
AstNode.prototype.match = function(s) {
    if (typeof s == "string") {
        return this.n == s;
    } else {
        if (this.n == s[0]) {
            s.shift();
            return s.length > 1 ? 
                this.first().match(s) : this.first().match(s[0]);
        }
        else
            return false;
    }
};
AstNode.prototype.toString = function() {
    var s = "";
    for (var i = 0; i < this.children.length; ++i) {
        if (i > 0) { s += this.delimiter == undefined ? " " : this.delimiter; }
        s += this.children[i].toString();
    }
    return s;
};
    
function DfaScanner(source, grammar) {
    this._source = source;
    this._grammar = grammar;
    this._position = 0;
    this._row = 1;
    this._column = 1;

    this.readTokenNonWS = function() {
        var token;
        do {
            token = this.readToken();
        } while (token.n == "Whitespace" || token.n == "Comment Start" || token.n == "Comment Line");
        return token;
    };

    this.readToken = function() {
        var ch = this._nextChar();
        var start = { r: this._row, c: this._column };

        if (ch < 0) {
            return new Token(this._grammar.symbols[0], 0, start, start, "");
        }

        var text = "";
        var state = this._grammar.dfaTableInitialState;
        var edge;

        do {
            edge = null;
            if (ch >= 0) {
                var dfaState = this._grammar.dfaTable[state];
                var ch1 = ch >= 127 && ch != 160 ? '`'.charCodeAt(0) : ch; // HACK change unicode chars to tick
                for (var i = 0; i < dfaState.e.length; ++i) {
                    var charSet = this._grammar.charSets[dfaState.e[i].cs];
                    var found = false;
                    for (var j = 0; j < charSet.length; ++j) {
                        if (charSet[j] == ch1) {
                            found = true; break;
                        }
                    }
                    if (found) {
                        edge = dfaState.e[i]; break;
                    }
                }
            }

            if (edge != null) {
                state = edge.t;
                text += String.fromCharCode(ch);
                this._changePosition(ch);

                ch = this._nextChar();
            }
        } while (edge != null);

        var acceptedSymbolIndex = this._grammar.dfaTable[state].a;
        var acceptedSymbol = this._grammar.symbols[acceptedSymbolIndex];
        // collect comment symbols
        if (acceptedSymbol == "Comment Start") {
            ch = this._nextChar();
            text += String.fromCharCode(ch);
            this._changePosition(ch);
            do {
                while (ch != '*'.charCodeAt(0)) {
                    ch = this._nextChar();
                    text += String.fromCharCode(ch);
                    this._changePosition(ch);
                }
                ch = this._nextChar();
                text += String.fromCharCode(ch);
                this._changePosition(ch);
            } while (ch != '/'.charCodeAt(0));
        }
        else if (acceptedSymbol == "Comment Line") {
            ch = this._nextChar();
            text += String.fromCharCode(ch);
            this._changePosition(ch);
            while (ch >= 0 && ch != 10) {
                ch = this._nextChar();
                text += String.fromCharCode(ch);
                this._changePosition(ch);
            }
        }

        var end = { r: this._row, c: this._column };
        return new Token(acceptedSymbol, acceptedSymbolIndex, start, end, text);
    };

    this._nextChar = function() {
        return this._position < this._source.length ?
          this._source.charCodeAt(this._position) : -1;
    };

    this._changePosition = function(ch) {
        if (ch == 10) {
            ++this._row;
            this._column = 1;
        } else if (ch == 13) {
            this._column = 1;
        }
        ++this._position;
    }
}

