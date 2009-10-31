/*

  P R O C E S S I N G . J S
  a port of the Processing visualization language
  
  License       : MIT 
  Developer     : John Resig - eJohn.org
  Web Site      : http://processingjs.org  
  Java Version  : http://processing.org
  Github Repo.  : http://github.com/jeresig/processing-js
  Mozilla POW!  : http://wiki.Mozilla.org/Education/Projects/ProcessingForTheWeb
  Maintained by : F1LT3R & the students of Open Seneca...
                  http://zenit.senecac.on.ca/wiki/index.php/Processing.js

*/


(function(){
  

  // Attach Processing to the window 
  this.Processing = function Processing( aElement, aCode ){

    // Get the DOM element if string was passed
    if( typeof aElement == "string" ){
      aElement = document.getElementById( aElement );
    }
      
    // Build an Processing functions and env. vars into 'p'  
    var p = buildProcessing( aElement );  

    // Send aCode Processing syntax to be converted to JavaScript
    if( aCode ){ p.init( aCode ); }
    
    return p;
    
  };
   
  // IE Unfriendly AJAX Method
  var ajax=function( url ){
    var AJAX;
    if( AJAX = new XMLHttpRequest() ){
      AJAX.open( "GET", url, false );
      AJAX.send( null );
      return AJAX.responseText;
    }else{
      return false;
    }
  }
 
  // Parse Processing (Java-like) syntax to JavaScript syntax with Regex
  var parse = Processing.parse = function parse( aCode, p ){
  return compileProcessing(parseLalr(processingGrammar, aCode));
  };


  // Attach Processing functions to 'p' 
  function buildProcessing( curElement ){
              
    // Create the 'p' object
    var p = {};
    
    // Set Processing defaults / environment variables
    p.name            = 'Processing.js Instance';
    p.PI              = Math.PI;
    p.TWO_PI          = 2 * p.PI;
    p.HALF_PI         = p.PI / 2;
    p.P3D             = 3;
    p.CORNER          = 0;
    p.RADIUS          = 1;
    p.CENTER_RADIUS   = 1;
    p.CENTER          = 2;
    p.POLYGON         = 2;
    p.QUADS           = 5;
    p.TRIANGLES       = 6;
    p.POINTS          = 7;
    p.LINES           = 8;
    p.TRIANGLE_STRIP  = 9;
    p.TRIANGLE_FAN    = 4;
    p.QUAD_STRIP      = 3;
    p.CORNERS         = 10;
    p.CLOSE           = true;
    p.RGB             = 1;
    p.HSB             = 2;  

    // KeyCode table  
    p.CENTER  = 88888880;
    p.CODED   = 88888888;
    p.UP      = 88888870;
    p.RIGHT   = 88888871;
    p.DOWN    = 88888872;
    p.LEFT    = 88888869;
    
//! // Description required...
    p.codedKeys = [ 69, 70, 71, 72  ];

    // "Private" variables used to maintain state
    var curContext      = curElement.getContext( "2d" ),
        doFill          = true,
        doStroke        = true,
        loopStarted     = false,
        hasBackground   = false,
        doLoop          = true,
        looping         = 0,
        curRectMode     = p.CORNER,
        curEllipseMode  = p.CENTER,
        inSetup         = false,
        inDraw          = false,
        curBackground   = "rgba( 204, 204, 204, 1 )",
        curFrameRate    = 1000,
        curMsPerFrame   = 1,
        curShape        = p.POLYGON,
        curShapeCount   = 0,
        curvePoints     = [],
        curTightness    = 0,
        opacityRange    = 255,
        redRange        = 255,
        greenRange      = 255,
        blueRange       = 255,
        pathOpen        = false,
        mousePressed    = false,
        keyPressed      = false,
        curColorMode    = p.RGB;
        curTint         = - 1,
        curTextSize     = 12,
        curTextFont     = "Arial",
        getLoaded       = false,
        start           = ( new Date ).getTime();

    var firstX,
        firstY,
        secondX,
        secondY,
        prevX,
        prevY;
    
    // Store a line for println(), print() handline
    p.ln = "";
    
    // Glyph path storage for textFonts
    p.glyphTable = {};
    
    // Global vars for tracking mouse position
    p.pmouseX     = 0;
    p.pmouseY     = 0;
    p.mouseX      = 0;
    p.mouseY      = 0;
    p.mouseButton = 0;
    p.mouseDown   = false;

    // Undefined event handlers to be replaced by user when needed
    p.mouseClicked = undefined;
    p.mouseDragged = undefined;
    p.mouseMoved = undefined;
    p.mousePressed = undefined;
    p.mouseReleased = undefined;
    p.keyPressed = undefined;
    p.keyReleased = undefined;
    p.draw = undefined;
    p.setup = undefined;

    // The height/width of the canvas
    p.width  = curElement.width  - 0;
    p.height = curElement.height - 0;

    // The current animation frame
    p.frameCount = 0;            
    
    

    ////////////////////////////////////////////////////////////////////////////
    // Array handling
    ////////////////////////////////////////////////////////////////////////////

    p.ArrayList = function ArrayList( size, size2, size3 ){
    
      var array = new Array( 0 | size );
      
      if( size2 ){
        
        for( var i = 0; i < size; i++ ){
          
          array[ i ] = [];

          for( var j = 0; j < size2; j++ ){
            var a = array[ i ][ j ] = size3 ? new Array( size3 ) : 0 ;  
            for( var k = 0; k < size3; k++ ){ a[ k ] = 0; }
          }
          
        }
        
      }else{
        
        for( var i = 0; i < size; i++ ){ array[ i ] = 0; }        
      }
      
      array.get     = function( i    ){ return this[ i ];           };
      array.add     = function( item ){ return this.push( item );   };
      array.size    = function(      ){ return this.length;         };      
      array.clear   = function(      ){ this.length = 0;            };
      array.remove  = function( i    ){ return this.splice( i, 1 ); };
      array.isEmpty = function(      ){ return !this.length;        };
      array.clone   = function(      ){
                                        var a = new ArrayList( size );
                                        for( var i = 0; i < size; i++ ){
                                          a[ i ] = this[ i ];
                                        }
                                        return a;
                                      };
      
      return array;
    };



    ////////////////////////////////////////////////////////////////////////////
    // Color functions
    ////////////////////////////////////////////////////////////////////////////

    p.color = function color( aValue1, aValue2, aValue3, aValue4 ){
      var aColor = "";
      
      if( arguments.length == 3 ){
      
        aColor = p.color( aValue1, aValue2, aValue3, opacityRange );
      
      } else if ( arguments.length == 4 ){
       
        var a = aValue4 / opacityRange;
        
        a = isNaN( a ) ? 1 : a ;

        if( curColorMode == p.HSB ){
          var rgb = HSBtoRGB( aValue1, aValue2, aValue3 )
              r   = rgb[ 0 ],
              g   = rgb[ 1 ],
              b   = rgb[ 2 ];
        }else{
          var r = getColor( aValue1, redRange );
          var g = getColor( aValue2, greenRange );
          var b = getColor( aValue3, blueRange );
        }

        aColor = "rgba("+ r +","+ g +","+ b +","+ a +")";
      
      }else if( typeof aValue1 == "string" ){
        aColor = aValue1;

        if( arguments.length == 2 ){
          var c = aColor.split( "," );
          c[ 3 ] = ( aValue2 / opacityRange ) + ")";
          aColor = c.join( "," );
        }
      }else if( arguments.length == 2 ){
        aColor = p.color( aValue1, aValue1, aValue1, aValue2 );
      }else if( typeof aValue1 == "number" ){
        aColor = p.color( aValue1, aValue1, aValue1, opacityRange );
      }else{
        aColor = p.color( redRange, greenRange, blueRange, opacityRange );
      }

      // HSB conversion function from Mootools, MIT Licensed
      function HSBtoRGB( h, s, b ){

        h = ( h / redRange   ) * 360;
        s = ( s / greenRange ) * 100;
        b = ( b / blueRange  ) * 100;

        var br = Math.round( b / 100 * 255 );

        if( s == 0 ){

          return [ br, br, br ];

        }else{

          var hue = h % 360;
          var f   = hue % 60;
          var p   = Math.round( ( b * ( 100  - s ) ) / 10000 * 255 );
          var q   = Math.round( ( b * ( 6000 - s * f ) ) / 600000 * 255 );
          var t   = Math.round( ( b * ( 6000 - s * ( 60 - f ) ) ) / 600000 * 255 );

          switch ( Math.floor( hue / 60 ) ){
            case 0: return [ br, t, p ];
            case 1: return [ q, br, p ];
            case 2: return [ p, br, t ];
            case 3: return [ p, q, br ];
            case 4: return [ t, p, br ];
            case 5: return [ br, p, q ];
          }
          
        }
        
      }

      function getColor( aValue, range ){
        return Math.round( 255 * ( aValue / range ) );
      }
      
      return aColor;
    }
    
    p.red   = function( aColor ){ return parseInt( verifyChannel( aColor ).slice( 5 ) ); };
    p.green = function( aColor ){ return parseInt( verifyChannel( aColor ).split( "," )[ 1 ] ); };
    p.blue  = function( aColor ){ return parseInt( verifyChannel( aColor ).split( "," )[ 2 ] ); };
    p.alpha = function( aColor ){ return parseInt( parseFloat( verifyChannel( aColor ).split( "," )[ 3 ] ) * 255 ); };

    function verifyChannel( aColor ){ 
      if( aColor.constructor == Array ){    
        return aColor;
      } else {
        return p.color( aColor );
      } 
    }
    
    p.lerpColor = function lerpColor( c1, c2, amt ){
        
      // Get RGBA values for Color 1 to floats
      var colors1 = p.color( c1 ).split( "," );
      var r1 =   parseInt( colors1[ 0 ].split( "(" )[ 1 ] ); 
      var g1 =   parseInt( colors1[ 1 ] );
      var b1 =   parseInt( colors1[ 2 ] );
      var a1 = parseFloat( colors1[ 3 ].split( ")" )[ 0 ] );
          
      // Get RGBA values for Color 2 to floats
      var colors2 = p.color( c2 ).split( "," );
      var r2 =   parseInt( colors2[ 0 ].split( "(" )[ 1 ] ); 
      var g2 =   parseInt( colors2[ 1 ] );
      var b2 =   parseInt( colors2[ 2 ] );
      var a2 = parseFloat( colors2[ 3 ].split( ")" )[ 0 ] );            
                        
      // Return lerp value for each channel, INT for color, Float for Alpha-range
      var r =   parseInt( p.lerp( r1, r2, amt ) );
      var g =   parseInt( p.lerp( g1, g2, amt ) );
      var b =   parseInt( p.lerp( b1, b2, amt ) );
      var a = parseFloat( p.lerp( a1, a2, amt ) );
      
      return aColor = "rgba("+ r +","+ g +","+ b +","+ a +")";
   
    }

    // Forced default color mode for #aaaaaa style
    p.DefaultColor = function( aValue1, aValue2, aValue3 ){
      var tmpColorMode = curColorMode;
      curColorMode = p.RGB;
      var c = p.color(aValue1 / 255 * redRange, aValue2 / 255 * greenRange, aValue3 / 255 * blueRange );
      curColorMode = tmpColorMode;
      return c;
    }
    
    p.colorMode = function colorMode( mode, range1, range2, range3, range4 ){
      curColorMode = mode;
      if( arguments.length >= 4 ){ redRange     = range1; greenRange = range2; blueRange  = range3; }
      if( arguments.length == 5 ){ opacityRange = range4; }
      if( arguments.length == 2 ){ p.colorMode( mode, range1, range1, range1, range1 ); }    
    };
    

    ////////////////////////////////////////////////////////////////////////////
    // Canvas-Matrix manipulation
    ////////////////////////////////////////////////////////////////////////////

    p.translate   = function translate( x, y ){ curContext.translate( x, y );   };    
    p.scale       = function scale( x, y )    { curContext.scale( x, y || x );  };    
    p.rotate      = function rotate( aAngle ) { curContext.rotate( aAngle );    };    
    p.pushMatrix  = function pushMatrix()     { curContext.save();              };
    p.popMatrix   = function popMatrix()      { curContext.restore();           };
    p.ortho       = function ortho(){};


    
    ////////////////////////////////////////////////////////////////////////////
    //Time based functions
    ////////////////////////////////////////////////////////////////////////////

    p.year    = function year()  { return ( new Date ).getYear() + 1900;   };
    p.month   = function month() { return ( new Date ).getMonth();         };
    p.day     = function day()   { return ( new Date ).getDay();           };
    p.hour    = function hour()  { return ( new Date ).getHours();         };
    p.minute  = function minute(){ return ( new Date ).getMinutes();       };
    p.second  = function second(){ return ( new Date ).getSeconds();       };
    p.millis  = function millis(){ return ( new Date ) .getTime() - start; };
    
    p.noLoop  = function noLoop(){ doLoop = false; };
         
    p.redraw = function redraw(){
      if( hasBackground ){ p.background(); }
      p.frameCount++;      
      inDraw = true;
      p.pushMatrix();
      p.draw();
      p.popMatrix();
      inDraw = false;      
    };
    
    p.loop = function loop(){
      
      if( loopStarted ){ return; }
      
      looping = setInterval( function(){
         
          try {
                      p.redraw();
              }
          catch( e ){
                      clearInterval( looping );
                      throw e;
                    }
      }, curMsPerFrame );
      
      loopStarted = true;
      
    };
    
    p.frameRate = function frameRate( aRate ){
      curFrameRate = aRate;
      curMsPerFrame = 1000 / curFrameRate;
    };

    p.exit = function exit(){
      clearInterval( looping );
    };
    
    
    
    ////////////////////////////////////////////////////////////////////////////
    // MISC functions
    ////////////////////////////////////////////////////////////////////////////
    p.cursor = function(mode){ document.body.style.cursor=mode; }
    p.link = function( href, target ) { window.location = href; };
    p.beginDraw = function beginDraw(){};
    p.endDraw = function endDraw(){};
    
    p.ajax = ajax;
    
    // Imports an external Processing.js library
    p.Import = function Import( lib ){
      eval( p.ajax( lib ) );
    }

    

    ////////////////////////////////////////////////////////////////////////////
    // String functions
    ////////////////////////////////////////////////////////////////////////////

    // Load a file or URL into strings     
    p.loadStrings = function loadStrings( url ){
      return p.ajax( url ).split( "\n" );              
    };

    p.nf = function( num, pad ){
      var str = "" + num;
      while ( pad - str.length ){
        str = "0" + str;
      }
      return str;
    };

    String.prototype.replaceAll = function( re, replace ){
      return this.replace( new RegExp( re, "g" ), replace );
    };
        
    // Returns a line to lnPrinted() for user handling 
    p.lnPrinted = function lnPrinted(){};
    p.printed   = function printed()  {};  
    
    // Event to send output to user control function print()/println()
    p.println = function println(){
      
      // Not working on Safari :( find work around!
      if( arguments.callee.caller ){
      
        var Caller = arguments.callee.caller.name.toString();
        
        if( arguments.length > 1 ){

          Caller != "print"        ?
            p.ln  = arguments      :
            p.ln  = arguments[ 0 ] ;

        }else{

            p.ln  = arguments[ 0 ] ;
        }
        
        //Returns a line to lnPrinted() for user error handling/debugging
        Caller == "print"          ?        
          p.printed( arguments )   :
          p.lnPrinted()            ;
        
      }
      
    };    

    // Converts a number to a string
    p.str = function str( aNumber ){ return aNumber+''; }   
    
    p.print = function print(){ p.println(arguments[ 0 ] ) };
    
    p.char = function char( key ){ return key; };
    
    
    
    ////////////////////////////////////////////////////////////////////////////
    // Math functions
    ////////////////////////////////////////////////////////////////////////////
    
    p.sq      = function sq     ( aNumber             ){ return aNumber * aNumber;                       };
    p.sqrt    = function sqrt   ( aNumber             ){ return Math.sqrt( aNumber );                    };
    p.int     = function int    ( aNumber             ){ return Math.floor( aNumber );                   };
    p.min     = function min    ( aNumber, aNumber2   ){ return Math.min( aNumber, aNumber2 );           };
    p.max     = function max    ( aNumber, aNumber2   ){ return Math.max( aNumber, aNumber2 );           };
    p.floor   = function floor  ( aNumber             ){ return Math.floor( aNumber );                   };
    p.float   = function float  ( aNumber             ){ return parseFloat( aNumber );                   };
    p.ceil    = function ceil   ( aNumber             ){ return Math.ceil( aNumber );                    };    
    p.round   = function round  ( aNumber             ){ return Math.round( aNumber );                   };
    p.lerp    = function lerp   ( value1, value2, amt ){ return ( ( value2 - value1 ) * amt ) + value1;  };
    p.abs    = function abs     ( aNumber             ){ return Math.abs( aNumber );                     };
    p.cos     = function cos    ( aNumber             ){ return Math.cos( aNumber );                     };
    p.sin     = function sin    ( aNumber             ){ return Math.sin( aNumber );                     };
    p.pow     = function pow    ( aNumber, aExponent  ){ return Math.pow( aNumber, aExponent );          };
    p.sqrt    = function sqrt   ( aNumber             ){ return Math.sqrt( aNumber );                    };
    p.atan2   = function atan2  ( aNumber, aNumber2   ){ return Math.atan2( aNumber, aNumber2 );         };
    p.radians = function radians( aAngle              ){ return ( aAngle / 180 ) * p.PI;                 };

    p.dist = function dist( x1, y1, x2, y2 ){
      return Math.sqrt( Math.pow( x2 - x1, 2 ) + Math.pow( y2 - y1, 2 ) );
    };

    p.map = function map( value, istart, istop, ostart, ostop ){
      return ostart + ( ostop - ostart ) * ( ( value - istart ) / ( istop - istart ) );
    };

    p.Random = function(){

      var haveNextNextGaussian = false,
          nextNextGaussian;

      this.nextGaussian = function(){
        
        if( haveNextNextGaussian ){
        
          haveNextNextGaussian = false;
          return nextNextGaussian;
        
        }else{
          
          var v1, v2, s;
          do{ 
              v1 = 2 * p.random( 1 ) - 1;   // between -1.0 and 1.0
              v2 = 2 * p.random( 1 ) - 1;   // between -1.0 and 1.0
              s = v1 * v1 + v2 * v2;
          }
          while( s >= 1 || s == 0 );
          
          var multiplier = Math.sqrt( - 2 * Math.log( s ) / s );
          nextNextGaussian = v2 * multiplier;
          haveNextNextGaussian = true;

          return v1 * multiplier;
        
        }
        
      };
      
    };

//! This can't be right... right?
    p.byte     = function byte( aNumber               ){ return aNumber || 0;                           };

    p.norm     = function norm( aNumber, low, high   ){
      var range = high-low;
      return ( ( 1 / range ) * aNumber ) - ( ( 1 / range ) * low );
    };        
    
    p.random = function random( aMin, aMax ) {
      return arguments.length == 2                   ?
        aMin + ( Math.random() * ( aMax - aMin ) )  :
        Math.random() * aMin                        ;
    };

    // From: http://freespace.virgin.net/hugo.elias/models/m_perlin.htm
    p.noise = function( x, y, z ){
      return arguments.length >= 2  ?
        PerlinNoise_2D( x, y, z )    :
        PerlinNoise_3D( x, x, z )    ;
    };

    function Noise( x, y ){
      var n = x + y * 57;
      n = ( n << 13 ) ^ n;
      return Math.abs( 1.0 - ( ( ( n * ( ( n * n * 15731 ) + 789221 ) + 1376312589 ) & 0x7fffffff ) / 1073741824.0 ) );
    };

    function SmoothedNoise( x, y ){
      var corners = ( Noise( x - 1, y - 1 ) + Noise( x + 1, y - 1 ) + Noise( x - 1, y + 1 ) + Noise( x + 1, y + 1 ) ) / 16,
          sides   = ( Noise( x - 1, y ) + Noise( x + 1, y ) + Noise( x, y - 1 ) + Noise( x, y + 1 ) ) / 8,
          center  = Noise( x, y ) / 4;
      return corners + sides + center;
    };

    function InterpolatedNoise( x, y ){

      var integer_X    = Math.floor( x );
      var fractional_X = x - integer_X;

      var integer_Y    = Math.floor( y );
      var fractional_Y = y - integer_Y;

      var v1 = SmoothedNoise( integer_X,     integer_Y     ),
          v2 = SmoothedNoise( integer_X + 1, integer_Y     ),
          v3 = SmoothedNoise( integer_X,     integer_Y + 1 ),
          v4 = SmoothedNoise( integer_X + 1, integer_Y + 1 );

      var i1 = Interpolate( v1, v2, fractional_X ),
          i2 = Interpolate( v3, v4, fractional_X );

      return Interpolate( i1, i2, fractional_Y );
      
    }


    function PerlinNoise_2D( x, y ){

        var total = 0,
            p     = 0.25,
            n     = 3;

        for( var i = 0; i <= n; i++ ){
          var frequency = Math.pow( 2, i );
          var amplitude = Math.pow( p, i );
          total += InterpolatedNoise( x * frequency, y * frequency ) * amplitude;
        }

        return total;
    }

    function Interpolate( a, b, x ){
      var ft   = x * p.PI;
      var f   = (1 - Math.cos( ft ) ) * .5;
      return  a * ( 1 - f ) + b * f;
    }
   
    p.constrain = function constrain( aNumber, aMin, aMax ){
      return Math.min( Math.max( aNumber, aMin ), aMax );
    };
          
    p.degrees = function degrees( aAngle ){
      aAngle = ( aAngle * 180 ) / p.PI;  
      if (aAngle < 0) {aAngle = 360 + aAngle}    
      return aAngle;
    };
    
    p.size = function size( aWidth, aHeight ){    
      var fillStyle = curContext.fillStyle,
          strokeStyle = curContext.strokeStyle;

      curElement.width = p.width = aWidth;
      curElement.height = p.height = aHeight;

      curContext.fillStyle = fillStyle;
      curContext.strokeStyle = strokeStyle;
    };
    

    
    ////////////////////////////////////////////////////////////////////////////
    // Style functions
    ////////////////////////////////////////////////////////////////////////////
    
    p.noStroke   = function noStroke()  { doStroke = false; };    
    p.noFill     = function noFill()    { doFill = false;   };
    p.smooth     = function smooth()    {};
    p.noSmooth   = function noSmooth()  {};        
    
    p.fill = function fill(){
      doFill = true;
      curContext.fillStyle = p.color.apply( this, arguments );    
    };
    
    p.stroke = function stroke(){
      doStroke = true;
      curContext.strokeStyle = p.color.apply( this, arguments );
    };

    p.strokeWeight = function strokeWeight( w ){
      curContext.lineWidth = w;
    };

       
        
    ////////////////////////////////////////////////////////////////////////////
    // Vector drawing functions
    ////////////////////////////////////////////////////////////////////////////

    p.Point = function Point( x, y ){
      this.x = x;
      this.y = y;
      this.copy = function(){
        return new Point( x, y );
      }
    };
    
    p.point = function point( x, y ){
      var oldFill = curContext.fillStyle;
      curContext.fillStyle = curContext.strokeStyle;
      curContext.fillRect( Math.round( x ), Math.round( y ), 1, 1 );
      curContext.fillStyle = oldFill;
    };
    
    p.beginShape = function beginShape( type ){
      curShape = type;
      curShapeCount = 0; 
      curvePoints = [];
    };
    
    p.endShape = function endShape( close ){
      
      if( curShapeCount != 0 ){
        
        if( close || doFill ){ curContext.lineTo( firstX, firstY ); }
        if( doFill          ){ curContext.fill();                   }          
        if( doStroke        ){ curContext.stroke();                 }
      
        curContext.closePath();
        curShapeCount = 0;
        pathOpen = false;
        
      }

      if( pathOpen ){
        
        if ( doFill   ){ curContext.fill();   }
        if ( doStroke ){ curContext.stroke(); }

        curContext.closePath();
        curShapeCount = 0;
        pathOpen = false;
        
      }
      
    };
    
    p.vertex = function vertex( x, y, x2, y2, x3, y3 ){    
      
      if( curShapeCount == 0 && curShape != p.POINTS ){

        pathOpen = true;
        curContext.beginPath();
        curContext.moveTo( x, y );
        firstX = x;
        firstY = y;

      }else{

        if( curShape == p.POINTS ){

          p.point( x, y );

        }else if( arguments.length == 2 ){
          
          if( curShape != p.QUAD_STRIP || curShapeCount != 2 ){

            curContext.lineTo( x, y );

          }
          
          if( curShape == p.TRIANGLE_STRIP ){
            
            if( curShapeCount == 2 ){
              
              // finish shape
              p.endShape( p.CLOSE );
              pathOpen = true;
              curContext.beginPath();
              
              // redraw last line to start next shape
              curContext.moveTo( prevX, prevY );
              curContext.lineTo( x, y );
              curShapeCount = 1;
              
            }
            
            firstX = prevX;
            firstY = prevY;
          
          }

          if( curShape == p.TRIANGLE_FAN && curShapeCount == 2 ){
            
            // finish shape
            p.endShape( p.CLOSE) ;
            pathOpen = true;
            curContext.beginPath();
        
            // redraw last line to start next shape
            curContext.moveTo( firstX, firstY );
            curContext.lineTo( x, y );
            curShapeCount = 1;
          
          }
      
          if( curShape == p.QUAD_STRIP && curShapeCount == 3 ){
            
            // finish shape
            curContext.lineTo( prevX, prevY );
            p.endShape(p.CLOSE);
            pathOpen = true;
            curContext.beginPath();
      
            // redraw lines to start next shape
            curContext.moveTo( prevX, prevY );
            curContext.lineTo( x, y );
            curShapeCount = 1;
          
          }

          if( curShape == p.QUAD_STRIP ){
            
            firstX  = secondX;
            firstY  = secondY;
            secondX = prevX;
            secondY = prevY;
            
          }
        
        }else if( arguments.length == 4 ){
        
          if( curShapeCount > 1 ){
            
            curContext.moveTo( prevX, prevY );
            curContext.quadraticCurveTo( firstX, firstY, x, y );
            curShapeCount = 1;
          
          }
        
        }else if( arguments.length == 6 ){
          
          curContext.bezierCurveTo( x, y, x2, y2, x3, y3 );

        }
      }

      prevX = x;
      prevY = y;
      curShapeCount ++;
      
      if(   curShape == p.LINES && curShapeCount == 2       ||
          ( curShape == p.TRIANGLES ) && curShapeCount == 3 ||
          ( curShape == p.QUADS     ) && curShapeCount == 4 
        ){
          p.endShape( p.CLOSE );
        }
    
    };

    p.curveVertex = function( x, y, x2, y2 ){
      
      if( curvePoints.length < 3 ){
        
        curvePoints.push( [ x, y ] );
      
      }else{
      
        var b = [], s = 1 - curTightness;

        /*
         * Matrix to convert from Catmull-Rom to cubic Bezier
         * where t = curTightness
         * |0         1          0         0       |
         * |(t-1)/6   1          (1-t)/6   0       |
         * |0         (1-t)/6    1         (t-1)/6 |
         * |0         0          0         0       |
         */

        curvePoints.push( [ x, y ] );

        b[ 0 ] = [ curvePoints[ 1 ][ 0 ], curvePoints[ 1 ][ 1 ] ];
        b[ 1 ] = [ curvePoints[ 1 ][ 0 ] + ( s * curvePoints[ 2 ][ 0 ] - s * curvePoints[ 0 ][ 0 ] ) / 6, curvePoints[ 1 ][ 1 ] + ( s * curvePoints[ 2 ][ 1 ] - s * curvePoints[ 0 ][ 1 ] ) / 6 ];
        b[ 2 ] = [ curvePoints[ 2 ][ 0 ] + ( s * curvePoints[ 1 ][ 0 ] - s * curvePoints[ 3 ][ 0 ] ) / 6, curvePoints[ 2 ][ 1 ] + ( s * curvePoints[ 1 ][ 1 ] - s * curvePoints[ 3 ][ 1 ] ) / 6 ];
        b[ 3 ] = [ curvePoints[ 2 ][ 0 ], curvePoints[ 2 ][ 1 ] ];

        if( !pathOpen ){
          p.vertex( b[ 0 ][ 0 ], b[ 0 ][ 1 ] );
        }else{
          curShapeCount = 1;
        }

        p.vertex(
          b[ 1 ][ 0 ],
          b[ 1 ][ 1 ],
          b[ 2 ][ 0 ],
          b[ 2 ][ 1 ],
          b[ 3 ][ 0 ],
          b[ 3 ][ 1 ]
        );
        
        curvePoints.shift();      
      }
    
    };

    p.curveTightness = function( tightness ){ curTightness = tightness; };

    p.bezierVertex = p.vertex;    
    
    p.rectMode     = function rectMode( aRectMode ){ curRectMode = aRectMode; };
    p.imageMode   = function (){};    
    p.ellipseMode = function ellipseMode( aEllipseMode ) { curEllipseMode = aEllipseMode; };        
    
    p.arc = function arc( x, y, width, height, start, stop ){

      if( width <= 0 ){ return; }

      if( curEllipseMode == p.CORNER ){
       x += width / 2;
       y += height / 2;
      }
      
      curContext.moveTo( x, y );
      curContext.beginPath();   
      curContext.arc( x, y, curEllipseMode == p.CENTER_RADIUS ? width : width/2, start, stop, false );

      if( doStroke ){ curContext.stroke(); }
      curContext.lineTo( x, y );

      if( doFill ){ curContext.fill(); }
      curContext.closePath();
      
    };
    
    p.line = function line( x1, y1, x2, y2 ){
      curContext.lineCap = "round";
      curContext.beginPath();    
      curContext.moveTo( x1 || 0, y1 || 0 );
      curContext.lineTo( x2 || 0, y2 || 0 );      
      curContext.stroke();      
      curContext.closePath();
    };

    p.bezier = function bezier( x1, y1, x2, y2, x3, y3, x4, y4 ){
      curContext.lineCap = "butt";
      curContext.beginPath();    
      curContext.moveTo( x1, y1 );
      curContext.bezierCurveTo( x2, y2, x3, y3, x4, y4 );      
      curContext.stroke();      
      curContext.closePath();
    };

    p.triangle = function triangle( x1, y1, x2, y2, x3, y3 ){
      p.beginShape();
      p.vertex( x1, y1 );
      p.vertex( x2, y2 );
      p.vertex( x3, y3 );
      p.endShape();
    };

    p.quad = function quad( x1, y1, x2, y2, x3, y3, x4, y4 ){
      curContext.lineCap = "square";
      p.beginShape();
      p.vertex( x1, y1 );
      p.vertex( x2, y2 );
      p.vertex( x3, y3 );
      p.vertex( x4, y4 );
      p.endShape();
    };
    
    p.rect = function rect( x, y, width, height ){

      if( !( width + height ) ){ return; }

      curContext.beginPath();
      
      var offsetStart = 0;
      var offsetEnd = 0;

      if( curRectMode == p.CORNERS ){
        width -= x;
        height -= y;
      }
      
      if( curRectMode == p.RADIUS ){
        width *= 2;
        height *= 2;
      }
      
      if( curRectMode == p.CENTER || curRectMode == p.RADIUS ){
        x -= width / 2;
        y -= height / 2;
      }
    
      curContext.rect(
        Math.round( x ) - offsetStart,
        Math.round( y ) - offsetStart,
        Math.round( width ) + offsetEnd,
        Math.round( height ) + offsetEnd
      );
        
      if( doFill     ){ curContext.fill();   }        
      if( doStroke   ){  curContext.stroke() };
      
      curContext.closePath();
      
    };
    
    p.ellipse = function ellipse( x, y, width, height ){

      x = x || 0;
      y = y || 0;

      if( width <= 0 && height <= 0 ){ return; }

      curContext.beginPath();
      
      if( curEllipseMode == p.RADIUS ){
        width *= 2;
        height *= 2;
      }     
      
      var offsetStart = 0;
      
      // Shortcut for drawing a circle
      if( width == height ){
      
        curContext.arc( x - offsetStart, y - offsetStart, width / 2, 0, p.TWO_PI, false );
      
      }else{
      
        var w = width/2,
            h = height/2,
            C = 0.5522847498307933;
        var c_x = C * w,
            c_y = C * h;

//!      Do we still need this? I hope the Canvas arc() more capable by now?
        curContext.moveTo( x + w, y );
        curContext.bezierCurveTo( x+w    ,   y-c_y  ,   x+c_x  ,   y-h   ,   x    ,   y-h  );
        curContext.bezierCurveTo( x-c_x  ,   y-h    ,   x-w    ,   y-c_y ,   x-w  ,   y    );
        curContext.bezierCurveTo( x-w    ,   y+c_y  ,   x-c_x  ,   y+h, x,   y+h           );
        curContext.bezierCurveTo( x+c_x  ,   y+h    ,   x+w    ,   y+c_y ,   x+w  ,   y    );
      
      }
    
      if( doFill    ){ curContext.fill();   }
      if( doStroke  ){ curContext.stroke(); }
      
      curContext.closePath();
      
    };



    ////////////////////////////////////////////////////////////////////////////
    // Raster drawing functions
    ////////////////////////////////////////////////////////////////////////////

    p.save = function save( file ){};

    // Loads an image for display. Type is unused. Callback is fired on load.
    p.loadImage = function loadImage( file, type, callback ){
      
      var img = document.createElement( 'img' );
      img.src = file;
     
      img.onload = function(){
        
        var h = this.height,
            w = this.width;
        
        var canvas = document.createElement( "canvas" );
        canvas.width = w;
        canvas.height = h;
        var context = canvas.getContext( "2d" );
     
        context.drawImage( this, 0, 0 );
        this.data = buildImageObject( context.getImageData( 0, 0, w, h ) );
        this.data.img = img;

        callback?callback():0;
        
      }
      
      return img;
          
    };
    
    // Gets a single pixel or block of pixels from the current Canvas Context
    p.get = function get( x, y ){
      
      if( !arguments.length ){
        var c = p.createGraphics( p.width, p.height );
        c.image( curContext, 0, 0 );
        return c;
      }

      if( !getLoaded ){
        getLoaded = buildImageObject( curContext.getImageData( 0, 0, p.width, p.height ) );
      }

      return getLoaded.get( x, y );
      
    };

    // Creates a new Processing instance and passes it back for... processing
    p.createGraphics = function createGraphics( w, h ){
 
      var canvas = document.createElement( "canvas" );
      var ret = buildProcessing( canvas );
      ret.size( w, h );
      ret.canvas = canvas;
      return ret;
 
    };

    // Paints a pixel array into the canvas
    p.set = function set( x, y, obj ){
      
      if( obj && obj.img ){
        
        p.image( obj, x, y );
        
      }else{
      
        var oldFill = curContext.fillStyle,
            color   = obj;
            
        curContext.fillStyle = color;
        curContext.fillRect( Math.round( x ), Math.round( y ), 1, 1 );
        curContext.fillStyle = oldFill;
        
      }
      
    };

    // Gets a 1-Dimensional pixel array from Canvas
    p.loadPixels = function(){
      p.pixels = buildImageObject( curContext.getImageData(0, 0, p.width, p.height) ).pixels;
    };

    // Draws a 1-Dimensional pixel array to Canvas
    p.updatePixels = function() {
    
      var colors = /(\d+),(\d+),(\d+),(\d+)/,
          pixels = {};
          
      pixels.width   = p.width;
      pixels.height = p.height;
      pixels.data   = [];

      if( curContext.createImageData ){
        pixels = curContext.createImageData( p.width, p.height );
      }

      var data   = pixels.data,
          pos   = 0;

      for( var i = 0, l = p.pixels.length; i < l; i++ ){

        var c = ( p.pixels[i] || "rgba(0,0,0,1)" ).match( colors );

        data[ pos + 0 ] =   parseInt( c[ 1 ] );
        data[ pos + 1 ] =   parseInt( c[ 2 ] );
        data[ pos + 2 ] =   parseInt( c[ 3 ] );
        data[ pos + 3 ] = parseFloat( c[ 4 ] ) * 255;

        pos += 4;
        
      }

      curContext.putImageData( pixels, 0, 0 );
      
    };

    // Draw an image or a color to the background
    p.background = function background( img ) {
      
       if( arguments.length ){
        
        if( img.data && img.data.img ){
          curBackground = img.data;
        }else{
          curBackground = p.color.apply( this, arguments );
        }
        
      }

      if( curBackground.img ){
      
        p.image( img, 0, 0 );
        
      }else{

        var oldFill = curContext.fillStyle;
        curContext.fillStyle = curBackground + "";
        curContext.fillRect( 0, 0, p.width, p.height );
        curContext.fillStyle = oldFill;

      }
      
    };    
    
    p.AniSprite = function( prefix, frames ){
      this.images = [];
      this.pos = 0;

      for( var i = 0; i < frames; i++ ){
        this.images.push( prefix + p.nf( i, ( "" + frames ).length ) + ".gif" );
      }

      this.display = function( x, y ){
        p.image_old( this.images[ this.pos ], x, y );

        if( ++this.pos >= frames ){
          this.pos = 0;
        }
      };

      this.getWidth   = function(){ return getImage_old( this.images[ 0 ] ).width;  };
      this.getHeight  = function(){ return getImage_old( this.images[ 0 ] ).height; };
    };

    function buildImageObject( obj ){
 
      var pixels = obj.data;
      var data = p.createImage( obj.width, obj.height );

      if( data.__defineGetter__ && data.__lookupGetter__ && !data.__lookupGetter__( "pixels" ) ){
        
        var pixelsDone;
        
        data.__defineGetter__( "pixels", function(){
          
          if( pixelsDone ){
            return pixelsDone;
          }
          pixelsDone = [];

          for( var i = 0; i < pixels.length; i += 4 ){
            pixelsDone.push(
              p.color(
                pixels[ i ],
                pixels[ i + 1 ],
                pixels[ i + 2 ],
                pixels[ i + 3 ])
              );
          }

          return pixelsDone;
        
        });
        
      }else{
        
        data.pixels = [];

        for ( var i = 0; i < pixels.length; i += 4 ){
          data.pixels.push( p.color(
            pixels[ i ],
            pixels[ i + 1 ],
            pixels[ i + 2 ],
            pixels[ i + 3 ]
          ));
        }
      
      }

      return data;
    }

    p.createImage = function createImage( w, h, mode ){
            
      var data    = {};
      data.width  = w;
      data.height = h;
      data.data   = [];

      if( curContext.createImageData ) {
        data = curContext.createImageData( w, h );
      }

      data.pixels = new Array( w * h );
      
      data.get = function( x, y ){
        return this.pixels[ w * y + x ];
      };
      
      data._mask = null;
      
      data.mask = function( img ){
        this._mask = img;
      };
      
      data.loadPixels = function(){};
      data.updatePixels = function(){};

      return data;
      
    };

    function getImage( img ){
      
      if( typeof img == "string" ){
        return document.getElementById( img );
      }

      if( img.img ){
      
        return img.img;
        
      }else if( img.getContext || img.canvas ){

        img.pixels = img.getContext( '2d' ).createImageData( img.width, img.height );
      }

      for( var i = 0, l = img.pixels.length; i < l; i++ ){
        
        var pos = i * 4;
        var c = ( img.pixels[ i ] || "rgba(0,0,0,1)" ).slice( 5, - 1 ).split( "," );
        
        img.data[ pos + 0 ] =   parseInt( c[ 0 ] );
        img.data[ pos + 1 ] =   parseInt( c[ 1 ] );
        img.data[ pos + 2 ] =   parseInt( c[ 2 ] );
        img.data[ pos + 3 ] = parseFloat( c[ 3 ] ) * 100;
      
      }

      var canvas = document.createElement( "canvas" );
      canvas.width = img.width;
      canvas.height = img.height;
      
      var context = canvas.getContext( "2d" );
      context.putImageData( img.pixels, 0, 0 );

      img.canvas = canvas;

      return img;
    }

    // Depreciating "getImage_old" from PJS - currently here to support AniSprite
    function getImage_old( img ){ 
      if( typeof img == "string" ){
        return document.getElementById( img );
      } 
      if( img.img || img.canvas ){
        return img.img || img.canvas;
      } 
      for( var i = 0, l = img.pixels.length; i < l; i++ ){        
        var pos = i * 4;
        var c = ( img.pixels[ i ] || "rgba(0,0,0,1)" ).slice( 5, - 1 ).split( "," );        
        img.data[ pos + 0 ] = parseInt( c[ 0 ] );
        img.data[ pos + 1 ] = parseInt( c[ 1 ] );
        img.data[ pos + 2 ] = parseInt( c[ 2 ] );
        img.data[ pos + 3 ] = parseFloat( c[ 3 ] ) * 100;      
      } 
      var canvas = document.createElement( "canvas" );
      canvas.width = img.width;
      canvas.height = img.height;      
      var context = canvas.getContext( "2d" );
      context.putImageData( img, 0, 0 ); 
      img.canvas = canvas; 
      return canvas;
    }
    // Depreciating "getImage_old" from PJS - currently here to support AniSprite
    p.image_old=function image_old(img,x,y,w,h){
      x = x || 0;
      y = y || 0; 
      var obj = getImage( img ); 
      if( curTint >= 0 ){
        var oldAlpha = curContext.globalAlpha;
        curContext.globalAlpha = curTint / opacityRange;
      } 
      if( arguments.length == 3 ){
        curContext.drawImage( obj, x, y );
      }else{
        curContext.drawImage( obj, x, y, w, h );
      } 
      if( curTint >= 0 ){
        curContext.globalAlpha = oldAlpha;
      } 
      if( img._mask ){
        var oldComposite = curContext.globalCompositeOperation;
        curContext.globalCompositeOperation = "darker";
        p.image( img._mask, x, y );
        curContext.globalCompositeOperation = oldComposite;
      }      
    };

    // Draws an image to the Canvas
    p.image = function image( img, x, y, w, h ){
      
      if( img.data || img.canvas ){

        x = x || 0;
        y = y || 0;

        var obj = getImage( img.data || img.canvas );

        if( curTint >= 0 ){
          var oldAlpha = curContext.globalAlpha;
          curContext.globalAlpha = curTint / opacityRange;
        }

        if( arguments.length == 3 ){
          curContext.drawImage( obj, x, y );
        }else{
          curContext.drawImage( obj, x, y, w, h );
        }

        if( curTint >= 0 ){
          curContext.globalAlpha = oldAlpha;
        }

        if( img._mask ){
          var oldComposite = curContext.globalCompositeOperation;
          curContext.globalCompositeOperation = "darker";
          p.image( img._mask, x, y );
          curContext.globalCompositeOperation = oldComposite;
        }
      
      }
      
      if( typeof img == 'string' ){
        
      }
      
    };    
    
    // Clears hole in the Canvas or the whole Canvas
    p.clear = function clear ( x, y, width, height ) {    
      if( arguments.length == 0 ){
        curContext.clearRect( x, y, width, height );
      }else{
        curContext.clearRect( 0, 0, p.width, p.height );
      }
    }

    p.tint = function tint( rgb, a ){
      curTint = a;
    };



    ////////////////////////////////////////////////////////////////////////////
    // Font handling
    ////////////////////////////////////////////////////////////////////////////
    
    // Loads a font from an SVG or Canvas API
    p.loadFont = function loadFont( name ){
      
      if( name.indexOf( ".svg" ) == - 1 ){

        return {
          name: name,
          width: function( str ){
            if( curContext.mozMeasureText ){
              return curContext.mozMeasureText(
                typeof str == "number" ?
                  String.fromCharCode( str ) :
                  str
              ) / curTextSize;
            }else{
              return 0;
            }
          }
        };
        
      }else{
        
        // If the font is a glyph, calculate by SVG table     
        var font = p.loadGlyphs( name );

        return {
          name          : name,
          glyph         : true,
          units_per_em  : font.units_per_em,
          horiz_adv_x   : 1 / font.units_per_em * font.horiz_adv_x,
          ascent        : font.ascent,
          descent       : font.descent,
          width         :
            function( str ){
              var width = 0;
              var len   = str.length;
              for( var i = 0; i < len; i++ ){                          
                try{ width += parseFloat( p.glyphLook( p.glyphTable[ name ], str[ i ] ).horiz_adv_x ); }
                catch( e ){ ; }
              }
              return width / p.glyphTable[ name ].units_per_em;
            }
        }
        
      }
    
    };

    // Sets a 'current font' for use
    p.textFont = function textFont( name, size ){
      curTextFont = name;
      p.textSize( size );
    };

    // Sets the font size
    p.textSize = function textSize( size ){
//!   Was this meant to return textSize value if no arguments were passed?
      if( size ){
        curTextSize = size;
      }
    };

    p.textAlign = function textAlign(){};

    // A lookup table for characters that can not be referenced by Object 
    p.glyphLook = function glyphLook( font, chr ){

      try{
        switch( chr ){
          case "1"  : return font[ "one"          ]; break;
          case "2"  : return font[ "two"          ]; break;
          case "3"  : return font[ "three"        ]; break;
          case "4"  : return font[ "four"         ]; break;
          case "5"  : return font[ "five"         ]; break;
          case "6"  : return font[ "six"          ]; break;
          case "7"  : return font[ "seven"        ]; break;
          case "8"  : return font[ "eight"        ]; break;
          case "9"  : return font[ "nine"         ]; break;
          case "0"  : return font[ "zero"         ]; break;
          case " "  : return font[ "space"        ]; break;
          case "$"  : return font[ "dollar"       ]; break;
          case "!"  : return font[ "exclam"       ]; break;
          case '"'  : return font[ "quotedbl"     ]; break;
          case "#"  : return font[ "numbersign"   ]; break;
          case "%"  : return font[ "percent"      ]; break;
          case "&"  : return font[ "ampersand"    ]; break;
          case "'"  : return font[ "quotesingle"  ]; break;
          case "("  : return font[ "parenleft"    ]; break;
          case ")"  : return font[ "parenright"   ]; break;
          case "*"  : return font[ "asterisk"     ]; break;
          case "+"  : return font[ "plus"         ]; break;
          case ","  : return font[ "comma"        ]; break;
          case "-"  : return font[ "hyphen"       ]; break;
          case "."  : return font[ "period"       ]; break;
          case "/"  : return font[ "slash"        ]; break;
          case "_"  : return font[ "underscore"   ]; break;
          case ":"  : return font[ "colon"        ]; break;
          case ";"  : return font[ "semicolon"    ]; break;
          case "<"  : return font[ "less"         ]; break;
          case "="  : return font[ "equal"        ]; break;
          case ">"  : return font[ "greater"      ]; break;
          case "?"  : return font[ "question"     ]; break;
          case "@"  : return font[ "at"           ]; break;
          case "["  : return font[ "bracketleft"  ]; break;
          case "\\" : return font[ "backslash"    ]; break;
          case "]"  : return font[ "bracketright" ]; break;
          case "^"  : return font[ "asciicircum"  ]; break;
          case "`"  : return font[ "grave"        ]; break;
          case "{"  : return font[ "braceleft"    ]; break;
          case "|"  : return font[ "bar"          ]; break;
          case "}"  : return font[ "braceright"   ]; break;
          case "~"  : return font[ "asciitilde"   ]; break;
          // If the character is not 'special', access it by object reference
          default   : return font[ chr            ]; break;
        }
      }catch( e ){ ; }
    
    }
    
    // Print some text to the Canvas
    p.text = function text( str, x, y ){
      
      // If the font is a standard Canvas font...
      if( !curTextFont.glyph ){
      
        if( str && curContext.mozDrawText ){

          curContext.save();
          curContext.mozTextStyle = curTextSize + "px " + curTextFont.name;
          curContext.translate( x, y );
          curContext.mozDrawText( 
            typeof str == "number" ?
            String.fromCharCode( str ) :
            str ) ;
          curContext.restore();

        }
        
      }else{
        
        // If the font is a Batik SVG font...
        var font = p.glyphTable[ curTextFont.name ];
        curContext.save();
        curContext.translate( x, y + curTextSize );
        
        var upem      = font[ "units_per_em" ],
            newScale = 1 / upem * curTextSize;
        
        curContext.scale( newScale, newScale );
        
        var len = str.length;
        
        for(var i = 0; i < len; i++ ){
          // Test character against glyph table
          try{ p.glyphLook( font, str[ i ] ).draw(); }
          catch( e ){ ; }
        }
        
        curContext.restore();
      }
      
    };
    
    // Load Batik SVG Fonts and parse to pre-def objects for quick rendering 
    p.loadGlyphs = function loadGlyph( url ){
        
        // Load and parse Batik SVG font as XML into a Processing Glyph object
        var loadXML = function loadXML(){
        
          try{
                      var xmlDoc = new ActiveXObject( "Microsoft.XMLDOM" );
          }
          catch( e ){ 
                      try{
                            xmlDoc=document.implementation.createDocument( "", "", null );
                      }
                      catch( e ){
                            p.println( e.message );
                            return;
                      }
          };
          
          try{
                      xmlDoc.async = false;
                      xmlDoc.load( url );
                      parse( xmlDoc.getElementsByTagName( "svg" )[ 0 ] );
          }
          catch( e ){
                      // Google Chrome, Safari etc.
                      try{
                            p.println( e.message );
                            var xmlhttp = new window.XMLHttpRequest();
                            xmlhttp.open( "GET", url, false );
                            xmlhttp.send( null );
                            parse( xmlhttp.responseXML.documentElement );
                      }
                      catch( e ){ ; }
          }
        };
        
        // Return arrays of SVG commands and coords
        var regex = function regex( needle, hay ){
          
          var regexp  = new RegExp( needle, "g" ),
              results = [],
              i       = 0;
              
          while( results[ i ] = regexp.exec( hay ) ){ i++; }
          return results;
        
        }

        // Parse SVG font-file into block of Canvas commands
        var parse = function parse( svg ){
          
          // Store font attributes
          var font = svg.getElementsByTagName( "font" );
          p.glyphTable[ url ][ "horiz_adv_x"  ] = font[ 0 ].getAttribute( "horiz-adv-x" );      
          
          var font_face = svg.getElementsByTagName( "font-face" )[ 0 ];                  
          p.glyphTable[ url ][ "units_per_em" ] = parseFloat( font_face.getAttribute( "units-per-em") );
          p.glyphTable[ url ][ "ascent"       ] = parseFloat( font_face.getAttribute( "ascent"      ) );
          p.glyphTable[ url ][ "descent"      ] = parseFloat( font_face.getAttribute( "descent"     ) );          
          
          var getXY = "[0-9\-]+",
              glyph = svg.getElementsByTagName( "glyph" ),
              len   = glyph.length;

          // Loop through each glyph in the SVG
          for( var i = 0; i < len; i++ ){
            
            // Store attributes for this glyph
            var unicode = glyph[ i ].getAttribute( "unicode" );
            var name = glyph[ i ].getAttribute( "glyph-name" );
            var horiz_adv_x = glyph[ i ].getAttribute( "horiz-adv-x" );
            if( horiz_adv_x == null ){ var horiz_adv_x = p.glyphTable[ url ][ 'horiz_adv_x' ]; }
            
            var buildPath = function buildPath( d ){ 
              
              var c = regex( "[A-Za-z][0-9\- ]+|Z", d );                                                    
              
              // Begin storing path object 
              var path = "var path={draw:function(){curContext.beginPath();curContext.save();";
              
              var x       = 0,
                  y       = 0,
                  cx      = 0,
                  cy      = 0,
                  nx      = 0,
                  ny      = 0,
                  d       = 0,
                  a       = 0,
                  lastCom = "",
                  lenC    = c.length - 1;
              
              // Loop through SVG commands translating to canvas eqivs functions in path object
              for( var j = 0; j < lenC; j++ ){
                
                var com = c[ j ][ 0 ],
                    xy   = regex( getXY, com );
       
                switch( com[ 0 ] ){
                
                  case "M": //curContext.moveTo(x,-y);
                    x = parseFloat( xy[ 0 ][ 0 ] );
                    y = parseFloat( xy[ 1 ][ 0 ] );              
//!                 Brackets needed on (-y)?
                    path += "curContext.moveTo("+ x +","+ (-y) +");";
                    break;

                  case "L": //curContext.lineTo(x,-y);
                    x = parseFloat( xy[ 0 ][ 0 ] );
                    y = parseFloat( xy[ 1 ][ 0 ] );
                    path += "curContext.lineTo("+ x +","+ (-y) +");";
                    break;

                  case "H"://curContext.lineTo(x,-y)
                    x = parseFloat( xy[ 0 ][ 0 ] );
                    path += "curContext.lineTo("+ x +","+ (-y) +");";
                    break;

                  case "V"://curContext.lineTo(x,-y);
                    y = parseFloat( xy[ 0 ][ 0 ] );              
                    path += "curContext.lineTo("+ x +","+ (-y) +");";
                    break;

                  case "T"://curContext.quadraticCurveTo(cx,-cy,nx,-ny);
                    nx = parseFloat( xy[ 0 ][ 0 ] );
                    ny = parseFloat( xy[ 1 ][ 0 ] );

                    if( lastCom == "Q" || lastCom == "T" ){

                      d = Math.sqrt( Math.pow( x - cx, 2 ) + Math.pow( cy - y, 2 ) );
                      a = Math.PI+Math.atan2( cx - x, cy - y );
                      cx = x + ( Math.sin( a ) * ( d ) );
                      cy = y + ( Math.cos( a ) * ( d ) );

                    }else{
                      cx = x;
                      cy = y;
                    }
                    
                    path += "curContext.quadraticCurveTo("+ cx +","+ (-cy) +","+ nx +","+ (-ny) +");";
                    x = nx;
                    y = ny;
                    break;
                     
                  case "Q"://curContext.quadraticCurveTo(cx,-cy,nx,-ny);
                    cx = parseFloat( xy[ 0 ][ 0 ] );
                    cy = parseFloat( xy[ 1 ][ 0 ] );
                    nx = parseFloat( xy[ 2 ][ 0 ] );
                    ny = parseFloat( xy[ 3 ][ 0 ] ); 
                    path += "curContext.quadraticCurveTo("+ cx +","+ (-cy) +","+ nx +","+ (-ny) +");";              
                    x = nx;
                    y = ny;
                    break;

                  case "Z"://curContext.closePath();
                    path += "curContext.closePath();";
                    break;

                }

                lastCom = com[ 0 ];

              }

              path += "doStroke?curContext.stroke():0;";
              path += "doFill?curContext.fill():0;";
              path += "curContext.restore();";
              path += "curContext.translate("+ horiz_adv_x  +",0);";            
              path += "}}";

              return path;

            }
                     
            var d = glyph[ i ].getAttribute( "d" );
            
            // Split path commands in glpyh 
            if( d !== undefined ){
            
              var path = buildPath( d );
              eval( path );
              
              // Store glyph data to table object
              p.glyphTable[ url ][ name ] = {
                name        : name,
                unicode     : unicode,
                horiz_adv_x : horiz_adv_x,
                draw        : path.draw
              }

            }
         
          } // finished adding glyphs to table
          
        }
        
        // Create a new object in glyphTable to store this font
        p.glyphTable[ url ] = {};
        
        // Begin loading the Batik SVG font... 
        loadXML( url );
        
        // Return the loaded font for attribute grabbing
        return p.glyphTable[ url ];
    }



    ////////////////////////////////////////////////////////////////////////////
    // Class methods
    ////////////////////////////////////////////////////////////////////////////
    
    p.extendClass = function extendClass( obj, args, fn ){
      if( arguments.length == 3 ){
        fn.apply( obj, args );
      }else{
        args.call( obj );
      }
    };

    p.addMethod = function addMethod( object, name, fn ){

      if( object[ name ] ){
      
        var args   = fn.length,
            oldfn = object[ name ];
        
        object[ name ] = function(){
          
          if( arguments.length == args ){

            return fn.apply( this, arguments );

          }else{

            return oldfn.apply( this, arguments );

          }
        
        };
      
      }else{
      
        object[ name ] = fn;
      
      }
    
    };
    
    

    ////////////////////////////////////////////////////////////////////////////
    // Set up environment
    ////////////////////////////////////////////////////////////////////////////
    
    p.init = function init(code){

      p.stroke( 0 );
      p.fill( 255 );
    
      // Canvas has trouble rendering single pixel stuff on whole-pixel
      // counts, so we slightly offset it (this is super lame).
      
      curContext.translate( 0.5, 0.5 );    
          
      // The fun bit!
      if( code ){
        (function( Processing ){
          with ( p ){
            eval(parse(code, p));
          }
        })( p );
      }
    
      if( p.setup ){
        inSetup = true;
        p.setup();
      }
      
      inSetup = false;
      
      if( p.draw ){
        if( !doLoop ){
          p.redraw();
        } else {
          p.loop();
        }
      }
      

      //////////////////////////////////////////////////////////////////////////
      // Event handling
      //////////////////////////////////////////////////////////////////////////
      
      attach( curElement, "mousemove"  , function(e){
      
        var scrollX = window.scrollX != null ? window.scrollX : window.pageXOffset;
        var scrollY = window.scrollY != null ? window.scrollY : window.pageYOffset;            
      
        p.pmouseX = p.mouseX;
        p.pmouseY = p.mouseY;
        p.mouseX   = e.clientX - curElement.offsetLeft + scrollX;
        p.mouseY   = e.clientY - curElement.offsetTop + scrollY;    

        if( p.mouseMoved ){ p.mouseMoved(); }
        if( mousePressed && p.mouseDragged ){ p.mouseDragged(); }
        
      });
      
      attach( curElement, "mouseout" , function( e ){ p.cursor("auto"); });      
      
      attach( curElement, "mousedown", function( e ){      
        mousePressed = true;      
        switch(e.which){
          case 1: p.mouseButton = p.LEFT; break;
          case 2: p.mouseButton = p.CENTER; break;
          case 3: p.mouseButton = p.RIGHT; break; 
        }        
        p.mouseDown = true;        
        if( typeof p.mousePressed == "function" ){ p.mousePressed(); }
        else{ p.mousePressed = true; }
      });

      attach( curElement, "contextmenu", function( e ){
        e.preventDefault();
        e.stopPropagation();
      });

      attach( curElement, "mouseup", function( e ){
        mousePressed = false;
        if( p.mouseClicked ){ p.mouseClicked(); }        
        if( typeof p.mousePressed != "function" ){ p.mousePressed = false; }
        if( p.mouseReleased ){ p.mouseReleased(); }
      });

      attach( document, "keydown", function( e ){
        keyPressed = true;
        p.key = e.keyCode + 32;               
        var i, len = p.codedKeys.length;        
        for( i=0; i < len; i++ ){
            if( p.key == p.codedKeys[ i ] ){
              switch(p.key){
              case 70: p.keyCode = p.UP        ; break;
              case 71: p.keyCode = p.RIGHT    ; break;
              case 72: p.keyCode = p.DOWN      ; break;
              case 69: p.keyCode = p.LEFT      ; break;
              }
              p.key=p.CODED;
            }
        }
        if( e.shiftKey ){ p.key = String.fromCharCode(p.key).toUpperCase().charCodeAt( 0 ); }
        if( typeof p.keyPressed == "function" ){ p.keyPressed(); }
        else{ p.keyPressed = true; }
      });

      attach( document, "keyup", function( e ){
        keyPressed = false;
        if( typeof p.keyPressed != "function" ){ p.keyPressed = false; }
        if( p.keyReleased ){ p.keyReleased(); }
      });

      function attach(elem, type, fn) {
        if( elem.addEventListener ){ elem.addEventListener( type, fn, false ); }
        else{ elem.attachEvent( "on" + type, fn ); }
      }

    };

    return p;
    
  }
/* Included: lalrParser.js */
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
    this.toString = function() { return this.text; };
}

function AstNode(symbol_, index_, begin_, end_, children_, rule_) {
    this.n = symbol_;
    this.i = index_;
    this.b = begin_;
    this.e = end_;
    this.children = children_;
    this.r = rule_;
    this.toString = function() {
        var s = "";
        for (var i = 0; i < this.children.length; ++i) {
            if (i > 0) { s += this.delimiter == undefined ? " " : this.delimiter; }
            s += this.children[i].toString();
        }
        return s;
    };
}

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


/* Included: processingCompiler.js */
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

/* Inculded: Processing grammar converted from XML */
/* Automatically generated grammar for LALR(1) parser */

var processingGrammar = {
 symbols: [
 "EOF",
 "Error",
 "Whitespace",
 "Comment End",
 "Comment Line",
 "Comment Start",
 "-",
 "--",
 "!",
 "!=",
 "%",
 "%=",
 "&",
 "&&",
 "&=",
 "(",
 ")",
 "*",
 "*=",
 ",",
 ".",
 "/",
 "/=",
 ":",
 ";",
 "?",
 "[",
 "]",
 "^",
 "^=",
 "{",
 "|",
 "||",
 "|=",
 "}",
 "~",
 "+",
 "++",
 "+=",
 "<",
 "<<",
 "<<=",
 "<=",
 "=",
 "-=",
 "==",
 ">",
 ">=",
 ">>",
 ">>=",
 ">>>=",
 "abstract",
 "boolean",
 "BooleanLiteral",
 "break",
 "byte",
 "case",
 "catch",
 "char",
 "CharLiteral",
 "class",
 "color",
 "continue",
 "default",
 "do",
 "double",
 "else",
 "extends",
 "final",
 "float",
 "FloatingPointLiteral",
 "FloatingPointLiteralExponent",
 "for",
 "HexIntegerLiteral",
 "Identifier",
 "if",
 "implements",
 "import",
 "instanceof",
 "int",
 "long",
 "native",
 "new",
 "NullLiteral",
 "OctalIntegerLiteral",
 "private",
 "protected",
 "public",
 "return",
 "short",
 "StartWithNoZeroDecimalIntegerLiteral",
 "StartWithZeroDecimalIntegerLiteral",
 "static",
 "string",
 "StringLiteral",
 "super",
 "switch",
 "synchronized",
 "this",
 "throws",
 "transient",
 "try",
 "void",
 "volatile",
 "WebColorLiteral",
 "while",
 "AdditiveExpression",
 "AndExpression",
 "ArgumentList",
 "ArrayAccess",
 "ArrayCreationExpression",
 "ArrayInitializer",
 "ArrayType",
 "Assignment",
 "AssignmentExpression",
 "AssignmentOperator",
 "Block",
 "BlockStatement",
 "BlockStatements",
 "BreakStatement",
 "CastExpression",
 "CatchClause",
 "Catches",
 "ClassBody",
 "ClassBodyDeclaration",
 "ClassBodyDeclarations",
 "ClassDeclaration",
 "ClassInstanceCreationExpression",
 "ClassMemberDeclaration",
 "ClassOrInterfaceType",
 "ClassType",
 "ClassTypeList",
 "ColorInstanceCreation",
 "ColorLiteral",
 "CompilationUnit",
 "ConditionalAndExpression",
 "ConditionalExpression",
 "ConditionalOrExpression",
 "ConstantExpression",
 "ConstructorBody",
 "ConstructorDeclaration",
 "ConstructorDeclarator",
 "ContinueStatement",
 "ConversionName",
 "DecimalIntegerLiteral",
 "DimExpr",
 "DimExprs",
 "Dims",
 "DoStatement",
 "EmptyStatement",
 "EqualityExpression",
 "ExclusiveOrExpression",
 "ExplicitConstructorInvocation",
 "Expression",
 "ExpressionStatement",
 "FieldAccess",
 "FieldDeclaration",
 "FloatingPointType",
 "FloatPointLiteral",
 "ForInit",
 "FormalParameter",
 "FormalParameterList",
 "ForStatement",
 "ForStatementNoShortIf",
 "ForUpdate",
 "GlobalDeclaration",
 "GlobalDeclarations",
 "GlobalMemberDeclaration",
 "GlobalStatement",
 "IfThenElseStatement",
 "IfThenElseStatementNoShortIf",
 "IfThenStatement",
 "ImportDeclaration",
 "ImportDeclarations",
 "InclusiveOrExpression",
 "IntegerLiteral",
 "IntegralType",
 "Interfaces",
 "InterfaceType",
 "InterfaceTypeList",
 "LeftHandSide",
 "Literal",
 "LocalVariableDeclaration",
 "LocalVariableDeclarationStatement",
 "MethodBody",
 "MethodDeclaration",
 "MethodDeclarator",
 "MethodHeader",
 "MethodInvocation",
 "Modifier",
 "Modifiers",
 "MultiplicativeExpression",
 "Name",
 "NumericType",
 "PostDecrementExpression",
 "PostfixExpression",
 "PostIncrementExpression",
 "PreDecrementExpression",
 "PreIncrementExpression",
 "Primary",
 "PrimaryNoNewArray",
 "PrimitiveType",
 "QualifiedName",
 "ReferenceType",
 "RelationalExpression",
 "ReturnStatement",
 "ShiftExpression",
 "SimpleName",
 "SingleTypeImportDeclaration",
 "Statement",
 "StatementExpression",
 "StatementExpressionList",
 "StatementNoShortIf",
 "StatementWithoutTrailingSubstatement",
 "Super",
 "SwitchBlock",
 "SwitchBlockStatementGroup",
 "SwitchBlockStatementGroups",
 "SwitchLabel",
 "SwitchLabels",
 "SwitchStatement",
 "Throws",
 "TryStatement",
 "Type",
 "TypeImportOnDemandDeclaration",
 "UnaryExpression",
 "UnaryExpressionNotPlusMinus",
 "VariableDeclarator",
 "VariableDeclaratorId",
 "VariableDeclarators",
 "VariableInitializer",
 "VariableInitializers",
 "WhileStatement",
 "WhileStatementNoShortIf",
 ],
 rules: [
 {n:144,c:1},
 {n:144,c:1},
 {n:158,c:1},
 {n:158,c:1},
 {n:175,c:1},
 {n:175,c:1},
 {n:175,c:1},
 {n:133,c:1},
 {n:181,c:1},
 {n:181,c:1},
 {n:181,c:1},
 {n:181,c:1},
 {n:181,c:1},
 {n:181,c:1},
 {n:181,c:1},
 {n:223,c:1},
 {n:223,c:1},
 {n:201,c:1},
 {n:201,c:1},
 {n:193,c:1},
 {n:193,c:1},
 {n:176,c:1},
 {n:176,c:1},
 {n:176,c:1},
 {n:176,c:1},
 {n:176,c:1},
 {n:176,c:1},
 {n:157,c:1},
 {n:157,c:1},
 {n:203,c:1},
 {n:203,c:1},
 {n:203,c:1},
 {n:129,c:1},
 {n:130,c:1},
 {n:178,c:1},
 {n:112,c:3},
 {n:112,c:3},
 {n:112,c:3},
 {n:192,c:1},
 {n:192,c:1},
 {n:207,c:1},
 {n:202,c:3},
 {n:134,c:2},
 {n:134,c:1},
 {n:173,c:1},
 {n:173,c:2},
 {n:166,c:1},
 {n:166,c:2},
 {n:165,c:1},
 {n:165,c:1},
 {n:165,c:1},
 {n:168,c:1},
 {n:167,c:1},
 {n:172,c:1},
 {n:172,c:1},
 {n:208,c:3},
 {n:224,c:5},
 {n:190,c:1},
 {n:190,c:2},
 {n:189,c:1},
 {n:189,c:1},
 {n:189,c:1},
 {n:189,c:1},
 {n:189,c:1},
 {n:189,c:1},
 {n:189,c:1},
 {n:189,c:1},
 {n:189,c:1},
 {n:189,c:1},
 {n:126,c:6},
 {n:126,c:5},
 {n:126,c:5},
 {n:126,c:4},
 {n:126,c:5},
 {n:126,c:4},
 {n:126,c:4},
 {n:126,c:3},
 {n:214,c:2},
 {n:177,c:2},
 {n:179,c:1},
 {n:179,c:3},
 {n:123,c:3},
 {n:123,c:2},
 {n:125,c:1},
 {n:125,c:2},
 {n:124,c:1},
 {n:124,c:1},
 {n:128,c:1},
 {n:128,c:1},
 {n:156,c:4},
 {n:156,c:3},
 {n:229,c:1},
 {n:229,c:3},
 {n:227,c:1},
 {n:227,c:3},
 {n:228,c:1},
 {n:228,c:3},
 {n:230,c:1},
 {n:230,c:1},
 {n:185,c:2},
 {n:187,c:4},
 {n:187,c:3},
 {n:187,c:3},
 {n:187,c:2},
 {n:187,c:4},
 {n:187,c:3},
 {n:187,c:3},
 {n:187,c:2},
 {n:186,c:4},
 {n:186,c:3},
 {n:186,c:3},
 {n:161,c:1},
 {n:161,c:3},
 {n:160,c:2},
 {n:221,c:2},
 {n:131,c:1},
 {n:131,c:3},
 {n:184,c:1},
 {n:184,c:1},
 {n:140,c:4},
 {n:140,c:3},
 {n:140,c:3},
 {n:140,c:2},
 {n:141,c:4},
 {n:141,c:3},
 {n:139,c:4},
 {n:139,c:3},
 {n:139,c:3},
 {n:139,c:2},
 {n:152,c:5},
 {n:152,c:4},
 {n:152,c:5},
 {n:152,c:4},
 {n:111,c:4},
 {n:111,c:3},
 {n:111,c:3},
 {n:111,c:2},
 {n:231,c:1},
 {n:231,c:3},
 {n:116,c:3},
 {n:116,c:2},
 {n:118,c:1},
 {n:118,c:2},
 {n:117,c:1},
 {n:117,c:1},
 {n:183,c:2},
 {n:182,c:3},
 {n:182,c:2},
 {n:209,c:1},
 {n:209,c:1},
 {n:209,c:1},
 {n:209,c:1},
 {n:209,c:1},
 {n:212,c:1},
 {n:212,c:1},
 {n:212,c:1},
 {n:212,c:1},
 {n:213,c:1},
 {n:213,c:1},
 {n:213,c:1},
 {n:213,c:1},
 {n:213,c:1},
 {n:213,c:1},
 {n:213,c:1},
 {n:213,c:1},
 {n:213,c:1},
 {n:149,c:1},
 {n:154,c:2},
 {n:210,c:1},
 {n:210,c:1},
 {n:210,c:1},
 {n:210,c:1},
 {n:210,c:1},
 {n:210,c:1},
 {n:210,c:1},
 {n:171,c:5},
 {n:169,c:7},
 {n:170,c:7},
 {n:220,c:5},
 {n:215,c:4},
 {n:215,c:3},
 {n:215,c:3},
 {n:215,c:2},
 {n:217,c:1},
 {n:217,c:2},
 {n:216,c:2},
 {n:219,c:1},
 {n:219,c:2},
 {n:218,c:3},
 {n:218,c:2},
 {n:232,c:5},
 {n:233,c:5},
 {n:148,c:7},
 {n:162,c:9},
 {n:162,c:8},
 {n:162,c:8},
 {n:162,c:7},
 {n:162,c:8},
 {n:162,c:7},
 {n:162,c:7},
 {n:162,c:6},
 {n:163,c:9},
 {n:163,c:8},
 {n:163,c:8},
 {n:163,c:7},
 {n:163,c:8},
 {n:163,c:7},
 {n:163,c:7},
 {n:163,c:6},
 {n:159,c:1},
 {n:159,c:1},
 {n:164,c:1},
 {n:211,c:1},
 {n:211,c:3},
 {n:119,c:2},
 {n:142,c:2},
 {n:205,c:3},
 {n:205,c:2},
 {n:222,c:3},
 {n:122,c:1},
 {n:122,c:2},
 {n:121,c:5},
 {n:199,c:1},
 {n:199,c:1},
 {n:200,c:1},
 {n:200,c:1},
 {n:200,c:3},
 {n:200,c:1},
 {n:200,c:1},
 {n:200,c:1},
 {n:200,c:1},
 {n:127,c:5},
 {n:127,c:4},
 {n:127,c:1},
 {n:132,c:4},
 {n:108,c:1},
 {n:108,c:3},
 {n:110,c:4},
 {n:110,c:3},
 {n:110,c:4},
 {n:110,c:3},
 {n:146,c:1},
 {n:146,c:2},
 {n:145,c:3},
 {n:147,c:2},
 {n:147,c:3},
 {n:155,c:3},
 {n:155,c:3},
 {n:188,c:4},
 {n:188,c:3},
 {n:188,c:6},
 {n:188,c:5},
 {n:188,c:6},
 {n:188,c:5},
 {n:188,c:4},
 {n:109,c:4},
 {n:109,c:4},
 {n:195,c:1},
 {n:195,c:1},
 {n:195,c:1},
 {n:195,c:1},
 {n:196,c:2},
 {n:194,c:2},
 {n:225,c:1},
 {n:225,c:1},
 {n:225,c:2},
 {n:225,c:2},
 {n:225,c:1},
 {n:198,c:2},
 {n:197,c:2},
 {n:226,c:1},
 {n:226,c:2},
 {n:226,c:2},
 {n:226,c:1},
 {n:120,c:5},
 {n:120,c:4},
 {n:120,c:4},
 {n:120,c:5},
 {n:191,c:1},
 {n:191,c:3},
 {n:191,c:3},
 {n:191,c:3},
 {n:106,c:1},
 {n:106,c:3},
 {n:106,c:3},
 {n:206,c:1},
 {n:206,c:3},
 {n:206,c:3},
 {n:204,c:1},
 {n:204,c:3},
 {n:204,c:3},
 {n:204,c:3},
 {n:204,c:3},
 {n:204,c:3},
 {n:150,c:1},
 {n:150,c:3},
 {n:150,c:3},
 {n:107,c:1},
 {n:107,c:3},
 {n:151,c:1},
 {n:151,c:3},
 {n:174,c:1},
 {n:174,c:3},
 {n:135,c:1},
 {n:135,c:3},
 {n:137,c:1},
 {n:137,c:3},
 {n:136,c:1},
 {n:136,c:5},
 {n:114,c:1},
 {n:114,c:1},
 {n:113,c:3},
 {n:180,c:1},
 {n:180,c:1},
 {n:180,c:1},
 {n:115,c:1},
 {n:115,c:1},
 {n:115,c:1},
 {n:115,c:1},
 {n:115,c:1},
 {n:115,c:1},
 {n:115,c:1},
 {n:115,c:1},
 {n:115,c:1},
 {n:115,c:1},
 {n:115,c:1},
 {n:115,c:1},
 {n:143,c:1},
 {n:143,c:1},
 {n:143,c:1},
 {n:143,c:1},
 {n:143,c:1},
 {n:153,c:1},
 {n:138,c:1},
 ],
 charSets: [
 [9,10,11,12,13,32,160],
 [40],
 [41],
 [44],
 [58],
 [59],
 [63],
 [91],
 [93],
 [123],
 [125],
 [126],
 [36,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,95,103,104,106,107,109,111,113,117,120,121,122],
 [34],
 [35],
 [33],
 [37],
 [38],
 [39],
 [42],
 [43],
 [45],
 [46],
 [47],
 [48],
 [49,50,51,52,53,54,55,56,57],
 [60],
 [61],
 [62],
 [94],
 [97],
 [98],
 [99],
 [100],
 [101],
 [102],
 [105],
 [108],
 [110],
 [112],
 [114],
 [115],
 [116],
 [118],
 [119],
 [124],
 [36,48,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,95,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122],
 [9,32,33,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,160],
 [92],
 [32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,160],
 [48,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,97,98,99,100,101,102],
 [32,33,34,35,36,37,38,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,160],
 [48,49,50,51,52,53,54,55,56,57],
 [68,70,100,102],
 [69,101],
 [43,45],
 [120],
 [88],
 [76,108],
 [48,49,50,51,52,53,54,55],
 [56,57],
 [36,48,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,95,97,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122],
 [36,48,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,95,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,116,117,118,119,120,121,122],
 [36,48,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,95,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,117,118,119,120,121,122],
 [36,48,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,95,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,115,116,117,118,119,120,121,122],
 [36,48,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,95,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122],
 [36,48,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,95,97,98,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122],
 [36,48,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,95,97,98,99,100,101,102,103,104,105,106,107,108,109,110,112,113,115,116,117,118,119,120,122],
 [111],
 [121],
 [36,48,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,95,97,98,99,100,101,102,103,104,105,106,107,108,109,110,112,113,114,115,116,117,118,119,120,121,122],
 [36,48,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,95,97,98,99,100,101,102,103,104,105,106,107,109,110,111,112,113,114,115,116,117,118,119,120,121,122],
 [36,48,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,95,97,98,99,100,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122],
 [36,48,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,95,97,98,99,100,101,102,103,104,105,106,107,108,109,111,112,113,114,115,116,117,118,119,120,121,122],
 [36,48,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,95,97,98,99,100,101,102,103,104,105,106,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122],
 [107],
 [36,48,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,95,98,99,100,101,102,103,105,106,107,109,110,112,113,114,115,116,117,118,119,120,121,122],
 [104],
 [36,48,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,95,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,117,118,119,120,121,122],
 [36,48,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,95,97,98,99,100,101,102,103,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122],
 [36,48,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,95,97,98,99,100,101,102,103,104,105,106,107,109,111,112,113,114,115,116,117,118,119,120,121,122],
 [36,48,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,95,97,98,99,100,101,102,103,104,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122],
 [36,48,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,95,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,118,119,120,121,122],
 [117],
 [36,48,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,95,97,98,99,100,102,103,104,105,106,107,108,109,110,112,113,114,115,116,117,118,119,120,121,122],
 [36,48,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,95,97,98,99,100,101,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122],
 [36,48,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,95,97,98,99,100,101,102,103,104,105,106,107,109,110,111,112,113,114,115,116,117,118,119,121,122],
 [36,48,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,95,97,98,99,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122],
 [36,48,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,95,98,99,100,101,102,103,104,106,107,109,110,112,113,114,115,116,117,118,119,120,121,122],
 [36,48,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,95,97,98,99,100,101,103,104,105,106,107,108,111,112,113,114,115,116,117,118,119,120,121,122],
 [109],
 [36,48,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,95,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,113,114,115,116,117,118,119,120,121,122],
 [36,48,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,95,97,98,99,100,101,102,103,104,105,106,107,109,110,112,113,114,115,116,117,118,119,120,121,122],
 [36,48,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,95,97,98,99,100,101,102,103,104,105,106,107,108,110,111,112,113,114,115,116,117,118,119,120,121,122],
 [36,48,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,95,97,98,99,100,101,102,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122],
 [103],
 [36,48,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,95,98,99,100,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,118,119,120,121,122],
 [36,48,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,95,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,119,120,121,122],
 [36,48,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,95,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,120,121,122],
 [36,48,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,95,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,115,116,118,119,120,121,122],
 [36,48,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,95,97,98,99,100,101,102,103,104,106,107,108,109,110,112,113,114,115,116,117,118,119,120,121,122],
 [36,48,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,95,97,98,99,100,101,102,103,105,106,107,108,109,110,111,112,113,114,115,118,120,122],
 [36,48,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,95,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,115,116,117,118,119,120,121,122],
 [36,48,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,95,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121],
 [122],
 [36,48,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,95,97,98,99,100,101,102,103,105,106,107,108,109,110,111,112,113,115,116,117,118,119,120,121,122],
 [36,48,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,95,97,98,99,100,101,102,103,104,106,107,108,109,110,111,112,113,115,116,117,118,119,120,121,122],
 [36,48,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,95,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,118,119,120,122],
 [36,48,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,95,97,98,99,100,101,102,103,104,106,107,109,110,111,112,113,114,115,116,117,118,119,120,121,122],
 ],
 dfaTable: [
 {a:-1,e:[{cs:0,t:1},{cs:1,t:2},{cs:2,t:3},{cs:3,t:4},{cs:4,t:5},{cs:5,t:6},{cs:6,t:7},{cs:7,t:8},{cs:8,t:9},{cs:9,t:10},{cs:10,t:11},{cs:11,t:12},{cs:12,t:13},{cs:13,t:15},{cs:14,t:20},{cs:15,t:27},{cs:16,t:29},{cs:17,t:31},{cs:18,t:34},{cs:19,t:40},{cs:20,t:43},{cs:21,t:46},{cs:22,t:49},{cs:23,t:56},{cs:24,t:60},{cs:25,t:81},{cs:26,t:84},{cs:27,t:88},{cs:28,t:90},{cs:29,t:96},{cs:30,t:98},{cs:31,t:106},{cs:32,t:120},{cs:33,t:144},{cs:34,t:156},{cs:35,t:166},{cs:36,t:181},{cs:37,t:205},{cs:38,t:209},{cs:39,t:220},{cs:40,t:239},{cs:41,t:245},{cs:42,t:279},{cs:43,t:298},{cs:44,t:308},{cs:45,t:313}]},
 {a:2,e:[{cs:0,t:1}]},
 {a:15,e:[]},
 {a:16,e:[]},
 {a:19,e:[]},
 {a:23,e:[]},
 {a:24,e:[]},
 {a:25,e:[]},
 {a:26,e:[]},
 {a:27,e:[]},
 {a:30,e:[]},
 {a:34,e:[]},
 {a:35,e:[]},
 {a:74,e:[{cs:46,t:14}]},
 {a:74,e:[{cs:46,t:14}]},
 {a:-1,e:[{cs:47,t:16},{cs:48,t:17},{cs:13,t:19}]},
 {a:-1,e:[{cs:47,t:16},{cs:48,t:17},{cs:13,t:19}]},
 {a:-1,e:[{cs:49,t:18}]},
 {a:-1,e:[{cs:47,t:16},{cs:48,t:17},{cs:13,t:19}]},
 {a:94,e:[]},
 {a:-1,e:[{cs:50,t:21}]},
 {a:-1,e:[{cs:50,t:22}]},
 {a:-1,e:[{cs:50,t:23}]},
 {a:-1,e:[{cs:50,t:24}]},
 {a:-1,e:[{cs:50,t:25}]},
 {a:-1,e:[{cs:50,t:26}]},
 {a:104,e:[]},
 {a:8,e:[{cs:27,t:28}]},
 {a:9,e:[]},
 {a:10,e:[{cs:27,t:30}]},
 {a:11,e:[]},
 {a:12,e:[{cs:17,t:32},{cs:27,t:33}]},
 {a:13,e:[]},
 {a:14,e:[]},
 {a:-1,e:[{cs:47,t:35},{cs:48,t:37}]},
 {a:-1,e:[{cs:18,t:36}]},
 {a:59,e:[]},
 {a:-1,e:[{cs:49,t:38}]},
 {a:-1,e:[{cs:51,t:38},{cs:18,t:39}]},
 {a:59,e:[{cs:51,t:38},{cs:18,t:39}]},
 {a:17,e:[{cs:23,t:41},{cs:27,t:42}]},
 {a:3,e:[]},
 {a:18,e:[]},
 {a:36,e:[{cs:20,t:44},{cs:27,t:45}]},
 {a:37,e:[]},
 {a:38,e:[]},
 {a:6,e:[{cs:21,t:47},{cs:27,t:48}]},
 {a:7,e:[]},
 {a:44,e:[]},
 {a:20,e:[{cs:52,t:50}]},
 {a:70,e:[{cs:53,t:51},{cs:54,t:52},{cs:52,t:50}]},
 {a:70,e:[]},
 {a:-1,e:[{cs:55,t:53},{cs:52,t:54}]},
 {a:-1,e:[{cs:52,t:54}]},
 {a:71,e:[{cs:52,t:54},{cs:53,t:55}]},
 {a:71,e:[]},
 {a:21,e:[{cs:23,t:57},{cs:19,t:58},{cs:27,t:59}]},
 {a:4,e:[]},
 {a:5,e:[]},
 {a:22,e:[]},
 {a:91,e:[{cs:53,t:61},{cs:54,t:62},{cs:56,t:66},{cs:57,t:69},{cs:58,t:70},{cs:22,t:71},{cs:59,t:78},{cs:60,t:80}]},
 {a:70,e:[]},
 {a:-1,e:[{cs:55,t:63},{cs:52,t:64}]},
 {a:-1,e:[{cs:52,t:64}]},
 {a:71,e:[{cs:52,t:64},{cs:53,t:65}]},
 {a:71,e:[]},
 {a:-1,e:[{cs:50,t:67}]},
 {a:73,e:[{cs:50,t:67},{cs:58,t:68}]},
 {a:73,e:[]},
 {a:-1,e:[{cs:50,t:67}]},
 {a:91,e:[]},
 {a:-1,e:[{cs:52,t:72}]},
 {a:70,e:[{cs:53,t:73},{cs:54,t:74},{cs:52,t:72}]},
 {a:70,e:[]},
 {a:-1,e:[{cs:55,t:75},{cs:52,t:76}]},
 {a:-1,e:[{cs:52,t:76}]},
 {a:71,e:[{cs:52,t:76},{cs:53,t:77}]},
 {a:71,e:[]},
 {a:84,e:[{cs:53,t:61},{cs:54,t:62},{cs:58,t:79},{cs:22,t:71},{cs:59,t:78},{cs:60,t:80}]},
 {a:84,e:[]},
 {a:-1,e:[{cs:53,t:61},{cs:54,t:62},{cs:22,t:71},{cs:52,t:80}]},
 {a:90,e:[{cs:53,t:61},{cs:54,t:62},{cs:58,t:82},{cs:22,t:71},{cs:52,t:83}]},
 {a:90,e:[]},
 {a:90,e:[{cs:53,t:61},{cs:54,t:62},{cs:58,t:82},{cs:22,t:71},{cs:52,t:83}]},
 {a:39,e:[{cs:27,t:85},{cs:26,t:86}]},
 {a:42,e:[]},
 {a:40,e:[{cs:27,t:87}]},
 {a:41,e:[]},
 {a:43,e:[{cs:27,t:89}]},
 {a:45,e:[]},
 {a:46,e:[{cs:27,t:91},{cs:28,t:92}]},
 {a:47,e:[]},
 {a:48,e:[{cs:27,t:93},{cs:28,t:94}]},
 {a:49,e:[]},
 {a:-1,e:[{cs:27,t:95}]},
 {a:50,e:[]},
 {a:28,e:[{cs:27,t:97}]},
 {a:29,e:[]},
 {a:74,e:[{cs:61,t:14},{cs:31,t:99}]},
 {a:74,e:[{cs:62,t:14},{cs:41,t:100}]},
 {a:74,e:[{cs:63,t:14},{cs:42,t:101}]},
 {a:74,e:[{cs:64,t:14},{cs:40,t:102}]},
 {a:74,e:[{cs:65,t:14},{cs:30,t:103}]},
 {a:74,e:[{cs:66,t:14},{cs:32,t:104}]},
 {a:74,e:[{cs:63,t:14},{cs:42,t:105}]},
 {a:51,e:[{cs:46,t:14}]},
 {a:74,e:[{cs:67,t:14},{cs:68,t:107},{cs:40,t:113},{cs:69,t:117}]},
 {a:74,e:[{cs:70,t:14},{cs:68,t:108}]},
 {a:74,e:[{cs:71,t:14},{cs:37,t:109}]},
 {a:74,e:[{cs:72,t:14},{cs:34,t:110}]},
 {a:74,e:[{cs:65,t:14},{cs:30,t:111}]},
 {a:74,e:[{cs:73,t:14},{cs:38,t:112}]},
 {a:52,e:[{cs:46,t:14}]},
 {a:74,e:[{cs:72,t:14},{cs:34,t:114}]},
 {a:74,e:[{cs:65,t:14},{cs:30,t:115}]},
 {a:74,e:[{cs:74,t:14},{cs:75,t:116}]},
 {a:54,e:[{cs:46,t:14}]},
 {a:74,e:[{cs:63,t:14},{cs:42,t:118}]},
 {a:74,e:[{cs:72,t:14},{cs:34,t:119}]},
 {a:55,e:[{cs:46,t:14}]},
 {a:74,e:[{cs:76,t:14},{cs:30,t:121},{cs:77,t:127},{cs:37,t:130},{cs:68,t:134}]},
 {a:74,e:[{cs:78,t:14},{cs:41,t:122},{cs:42,t:124}]},
 {a:74,e:[{cs:72,t:14},{cs:34,t:123}]},
 {a:56,e:[{cs:46,t:14}]},
 {a:74,e:[{cs:66,t:14},{cs:32,t:125}]},
 {a:74,e:[{cs:79,t:14},{cs:77,t:126}]},
 {a:57,e:[{cs:46,t:14}]},
 {a:74,e:[{cs:65,t:14},{cs:30,t:128}]},
 {a:74,e:[{cs:64,t:14},{cs:40,t:129}]},
 {a:58,e:[{cs:46,t:14}]},
 {a:74,e:[{cs:65,t:14},{cs:30,t:131}]},
 {a:74,e:[{cs:62,t:14},{cs:41,t:132}]},
 {a:74,e:[{cs:62,t:14},{cs:41,t:133}]},
 {a:60,e:[{cs:46,t:14}]},
 {a:74,e:[{cs:80,t:14},{cs:37,t:135},{cs:38,t:138}]},
 {a:74,e:[{cs:70,t:14},{cs:68,t:136}]},
 {a:74,e:[{cs:64,t:14},{cs:40,t:137}]},
 {a:61,e:[{cs:46,t:14}]},
 {a:74,e:[{cs:63,t:14},{cs:42,t:139}]},
 {a:74,e:[{cs:81,t:14},{cs:36,t:140}]},
 {a:74,e:[{cs:73,t:14},{cs:38,t:141}]},
 {a:74,e:[{cs:82,t:14},{cs:83,t:142}]},
 {a:74,e:[{cs:72,t:14},{cs:34,t:143}]},
 {a:62,e:[{cs:46,t:14}]},
 {a:74,e:[{cs:84,t:14},{cs:34,t:145},{cs:68,t:151}]},
 {a:74,e:[{cs:85,t:14},{cs:35,t:146}]},
 {a:74,e:[{cs:65,t:14},{cs:30,t:147}]},
 {a:74,e:[{cs:82,t:14},{cs:83,t:148}]},
 {a:74,e:[{cs:71,t:14},{cs:37,t:149}]},
 {a:74,e:[{cs:63,t:14},{cs:42,t:150}]},
 {a:63,e:[{cs:46,t:14}]},
 {a:64,e:[{cs:82,t:14},{cs:83,t:152}]},
 {a:74,e:[{cs:61,t:14},{cs:31,t:153}]},
 {a:74,e:[{cs:71,t:14},{cs:37,t:154}]},
 {a:74,e:[{cs:72,t:14},{cs:34,t:155}]},
 {a:65,e:[{cs:46,t:14}]},
 {a:74,e:[{cs:86,t:14},{cs:37,t:157},{cs:56,t:160}]},
 {a:74,e:[{cs:62,t:14},{cs:41,t:158}]},
 {a:74,e:[{cs:72,t:14},{cs:34,t:159}]},
 {a:66,e:[{cs:46,t:14}]},
 {a:74,e:[{cs:63,t:14},{cs:42,t:161}]},
 {a:74,e:[{cs:72,t:14},{cs:34,t:162}]},
 {a:74,e:[{cs:73,t:14},{cs:38,t:163}]},
 {a:74,e:[{cs:87,t:14},{cs:33,t:164}]},
 {a:74,e:[{cs:62,t:14},{cs:41,t:165}]},
 {a:67,e:[{cs:46,t:14}]},
 {a:74,e:[{cs:88,t:14},{cs:30,t:167},{cs:36,t:171},{cs:37,t:175},{cs:68,t:179}]},
 {a:74,e:[{cs:71,t:14},{cs:37,t:168}]},
 {a:74,e:[{cs:62,t:14},{cs:41,t:169}]},
 {a:74,e:[{cs:72,t:14},{cs:34,t:170}]},
 {a:53,e:[{cs:46,t:14}]},
 {a:74,e:[{cs:73,t:14},{cs:38,t:172}]},
 {a:74,e:[{cs:65,t:14},{cs:30,t:173}]},
 {a:74,e:[{cs:71,t:14},{cs:37,t:174}]},
 {a:68,e:[{cs:46,t:14}]},
 {a:74,e:[{cs:70,t:14},{cs:68,t:176}]},
 {a:74,e:[{cs:65,t:14},{cs:30,t:177}]},
 {a:74,e:[{cs:63,t:14},{cs:42,t:178}]},
 {a:69,e:[{cs:46,t:14}]},
 {a:74,e:[{cs:64,t:14},{cs:40,t:180}]},
 {a:72,e:[{cs:46,t:14}]},
 {a:74,e:[{cs:89,t:14},{cs:35,t:182},{cs:90,t:183},{cs:38,t:195}]},
 {a:75,e:[{cs:46,t:14}]},
 {a:74,e:[{cs:91,t:14},{cs:39,t:184}]},
 {a:74,e:[{cs:92,t:14},{cs:37,t:185},{cs:68,t:192}]},
 {a:74,e:[{cs:72,t:14},{cs:34,t:186}]},
 {a:74,e:[{cs:93,t:14},{cs:90,t:187}]},
 {a:74,e:[{cs:72,t:14},{cs:34,t:188}]},
 {a:74,e:[{cs:73,t:14},{cs:38,t:189}]},
 {a:74,e:[{cs:63,t:14},{cs:42,t:190}]},
 {a:74,e:[{cs:62,t:14},{cs:41,t:191}]},
 {a:76,e:[{cs:46,t:14}]},
 {a:74,e:[{cs:64,t:14},{cs:40,t:193}]},
 {a:74,e:[{cs:63,t:14},{cs:42,t:194}]},
 {a:77,e:[{cs:46,t:14}]},
 {a:74,e:[{cs:78,t:14},{cs:41,t:196},{cs:42,t:204}]},
 {a:74,e:[{cs:63,t:14},{cs:42,t:197}]},
 {a:74,e:[{cs:65,t:14},{cs:30,t:198}]},
 {a:74,e:[{cs:73,t:14},{cs:38,t:199}]},
 {a:74,e:[{cs:66,t:14},{cs:32,t:200}]},
 {a:74,e:[{cs:72,t:14},{cs:34,t:201}]},
 {a:74,e:[{cs:70,t:14},{cs:68,t:202}]},
 {a:74,e:[{cs:85,t:14},{cs:35,t:203}]},
 {a:78,e:[{cs:46,t:14}]},
 {a:79,e:[{cs:46,t:14}]},
 {a:74,e:[{cs:70,t:14},{cs:68,t:206}]},
 {a:74,e:[{cs:73,t:14},{cs:38,t:207}]},
 {a:74,e:[{cs:94,t:14},{cs:95,t:208}]},
 {a:80,e:[{cs:46,t:14}]},
 {a:74,e:[{cs:96,t:14},{cs:30,t:210},{cs:34,t:215},{cs:83,t:217}]},
 {a:74,e:[{cs:63,t:14},{cs:42,t:211}]},
 {a:74,e:[{cs:81,t:14},{cs:36,t:212}]},
 {a:74,e:[{cs:97,t:14},{cs:43,t:213}]},
 {a:74,e:[{cs:72,t:14},{cs:34,t:214}]},
 {a:81,e:[{cs:46,t:14}]},
 {a:74,e:[{cs:98,t:14},{cs:44,t:216}]},
 {a:82,e:[{cs:46,t:14}]},
 {a:74,e:[{cs:71,t:14},{cs:37,t:218}]},
 {a:74,e:[{cs:71,t:14},{cs:37,t:219}]},
 {a:83,e:[{cs:46,t:14}]},
 {a:74,e:[{cs:99,t:14},{cs:40,t:221},{cs:83,t:234}]},
 {a:74,e:[{cs:100,t:14},{cs:36,t:222},{cs:68,t:227}]},
 {a:74,e:[{cs:97,t:14},{cs:43,t:223}]},
 {a:74,e:[{cs:65,t:14},{cs:30,t:224}]},
 {a:74,e:[{cs:63,t:14},{cs:42,t:225}]},
 {a:74,e:[{cs:72,t:14},{cs:34,t:226}]},
 {a:85,e:[{cs:46,t:14}]},
 {a:74,e:[{cs:63,t:14},{cs:42,t:228}]},
 {a:74,e:[{cs:72,t:14},{cs:34,t:229}]},
 {a:74,e:[{cs:66,t:14},{cs:32,t:230}]},
 {a:74,e:[{cs:63,t:14},{cs:42,t:231}]},
 {a:74,e:[{cs:72,t:14},{cs:34,t:232}]},
 {a:74,e:[{cs:87,t:14},{cs:33,t:233}]},
 {a:86,e:[{cs:46,t:14}]},
 {a:74,e:[{cs:61,t:14},{cs:31,t:235}]},
 {a:74,e:[{cs:71,t:14},{cs:37,t:236}]},
 {a:74,e:[{cs:81,t:14},{cs:36,t:237}]},
 {a:74,e:[{cs:66,t:14},{cs:32,t:238}]},
 {a:87,e:[{cs:46,t:14}]},
 {a:74,e:[{cs:72,t:14},{cs:34,t:240}]},
 {a:74,e:[{cs:63,t:14},{cs:42,t:241}]},
 {a:74,e:[{cs:82,t:14},{cs:83,t:242}]},
 {a:74,e:[{cs:64,t:14},{cs:40,t:243}]},
 {a:74,e:[{cs:73,t:14},{cs:38,t:244}]},
 {a:88,e:[{cs:46,t:14}]},
 {a:74,e:[{cs:101,t:14},{cs:77,t:246},{cs:42,t:250},{cs:83,t:259},{cs:44,t:263},{cs:69,t:268}]},
 {a:74,e:[{cs:70,t:14},{cs:68,t:247}]},
 {a:74,e:[{cs:64,t:14},{cs:40,t:248}]},
 {a:74,e:[{cs:63,t:14},{cs:42,t:249}]},
 {a:89,e:[{cs:46,t:14}]},
 {a:74,e:[{cs:102,t:14},{cs:30,t:251},{cs:40,t:255}]},
 {a:74,e:[{cs:63,t:14},{cs:42,t:252}]},
 {a:74,e:[{cs:81,t:14},{cs:36,t:253}]},
 {a:74,e:[{cs:66,t:14},{cs:32,t:254}]},
 {a:92,e:[{cs:46,t:14}]},
 {a:74,e:[{cs:81,t:14},{cs:36,t:256}]},
 {a:74,e:[{cs:73,t:14},{cs:38,t:257}]},
 {a:74,e:[{cs:94,t:14},{cs:95,t:258}]},
 {a:93,e:[{cs:46,t:14}]},
 {a:74,e:[{cs:91,t:14},{cs:39,t:260}]},
 {a:74,e:[{cs:72,t:14},{cs:34,t:261}]},
 {a:74,e:[{cs:64,t:14},{cs:40,t:262}]},
 {a:95,e:[{cs:46,t:14}]},
 {a:74,e:[{cs:81,t:14},{cs:36,t:264}]},
 {a:74,e:[{cs:63,t:14},{cs:42,t:265}]},
 {a:74,e:[{cs:66,t:14},{cs:32,t:266}]},
 {a:74,e:[{cs:79,t:14},{cs:77,t:267}]},
 {a:96,e:[{cs:46,t:14}]},
 {a:74,e:[{cs:73,t:14},{cs:38,t:269}]},
 {a:74,e:[{cs:66,t:14},{cs:32,t:270}]},
 {a:74,e:[{cs:79,t:14},{cs:77,t:271}]},
 {a:74,e:[{cs:64,t:14},{cs:40,t:272}]},
 {a:74,e:[{cs:70,t:14},{cs:68,t:273}]},
 {a:74,e:[{cs:73,t:14},{cs:38,t:274}]},
 {a:74,e:[{cs:81,t:14},{cs:36,t:275}]},
 {a:74,e:[{cs:103,t:14},{cs:104,t:276}]},
 {a:74,e:[{cs:72,t:14},{cs:34,t:277}]},
 {a:74,e:[{cs:87,t:14},{cs:33,t:278}]},
 {a:97,e:[{cs:46,t:14}]},
 {a:74,e:[{cs:105,t:14},{cs:77,t:280},{cs:40,t:287}]},
 {a:74,e:[{cs:106,t:14},{cs:36,t:281},{cs:40,t:283}]},
 {a:74,e:[{cs:62,t:14},{cs:41,t:282}]},
 {a:98,e:[{cs:46,t:14}]},
 {a:74,e:[{cs:70,t:14},{cs:68,t:284}]},
 {a:74,e:[{cs:98,t:14},{cs:44,t:285}]},
 {a:74,e:[{cs:62,t:14},{cs:41,t:286}]},
 {a:99,e:[{cs:46,t:14}]},
 {a:74,e:[{cs:107,t:14},{cs:30,t:288},{cs:83,t:295},{cs:69,t:297}]},
 {a:74,e:[{cs:73,t:14},{cs:38,t:289}]},
 {a:74,e:[{cs:62,t:14},{cs:41,t:290}]},
 {a:74,e:[{cs:81,t:14},{cs:36,t:291}]},
 {a:74,e:[{cs:72,t:14},{cs:34,t:292}]},
 {a:74,e:[{cs:73,t:14},{cs:38,t:293}]},
 {a:74,e:[{cs:63,t:14},{cs:42,t:294}]},
 {a:100,e:[{cs:46,t:14}]},
 {a:74,e:[{cs:72,t:14},{cs:34,t:296}]},
 {a:53,e:[{cs:46,t:14}]},
 {a:101,e:[{cs:46,t:14}]},
 {a:74,e:[{cs:70,t:14},{cs:68,t:299}]},
 {a:74,e:[{cs:108,t:14},{cs:36,t:300},{cs:37,t:302}]},
 {a:74,e:[{cs:87,t:14},{cs:33,t:301}]},
 {a:102,e:[{cs:46,t:14}]},
 {a:74,e:[{cs:65,t:14},{cs:30,t:303}]},
 {a:74,e:[{cs:63,t:14},{cs:42,t:304}]},
 {a:74,e:[{cs:81,t:14},{cs:36,t:305}]},
 {a:74,e:[{cs:71,t:14},{cs:37,t:306}]},
 {a:74,e:[{cs:72,t:14},{cs:34,t:307}]},
 {a:103,e:[{cs:46,t:14}]},
 {a:74,e:[{cs:79,t:14},{cs:77,t:309}]},
 {a:74,e:[{cs:81,t:14},{cs:36,t:310}]},
 {a:74,e:[{cs:71,t:14},{cs:37,t:311}]},
 {a:74,e:[{cs:72,t:14},{cs:34,t:312}]},
 {a:105,e:[{cs:46,t:14}]},
 {a:31,e:[{cs:45,t:314},{cs:27,t:315}]},
 {a:32,e:[]},
 {a:33,e:[]},
 ],
 dfaTableInitialState: 0,
 lalrTable: [
 [{k:1,s:7,v:1},{k:1,s:15,v:2},{k:1,s:24,v:3},{k:1,s:30,v:4},{k:1,s:37,v:5},{k:1,s:51,v:6},{k:1,s:52,v:7},{k:1,s:53,v:8},{k:1,s:54,v:9},{k:1,s:55,v:10},{k:1,s:58,v:11},{k:1,s:59,v:12},{k:1,s:60,v:13},{k:1,s:61,v:14},{k:1,s:62,v:15},{k:1,s:64,v:16},{k:1,s:65,v:17},{k:1,s:68,v:18},{k:1,s:69,v:19},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:72,v:22},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:75,v:25},{k:1,s:77,v:26},{k:1,s:79,v:27},{k:1,s:80,v:28},{k:1,s:81,v:29},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:85,v:33},{k:1,s:86,v:34},{k:1,s:87,v:35},{k:1,s:88,v:36},{k:1,s:89,v:37},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:92,v:40},{k:1,s:93,v:41},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:96,v:44},{k:1,s:97,v:45},{k:1,s:98,v:46},{k:1,s:100,v:47},{k:1,s:101,v:48},{k:1,s:102,v:49},{k:1,s:103,v:50},{k:1,s:104,v:51},{k:1,s:105,v:52},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:112,v:55},{k:3,s:113,v:56},{k:3,s:116,v:57},{k:3,s:119,v:58},{k:3,s:126,v:59},{k:3,s:127,v:60},{k:3,s:128,v:61},{k:3,s:129,v:62},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:134,v:65},{k:3,s:142,v:66},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:148,v:69},{k:3,s:149,v:70},{k:3,s:154,v:71},{k:3,s:155,v:72},{k:3,s:156,v:73},{k:3,s:157,v:74},{k:3,s:158,v:75},{k:3,s:162,v:76},{k:3,s:165,v:77},{k:3,s:166,v:78},{k:3,s:167,v:79},{k:3,s:168,v:80},{k:3,s:169,v:81},{k:3,s:171,v:82},{k:3,s:172,v:83},{k:3,s:173,v:84},{k:3,s:175,v:85},{k:3,s:176,v:86},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:185,v:89},{k:3,s:187,v:90},{k:3,s:188,v:91},{k:3,s:189,v:92},{k:3,s:190,v:93},{k:3,s:192,v:94},{k:3,s:193,v:95},{k:3,s:194,v:96},{k:3,s:195,v:97},{k:3,s:196,v:98},{k:3,s:197,v:99},{k:3,s:198,v:100},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:201,v:103},{k:3,s:202,v:104},{k:3,s:203,v:105},{k:3,s:205,v:106},{k:3,s:207,v:107},{k:3,s:208,v:108},{k:3,s:209,v:109},{k:3,s:210,v:110},{k:3,s:213,v:111},{k:3,s:220,v:112},{k:3,s:222,v:113},{k:3,s:223,v:114},{k:3,s:224,v:115},{k:3,s:232,v:116}],
 [{k:1,s:6,v:117},{k:1,s:7,v:1},{k:1,s:8,v:118},{k:1,s:15,v:119},{k:1,s:35,v:120},{k:1,s:36,v:121},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:109,v:128},{k:3,s:110,v:54},{k:3,s:120,v:129},{k:3,s:127,v:130},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:155,v:131},{k:3,s:158,v:75},{k:3,s:175,v:85},{k:3,s:181,v:88},{k:3,s:188,v:132},{k:3,s:192,v:133},{k:3,s:194,v:134},{k:3,s:195,v:135},{k:3,s:196,v:136},{k:3,s:197,v:137},{k:3,s:198,v:138},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:207,v:107},{k:3,s:225,v:139},{k:3,s:226,v:140}],
 [{k:1,s:6,v:117},{k:1,s:7,v:1},{k:1,s:8,v:118},{k:1,s:15,v:119},{k:1,s:35,v:120},{k:1,s:36,v:121},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:106,v:141},{k:3,s:107,v:142},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:113,v:143},{k:3,s:114,v:144},{k:3,s:120,v:129},{k:3,s:127,v:130},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:135,v:145},{k:3,s:136,v:146},{k:3,s:137,v:147},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:150,v:148},{k:3,s:151,v:149},{k:3,s:153,v:150},{k:3,s:155,v:72},{k:3,s:158,v:75},{k:3,s:174,v:151},{k:3,s:175,v:85},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:188,v:132},{k:3,s:191,v:152},{k:3,s:192,v:153},{k:3,s:194,v:134},{k:3,s:195,v:135},{k:3,s:196,v:136},{k:3,s:197,v:137},{k:3,s:198,v:138},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:204,v:154},{k:3,s:206,v:155},{k:3,s:207,v:107},{k:3,s:225,v:156},{k:3,s:226,v:140}],
 [{k:2,s:0,v:166},{k:2,s:7,v:166},{k:2,s:15,v:166},{k:2,s:24,v:166},{k:2,s:30,v:166},{k:2,s:34,v:166},{k:2,s:37,v:166},{k:2,s:51,v:166},{k:2,s:52,v:166},{k:2,s:53,v:166},{k:2,s:54,v:166},{k:2,s:55,v:166},{k:2,s:56,v:166},{k:2,s:58,v:166},{k:2,s:59,v:166},{k:2,s:60,v:166},{k:2,s:61,v:166},{k:2,s:62,v:166},{k:2,s:63,v:166},{k:2,s:64,v:166},{k:2,s:65,v:166},{k:2,s:66,v:166},{k:2,s:68,v:166},{k:2,s:69,v:166},{k:2,s:70,v:166},{k:2,s:71,v:166},{k:2,s:72,v:166},{k:2,s:73,v:166},{k:2,s:74,v:166},{k:2,s:75,v:166},{k:2,s:79,v:166},{k:2,s:80,v:166},{k:2,s:81,v:166},{k:2,s:82,v:166},{k:2,s:83,v:166},{k:2,s:84,v:166},{k:2,s:85,v:166},{k:2,s:86,v:166},{k:2,s:87,v:166},{k:2,s:88,v:166},{k:2,s:89,v:166},{k:2,s:90,v:166},{k:2,s:91,v:166},{k:2,s:92,v:166},{k:2,s:93,v:166},{k:2,s:94,v:166},{k:2,s:95,v:166},{k:2,s:96,v:166},{k:2,s:97,v:166},{k:2,s:98,v:166},{k:2,s:100,v:166},{k:2,s:101,v:166},{k:2,s:102,v:166},{k:2,s:103,v:166},{k:2,s:104,v:166},{k:2,s:105,v:166}],
 [{k:1,s:7,v:1},{k:1,s:15,v:2},{k:1,s:24,v:3},{k:1,s:30,v:4},{k:1,s:34,v:157},{k:1,s:37,v:5},{k:1,s:51,v:6},{k:1,s:52,v:7},{k:1,s:53,v:8},{k:1,s:54,v:9},{k:1,s:55,v:10},{k:1,s:58,v:11},{k:1,s:59,v:12},{k:1,s:61,v:14},{k:1,s:62,v:15},{k:1,s:64,v:16},{k:1,s:65,v:17},{k:1,s:68,v:18},{k:1,s:69,v:19},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:72,v:22},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:75,v:25},{k:1,s:79,v:27},{k:1,s:80,v:28},{k:1,s:81,v:29},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:85,v:33},{k:1,s:86,v:34},{k:1,s:87,v:35},{k:1,s:88,v:36},{k:1,s:89,v:37},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:92,v:40},{k:1,s:93,v:41},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:96,v:44},{k:1,s:97,v:45},{k:1,s:98,v:46},{k:1,s:100,v:47},{k:1,s:101,v:48},{k:1,s:103,v:50},{k:1,s:104,v:51},{k:1,s:105,v:52},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:112,v:55},{k:3,s:113,v:56},{k:3,s:116,v:57},{k:3,s:117,v:158},{k:3,s:118,v:159},{k:3,s:119,v:58},{k:3,s:127,v:60},{k:3,s:129,v:62},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:142,v:66},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:148,v:69},{k:3,s:149,v:70},{k:3,s:154,v:71},{k:3,s:155,v:72},{k:3,s:157,v:74},{k:3,s:158,v:75},{k:3,s:162,v:76},{k:3,s:169,v:81},{k:3,s:171,v:82},{k:3,s:175,v:85},{k:3,s:176,v:86},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:182,v:160},{k:3,s:183,v:161},{k:3,s:188,v:91},{k:3,s:189,v:92},{k:3,s:190,v:162},{k:3,s:192,v:94},{k:3,s:193,v:95},{k:3,s:194,v:96},{k:3,s:195,v:97},{k:3,s:196,v:98},{k:3,s:197,v:99},{k:3,s:198,v:100},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:201,v:103},{k:3,s:202,v:104},{k:3,s:203,v:105},{k:3,s:205,v:106},{k:3,s:207,v:107},{k:3,s:209,v:163},{k:3,s:210,v:110},{k:3,s:213,v:111},{k:3,s:220,v:112},{k:3,s:222,v:113},{k:3,s:223,v:164},{k:3,s:232,v:116}],
 [{k:1,s:6,v:117},{k:1,s:7,v:1},{k:1,s:8,v:118},{k:1,s:15,v:119},{k:1,s:35,v:120},{k:1,s:36,v:121},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:109,v:128},{k:3,s:110,v:54},{k:3,s:120,v:129},{k:3,s:127,v:130},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:155,v:131},{k:3,s:158,v:75},{k:3,s:175,v:85},{k:3,s:181,v:88},{k:3,s:188,v:132},{k:3,s:192,v:133},{k:3,s:194,v:134},{k:3,s:195,v:135},{k:3,s:196,v:136},{k:3,s:197,v:137},{k:3,s:198,v:138},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:207,v:107},{k:3,s:225,v:165},{k:3,s:226,v:140}],
 [{k:2,s:51,v:63},{k:2,s:52,v:63},{k:2,s:55,v:63},{k:2,s:58,v:63},{k:2,s:60,v:63},{k:2,s:61,v:63},{k:2,s:65,v:63},{k:2,s:68,v:63},{k:2,s:69,v:63},{k:2,s:74,v:63},{k:2,s:79,v:63},{k:2,s:80,v:63},{k:2,s:81,v:63},{k:2,s:85,v:63},{k:2,s:86,v:63},{k:2,s:87,v:63},{k:2,s:89,v:63},{k:2,s:92,v:63},{k:2,s:93,v:63},{k:2,s:97,v:63},{k:2,s:100,v:63},{k:2,s:102,v:63},{k:2,s:103,v:63}],
 [{k:2,s:16,v:18},{k:2,s:26,v:18},{k:2,s:74,v:18},{k:2,s:15,v:327}],
 [{k:2,s:6,v:10},{k:2,s:7,v:10},{k:2,s:9,v:10},{k:2,s:10,v:10},{k:2,s:12,v:10},{k:2,s:13,v:10},{k:2,s:16,v:10},{k:2,s:17,v:10},{k:2,s:19,v:10},{k:2,s:20,v:10},{k:2,s:21,v:10},{k:2,s:23,v:10},{k:2,s:24,v:10},{k:2,s:25,v:10},{k:2,s:26,v:10},{k:2,s:27,v:10},{k:2,s:28,v:10},{k:2,s:31,v:10},{k:2,s:32,v:10},{k:2,s:34,v:10},{k:2,s:36,v:10},{k:2,s:37,v:10},{k:2,s:39,v:10},{k:2,s:40,v:10},{k:2,s:42,v:10},{k:2,s:45,v:10},{k:2,s:46,v:10},{k:2,s:47,v:10},{k:2,s:48,v:10},{k:2,s:78,v:10}],
 [{k:1,s:24,v:166}],
 [{k:2,s:16,v:21},{k:2,s:26,v:21},{k:2,s:74,v:21},{k:2,s:15,v:328}],
 [{k:2,s:16,v:25},{k:2,s:26,v:25},{k:2,s:74,v:25},{k:2,s:15,v:329}],
 [{k:2,s:6,v:11},{k:2,s:7,v:11},{k:2,s:9,v:11},{k:2,s:10,v:11},{k:2,s:12,v:11},{k:2,s:13,v:11},{k:2,s:16,v:11},{k:2,s:17,v:11},{k:2,s:19,v:11},{k:2,s:20,v:11},{k:2,s:21,v:11},{k:2,s:23,v:11},{k:2,s:24,v:11},{k:2,s:25,v:11},{k:2,s:26,v:11},{k:2,s:27,v:11},{k:2,s:28,v:11},{k:2,s:31,v:11},{k:2,s:32,v:11},{k:2,s:34,v:11},{k:2,s:36,v:11},{k:2,s:37,v:11},{k:2,s:39,v:11},{k:2,s:40,v:11},{k:2,s:42,v:11},{k:2,s:45,v:11},{k:2,s:46,v:11},{k:2,s:47,v:11},{k:2,s:48,v:11},{k:2,s:78,v:11}],
 [{k:1,s:74,v:167}],
 [{k:1,s:15,v:168},{k:2,s:16,v:26},{k:2,s:26,v:26},{k:2,s:74,v:26}],
 [{k:1,s:24,v:169}],
 [{k:1,s:7,v:1},{k:1,s:15,v:2},{k:1,s:24,v:3},{k:1,s:30,v:4},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:54,v:9},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:62,v:15},{k:1,s:64,v:16},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:72,v:22},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:75,v:25},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:88,v:36},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:96,v:44},{k:1,s:98,v:46},{k:1,s:101,v:48},{k:1,s:104,v:51},{k:1,s:105,v:52},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:113,v:56},{k:3,s:116,v:57},{k:3,s:119,v:58},{k:3,s:127,v:60},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:142,v:66},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:148,v:69},{k:3,s:149,v:70},{k:3,s:154,v:71},{k:3,s:155,v:72},{k:3,s:158,v:75},{k:3,s:162,v:76},{k:3,s:169,v:81},{k:3,s:171,v:82},{k:3,s:175,v:85},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:188,v:91},{k:3,s:192,v:153},{k:3,s:194,v:96},{k:3,s:195,v:97},{k:3,s:196,v:98},{k:3,s:197,v:99},{k:3,s:198,v:100},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:205,v:106},{k:3,s:207,v:107},{k:3,s:209,v:170},{k:3,s:210,v:110},{k:3,s:213,v:111},{k:3,s:220,v:112},{k:3,s:222,v:113},{k:3,s:232,v:116}],
 [{k:2,s:16,v:28},{k:2,s:26,v:28},{k:2,s:74,v:28}],
 [{k:2,s:51,v:64},{k:2,s:52,v:64},{k:2,s:55,v:64},{k:2,s:58,v:64},{k:2,s:60,v:64},{k:2,s:61,v:64},{k:2,s:65,v:64},{k:2,s:68,v:64},{k:2,s:69,v:64},{k:2,s:74,v:64},{k:2,s:79,v:64},{k:2,s:80,v:64},{k:2,s:81,v:64},{k:2,s:85,v:64},{k:2,s:86,v:64},{k:2,s:87,v:64},{k:2,s:89,v:64},{k:2,s:92,v:64},{k:2,s:93,v:64},{k:2,s:97,v:64},{k:2,s:100,v:64},{k:2,s:102,v:64},{k:2,s:103,v:64}],
 [{k:2,s:16,v:27},{k:2,s:26,v:27},{k:2,s:74,v:27},{k:2,s:15,v:330}],
 [{k:2,s:6,v:2},{k:2,s:7,v:2},{k:2,s:9,v:2},{k:2,s:10,v:2},{k:2,s:12,v:2},{k:2,s:13,v:2},{k:2,s:16,v:2},{k:2,s:17,v:2},{k:2,s:19,v:2},{k:2,s:20,v:2},{k:2,s:21,v:2},{k:2,s:23,v:2},{k:2,s:24,v:2},{k:2,s:25,v:2},{k:2,s:26,v:2},{k:2,s:27,v:2},{k:2,s:28,v:2},{k:2,s:31,v:2},{k:2,s:32,v:2},{k:2,s:34,v:2},{k:2,s:36,v:2},{k:2,s:37,v:2},{k:2,s:39,v:2},{k:2,s:40,v:2},{k:2,s:42,v:2},{k:2,s:45,v:2},{k:2,s:46,v:2},{k:2,s:47,v:2},{k:2,s:48,v:2},{k:2,s:78,v:2}],
 [{k:2,s:6,v:3},{k:2,s:7,v:3},{k:2,s:9,v:3},{k:2,s:10,v:3},{k:2,s:12,v:3},{k:2,s:13,v:3},{k:2,s:16,v:3},{k:2,s:17,v:3},{k:2,s:19,v:3},{k:2,s:20,v:3},{k:2,s:21,v:3},{k:2,s:23,v:3},{k:2,s:24,v:3},{k:2,s:25,v:3},{k:2,s:26,v:3},{k:2,s:27,v:3},{k:2,s:28,v:3},{k:2,s:31,v:3},{k:2,s:32,v:3},{k:2,s:34,v:3},{k:2,s:36,v:3},{k:2,s:37,v:3},{k:2,s:39,v:3},{k:2,s:40,v:3},{k:2,s:42,v:3},{k:2,s:45,v:3},{k:2,s:46,v:3},{k:2,s:47,v:3},{k:2,s:48,v:3},{k:2,s:78,v:3}],
 [{k:1,s:15,v:171}],
 [{k:2,s:6,v:5},{k:2,s:7,v:5},{k:2,s:9,v:5},{k:2,s:10,v:5},{k:2,s:12,v:5},{k:2,s:13,v:5},{k:2,s:16,v:5},{k:2,s:17,v:5},{k:2,s:19,v:5},{k:2,s:20,v:5},{k:2,s:21,v:5},{k:2,s:23,v:5},{k:2,s:24,v:5},{k:2,s:25,v:5},{k:2,s:26,v:5},{k:2,s:27,v:5},{k:2,s:28,v:5},{k:2,s:31,v:5},{k:2,s:32,v:5},{k:2,s:34,v:5},{k:2,s:36,v:5},{k:2,s:37,v:5},{k:2,s:39,v:5},{k:2,s:40,v:5},{k:2,s:42,v:5},{k:2,s:45,v:5},{k:2,s:46,v:5},{k:2,s:47,v:5},{k:2,s:48,v:5},{k:2,s:78,v:5}],
 [{k:2,s:6,v:40},{k:2,s:7,v:40},{k:2,s:9,v:40},{k:2,s:10,v:40},{k:2,s:11,v:40},{k:2,s:12,v:40},{k:2,s:13,v:40},{k:2,s:14,v:40},{k:2,s:15,v:40},{k:2,s:16,v:40},{k:2,s:17,v:40},{k:2,s:18,v:40},{k:2,s:19,v:40},{k:2,s:20,v:40},{k:2,s:21,v:40},{k:2,s:22,v:40},{k:2,s:23,v:40},{k:2,s:24,v:40},{k:2,s:25,v:40},{k:2,s:26,v:40},{k:2,s:27,v:40},{k:2,s:28,v:40},{k:2,s:29,v:40},{k:2,s:30,v:40},{k:2,s:31,v:40},{k:2,s:32,v:40},{k:2,s:33,v:40},{k:2,s:34,v:40},{k:2,s:36,v:40},{k:2,s:37,v:40},{k:2,s:38,v:40},{k:2,s:39,v:40},{k:2,s:40,v:40},{k:2,s:41,v:40},{k:2,s:42,v:40},{k:2,s:43,v:40},{k:2,s:44,v:40},{k:2,s:45,v:40},{k:2,s:46,v:40},{k:2,s:47,v:40},{k:2,s:48,v:40},{k:2,s:49,v:40},{k:2,s:50,v:40},{k:2,s:74,v:40},{k:2,s:76,v:40},{k:2,s:78,v:40}],
 [{k:1,s:15,v:172}],
 [{k:1,s:74,v:24},{k:3,s:192,v:173},{k:3,s:202,v:104},{k:3,s:207,v:107}],
 [{k:2,s:16,v:23},{k:2,s:26,v:23},{k:2,s:74,v:23},{k:2,s:15,v:331}],
 [{k:2,s:16,v:24},{k:2,s:26,v:24},{k:2,s:74,v:24}],
 [{k:2,s:51,v:65},{k:2,s:52,v:65},{k:2,s:55,v:65},{k:2,s:58,v:65},{k:2,s:60,v:65},{k:2,s:61,v:65},{k:2,s:65,v:65},{k:2,s:68,v:65},{k:2,s:69,v:65},{k:2,s:74,v:65},{k:2,s:79,v:65},{k:2,s:80,v:65},{k:2,s:81,v:65},{k:2,s:85,v:65},{k:2,s:86,v:65},{k:2,s:87,v:65},{k:2,s:89,v:65},{k:2,s:92,v:65},{k:2,s:93,v:65},{k:2,s:97,v:65},{k:2,s:100,v:65},{k:2,s:102,v:65},{k:2,s:103,v:65}],
 [{k:1,s:52,v:174},{k:1,s:55,v:175},{k:1,s:58,v:176},{k:1,s:61,v:177},{k:1,s:65,v:17},{k:1,s:69,v:178},{k:1,s:74,v:24},{k:1,s:79,v:179},{k:1,s:80,v:28},{k:1,s:89,v:37},{k:3,s:129,v:180},{k:3,s:130,v:181},{k:3,s:157,v:74},{k:3,s:176,v:86},{k:3,s:192,v:182},{k:3,s:193,v:95},{k:3,s:201,v:183},{k:3,s:202,v:104},{k:3,s:207,v:107}],
 [{k:2,s:6,v:14},{k:2,s:7,v:14},{k:2,s:9,v:14},{k:2,s:10,v:14},{k:2,s:12,v:14},{k:2,s:13,v:14},{k:2,s:16,v:14},{k:2,s:17,v:14},{k:2,s:19,v:14},{k:2,s:20,v:14},{k:2,s:21,v:14},{k:2,s:23,v:14},{k:2,s:24,v:14},{k:2,s:25,v:14},{k:2,s:26,v:14},{k:2,s:27,v:14},{k:2,s:28,v:14},{k:2,s:31,v:14},{k:2,s:32,v:14},{k:2,s:34,v:14},{k:2,s:36,v:14},{k:2,s:37,v:14},{k:2,s:39,v:14},{k:2,s:40,v:14},{k:2,s:42,v:14},{k:2,s:45,v:14},{k:2,s:46,v:14},{k:2,s:47,v:14},{k:2,s:48,v:14},{k:2,s:78,v:14}],
 [{k:2,s:6,v:6},{k:2,s:7,v:6},{k:2,s:9,v:6},{k:2,s:10,v:6},{k:2,s:12,v:6},{k:2,s:13,v:6},{k:2,s:16,v:6},{k:2,s:17,v:6},{k:2,s:19,v:6},{k:2,s:20,v:6},{k:2,s:21,v:6},{k:2,s:23,v:6},{k:2,s:24,v:6},{k:2,s:25,v:6},{k:2,s:26,v:6},{k:2,s:27,v:6},{k:2,s:28,v:6},{k:2,s:31,v:6},{k:2,s:32,v:6},{k:2,s:34,v:6},{k:2,s:36,v:6},{k:2,s:37,v:6},{k:2,s:39,v:6},{k:2,s:40,v:6},{k:2,s:42,v:6},{k:2,s:45,v:6},{k:2,s:46,v:6},{k:2,s:47,v:6},{k:2,s:48,v:6},{k:2,s:78,v:6}],
 [{k:2,s:51,v:61},{k:2,s:52,v:61},{k:2,s:55,v:61},{k:2,s:58,v:61},{k:2,s:60,v:61},{k:2,s:61,v:61},{k:2,s:65,v:61},{k:2,s:68,v:61},{k:2,s:69,v:61},{k:2,s:74,v:61},{k:2,s:79,v:61},{k:2,s:80,v:61},{k:2,s:81,v:61},{k:2,s:85,v:61},{k:2,s:86,v:61},{k:2,s:87,v:61},{k:2,s:89,v:61},{k:2,s:92,v:61},{k:2,s:93,v:61},{k:2,s:97,v:61},{k:2,s:100,v:61},{k:2,s:102,v:61},{k:2,s:103,v:61}],
 [{k:2,s:51,v:60},{k:2,s:52,v:60},{k:2,s:55,v:60},{k:2,s:58,v:60},{k:2,s:60,v:60},{k:2,s:61,v:60},{k:2,s:65,v:60},{k:2,s:68,v:60},{k:2,s:69,v:60},{k:2,s:74,v:60},{k:2,s:79,v:60},{k:2,s:80,v:60},{k:2,s:81,v:60},{k:2,s:85,v:60},{k:2,s:86,v:60},{k:2,s:87,v:60},{k:2,s:89,v:60},{k:2,s:92,v:60},{k:2,s:93,v:60},{k:2,s:97,v:60},{k:2,s:100,v:60},{k:2,s:102,v:60},{k:2,s:103,v:60}],
 [{k:2,s:51,v:59},{k:2,s:52,v:59},{k:2,s:55,v:59},{k:2,s:58,v:59},{k:2,s:60,v:59},{k:2,s:61,v:59},{k:2,s:65,v:59},{k:2,s:68,v:59},{k:2,s:69,v:59},{k:2,s:74,v:59},{k:2,s:79,v:59},{k:2,s:80,v:59},{k:2,s:81,v:59},{k:2,s:85,v:59},{k:2,s:86,v:59},{k:2,s:87,v:59},{k:2,s:89,v:59},{k:2,s:92,v:59},{k:2,s:93,v:59},{k:2,s:97,v:59},{k:2,s:100,v:59},{k:2,s:102,v:59},{k:2,s:103,v:59}],
 [{k:1,s:6,v:117},{k:1,s:7,v:1},{k:1,s:8,v:118},{k:1,s:15,v:119},{k:1,s:24,v:184},{k:1,s:35,v:120},{k:1,s:36,v:121},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:106,v:141},{k:3,s:107,v:142},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:113,v:143},{k:3,s:114,v:144},{k:3,s:120,v:129},{k:3,s:127,v:130},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:135,v:145},{k:3,s:136,v:146},{k:3,s:137,v:147},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:150,v:148},{k:3,s:151,v:149},{k:3,s:153,v:185},{k:3,s:155,v:72},{k:3,s:158,v:75},{k:3,s:174,v:151},{k:3,s:175,v:85},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:188,v:132},{k:3,s:191,v:152},{k:3,s:192,v:153},{k:3,s:194,v:134},{k:3,s:195,v:135},{k:3,s:196,v:136},{k:3,s:197,v:137},{k:3,s:198,v:138},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:204,v:154},{k:3,s:206,v:155},{k:3,s:207,v:107},{k:3,s:225,v:156},{k:3,s:226,v:140}],
 [{k:2,s:16,v:22},{k:2,s:26,v:22},{k:2,s:74,v:22}],
 [{k:2,s:6,v:1},{k:2,s:7,v:1},{k:2,s:9,v:1},{k:2,s:10,v:1},{k:2,s:12,v:1},{k:2,s:13,v:1},{k:2,s:16,v:1},{k:2,s:17,v:1},{k:2,s:19,v:1},{k:2,s:20,v:1},{k:2,s:21,v:1},{k:2,s:23,v:1},{k:2,s:24,v:1},{k:2,s:25,v:1},{k:2,s:26,v:1},{k:2,s:27,v:1},{k:2,s:28,v:1},{k:2,s:31,v:1},{k:2,s:32,v:1},{k:2,s:34,v:1},{k:2,s:36,v:1},{k:2,s:37,v:1},{k:2,s:39,v:1},{k:2,s:40,v:1},{k:2,s:42,v:1},{k:2,s:45,v:1},{k:2,s:46,v:1},{k:2,s:47,v:1},{k:2,s:48,v:1},{k:2,s:78,v:1}],
 [{k:2,s:6,v:0},{k:2,s:7,v:0},{k:2,s:9,v:0},{k:2,s:10,v:0},{k:2,s:12,v:0},{k:2,s:13,v:0},{k:2,s:16,v:0},{k:2,s:17,v:0},{k:2,s:19,v:0},{k:2,s:20,v:0},{k:2,s:21,v:0},{k:2,s:23,v:0},{k:2,s:24,v:0},{k:2,s:25,v:0},{k:2,s:26,v:0},{k:2,s:27,v:0},{k:2,s:28,v:0},{k:2,s:31,v:0},{k:2,s:32,v:0},{k:2,s:34,v:0},{k:2,s:36,v:0},{k:2,s:37,v:0},{k:2,s:39,v:0},{k:2,s:40,v:0},{k:2,s:42,v:0},{k:2,s:45,v:0},{k:2,s:46,v:0},{k:2,s:47,v:0},{k:2,s:48,v:0},{k:2,s:78,v:0}],
 [{k:2,s:51,v:62},{k:2,s:52,v:62},{k:2,s:55,v:62},{k:2,s:58,v:62},{k:2,s:60,v:62},{k:2,s:61,v:62},{k:2,s:65,v:62},{k:2,s:68,v:62},{k:2,s:69,v:62},{k:2,s:74,v:62},{k:2,s:79,v:62},{k:2,s:80,v:62},{k:2,s:81,v:62},{k:2,s:85,v:62},{k:2,s:86,v:62},{k:2,s:87,v:62},{k:2,s:89,v:62},{k:2,s:92,v:62},{k:2,s:93,v:62},{k:2,s:97,v:62},{k:2,s:100,v:62},{k:2,s:102,v:62},{k:2,s:103,v:62}],
 [{k:2,s:9,v:30},{k:2,s:12,v:30},{k:2,s:13,v:30},{k:2,s:16,v:30},{k:2,s:19,v:30},{k:2,s:23,v:30},{k:2,s:24,v:30},{k:2,s:25,v:30},{k:2,s:27,v:30},{k:2,s:28,v:30},{k:2,s:31,v:30},{k:2,s:32,v:30},{k:2,s:34,v:30},{k:2,s:39,v:30},{k:2,s:42,v:30},{k:2,s:45,v:30},{k:2,s:46,v:30},{k:2,s:47,v:30},{k:2,s:74,v:30},{k:2,s:78,v:30}],
 [{k:2,s:6,v:13},{k:2,s:7,v:13},{k:2,s:9,v:13},{k:2,s:10,v:13},{k:2,s:12,v:13},{k:2,s:13,v:13},{k:2,s:16,v:13},{k:2,s:17,v:13},{k:2,s:19,v:13},{k:2,s:20,v:13},{k:2,s:21,v:13},{k:2,s:23,v:13},{k:2,s:24,v:13},{k:2,s:25,v:13},{k:2,s:26,v:13},{k:2,s:27,v:13},{k:2,s:28,v:13},{k:2,s:31,v:13},{k:2,s:32,v:13},{k:2,s:34,v:13},{k:2,s:36,v:13},{k:2,s:37,v:13},{k:2,s:39,v:13},{k:2,s:40,v:13},{k:2,s:42,v:13},{k:2,s:45,v:13},{k:2,s:46,v:13},{k:2,s:47,v:13},{k:2,s:48,v:13},{k:2,s:78,v:13}],
 [{k:1,s:20,v:186}],
 [{k:1,s:15,v:187}],
 [{k:2,s:51,v:66},{k:2,s:52,v:66},{k:2,s:55,v:66},{k:2,s:58,v:66},{k:2,s:60,v:66},{k:2,s:61,v:66},{k:2,s:65,v:66},{k:2,s:68,v:66},{k:2,s:69,v:66},{k:2,s:74,v:66},{k:2,s:79,v:66},{k:2,s:80,v:66},{k:2,s:81,v:66},{k:2,s:85,v:66},{k:2,s:86,v:66},{k:2,s:87,v:66},{k:2,s:89,v:66},{k:2,s:92,v:66},{k:2,s:93,v:66},{k:2,s:97,v:66},{k:2,s:100,v:66},{k:2,s:102,v:66},{k:2,s:103,v:66}],
 [{k:2,s:6,v:225},{k:2,s:7,v:225},{k:2,s:9,v:225},{k:2,s:10,v:225},{k:2,s:12,v:225},{k:2,s:13,v:225},{k:2,s:16,v:225},{k:2,s:17,v:225},{k:2,s:19,v:225},{k:2,s:20,v:225},{k:2,s:21,v:225},{k:2,s:23,v:225},{k:2,s:24,v:225},{k:2,s:25,v:225},{k:2,s:26,v:225},{k:2,s:27,v:225},{k:2,s:28,v:225},{k:2,s:31,v:225},{k:2,s:32,v:225},{k:2,s:34,v:225},{k:2,s:36,v:225},{k:2,s:37,v:225},{k:2,s:39,v:225},{k:2,s:40,v:225},{k:2,s:42,v:225},{k:2,s:45,v:225},{k:2,s:46,v:225},{k:2,s:47,v:225},{k:2,s:48,v:225},{k:2,s:78,v:225}],
 [{k:2,s:51,v:67},{k:2,s:52,v:67},{k:2,s:55,v:67},{k:2,s:58,v:67},{k:2,s:60,v:67},{k:2,s:61,v:67},{k:2,s:65,v:67},{k:2,s:68,v:67},{k:2,s:69,v:67},{k:2,s:74,v:67},{k:2,s:79,v:67},{k:2,s:80,v:67},{k:2,s:81,v:67},{k:2,s:85,v:67},{k:2,s:86,v:67},{k:2,s:87,v:67},{k:2,s:89,v:67},{k:2,s:92,v:67},{k:2,s:93,v:67},{k:2,s:97,v:67},{k:2,s:100,v:67},{k:2,s:102,v:67},{k:2,s:103,v:67}],
 [{k:1,s:30,v:4},{k:3,s:116,v:188}],
 [{k:1,s:74,v:189},{k:3,s:186,v:190}],
 [{k:2,s:51,v:68},{k:2,s:52,v:68},{k:2,s:55,v:68},{k:2,s:58,v:68},{k:2,s:60,v:68},{k:2,s:61,v:68},{k:2,s:65,v:68},{k:2,s:68,v:68},{k:2,s:69,v:68},{k:2,s:74,v:68},{k:2,s:79,v:68},{k:2,s:80,v:68},{k:2,s:81,v:68},{k:2,s:85,v:68},{k:2,s:86,v:68},{k:2,s:87,v:68},{k:2,s:89,v:68},{k:2,s:92,v:68},{k:2,s:93,v:68},{k:2,s:97,v:68},{k:2,s:100,v:68},{k:2,s:102,v:68},{k:2,s:103,v:68}],
 [{k:2,s:6,v:7},{k:2,s:7,v:7},{k:2,s:9,v:7},{k:2,s:10,v:7},{k:2,s:12,v:7},{k:2,s:13,v:7},{k:2,s:16,v:7},{k:2,s:17,v:7},{k:2,s:19,v:7},{k:2,s:20,v:7},{k:2,s:21,v:7},{k:2,s:23,v:7},{k:2,s:24,v:7},{k:2,s:25,v:7},{k:2,s:26,v:7},{k:2,s:27,v:7},{k:2,s:28,v:7},{k:2,s:31,v:7},{k:2,s:32,v:7},{k:2,s:34,v:7},{k:2,s:36,v:7},{k:2,s:37,v:7},{k:2,s:39,v:7},{k:2,s:40,v:7},{k:2,s:42,v:7},{k:2,s:45,v:7},{k:2,s:46,v:7},{k:2,s:47,v:7},{k:2,s:48,v:7},{k:2,s:78,v:7}],
 [{k:1,s:15,v:191}],
 [{k:2,s:6,v:230},{k:2,s:7,v:230},{k:2,s:9,v:230},{k:2,s:10,v:230},{k:2,s:12,v:230},{k:2,s:13,v:230},{k:2,s:16,v:230},{k:2,s:17,v:230},{k:2,s:19,v:230},{k:2,s:20,v:230},{k:2,s:21,v:230},{k:2,s:23,v:230},{k:2,s:24,v:230},{k:2,s:25,v:230},{k:2,s:26,v:230},{k:2,s:27,v:230},{k:2,s:28,v:230},{k:2,s:31,v:230},{k:2,s:32,v:230},{k:2,s:34,v:230},{k:2,s:36,v:230},{k:2,s:37,v:230},{k:2,s:39,v:230},{k:2,s:40,v:230},{k:2,s:42,v:230},{k:2,s:45,v:230},{k:2,s:46,v:230},{k:2,s:47,v:230},{k:2,s:48,v:230},{k:2,s:78,v:230},{k:2,s:11,v:314},{k:2,s:14,v:314},{k:2,s:18,v:314},{k:2,s:22,v:314},{k:2,s:29,v:314},{k:2,s:33,v:314},{k:2,s:38,v:314},{k:2,s:41,v:314},{k:2,s:43,v:314},{k:2,s:44,v:314},{k:2,s:49,v:314},{k:2,s:50,v:314}],
 [{k:2,s:6,v:223},{k:2,s:7,v:223},{k:2,s:9,v:223},{k:2,s:10,v:223},{k:2,s:12,v:223},{k:2,s:13,v:223},{k:2,s:16,v:223},{k:2,s:17,v:223},{k:2,s:19,v:223},{k:2,s:20,v:223},{k:2,s:21,v:223},{k:2,s:23,v:223},{k:2,s:24,v:223},{k:2,s:25,v:223},{k:2,s:27,v:223},{k:2,s:28,v:223},{k:2,s:31,v:223},{k:2,s:32,v:223},{k:2,s:34,v:223},{k:2,s:36,v:223},{k:2,s:37,v:223},{k:2,s:39,v:223},{k:2,s:40,v:223},{k:2,s:42,v:223},{k:2,s:45,v:223},{k:2,s:46,v:223},{k:2,s:47,v:223},{k:2,s:48,v:223},{k:2,s:78,v:223}],
 [{k:1,s:26,v:192},{k:2,s:9,v:31},{k:2,s:12,v:31},{k:2,s:13,v:31},{k:2,s:16,v:31},{k:2,s:19,v:31},{k:2,s:23,v:31},{k:2,s:24,v:31},{k:2,s:25,v:31},{k:2,s:27,v:31},{k:2,s:28,v:31},{k:2,s:31,v:31},{k:2,s:32,v:31},{k:2,s:34,v:31},{k:2,s:39,v:31},{k:2,s:42,v:31},{k:2,s:45,v:31},{k:2,s:46,v:31},{k:2,s:47,v:31},{k:2,s:74,v:31},{k:2,s:78,v:31}],
 [{k:2,s:16,v:168},{k:2,s:19,v:168},{k:2,s:24,v:168}],
 [{k:2,s:0,v:157},{k:2,s:7,v:157},{k:2,s:15,v:157},{k:2,s:24,v:157},{k:2,s:30,v:157},{k:2,s:34,v:157},{k:2,s:37,v:157},{k:2,s:51,v:157},{k:2,s:52,v:157},{k:2,s:53,v:157},{k:2,s:54,v:157},{k:2,s:55,v:157},{k:2,s:56,v:157},{k:2,s:58,v:157},{k:2,s:59,v:157},{k:2,s:60,v:157},{k:2,s:61,v:157},{k:2,s:62,v:157},{k:2,s:63,v:157},{k:2,s:64,v:157},{k:2,s:65,v:157},{k:2,s:66,v:157},{k:2,s:68,v:157},{k:2,s:69,v:157},{k:2,s:70,v:157},{k:2,s:71,v:157},{k:2,s:72,v:157},{k:2,s:73,v:157},{k:2,s:74,v:157},{k:2,s:75,v:157},{k:2,s:79,v:157},{k:2,s:80,v:157},{k:2,s:81,v:157},{k:2,s:82,v:157},{k:2,s:83,v:157},{k:2,s:84,v:157},{k:2,s:85,v:157},{k:2,s:86,v:157},{k:2,s:87,v:157},{k:2,s:88,v:157},{k:2,s:89,v:157},{k:2,s:90,v:157},{k:2,s:91,v:157},{k:2,s:92,v:157},{k:2,s:93,v:157},{k:2,s:94,v:157},{k:2,s:95,v:157},{k:2,s:96,v:157},{k:2,s:97,v:157},{k:2,s:98,v:157},{k:2,s:100,v:157},{k:2,s:101,v:157},{k:2,s:102,v:157},{k:2,s:103,v:157},{k:2,s:104,v:157},{k:2,s:105,v:157}],
 [{k:2,s:0,v:162},{k:2,s:7,v:162},{k:2,s:15,v:162},{k:2,s:24,v:162},{k:2,s:30,v:162},{k:2,s:34,v:162},{k:2,s:37,v:162},{k:2,s:51,v:162},{k:2,s:52,v:162},{k:2,s:53,v:162},{k:2,s:54,v:162},{k:2,s:55,v:162},{k:2,s:56,v:162},{k:2,s:58,v:162},{k:2,s:59,v:162},{k:2,s:60,v:162},{k:2,s:61,v:162},{k:2,s:62,v:162},{k:2,s:63,v:162},{k:2,s:64,v:162},{k:2,s:65,v:162},{k:2,s:66,v:162},{k:2,s:68,v:162},{k:2,s:69,v:162},{k:2,s:70,v:162},{k:2,s:71,v:162},{k:2,s:72,v:162},{k:2,s:73,v:162},{k:2,s:74,v:162},{k:2,s:75,v:162},{k:2,s:79,v:162},{k:2,s:80,v:162},{k:2,s:81,v:162},{k:2,s:82,v:162},{k:2,s:83,v:162},{k:2,s:84,v:162},{k:2,s:85,v:162},{k:2,s:86,v:162},{k:2,s:87,v:162},{k:2,s:88,v:162},{k:2,s:89,v:162},{k:2,s:90,v:162},{k:2,s:91,v:162},{k:2,s:92,v:162},{k:2,s:93,v:162},{k:2,s:94,v:162},{k:2,s:95,v:162},{k:2,s:96,v:162},{k:2,s:97,v:162},{k:2,s:98,v:162},{k:2,s:100,v:162},{k:2,s:101,v:162},{k:2,s:102,v:162},{k:2,s:103,v:162},{k:2,s:104,v:162},{k:2,s:105,v:162}],
 [{k:2,s:0,v:48},{k:2,s:7,v:48},{k:2,s:15,v:48},{k:2,s:24,v:48},{k:2,s:30,v:48},{k:2,s:37,v:48},{k:2,s:51,v:48},{k:2,s:52,v:48},{k:2,s:53,v:48},{k:2,s:54,v:48},{k:2,s:55,v:48},{k:2,s:58,v:48},{k:2,s:59,v:48},{k:2,s:60,v:48},{k:2,s:61,v:48},{k:2,s:62,v:48},{k:2,s:64,v:48},{k:2,s:65,v:48},{k:2,s:68,v:48},{k:2,s:69,v:48},{k:2,s:70,v:48},{k:2,s:71,v:48},{k:2,s:72,v:48},{k:2,s:73,v:48},{k:2,s:74,v:48},{k:2,s:75,v:48},{k:2,s:79,v:48},{k:2,s:80,v:48},{k:2,s:81,v:48},{k:2,s:82,v:48},{k:2,s:83,v:48},{k:2,s:84,v:48},{k:2,s:85,v:48},{k:2,s:86,v:48},{k:2,s:87,v:48},{k:2,s:88,v:48},{k:2,s:89,v:48},{k:2,s:90,v:48},{k:2,s:91,v:48},{k:2,s:92,v:48},{k:2,s:93,v:48},{k:2,s:94,v:48},{k:2,s:95,v:48},{k:2,s:96,v:48},{k:2,s:97,v:48},{k:2,s:98,v:48},{k:2,s:100,v:48},{k:2,s:101,v:48},{k:2,s:102,v:48},{k:2,s:103,v:48},{k:2,s:104,v:48},{k:2,s:105,v:48}],
 [{k:2,s:16,v:174},{k:2,s:19,v:174},{k:2,s:24,v:174},{k:2,s:7,v:227},{k:2,s:20,v:227},{k:2,s:26,v:227},{k:2,s:37,v:227}],
 [{k:2,s:0,v:52},{k:2,s:7,v:52},{k:2,s:15,v:52},{k:2,s:24,v:52},{k:2,s:30,v:52},{k:2,s:37,v:52},{k:2,s:51,v:52},{k:2,s:52,v:52},{k:2,s:53,v:52},{k:2,s:54,v:52},{k:2,s:55,v:52},{k:2,s:58,v:52},{k:2,s:59,v:52},{k:2,s:60,v:52},{k:2,s:61,v:52},{k:2,s:62,v:52},{k:2,s:64,v:52},{k:2,s:65,v:52},{k:2,s:68,v:52},{k:2,s:69,v:52},{k:2,s:70,v:52},{k:2,s:71,v:52},{k:2,s:72,v:52},{k:2,s:73,v:52},{k:2,s:74,v:52},{k:2,s:75,v:52},{k:2,s:79,v:52},{k:2,s:80,v:52},{k:2,s:81,v:52},{k:2,s:82,v:52},{k:2,s:83,v:52},{k:2,s:84,v:52},{k:2,s:85,v:52},{k:2,s:86,v:52},{k:2,s:87,v:52},{k:2,s:88,v:52},{k:2,s:89,v:52},{k:2,s:90,v:52},{k:2,s:91,v:52},{k:2,s:92,v:52},{k:2,s:93,v:52},{k:2,s:94,v:52},{k:2,s:95,v:52},{k:2,s:96,v:52},{k:2,s:97,v:52},{k:2,s:98,v:52},{k:2,s:100,v:52},{k:2,s:101,v:52},{k:2,s:102,v:52},{k:2,s:103,v:52},{k:2,s:104,v:52},{k:2,s:105,v:52}],
 [{k:2,s:9,v:29},{k:2,s:12,v:29},{k:2,s:13,v:29},{k:2,s:16,v:29},{k:2,s:19,v:29},{k:2,s:23,v:29},{k:2,s:24,v:29},{k:2,s:25,v:29},{k:2,s:27,v:29},{k:2,s:28,v:29},{k:2,s:31,v:29},{k:2,s:32,v:29},{k:2,s:34,v:29},{k:2,s:39,v:29},{k:2,s:42,v:29},{k:2,s:45,v:29},{k:2,s:46,v:29},{k:2,s:47,v:29},{k:2,s:74,v:29},{k:2,s:78,v:29}],
 [{k:2,s:6,v:233},{k:2,s:7,v:233},{k:2,s:9,v:233},{k:2,s:10,v:233},{k:2,s:12,v:233},{k:2,s:13,v:233},{k:2,s:16,v:233},{k:2,s:17,v:233},{k:2,s:19,v:233},{k:2,s:20,v:233},{k:2,s:21,v:233},{k:2,s:23,v:233},{k:2,s:24,v:233},{k:2,s:25,v:233},{k:2,s:26,v:233},{k:2,s:27,v:233},{k:2,s:28,v:233},{k:2,s:31,v:233},{k:2,s:32,v:233},{k:2,s:34,v:233},{k:2,s:36,v:233},{k:2,s:37,v:233},{k:2,s:39,v:233},{k:2,s:40,v:233},{k:2,s:42,v:233},{k:2,s:45,v:233},{k:2,s:46,v:233},{k:2,s:47,v:233},{k:2,s:48,v:233},{k:2,s:78,v:233}],
 [{k:2,s:6,v:12},{k:2,s:7,v:12},{k:2,s:9,v:12},{k:2,s:10,v:12},{k:2,s:12,v:12},{k:2,s:13,v:12},{k:2,s:16,v:12},{k:2,s:17,v:12},{k:2,s:19,v:12},{k:2,s:20,v:12},{k:2,s:21,v:12},{k:2,s:23,v:12},{k:2,s:24,v:12},{k:2,s:25,v:12},{k:2,s:26,v:12},{k:2,s:27,v:12},{k:2,s:28,v:12},{k:2,s:31,v:12},{k:2,s:32,v:12},{k:2,s:34,v:12},{k:2,s:36,v:12},{k:2,s:37,v:12},{k:2,s:39,v:12},{k:2,s:40,v:12},{k:2,s:42,v:12},{k:2,s:45,v:12},{k:2,s:46,v:12},{k:2,s:47,v:12},{k:2,s:48,v:12},{k:2,s:78,v:12}],
 [{k:4,s:0,v:0}],
 [{k:2,s:0,v:163},{k:2,s:7,v:163},{k:2,s:15,v:163},{k:2,s:24,v:163},{k:2,s:30,v:163},{k:2,s:34,v:163},{k:2,s:37,v:163},{k:2,s:51,v:163},{k:2,s:52,v:163},{k:2,s:53,v:163},{k:2,s:54,v:163},{k:2,s:55,v:163},{k:2,s:56,v:163},{k:2,s:58,v:163},{k:2,s:59,v:163},{k:2,s:60,v:163},{k:2,s:61,v:163},{k:2,s:62,v:163},{k:2,s:63,v:163},{k:2,s:64,v:163},{k:2,s:65,v:163},{k:2,s:66,v:163},{k:2,s:68,v:163},{k:2,s:69,v:163},{k:2,s:70,v:163},{k:2,s:71,v:163},{k:2,s:72,v:163},{k:2,s:73,v:163},{k:2,s:74,v:163},{k:2,s:75,v:163},{k:2,s:79,v:163},{k:2,s:80,v:163},{k:2,s:81,v:163},{k:2,s:82,v:163},{k:2,s:83,v:163},{k:2,s:84,v:163},{k:2,s:85,v:163},{k:2,s:86,v:163},{k:2,s:87,v:163},{k:2,s:88,v:163},{k:2,s:89,v:163},{k:2,s:90,v:163},{k:2,s:91,v:163},{k:2,s:92,v:163},{k:2,s:93,v:163},{k:2,s:94,v:163},{k:2,s:95,v:163},{k:2,s:96,v:163},{k:2,s:97,v:163},{k:2,s:98,v:163},{k:2,s:100,v:163},{k:2,s:101,v:163},{k:2,s:102,v:163},{k:2,s:103,v:163},{k:2,s:104,v:163},{k:2,s:105,v:163}],
 [{k:1,s:15,v:193}],
 [{k:2,s:6,v:4},{k:2,s:7,v:4},{k:2,s:9,v:4},{k:2,s:10,v:4},{k:2,s:12,v:4},{k:2,s:13,v:4},{k:2,s:16,v:4},{k:2,s:17,v:4},{k:2,s:19,v:4},{k:2,s:20,v:4},{k:2,s:21,v:4},{k:2,s:23,v:4},{k:2,s:24,v:4},{k:2,s:25,v:4},{k:2,s:26,v:4},{k:2,s:27,v:4},{k:2,s:28,v:4},{k:2,s:31,v:4},{k:2,s:32,v:4},{k:2,s:34,v:4},{k:2,s:36,v:4},{k:2,s:37,v:4},{k:2,s:39,v:4},{k:2,s:40,v:4},{k:2,s:42,v:4},{k:2,s:45,v:4},{k:2,s:46,v:4},{k:2,s:47,v:4},{k:2,s:48,v:4},{k:2,s:78,v:4}],
 [{k:2,s:0,v:161},{k:2,s:7,v:161},{k:2,s:15,v:161},{k:2,s:24,v:161},{k:2,s:30,v:161},{k:2,s:34,v:161},{k:2,s:37,v:161},{k:2,s:51,v:161},{k:2,s:52,v:161},{k:2,s:53,v:161},{k:2,s:54,v:161},{k:2,s:55,v:161},{k:2,s:56,v:161},{k:2,s:58,v:161},{k:2,s:59,v:161},{k:2,s:60,v:161},{k:2,s:61,v:161},{k:2,s:62,v:161},{k:2,s:63,v:161},{k:2,s:64,v:161},{k:2,s:65,v:161},{k:2,s:66,v:161},{k:2,s:68,v:161},{k:2,s:69,v:161},{k:2,s:70,v:161},{k:2,s:71,v:161},{k:2,s:72,v:161},{k:2,s:73,v:161},{k:2,s:74,v:161},{k:2,s:75,v:161},{k:2,s:79,v:161},{k:2,s:80,v:161},{k:2,s:81,v:161},{k:2,s:82,v:161},{k:2,s:83,v:161},{k:2,s:84,v:161},{k:2,s:85,v:161},{k:2,s:86,v:161},{k:2,s:87,v:161},{k:2,s:88,v:161},{k:2,s:89,v:161},{k:2,s:90,v:161},{k:2,s:91,v:161},{k:2,s:92,v:161},{k:2,s:93,v:161},{k:2,s:94,v:161},{k:2,s:95,v:161},{k:2,s:96,v:161},{k:2,s:97,v:161},{k:2,s:98,v:161},{k:2,s:100,v:161},{k:2,s:101,v:161},{k:2,s:102,v:161},{k:2,s:103,v:161},{k:2,s:104,v:161},{k:2,s:105,v:161}],
 [{k:2,s:0,v:158},{k:2,s:7,v:158},{k:2,s:15,v:158},{k:2,s:24,v:158},{k:2,s:30,v:158},{k:2,s:34,v:158},{k:2,s:37,v:158},{k:2,s:51,v:158},{k:2,s:52,v:158},{k:2,s:53,v:158},{k:2,s:54,v:158},{k:2,s:55,v:158},{k:2,s:56,v:158},{k:2,s:58,v:158},{k:2,s:59,v:158},{k:2,s:60,v:158},{k:2,s:61,v:158},{k:2,s:62,v:158},{k:2,s:63,v:158},{k:2,s:64,v:158},{k:2,s:65,v:158},{k:2,s:66,v:158},{k:2,s:68,v:158},{k:2,s:69,v:158},{k:2,s:70,v:158},{k:2,s:71,v:158},{k:2,s:72,v:158},{k:2,s:73,v:158},{k:2,s:74,v:158},{k:2,s:75,v:158},{k:2,s:79,v:158},{k:2,s:80,v:158},{k:2,s:81,v:158},{k:2,s:82,v:158},{k:2,s:83,v:158},{k:2,s:84,v:158},{k:2,s:85,v:158},{k:2,s:86,v:158},{k:2,s:87,v:158},{k:2,s:88,v:158},{k:2,s:89,v:158},{k:2,s:90,v:158},{k:2,s:91,v:158},{k:2,s:92,v:158},{k:2,s:93,v:158},{k:2,s:94,v:158},{k:2,s:95,v:158},{k:2,s:96,v:158},{k:2,s:97,v:158},{k:2,s:98,v:158},{k:2,s:100,v:158},{k:2,s:101,v:158},{k:2,s:102,v:158},{k:2,s:103,v:158},{k:2,s:104,v:158},{k:2,s:105,v:158}],
 [{k:2,s:0,v:159},{k:2,s:7,v:159},{k:2,s:15,v:159},{k:2,s:24,v:159},{k:2,s:30,v:159},{k:2,s:34,v:159},{k:2,s:37,v:159},{k:2,s:51,v:159},{k:2,s:52,v:159},{k:2,s:53,v:159},{k:2,s:54,v:159},{k:2,s:55,v:159},{k:2,s:56,v:159},{k:2,s:58,v:159},{k:2,s:59,v:159},{k:2,s:60,v:159},{k:2,s:61,v:159},{k:2,s:62,v:159},{k:2,s:63,v:159},{k:2,s:64,v:159},{k:2,s:65,v:159},{k:2,s:66,v:159},{k:2,s:68,v:159},{k:2,s:69,v:159},{k:2,s:70,v:159},{k:2,s:71,v:159},{k:2,s:72,v:159},{k:2,s:73,v:159},{k:2,s:74,v:159},{k:2,s:75,v:159},{k:2,s:79,v:159},{k:2,s:80,v:159},{k:2,s:81,v:159},{k:2,s:82,v:159},{k:2,s:83,v:159},{k:2,s:84,v:159},{k:2,s:85,v:159},{k:2,s:86,v:159},{k:2,s:87,v:159},{k:2,s:88,v:159},{k:2,s:89,v:159},{k:2,s:90,v:159},{k:2,s:91,v:159},{k:2,s:92,v:159},{k:2,s:93,v:159},{k:2,s:94,v:159},{k:2,s:95,v:159},{k:2,s:96,v:159},{k:2,s:97,v:159},{k:2,s:98,v:159},{k:2,s:100,v:159},{k:2,s:101,v:159},{k:2,s:102,v:159},{k:2,s:103,v:159},{k:2,s:104,v:159},{k:2,s:105,v:159}],
 [{k:2,s:6,v:228},{k:2,s:7,v:228},{k:2,s:9,v:228},{k:2,s:10,v:228},{k:2,s:12,v:228},{k:2,s:13,v:228},{k:2,s:16,v:228},{k:2,s:17,v:228},{k:2,s:19,v:228},{k:2,s:20,v:228},{k:2,s:21,v:228},{k:2,s:23,v:228},{k:2,s:24,v:228},{k:2,s:25,v:228},{k:2,s:26,v:228},{k:2,s:27,v:228},{k:2,s:28,v:228},{k:2,s:31,v:228},{k:2,s:32,v:228},{k:2,s:34,v:228},{k:2,s:36,v:228},{k:2,s:37,v:228},{k:2,s:39,v:228},{k:2,s:40,v:228},{k:2,s:42,v:228},{k:2,s:45,v:228},{k:2,s:46,v:228},{k:2,s:47,v:228},{k:2,s:48,v:228},{k:2,s:78,v:228},{k:2,s:11,v:313},{k:2,s:14,v:313},{k:2,s:18,v:313},{k:2,s:22,v:313},{k:2,s:29,v:313},{k:2,s:33,v:313},{k:2,s:38,v:313},{k:2,s:41,v:313},{k:2,s:43,v:313},{k:2,s:44,v:313},{k:2,s:49,v:313},{k:2,s:50,v:313}],
 [{k:2,s:0,v:87},{k:2,s:7,v:87},{k:2,s:15,v:87},{k:2,s:24,v:87},{k:2,s:30,v:87},{k:2,s:34,v:87},{k:2,s:37,v:87},{k:2,s:51,v:87},{k:2,s:52,v:87},{k:2,s:53,v:87},{k:2,s:54,v:87},{k:2,s:55,v:87},{k:2,s:58,v:87},{k:2,s:59,v:87},{k:2,s:60,v:87},{k:2,s:61,v:87},{k:2,s:62,v:87},{k:2,s:64,v:87},{k:2,s:65,v:87},{k:2,s:68,v:87},{k:2,s:69,v:87},{k:2,s:70,v:87},{k:2,s:71,v:87},{k:2,s:72,v:87},{k:2,s:73,v:87},{k:2,s:74,v:87},{k:2,s:75,v:87},{k:2,s:79,v:87},{k:2,s:80,v:87},{k:2,s:81,v:87},{k:2,s:82,v:87},{k:2,s:83,v:87},{k:2,s:84,v:87},{k:2,s:85,v:87},{k:2,s:86,v:87},{k:2,s:87,v:87},{k:2,s:88,v:87},{k:2,s:89,v:87},{k:2,s:90,v:87},{k:2,s:91,v:87},{k:2,s:92,v:87},{k:2,s:93,v:87},{k:2,s:94,v:87},{k:2,s:95,v:87},{k:2,s:96,v:87},{k:2,s:97,v:87},{k:2,s:98,v:87},{k:2,s:100,v:87},{k:2,s:101,v:87},{k:2,s:102,v:87},{k:2,s:103,v:87},{k:2,s:104,v:87},{k:2,s:105,v:87}],
 [{k:2,s:16,v:20},{k:2,s:26,v:20},{k:2,s:74,v:20}],
 [{k:2,s:6,v:9},{k:2,s:7,v:9},{k:2,s:9,v:9},{k:2,s:10,v:9},{k:2,s:12,v:9},{k:2,s:13,v:9},{k:2,s:16,v:9},{k:2,s:17,v:9},{k:2,s:19,v:9},{k:2,s:20,v:9},{k:2,s:21,v:9},{k:2,s:23,v:9},{k:2,s:24,v:9},{k:2,s:25,v:9},{k:2,s:26,v:9},{k:2,s:27,v:9},{k:2,s:28,v:9},{k:2,s:31,v:9},{k:2,s:32,v:9},{k:2,s:34,v:9},{k:2,s:36,v:9},{k:2,s:37,v:9},{k:2,s:39,v:9},{k:2,s:40,v:9},{k:2,s:42,v:9},{k:2,s:45,v:9},{k:2,s:46,v:9},{k:2,s:47,v:9},{k:2,s:48,v:9},{k:2,s:78,v:9}],
 [{k:2,s:0,v:152},{k:2,s:7,v:152},{k:2,s:15,v:152},{k:2,s:24,v:152},{k:2,s:30,v:152},{k:2,s:34,v:152},{k:2,s:37,v:152},{k:2,s:51,v:152},{k:2,s:52,v:152},{k:2,s:53,v:152},{k:2,s:54,v:152},{k:2,s:55,v:152},{k:2,s:56,v:152},{k:2,s:58,v:152},{k:2,s:59,v:152},{k:2,s:60,v:152},{k:2,s:61,v:152},{k:2,s:62,v:152},{k:2,s:63,v:152},{k:2,s:64,v:152},{k:2,s:65,v:152},{k:2,s:68,v:152},{k:2,s:69,v:152},{k:2,s:70,v:152},{k:2,s:71,v:152},{k:2,s:72,v:152},{k:2,s:73,v:152},{k:2,s:74,v:152},{k:2,s:75,v:152},{k:2,s:79,v:152},{k:2,s:80,v:152},{k:2,s:81,v:152},{k:2,s:82,v:152},{k:2,s:83,v:152},{k:2,s:84,v:152},{k:2,s:85,v:152},{k:2,s:86,v:152},{k:2,s:87,v:152},{k:2,s:88,v:152},{k:2,s:89,v:152},{k:2,s:90,v:152},{k:2,s:91,v:152},{k:2,s:92,v:152},{k:2,s:93,v:152},{k:2,s:94,v:152},{k:2,s:95,v:152},{k:2,s:96,v:152},{k:2,s:97,v:152},{k:2,s:98,v:152},{k:2,s:100,v:152},{k:2,s:101,v:152},{k:2,s:102,v:152},{k:2,s:103,v:152},{k:2,s:104,v:152},{k:2,s:105,v:152}],
 [{k:2,s:0,v:46},{k:2,s:7,v:46},{k:2,s:15,v:46},{k:2,s:24,v:46},{k:2,s:30,v:46},{k:2,s:37,v:46},{k:2,s:51,v:46},{k:2,s:52,v:46},{k:2,s:53,v:46},{k:2,s:54,v:46},{k:2,s:55,v:46},{k:2,s:58,v:46},{k:2,s:59,v:46},{k:2,s:60,v:46},{k:2,s:61,v:46},{k:2,s:62,v:46},{k:2,s:64,v:46},{k:2,s:65,v:46},{k:2,s:68,v:46},{k:2,s:69,v:46},{k:2,s:70,v:46},{k:2,s:71,v:46},{k:2,s:72,v:46},{k:2,s:73,v:46},{k:2,s:74,v:46},{k:2,s:75,v:46},{k:2,s:79,v:46},{k:2,s:80,v:46},{k:2,s:81,v:46},{k:2,s:82,v:46},{k:2,s:83,v:46},{k:2,s:84,v:46},{k:2,s:85,v:46},{k:2,s:86,v:46},{k:2,s:87,v:46},{k:2,s:88,v:46},{k:2,s:89,v:46},{k:2,s:90,v:46},{k:2,s:91,v:46},{k:2,s:92,v:46},{k:2,s:93,v:46},{k:2,s:94,v:46},{k:2,s:95,v:46},{k:2,s:96,v:46},{k:2,s:97,v:46},{k:2,s:98,v:46},{k:2,s:100,v:46},{k:2,s:101,v:46},{k:2,s:102,v:46},{k:2,s:103,v:46},{k:2,s:104,v:46},{k:2,s:105,v:46}],
 [{k:1,s:7,v:1},{k:1,s:15,v:2},{k:1,s:24,v:3},{k:1,s:30,v:4},{k:1,s:37,v:5},{k:1,s:51,v:6},{k:1,s:52,v:7},{k:1,s:53,v:8},{k:1,s:54,v:9},{k:1,s:55,v:10},{k:1,s:58,v:11},{k:1,s:59,v:12},{k:1,s:60,v:13},{k:1,s:61,v:14},{k:1,s:62,v:15},{k:1,s:64,v:16},{k:1,s:65,v:17},{k:1,s:68,v:18},{k:1,s:69,v:19},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:72,v:22},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:75,v:25},{k:1,s:79,v:27},{k:1,s:80,v:28},{k:1,s:81,v:29},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:85,v:33},{k:1,s:86,v:34},{k:1,s:87,v:35},{k:1,s:88,v:36},{k:1,s:89,v:37},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:92,v:40},{k:1,s:93,v:41},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:96,v:44},{k:1,s:97,v:45},{k:1,s:98,v:46},{k:1,s:100,v:47},{k:1,s:101,v:48},{k:1,s:102,v:49},{k:1,s:103,v:50},{k:1,s:104,v:51},{k:1,s:105,v:52},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:112,v:55},{k:3,s:113,v:56},{k:3,s:116,v:57},{k:3,s:119,v:58},{k:3,s:126,v:59},{k:3,s:127,v:60},{k:3,s:128,v:61},{k:3,s:129,v:62},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:142,v:66},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:148,v:69},{k:3,s:149,v:70},{k:3,s:154,v:71},{k:3,s:155,v:72},{k:3,s:156,v:73},{k:3,s:157,v:74},{k:3,s:158,v:75},{k:3,s:162,v:76},{k:3,s:165,v:194},{k:3,s:167,v:79},{k:3,s:168,v:80},{k:3,s:169,v:81},{k:3,s:171,v:82},{k:3,s:175,v:85},{k:3,s:176,v:86},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:185,v:89},{k:3,s:187,v:90},{k:3,s:188,v:91},{k:3,s:189,v:92},{k:3,s:190,v:93},{k:3,s:192,v:94},{k:3,s:193,v:95},{k:3,s:194,v:96},{k:3,s:195,v:97},{k:3,s:196,v:98},{k:3,s:197,v:99},{k:3,s:198,v:100},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:201,v:103},{k:3,s:202,v:104},{k:3,s:203,v:105},{k:3,s:205,v:106},{k:3,s:207,v:107},{k:3,s:209,v:109},{k:3,s:210,v:110},{k:3,s:213,v:111},{k:3,s:220,v:112},{k:3,s:222,v:113},{k:3,s:223,v:114},{k:3,s:232,v:116},{k:2,s:0,v:43}],
 [{k:2,s:0,v:49},{k:2,s:7,v:49},{k:2,s:15,v:49},{k:2,s:24,v:49},{k:2,s:30,v:49},{k:2,s:37,v:49},{k:2,s:51,v:49},{k:2,s:52,v:49},{k:2,s:53,v:49},{k:2,s:54,v:49},{k:2,s:55,v:49},{k:2,s:58,v:49},{k:2,s:59,v:49},{k:2,s:60,v:49},{k:2,s:61,v:49},{k:2,s:62,v:49},{k:2,s:64,v:49},{k:2,s:65,v:49},{k:2,s:68,v:49},{k:2,s:69,v:49},{k:2,s:70,v:49},{k:2,s:71,v:49},{k:2,s:72,v:49},{k:2,s:73,v:49},{k:2,s:74,v:49},{k:2,s:75,v:49},{k:2,s:79,v:49},{k:2,s:80,v:49},{k:2,s:81,v:49},{k:2,s:82,v:49},{k:2,s:83,v:49},{k:2,s:84,v:49},{k:2,s:85,v:49},{k:2,s:86,v:49},{k:2,s:87,v:49},{k:2,s:88,v:49},{k:2,s:89,v:49},{k:2,s:90,v:49},{k:2,s:91,v:49},{k:2,s:92,v:49},{k:2,s:93,v:49},{k:2,s:94,v:49},{k:2,s:95,v:49},{k:2,s:96,v:49},{k:2,s:97,v:49},{k:2,s:98,v:49},{k:2,s:100,v:49},{k:2,s:101,v:49},{k:2,s:102,v:49},{k:2,s:103,v:49},{k:2,s:104,v:49},{k:2,s:105,v:49}],
 [{k:2,s:0,v:50},{k:2,s:7,v:50},{k:2,s:15,v:50},{k:2,s:24,v:50},{k:2,s:30,v:50},{k:2,s:37,v:50},{k:2,s:51,v:50},{k:2,s:52,v:50},{k:2,s:53,v:50},{k:2,s:54,v:50},{k:2,s:55,v:50},{k:2,s:58,v:50},{k:2,s:59,v:50},{k:2,s:60,v:50},{k:2,s:61,v:50},{k:2,s:62,v:50},{k:2,s:64,v:50},{k:2,s:65,v:50},{k:2,s:68,v:50},{k:2,s:69,v:50},{k:2,s:70,v:50},{k:2,s:71,v:50},{k:2,s:72,v:50},{k:2,s:73,v:50},{k:2,s:74,v:50},{k:2,s:75,v:50},{k:2,s:79,v:50},{k:2,s:80,v:50},{k:2,s:81,v:50},{k:2,s:82,v:50},{k:2,s:83,v:50},{k:2,s:84,v:50},{k:2,s:85,v:50},{k:2,s:86,v:50},{k:2,s:87,v:50},{k:2,s:88,v:50},{k:2,s:89,v:50},{k:2,s:90,v:50},{k:2,s:91,v:50},{k:2,s:92,v:50},{k:2,s:93,v:50},{k:2,s:94,v:50},{k:2,s:95,v:50},{k:2,s:96,v:50},{k:2,s:97,v:50},{k:2,s:98,v:50},{k:2,s:100,v:50},{k:2,s:101,v:50},{k:2,s:102,v:50},{k:2,s:103,v:50},{k:2,s:104,v:50},{k:2,s:105,v:50}],
 [{k:2,s:0,v:150},{k:2,s:7,v:150},{k:2,s:15,v:150},{k:2,s:24,v:150},{k:2,s:30,v:150},{k:2,s:34,v:150},{k:2,s:37,v:150},{k:2,s:51,v:150},{k:2,s:52,v:150},{k:2,s:53,v:150},{k:2,s:54,v:150},{k:2,s:55,v:150},{k:2,s:56,v:150},{k:2,s:58,v:150},{k:2,s:59,v:150},{k:2,s:60,v:150},{k:2,s:61,v:150},{k:2,s:62,v:150},{k:2,s:63,v:150},{k:2,s:64,v:150},{k:2,s:65,v:150},{k:2,s:68,v:150},{k:2,s:69,v:150},{k:2,s:70,v:150},{k:2,s:71,v:150},{k:2,s:72,v:150},{k:2,s:73,v:150},{k:2,s:74,v:150},{k:2,s:75,v:150},{k:2,s:79,v:150},{k:2,s:80,v:150},{k:2,s:81,v:150},{k:2,s:82,v:150},{k:2,s:83,v:150},{k:2,s:84,v:150},{k:2,s:85,v:150},{k:2,s:86,v:150},{k:2,s:87,v:150},{k:2,s:88,v:150},{k:2,s:89,v:150},{k:2,s:90,v:150},{k:2,s:91,v:150},{k:2,s:92,v:150},{k:2,s:93,v:150},{k:2,s:94,v:150},{k:2,s:95,v:150},{k:2,s:96,v:150},{k:2,s:97,v:150},{k:2,s:98,v:150},{k:2,s:100,v:150},{k:2,s:101,v:150},{k:2,s:102,v:150},{k:2,s:103,v:150},{k:2,s:104,v:150},{k:2,s:105,v:150}],
 [{k:2,s:0,v:149},{k:2,s:7,v:149},{k:2,s:15,v:149},{k:2,s:24,v:149},{k:2,s:30,v:149},{k:2,s:34,v:149},{k:2,s:37,v:149},{k:2,s:51,v:149},{k:2,s:52,v:149},{k:2,s:53,v:149},{k:2,s:54,v:149},{k:2,s:55,v:149},{k:2,s:56,v:149},{k:2,s:58,v:149},{k:2,s:59,v:149},{k:2,s:60,v:149},{k:2,s:61,v:149},{k:2,s:62,v:149},{k:2,s:63,v:149},{k:2,s:64,v:149},{k:2,s:65,v:149},{k:2,s:68,v:149},{k:2,s:69,v:149},{k:2,s:70,v:149},{k:2,s:71,v:149},{k:2,s:72,v:149},{k:2,s:73,v:149},{k:2,s:74,v:149},{k:2,s:75,v:149},{k:2,s:79,v:149},{k:2,s:80,v:149},{k:2,s:81,v:149},{k:2,s:82,v:149},{k:2,s:83,v:149},{k:2,s:84,v:149},{k:2,s:85,v:149},{k:2,s:86,v:149},{k:2,s:87,v:149},{k:2,s:88,v:149},{k:2,s:89,v:149},{k:2,s:90,v:149},{k:2,s:91,v:149},{k:2,s:92,v:149},{k:2,s:93,v:149},{k:2,s:94,v:149},{k:2,s:95,v:149},{k:2,s:96,v:149},{k:2,s:97,v:149},{k:2,s:98,v:149},{k:2,s:100,v:149},{k:2,s:101,v:149},{k:2,s:102,v:149},{k:2,s:103,v:149},{k:2,s:104,v:149},{k:2,s:105,v:149}],
 [{k:2,s:7,v:44},{k:2,s:15,v:44},{k:2,s:24,v:44},{k:2,s:30,v:44},{k:2,s:37,v:44},{k:2,s:51,v:44},{k:2,s:52,v:44},{k:2,s:53,v:44},{k:2,s:54,v:44},{k:2,s:55,v:44},{k:2,s:58,v:44},{k:2,s:59,v:44},{k:2,s:60,v:44},{k:2,s:61,v:44},{k:2,s:62,v:44},{k:2,s:64,v:44},{k:2,s:65,v:44},{k:2,s:68,v:44},{k:2,s:69,v:44},{k:2,s:70,v:44},{k:2,s:71,v:44},{k:2,s:72,v:44},{k:2,s:73,v:44},{k:2,s:74,v:44},{k:2,s:75,v:44},{k:2,s:77,v:44},{k:2,s:79,v:44},{k:2,s:80,v:44},{k:2,s:81,v:44},{k:2,s:82,v:44},{k:2,s:83,v:44},{k:2,s:84,v:44},{k:2,s:85,v:44},{k:2,s:86,v:44},{k:2,s:87,v:44},{k:2,s:88,v:44},{k:2,s:89,v:44},{k:2,s:90,v:44},{k:2,s:91,v:44},{k:2,s:92,v:44},{k:2,s:93,v:44},{k:2,s:94,v:44},{k:2,s:95,v:44},{k:2,s:96,v:44},{k:2,s:97,v:44},{k:2,s:98,v:44},{k:2,s:100,v:44},{k:2,s:101,v:44},{k:2,s:102,v:44},{k:2,s:103,v:44},{k:2,s:104,v:44},{k:2,s:105,v:44}],
 [{k:1,s:7,v:1},{k:1,s:15,v:2},{k:1,s:24,v:3},{k:1,s:30,v:4},{k:1,s:37,v:5},{k:1,s:51,v:6},{k:1,s:52,v:7},{k:1,s:53,v:8},{k:1,s:54,v:9},{k:1,s:55,v:10},{k:1,s:58,v:11},{k:1,s:59,v:12},{k:1,s:60,v:13},{k:1,s:61,v:14},{k:1,s:62,v:15},{k:1,s:64,v:16},{k:1,s:65,v:17},{k:1,s:68,v:18},{k:1,s:69,v:19},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:72,v:22},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:75,v:25},{k:1,s:77,v:26},{k:1,s:79,v:27},{k:1,s:80,v:28},{k:1,s:81,v:29},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:85,v:33},{k:1,s:86,v:34},{k:1,s:87,v:35},{k:1,s:88,v:36},{k:1,s:89,v:37},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:92,v:40},{k:1,s:93,v:41},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:96,v:44},{k:1,s:97,v:45},{k:1,s:98,v:46},{k:1,s:100,v:47},{k:1,s:101,v:48},{k:1,s:102,v:49},{k:1,s:103,v:50},{k:1,s:104,v:51},{k:1,s:105,v:52},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:112,v:55},{k:3,s:113,v:56},{k:3,s:116,v:57},{k:3,s:119,v:58},{k:3,s:126,v:59},{k:3,s:127,v:60},{k:3,s:128,v:61},{k:3,s:129,v:62},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:142,v:66},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:148,v:69},{k:3,s:149,v:70},{k:3,s:154,v:71},{k:3,s:155,v:72},{k:3,s:156,v:73},{k:3,s:157,v:74},{k:3,s:158,v:75},{k:3,s:162,v:76},{k:3,s:165,v:77},{k:3,s:166,v:195},{k:3,s:167,v:79},{k:3,s:168,v:80},{k:3,s:169,v:81},{k:3,s:171,v:82},{k:3,s:172,v:196},{k:3,s:175,v:85},{k:3,s:176,v:86},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:185,v:89},{k:3,s:187,v:90},{k:3,s:188,v:91},{k:3,s:189,v:92},{k:3,s:190,v:93},{k:3,s:192,v:94},{k:3,s:193,v:95},{k:3,s:194,v:96},{k:3,s:195,v:97},{k:3,s:196,v:98},{k:3,s:197,v:99},{k:3,s:198,v:100},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:201,v:103},{k:3,s:202,v:104},{k:3,s:203,v:105},{k:3,s:205,v:106},{k:3,s:207,v:107},{k:3,s:208,v:108},{k:3,s:209,v:109},{k:3,s:210,v:110},{k:3,s:213,v:111},{k:3,s:220,v:112},{k:3,s:222,v:113},{k:3,s:223,v:114},{k:3,s:224,v:115},{k:3,s:232,v:116}],
 [{k:2,s:6,v:8},{k:2,s:7,v:8},{k:2,s:9,v:8},{k:2,s:10,v:8},{k:2,s:12,v:8},{k:2,s:13,v:8},{k:2,s:16,v:8},{k:2,s:17,v:8},{k:2,s:19,v:8},{k:2,s:20,v:8},{k:2,s:21,v:8},{k:2,s:23,v:8},{k:2,s:24,v:8},{k:2,s:25,v:8},{k:2,s:26,v:8},{k:2,s:27,v:8},{k:2,s:28,v:8},{k:2,s:31,v:8},{k:2,s:32,v:8},{k:2,s:34,v:8},{k:2,s:36,v:8},{k:2,s:37,v:8},{k:2,s:39,v:8},{k:2,s:40,v:8},{k:2,s:42,v:8},{k:2,s:45,v:8},{k:2,s:46,v:8},{k:2,s:47,v:8},{k:2,s:48,v:8},{k:2,s:78,v:8}],
 [{k:2,s:16,v:19},{k:2,s:26,v:19},{k:2,s:74,v:19}],
 [{k:1,s:11,v:197},{k:1,s:14,v:198},{k:1,s:18,v:199},{k:1,s:22,v:200},{k:1,s:29,v:201},{k:1,s:33,v:202},{k:1,s:38,v:203},{k:1,s:41,v:204},{k:1,s:43,v:205},{k:1,s:44,v:206},{k:1,s:49,v:207},{k:1,s:50,v:208},{k:3,s:115,v:209}],
 [{k:2,s:6,v:224},{k:2,s:7,v:224},{k:2,s:9,v:224},{k:2,s:10,v:224},{k:2,s:12,v:224},{k:2,s:13,v:224},{k:2,s:16,v:224},{k:2,s:17,v:224},{k:2,s:19,v:224},{k:2,s:20,v:224},{k:2,s:21,v:224},{k:2,s:23,v:224},{k:2,s:24,v:224},{k:2,s:25,v:224},{k:2,s:26,v:224},{k:2,s:27,v:224},{k:2,s:28,v:224},{k:2,s:31,v:224},{k:2,s:32,v:224},{k:2,s:34,v:224},{k:2,s:36,v:224},{k:2,s:37,v:224},{k:2,s:39,v:224},{k:2,s:40,v:224},{k:2,s:42,v:224},{k:2,s:45,v:224},{k:2,s:46,v:224},{k:2,s:47,v:224},{k:2,s:48,v:224},{k:2,s:78,v:224}],
 [{k:2,s:0,v:88},{k:2,s:7,v:88},{k:2,s:15,v:88},{k:2,s:24,v:88},{k:2,s:30,v:88},{k:2,s:34,v:88},{k:2,s:37,v:88},{k:2,s:51,v:88},{k:2,s:52,v:88},{k:2,s:53,v:88},{k:2,s:54,v:88},{k:2,s:55,v:88},{k:2,s:58,v:88},{k:2,s:59,v:88},{k:2,s:60,v:88},{k:2,s:61,v:88},{k:2,s:62,v:88},{k:2,s:64,v:88},{k:2,s:65,v:88},{k:2,s:68,v:88},{k:2,s:69,v:88},{k:2,s:70,v:88},{k:2,s:71,v:88},{k:2,s:72,v:88},{k:2,s:73,v:88},{k:2,s:74,v:88},{k:2,s:75,v:88},{k:2,s:79,v:88},{k:2,s:80,v:88},{k:2,s:81,v:88},{k:2,s:82,v:88},{k:2,s:83,v:88},{k:2,s:84,v:88},{k:2,s:85,v:88},{k:2,s:86,v:88},{k:2,s:87,v:88},{k:2,s:88,v:88},{k:2,s:89,v:88},{k:2,s:90,v:88},{k:2,s:91,v:88},{k:2,s:92,v:88},{k:2,s:93,v:88},{k:2,s:94,v:88},{k:2,s:95,v:88},{k:2,s:96,v:88},{k:2,s:97,v:88},{k:2,s:98,v:88},{k:2,s:100,v:88},{k:2,s:101,v:88},{k:2,s:102,v:88},{k:2,s:103,v:88},{k:2,s:104,v:88},{k:2,s:105,v:88}],
 [{k:1,s:24,v:210},{k:1,s:30,v:4},{k:3,s:116,v:211},{k:3,s:184,v:212}],
 [{k:2,s:16,v:173},{k:2,s:19,v:173},{k:2,s:24,v:173},{k:2,s:7,v:229},{k:2,s:20,v:229},{k:2,s:26,v:229},{k:2,s:37,v:229}],
 [{k:2,s:51,v:57},{k:2,s:52,v:57},{k:2,s:55,v:57},{k:2,s:58,v:57},{k:2,s:60,v:57},{k:2,s:61,v:57},{k:2,s:65,v:57},{k:2,s:68,v:57},{k:2,s:69,v:57},{k:2,s:74,v:57},{k:2,s:79,v:57},{k:2,s:80,v:57},{k:2,s:81,v:57},{k:2,s:85,v:57},{k:2,s:86,v:57},{k:2,s:87,v:57},{k:2,s:89,v:57},{k:2,s:92,v:57},{k:2,s:93,v:57},{k:2,s:97,v:57},{k:2,s:100,v:57},{k:2,s:102,v:57},{k:2,s:103,v:57}],
 [{k:1,s:51,v:6},{k:1,s:52,v:174},{k:1,s:55,v:175},{k:1,s:58,v:176},{k:1,s:60,v:213},{k:1,s:61,v:177},{k:1,s:65,v:17},{k:1,s:68,v:18},{k:1,s:69,v:178},{k:1,s:74,v:24},{k:1,s:79,v:179},{k:1,s:80,v:28},{k:1,s:81,v:29},{k:1,s:85,v:33},{k:1,s:86,v:34},{k:1,s:87,v:35},{k:1,s:89,v:37},{k:1,s:92,v:40},{k:1,s:93,v:41},{k:1,s:97,v:45},{k:1,s:100,v:47},{k:1,s:102,v:214},{k:1,s:103,v:50},{k:3,s:112,v:55},{k:3,s:129,v:62},{k:3,s:157,v:74},{k:3,s:176,v:86},{k:3,s:189,v:215},{k:3,s:192,v:216},{k:3,s:193,v:95},{k:3,s:201,v:103},{k:3,s:202,v:104},{k:3,s:203,v:105},{k:3,s:207,v:107},{k:3,s:223,v:217}],
 [{k:1,s:15,v:218},{k:1,s:20,v:219},{k:1,s:26,v:220},{k:2,s:74,v:32},{k:2,s:7,v:258},{k:2,s:37,v:258},{k:2,s:11,v:312},{k:2,s:14,v:312},{k:2,s:18,v:312},{k:2,s:22,v:312},{k:2,s:29,v:312},{k:2,s:33,v:312},{k:2,s:38,v:312},{k:2,s:41,v:312},{k:2,s:43,v:312},{k:2,s:44,v:312},{k:2,s:49,v:312},{k:2,s:50,v:312}],
 [{k:2,s:16,v:17},{k:2,s:26,v:17},{k:2,s:74,v:17}],
 [{k:2,s:16,v:172},{k:2,s:19,v:172},{k:2,s:24,v:172},{k:2,s:7,v:260},{k:2,s:37,v:260}],
 [{k:1,s:7,v:221},{k:1,s:37,v:222}],
 [{k:2,s:16,v:171},{k:2,s:19,v:171},{k:2,s:24,v:171},{k:2,s:7,v:259},{k:2,s:37,v:259}],
 [{k:2,s:16,v:170},{k:2,s:19,v:170},{k:2,s:24,v:170}],
 [{k:2,s:16,v:169},{k:2,s:19,v:169},{k:2,s:24,v:169}],
 [{k:1,s:20,v:223},{k:2,s:6,v:257},{k:2,s:7,v:257},{k:2,s:9,v:257},{k:2,s:10,v:257},{k:2,s:12,v:257},{k:2,s:13,v:257},{k:2,s:16,v:257},{k:2,s:17,v:257},{k:2,s:19,v:257},{k:2,s:21,v:257},{k:2,s:23,v:257},{k:2,s:24,v:257},{k:2,s:25,v:257},{k:2,s:27,v:257},{k:2,s:28,v:257},{k:2,s:31,v:257},{k:2,s:32,v:257},{k:2,s:34,v:257},{k:2,s:36,v:257},{k:2,s:37,v:257},{k:2,s:39,v:257},{k:2,s:40,v:257},{k:2,s:42,v:257},{k:2,s:45,v:257},{k:2,s:46,v:257},{k:2,s:47,v:257},{k:2,s:48,v:257},{k:2,s:78,v:257}],
 [{k:1,s:26,v:224},{k:2,s:6,v:222},{k:2,s:7,v:222},{k:2,s:9,v:222},{k:2,s:10,v:222},{k:2,s:12,v:222},{k:2,s:13,v:222},{k:2,s:16,v:222},{k:2,s:17,v:222},{k:2,s:19,v:222},{k:2,s:20,v:222},{k:2,s:21,v:222},{k:2,s:23,v:222},{k:2,s:24,v:222},{k:2,s:25,v:222},{k:2,s:27,v:222},{k:2,s:28,v:222},{k:2,s:31,v:222},{k:2,s:32,v:222},{k:2,s:34,v:222},{k:2,s:36,v:222},{k:2,s:37,v:222},{k:2,s:39,v:222},{k:2,s:40,v:222},{k:2,s:42,v:222},{k:2,s:45,v:222},{k:2,s:46,v:222},{k:2,s:47,v:222},{k:2,s:48,v:222},{k:2,s:78,v:222}],
 [{k:1,s:26,v:225},{k:2,s:74,v:15}],
 [{k:2,s:6,v:39},{k:2,s:7,v:39},{k:2,s:9,v:39},{k:2,s:10,v:39},{k:2,s:11,v:39},{k:2,s:12,v:39},{k:2,s:13,v:39},{k:2,s:14,v:39},{k:2,s:15,v:39},{k:2,s:16,v:39},{k:2,s:17,v:39},{k:2,s:18,v:39},{k:2,s:19,v:39},{k:2,s:20,v:39},{k:2,s:21,v:39},{k:2,s:22,v:39},{k:2,s:23,v:39},{k:2,s:24,v:39},{k:2,s:25,v:39},{k:2,s:26,v:39},{k:2,s:27,v:39},{k:2,s:28,v:39},{k:2,s:29,v:39},{k:2,s:30,v:39},{k:2,s:31,v:39},{k:2,s:32,v:39},{k:2,s:33,v:39},{k:2,s:34,v:39},{k:2,s:36,v:39},{k:2,s:37,v:39},{k:2,s:38,v:39},{k:2,s:39,v:39},{k:2,s:40,v:39},{k:2,s:41,v:39},{k:2,s:42,v:39},{k:2,s:43,v:39},{k:2,s:44,v:39},{k:2,s:45,v:39},{k:2,s:46,v:39},{k:2,s:47,v:39},{k:2,s:48,v:39},{k:2,s:49,v:39},{k:2,s:50,v:39},{k:2,s:74,v:39},{k:2,s:76,v:39},{k:2,s:78,v:39}],
 [{k:2,s:74,v:16}],
 [{k:2,s:0,v:164},{k:2,s:7,v:164},{k:2,s:15,v:164},{k:2,s:24,v:164},{k:2,s:30,v:164},{k:2,s:34,v:164},{k:2,s:37,v:164},{k:2,s:51,v:164},{k:2,s:52,v:164},{k:2,s:53,v:164},{k:2,s:54,v:164},{k:2,s:55,v:164},{k:2,s:56,v:164},{k:2,s:58,v:164},{k:2,s:59,v:164},{k:2,s:60,v:164},{k:2,s:61,v:164},{k:2,s:62,v:164},{k:2,s:63,v:164},{k:2,s:64,v:164},{k:2,s:65,v:164},{k:2,s:66,v:164},{k:2,s:68,v:164},{k:2,s:69,v:164},{k:2,s:70,v:164},{k:2,s:71,v:164},{k:2,s:72,v:164},{k:2,s:73,v:164},{k:2,s:74,v:164},{k:2,s:75,v:164},{k:2,s:79,v:164},{k:2,s:80,v:164},{k:2,s:81,v:164},{k:2,s:82,v:164},{k:2,s:83,v:164},{k:2,s:84,v:164},{k:2,s:85,v:164},{k:2,s:86,v:164},{k:2,s:87,v:164},{k:2,s:88,v:164},{k:2,s:89,v:164},{k:2,s:90,v:164},{k:2,s:91,v:164},{k:2,s:92,v:164},{k:2,s:93,v:164},{k:2,s:94,v:164},{k:2,s:95,v:164},{k:2,s:96,v:164},{k:2,s:97,v:164},{k:2,s:98,v:164},{k:2,s:100,v:164},{k:2,s:101,v:164},{k:2,s:102,v:164},{k:2,s:103,v:164},{k:2,s:104,v:164},{k:2,s:105,v:164}],
 [{k:2,s:6,v:38},{k:2,s:7,v:38},{k:2,s:9,v:38},{k:2,s:10,v:38},{k:2,s:11,v:38},{k:2,s:12,v:38},{k:2,s:13,v:38},{k:2,s:14,v:38},{k:2,s:15,v:38},{k:2,s:16,v:38},{k:2,s:17,v:38},{k:2,s:18,v:38},{k:2,s:19,v:38},{k:2,s:20,v:38},{k:2,s:21,v:38},{k:2,s:22,v:38},{k:2,s:23,v:38},{k:2,s:24,v:38},{k:2,s:25,v:38},{k:2,s:26,v:38},{k:2,s:27,v:38},{k:2,s:28,v:38},{k:2,s:29,v:38},{k:2,s:30,v:38},{k:2,s:31,v:38},{k:2,s:32,v:38},{k:2,s:33,v:38},{k:2,s:34,v:38},{k:2,s:36,v:38},{k:2,s:37,v:38},{k:2,s:38,v:38},{k:2,s:39,v:38},{k:2,s:40,v:38},{k:2,s:41,v:38},{k:2,s:42,v:38},{k:2,s:43,v:38},{k:2,s:44,v:38},{k:2,s:45,v:38},{k:2,s:46,v:38},{k:2,s:47,v:38},{k:2,s:48,v:38},{k:2,s:49,v:38},{k:2,s:50,v:38},{k:2,s:74,v:38},{k:2,s:76,v:38},{k:2,s:78,v:38}],
 [{k:2,s:7,v:53},{k:2,s:15,v:53},{k:2,s:24,v:53},{k:2,s:30,v:53},{k:2,s:37,v:53},{k:2,s:51,v:53},{k:2,s:52,v:53},{k:2,s:53,v:53},{k:2,s:54,v:53},{k:2,s:55,v:53},{k:2,s:58,v:53},{k:2,s:59,v:53},{k:2,s:60,v:53},{k:2,s:61,v:53},{k:2,s:62,v:53},{k:2,s:64,v:53},{k:2,s:65,v:53},{k:2,s:68,v:53},{k:2,s:69,v:53},{k:2,s:70,v:53},{k:2,s:71,v:53},{k:2,s:72,v:53},{k:2,s:73,v:53},{k:2,s:74,v:53},{k:2,s:75,v:53},{k:2,s:77,v:53},{k:2,s:79,v:53},{k:2,s:80,v:53},{k:2,s:81,v:53},{k:2,s:82,v:53},{k:2,s:83,v:53},{k:2,s:84,v:53},{k:2,s:85,v:53},{k:2,s:86,v:53},{k:2,s:87,v:53},{k:2,s:88,v:53},{k:2,s:89,v:53},{k:2,s:90,v:53},{k:2,s:91,v:53},{k:2,s:92,v:53},{k:2,s:93,v:53},{k:2,s:94,v:53},{k:2,s:95,v:53},{k:2,s:96,v:53},{k:2,s:97,v:53},{k:2,s:98,v:53},{k:2,s:100,v:53},{k:2,s:101,v:53},{k:2,s:102,v:53},{k:2,s:103,v:53},{k:2,s:104,v:53},{k:2,s:105,v:53}],
 [{k:2,s:0,v:51},{k:2,s:7,v:51},{k:2,s:15,v:51},{k:2,s:24,v:51},{k:2,s:30,v:51},{k:2,s:37,v:51},{k:2,s:51,v:51},{k:2,s:52,v:51},{k:2,s:53,v:51},{k:2,s:54,v:51},{k:2,s:55,v:51},{k:2,s:58,v:51},{k:2,s:59,v:51},{k:2,s:60,v:51},{k:2,s:61,v:51},{k:2,s:62,v:51},{k:2,s:64,v:51},{k:2,s:65,v:51},{k:2,s:68,v:51},{k:2,s:69,v:51},{k:2,s:70,v:51},{k:2,s:71,v:51},{k:2,s:72,v:51},{k:2,s:73,v:51},{k:2,s:74,v:51},{k:2,s:75,v:51},{k:2,s:79,v:51},{k:2,s:80,v:51},{k:2,s:81,v:51},{k:2,s:82,v:51},{k:2,s:83,v:51},{k:2,s:84,v:51},{k:2,s:85,v:51},{k:2,s:86,v:51},{k:2,s:87,v:51},{k:2,s:88,v:51},{k:2,s:89,v:51},{k:2,s:90,v:51},{k:2,s:91,v:51},{k:2,s:92,v:51},{k:2,s:93,v:51},{k:2,s:94,v:51},{k:2,s:95,v:51},{k:2,s:96,v:51},{k:2,s:97,v:51},{k:2,s:98,v:51},{k:2,s:100,v:51},{k:2,s:101,v:51},{k:2,s:102,v:51},{k:2,s:103,v:51},{k:2,s:104,v:51},{k:2,s:105,v:51}],
 [{k:1,s:24,v:226}],
 [{k:2,s:0,v:148},{k:2,s:7,v:148},{k:2,s:15,v:148},{k:2,s:24,v:148},{k:2,s:30,v:148},{k:2,s:34,v:148},{k:2,s:37,v:148},{k:2,s:51,v:148},{k:2,s:52,v:148},{k:2,s:53,v:148},{k:2,s:54,v:148},{k:2,s:55,v:148},{k:2,s:56,v:148},{k:2,s:58,v:148},{k:2,s:59,v:148},{k:2,s:60,v:148},{k:2,s:61,v:148},{k:2,s:62,v:148},{k:2,s:63,v:148},{k:2,s:64,v:148},{k:2,s:65,v:148},{k:2,s:68,v:148},{k:2,s:69,v:148},{k:2,s:70,v:148},{k:2,s:71,v:148},{k:2,s:72,v:148},{k:2,s:73,v:148},{k:2,s:74,v:148},{k:2,s:75,v:148},{k:2,s:79,v:148},{k:2,s:80,v:148},{k:2,s:81,v:148},{k:2,s:82,v:148},{k:2,s:83,v:148},{k:2,s:84,v:148},{k:2,s:85,v:148},{k:2,s:86,v:148},{k:2,s:87,v:148},{k:2,s:88,v:148},{k:2,s:89,v:148},{k:2,s:90,v:148},{k:2,s:91,v:148},{k:2,s:92,v:148},{k:2,s:93,v:148},{k:2,s:94,v:148},{k:2,s:95,v:148},{k:2,s:96,v:148},{k:2,s:97,v:148},{k:2,s:98,v:148},{k:2,s:100,v:148},{k:2,s:101,v:148},{k:2,s:102,v:148},{k:2,s:103,v:148},{k:2,s:104,v:148},{k:2,s:105,v:148}],
 [{k:2,s:0,v:160},{k:2,s:7,v:160},{k:2,s:15,v:160},{k:2,s:24,v:160},{k:2,s:30,v:160},{k:2,s:34,v:160},{k:2,s:37,v:160},{k:2,s:51,v:160},{k:2,s:52,v:160},{k:2,s:53,v:160},{k:2,s:54,v:160},{k:2,s:55,v:160},{k:2,s:56,v:160},{k:2,s:58,v:160},{k:2,s:59,v:160},{k:2,s:60,v:160},{k:2,s:61,v:160},{k:2,s:62,v:160},{k:2,s:63,v:160},{k:2,s:64,v:160},{k:2,s:65,v:160},{k:2,s:66,v:160},{k:2,s:68,v:160},{k:2,s:69,v:160},{k:2,s:70,v:160},{k:2,s:71,v:160},{k:2,s:72,v:160},{k:2,s:73,v:160},{k:2,s:74,v:160},{k:2,s:75,v:160},{k:2,s:79,v:160},{k:2,s:80,v:160},{k:2,s:81,v:160},{k:2,s:82,v:160},{k:2,s:83,v:160},{k:2,s:84,v:160},{k:2,s:85,v:160},{k:2,s:86,v:160},{k:2,s:87,v:160},{k:2,s:88,v:160},{k:2,s:89,v:160},{k:2,s:90,v:160},{k:2,s:91,v:160},{k:2,s:92,v:160},{k:2,s:93,v:160},{k:2,s:94,v:160},{k:2,s:95,v:160},{k:2,s:96,v:160},{k:2,s:97,v:160},{k:2,s:98,v:160},{k:2,s:100,v:160},{k:2,s:101,v:160},{k:2,s:102,v:160},{k:2,s:103,v:160},{k:2,s:104,v:160},{k:2,s:105,v:160}],
 [{k:2,s:0,v:165},{k:2,s:7,v:165},{k:2,s:15,v:165},{k:2,s:24,v:165},{k:2,s:30,v:165},{k:2,s:34,v:165},{k:2,s:37,v:165},{k:2,s:51,v:165},{k:2,s:52,v:165},{k:2,s:53,v:165},{k:2,s:54,v:165},{k:2,s:55,v:165},{k:2,s:56,v:165},{k:2,s:58,v:165},{k:2,s:59,v:165},{k:2,s:60,v:165},{k:2,s:61,v:165},{k:2,s:62,v:165},{k:2,s:63,v:165},{k:2,s:64,v:165},{k:2,s:65,v:165},{k:2,s:66,v:165},{k:2,s:68,v:165},{k:2,s:69,v:165},{k:2,s:70,v:165},{k:2,s:71,v:165},{k:2,s:72,v:165},{k:2,s:73,v:165},{k:2,s:74,v:165},{k:2,s:75,v:165},{k:2,s:79,v:165},{k:2,s:80,v:165},{k:2,s:81,v:165},{k:2,s:82,v:165},{k:2,s:83,v:165},{k:2,s:84,v:165},{k:2,s:85,v:165},{k:2,s:86,v:165},{k:2,s:87,v:165},{k:2,s:88,v:165},{k:2,s:89,v:165},{k:2,s:90,v:165},{k:2,s:91,v:165},{k:2,s:92,v:165},{k:2,s:93,v:165},{k:2,s:94,v:165},{k:2,s:95,v:165},{k:2,s:96,v:165},{k:2,s:97,v:165},{k:2,s:98,v:165},{k:2,s:100,v:165},{k:2,s:101,v:165},{k:2,s:102,v:165},{k:2,s:103,v:165},{k:2,s:104,v:165},{k:2,s:105,v:165}],
 [{k:1,s:74,v:227},{k:3,s:186,v:228},{k:3,s:227,v:229},{k:3,s:228,v:230},{k:3,s:229,v:231}],
 [{k:2,s:7,v:54},{k:2,s:15,v:54},{k:2,s:24,v:54},{k:2,s:30,v:54},{k:2,s:37,v:54},{k:2,s:51,v:54},{k:2,s:52,v:54},{k:2,s:53,v:54},{k:2,s:54,v:54},{k:2,s:55,v:54},{k:2,s:58,v:54},{k:2,s:59,v:54},{k:2,s:60,v:54},{k:2,s:61,v:54},{k:2,s:62,v:54},{k:2,s:64,v:54},{k:2,s:65,v:54},{k:2,s:68,v:54},{k:2,s:69,v:54},{k:2,s:70,v:54},{k:2,s:71,v:54},{k:2,s:72,v:54},{k:2,s:73,v:54},{k:2,s:74,v:54},{k:2,s:75,v:54},{k:2,s:77,v:54},{k:2,s:79,v:54},{k:2,s:80,v:54},{k:2,s:81,v:54},{k:2,s:82,v:54},{k:2,s:83,v:54},{k:2,s:84,v:54},{k:2,s:85,v:54},{k:2,s:86,v:54},{k:2,s:87,v:54},{k:2,s:88,v:54},{k:2,s:89,v:54},{k:2,s:90,v:54},{k:2,s:91,v:54},{k:2,s:92,v:54},{k:2,s:93,v:54},{k:2,s:94,v:54},{k:2,s:95,v:54},{k:2,s:96,v:54},{k:2,s:97,v:54},{k:2,s:98,v:54},{k:2,s:100,v:54},{k:2,s:101,v:54},{k:2,s:102,v:54},{k:2,s:103,v:54},{k:2,s:104,v:54},{k:2,s:105,v:54}],
 [{k:2,s:0,v:151},{k:2,s:7,v:151},{k:2,s:15,v:151},{k:2,s:24,v:151},{k:2,s:30,v:151},{k:2,s:34,v:151},{k:2,s:37,v:151},{k:2,s:51,v:151},{k:2,s:52,v:151},{k:2,s:53,v:151},{k:2,s:54,v:151},{k:2,s:55,v:151},{k:2,s:56,v:151},{k:2,s:58,v:151},{k:2,s:59,v:151},{k:2,s:60,v:151},{k:2,s:61,v:151},{k:2,s:62,v:151},{k:2,s:63,v:151},{k:2,s:64,v:151},{k:2,s:65,v:151},{k:2,s:68,v:151},{k:2,s:69,v:151},{k:2,s:70,v:151},{k:2,s:71,v:151},{k:2,s:72,v:151},{k:2,s:73,v:151},{k:2,s:74,v:151},{k:2,s:75,v:151},{k:2,s:79,v:151},{k:2,s:80,v:151},{k:2,s:81,v:151},{k:2,s:82,v:151},{k:2,s:83,v:151},{k:2,s:84,v:151},{k:2,s:85,v:151},{k:2,s:86,v:151},{k:2,s:87,v:151},{k:2,s:88,v:151},{k:2,s:89,v:151},{k:2,s:90,v:151},{k:2,s:91,v:151},{k:2,s:92,v:151},{k:2,s:93,v:151},{k:2,s:94,v:151},{k:2,s:95,v:151},{k:2,s:96,v:151},{k:2,s:97,v:151},{k:2,s:98,v:151},{k:2,s:100,v:151},{k:2,s:101,v:151},{k:2,s:102,v:151},{k:2,s:103,v:151},{k:2,s:104,v:151},{k:2,s:105,v:151}],
 [{k:1,s:6,v:117},{k:1,s:7,v:1},{k:1,s:8,v:118},{k:1,s:15,v:119},{k:1,s:35,v:120},{k:1,s:36,v:121},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:109,v:128},{k:3,s:110,v:54},{k:3,s:120,v:129},{k:3,s:127,v:130},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:155,v:131},{k:3,s:158,v:75},{k:3,s:175,v:85},{k:3,s:181,v:88},{k:3,s:188,v:132},{k:3,s:192,v:133},{k:3,s:194,v:134},{k:3,s:195,v:135},{k:3,s:196,v:136},{k:3,s:197,v:137},{k:3,s:198,v:138},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:207,v:107},{k:3,s:225,v:232},{k:3,s:226,v:140}],
 [{k:1,s:6,v:117},{k:1,s:7,v:1},{k:1,s:8,v:118},{k:1,s:15,v:119},{k:1,s:35,v:120},{k:1,s:36,v:121},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:109,v:128},{k:3,s:110,v:54},{k:3,s:120,v:129},{k:3,s:127,v:130},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:155,v:131},{k:3,s:158,v:75},{k:3,s:175,v:85},{k:3,s:181,v:88},{k:3,s:188,v:132},{k:3,s:192,v:133},{k:3,s:194,v:134},{k:3,s:195,v:135},{k:3,s:196,v:136},{k:3,s:197,v:137},{k:3,s:198,v:138},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:207,v:107},{k:3,s:225,v:233},{k:3,s:226,v:140}],
 [{k:1,s:6,v:117},{k:1,s:7,v:1},{k:1,s:8,v:118},{k:1,s:15,v:119},{k:1,s:35,v:120},{k:1,s:36,v:121},{k:1,s:37,v:5},{k:1,s:52,v:7},{k:1,s:53,v:8},{k:1,s:55,v:10},{k:1,s:58,v:11},{k:1,s:59,v:12},{k:1,s:61,v:14},{k:1,s:65,v:17},{k:1,s:69,v:19},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:27},{k:1,s:80,v:28},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:89,v:37},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:106,v:141},{k:3,s:107,v:142},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:113,v:143},{k:3,s:114,v:144},{k:3,s:120,v:129},{k:3,s:127,v:130},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:135,v:145},{k:3,s:136,v:146},{k:3,s:137,v:147},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:150,v:148},{k:3,s:151,v:149},{k:3,s:153,v:234},{k:3,s:155,v:72},{k:3,s:157,v:74},{k:3,s:158,v:75},{k:3,s:174,v:151},{k:3,s:175,v:85},{k:3,s:176,v:86},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:188,v:132},{k:3,s:191,v:152},{k:3,s:192,v:235},{k:3,s:193,v:95},{k:3,s:194,v:134},{k:3,s:195,v:135},{k:3,s:196,v:136},{k:3,s:197,v:137},{k:3,s:198,v:138},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:201,v:236},{k:3,s:202,v:104},{k:3,s:204,v:154},{k:3,s:206,v:155},{k:3,s:207,v:107},{k:3,s:225,v:156},{k:3,s:226,v:140}],
 [{k:1,s:6,v:117},{k:1,s:7,v:1},{k:1,s:8,v:118},{k:1,s:15,v:119},{k:1,s:35,v:120},{k:1,s:36,v:121},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:109,v:128},{k:3,s:110,v:54},{k:3,s:120,v:129},{k:3,s:127,v:130},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:155,v:131},{k:3,s:158,v:75},{k:3,s:175,v:85},{k:3,s:181,v:88},{k:3,s:188,v:132},{k:3,s:192,v:133},{k:3,s:194,v:134},{k:3,s:195,v:135},{k:3,s:196,v:136},{k:3,s:197,v:137},{k:3,s:198,v:138},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:207,v:107},{k:3,s:225,v:237},{k:3,s:226,v:140}],
 [{k:1,s:6,v:117},{k:1,s:7,v:1},{k:1,s:8,v:118},{k:1,s:15,v:119},{k:1,s:35,v:120},{k:1,s:36,v:121},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:109,v:128},{k:3,s:110,v:54},{k:3,s:120,v:129},{k:3,s:127,v:130},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:155,v:131},{k:3,s:158,v:75},{k:3,s:175,v:85},{k:3,s:181,v:88},{k:3,s:188,v:132},{k:3,s:192,v:133},{k:3,s:194,v:134},{k:3,s:195,v:135},{k:3,s:196,v:136},{k:3,s:197,v:137},{k:3,s:198,v:138},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:207,v:107},{k:3,s:225,v:238},{k:3,s:226,v:140}],
 [{k:2,s:15,v:327}],
 [{k:2,s:15,v:328}],
 [{k:2,s:15,v:329}],
 [{k:1,s:15,v:168}],
 [{k:2,s:15,v:330}],
 [{k:2,s:15,v:331}],
 [{k:2,s:6,v:230},{k:2,s:7,v:230},{k:2,s:9,v:230},{k:2,s:10,v:230},{k:2,s:12,v:230},{k:2,s:13,v:230},{k:2,s:16,v:230},{k:2,s:17,v:230},{k:2,s:19,v:230},{k:2,s:20,v:230},{k:2,s:21,v:230},{k:2,s:23,v:230},{k:2,s:24,v:230},{k:2,s:25,v:230},{k:2,s:26,v:230},{k:2,s:27,v:230},{k:2,s:28,v:230},{k:2,s:31,v:230},{k:2,s:32,v:230},{k:2,s:34,v:230},{k:2,s:36,v:230},{k:2,s:37,v:230},{k:2,s:39,v:230},{k:2,s:40,v:230},{k:2,s:42,v:230},{k:2,s:45,v:230},{k:2,s:46,v:230},{k:2,s:47,v:230},{k:2,s:48,v:230},{k:2,s:78,v:230}],
 [{k:2,s:6,v:273},{k:2,s:9,v:273},{k:2,s:10,v:273},{k:2,s:12,v:273},{k:2,s:13,v:273},{k:2,s:16,v:273},{k:2,s:17,v:273},{k:2,s:19,v:273},{k:2,s:21,v:273},{k:2,s:23,v:273},{k:2,s:24,v:273},{k:2,s:25,v:273},{k:2,s:27,v:273},{k:2,s:28,v:273},{k:2,s:31,v:273},{k:2,s:32,v:273},{k:2,s:34,v:273},{k:2,s:36,v:273},{k:2,s:39,v:273},{k:2,s:40,v:273},{k:2,s:42,v:273},{k:2,s:45,v:273},{k:2,s:46,v:273},{k:2,s:47,v:273},{k:2,s:48,v:273},{k:2,s:78,v:273}],
 [{k:2,s:6,v:227},{k:2,s:7,v:227},{k:2,s:9,v:227},{k:2,s:10,v:227},{k:2,s:12,v:227},{k:2,s:13,v:227},{k:2,s:16,v:227},{k:2,s:17,v:227},{k:2,s:19,v:227},{k:2,s:20,v:227},{k:2,s:21,v:227},{k:2,s:23,v:227},{k:2,s:24,v:227},{k:2,s:25,v:227},{k:2,s:26,v:227},{k:2,s:27,v:227},{k:2,s:28,v:227},{k:2,s:31,v:227},{k:2,s:32,v:227},{k:2,s:34,v:227},{k:2,s:36,v:227},{k:2,s:37,v:227},{k:2,s:39,v:227},{k:2,s:40,v:227},{k:2,s:42,v:227},{k:2,s:45,v:227},{k:2,s:46,v:227},{k:2,s:47,v:227},{k:2,s:48,v:227},{k:2,s:78,v:227}],
 [{k:2,s:6,v:228},{k:2,s:7,v:228},{k:2,s:9,v:228},{k:2,s:10,v:228},{k:2,s:12,v:228},{k:2,s:13,v:228},{k:2,s:16,v:228},{k:2,s:17,v:228},{k:2,s:19,v:228},{k:2,s:20,v:228},{k:2,s:21,v:228},{k:2,s:23,v:228},{k:2,s:24,v:228},{k:2,s:25,v:228},{k:2,s:26,v:228},{k:2,s:27,v:228},{k:2,s:28,v:228},{k:2,s:31,v:228},{k:2,s:32,v:228},{k:2,s:34,v:228},{k:2,s:36,v:228},{k:2,s:37,v:228},{k:2,s:39,v:228},{k:2,s:40,v:228},{k:2,s:42,v:228},{k:2,s:45,v:228},{k:2,s:46,v:228},{k:2,s:47,v:228},{k:2,s:48,v:228},{k:2,s:78,v:228}],
 [{k:2,s:6,v:229},{k:2,s:7,v:229},{k:2,s:9,v:229},{k:2,s:10,v:229},{k:2,s:12,v:229},{k:2,s:13,v:229},{k:2,s:16,v:229},{k:2,s:17,v:229},{k:2,s:19,v:229},{k:2,s:20,v:229},{k:2,s:21,v:229},{k:2,s:23,v:229},{k:2,s:24,v:229},{k:2,s:25,v:229},{k:2,s:26,v:229},{k:2,s:27,v:229},{k:2,s:28,v:229},{k:2,s:31,v:229},{k:2,s:32,v:229},{k:2,s:34,v:229},{k:2,s:36,v:229},{k:2,s:37,v:229},{k:2,s:39,v:229},{k:2,s:40,v:229},{k:2,s:42,v:229},{k:2,s:45,v:229},{k:2,s:46,v:229},{k:2,s:47,v:229},{k:2,s:48,v:229},{k:2,s:78,v:229}],
 [{k:1,s:15,v:218},{k:1,s:20,v:219},{k:1,s:26,v:239},{k:2,s:6,v:258},{k:2,s:7,v:258},{k:2,s:9,v:258},{k:2,s:10,v:258},{k:2,s:12,v:258},{k:2,s:13,v:258},{k:2,s:16,v:258},{k:2,s:17,v:258},{k:2,s:19,v:258},{k:2,s:21,v:258},{k:2,s:23,v:258},{k:2,s:24,v:258},{k:2,s:25,v:258},{k:2,s:27,v:258},{k:2,s:28,v:258},{k:2,s:31,v:258},{k:2,s:32,v:258},{k:2,s:34,v:258},{k:2,s:36,v:258},{k:2,s:37,v:258},{k:2,s:39,v:258},{k:2,s:40,v:258},{k:2,s:42,v:258},{k:2,s:45,v:258},{k:2,s:46,v:258},{k:2,s:47,v:258},{k:2,s:48,v:258},{k:2,s:78,v:258}],
 [{k:2,s:6,v:260},{k:2,s:7,v:260},{k:2,s:9,v:260},{k:2,s:10,v:260},{k:2,s:12,v:260},{k:2,s:13,v:260},{k:2,s:16,v:260},{k:2,s:17,v:260},{k:2,s:19,v:260},{k:2,s:21,v:260},{k:2,s:23,v:260},{k:2,s:24,v:260},{k:2,s:25,v:260},{k:2,s:27,v:260},{k:2,s:28,v:260},{k:2,s:31,v:260},{k:2,s:32,v:260},{k:2,s:34,v:260},{k:2,s:36,v:260},{k:2,s:37,v:260},{k:2,s:39,v:260},{k:2,s:40,v:260},{k:2,s:42,v:260},{k:2,s:45,v:260},{k:2,s:46,v:260},{k:2,s:47,v:260},{k:2,s:48,v:260},{k:2,s:78,v:260}],
 [{k:1,s:7,v:221},{k:1,s:37,v:222},{k:2,s:6,v:270},{k:2,s:9,v:270},{k:2,s:10,v:270},{k:2,s:12,v:270},{k:2,s:13,v:270},{k:2,s:16,v:270},{k:2,s:17,v:270},{k:2,s:19,v:270},{k:2,s:21,v:270},{k:2,s:23,v:270},{k:2,s:24,v:270},{k:2,s:25,v:270},{k:2,s:27,v:270},{k:2,s:28,v:270},{k:2,s:31,v:270},{k:2,s:32,v:270},{k:2,s:34,v:270},{k:2,s:36,v:270},{k:2,s:39,v:270},{k:2,s:40,v:270},{k:2,s:42,v:270},{k:2,s:45,v:270},{k:2,s:46,v:270},{k:2,s:47,v:270},{k:2,s:48,v:270},{k:2,s:78,v:270}],
 [{k:2,s:6,v:259},{k:2,s:7,v:259},{k:2,s:9,v:259},{k:2,s:10,v:259},{k:2,s:12,v:259},{k:2,s:13,v:259},{k:2,s:16,v:259},{k:2,s:17,v:259},{k:2,s:19,v:259},{k:2,s:21,v:259},{k:2,s:23,v:259},{k:2,s:24,v:259},{k:2,s:25,v:259},{k:2,s:27,v:259},{k:2,s:28,v:259},{k:2,s:31,v:259},{k:2,s:32,v:259},{k:2,s:34,v:259},{k:2,s:36,v:259},{k:2,s:37,v:259},{k:2,s:39,v:259},{k:2,s:40,v:259},{k:2,s:42,v:259},{k:2,s:45,v:259},{k:2,s:46,v:259},{k:2,s:47,v:259},{k:2,s:48,v:259},{k:2,s:78,v:259}],
 [{k:2,s:6,v:264},{k:2,s:9,v:264},{k:2,s:10,v:264},{k:2,s:12,v:264},{k:2,s:13,v:264},{k:2,s:16,v:264},{k:2,s:17,v:264},{k:2,s:19,v:264},{k:2,s:21,v:264},{k:2,s:23,v:264},{k:2,s:24,v:264},{k:2,s:25,v:264},{k:2,s:27,v:264},{k:2,s:28,v:264},{k:2,s:31,v:264},{k:2,s:32,v:264},{k:2,s:34,v:264},{k:2,s:36,v:264},{k:2,s:39,v:264},{k:2,s:40,v:264},{k:2,s:42,v:264},{k:2,s:45,v:264},{k:2,s:46,v:264},{k:2,s:47,v:264},{k:2,s:48,v:264},{k:2,s:78,v:264}],
 [{k:2,s:6,v:263},{k:2,s:9,v:263},{k:2,s:10,v:263},{k:2,s:12,v:263},{k:2,s:13,v:263},{k:2,s:16,v:263},{k:2,s:17,v:263},{k:2,s:19,v:263},{k:2,s:21,v:263},{k:2,s:23,v:263},{k:2,s:24,v:263},{k:2,s:25,v:263},{k:2,s:27,v:263},{k:2,s:28,v:263},{k:2,s:31,v:263},{k:2,s:32,v:263},{k:2,s:34,v:263},{k:2,s:36,v:263},{k:2,s:39,v:263},{k:2,s:40,v:263},{k:2,s:42,v:263},{k:2,s:45,v:263},{k:2,s:46,v:263},{k:2,s:47,v:263},{k:2,s:48,v:263},{k:2,s:78,v:263}],
 [{k:2,s:6,v:269},{k:2,s:9,v:269},{k:2,s:10,v:269},{k:2,s:12,v:269},{k:2,s:13,v:269},{k:2,s:16,v:269},{k:2,s:17,v:269},{k:2,s:19,v:269},{k:2,s:21,v:269},{k:2,s:23,v:269},{k:2,s:24,v:269},{k:2,s:25,v:269},{k:2,s:27,v:269},{k:2,s:28,v:269},{k:2,s:31,v:269},{k:2,s:32,v:269},{k:2,s:34,v:269},{k:2,s:36,v:269},{k:2,s:39,v:269},{k:2,s:40,v:269},{k:2,s:42,v:269},{k:2,s:45,v:269},{k:2,s:46,v:269},{k:2,s:47,v:269},{k:2,s:48,v:269},{k:2,s:78,v:269}],
 [{k:2,s:6,v:267},{k:2,s:9,v:267},{k:2,s:10,v:267},{k:2,s:12,v:267},{k:2,s:13,v:267},{k:2,s:16,v:267},{k:2,s:17,v:267},{k:2,s:19,v:267},{k:2,s:21,v:267},{k:2,s:23,v:267},{k:2,s:24,v:267},{k:2,s:25,v:267},{k:2,s:27,v:267},{k:2,s:28,v:267},{k:2,s:31,v:267},{k:2,s:32,v:267},{k:2,s:34,v:267},{k:2,s:36,v:267},{k:2,s:39,v:267},{k:2,s:40,v:267},{k:2,s:42,v:267},{k:2,s:45,v:267},{k:2,s:46,v:267},{k:2,s:47,v:267},{k:2,s:48,v:267},{k:2,s:78,v:267}],
 [{k:1,s:6,v:240},{k:1,s:36,v:241},{k:2,s:9,v:285},{k:2,s:12,v:285},{k:2,s:13,v:285},{k:2,s:16,v:285},{k:2,s:19,v:285},{k:2,s:23,v:285},{k:2,s:24,v:285},{k:2,s:25,v:285},{k:2,s:27,v:285},{k:2,s:28,v:285},{k:2,s:31,v:285},{k:2,s:32,v:285},{k:2,s:34,v:285},{k:2,s:39,v:285},{k:2,s:40,v:285},{k:2,s:42,v:285},{k:2,s:45,v:285},{k:2,s:46,v:285},{k:2,s:47,v:285},{k:2,s:48,v:285},{k:2,s:78,v:285}],
 [{k:1,s:12,v:242},{k:2,s:13,v:299},{k:2,s:16,v:299},{k:2,s:19,v:299},{k:2,s:23,v:299},{k:2,s:24,v:299},{k:2,s:25,v:299},{k:2,s:27,v:299},{k:2,s:28,v:299},{k:2,s:31,v:299},{k:2,s:32,v:299},{k:2,s:34,v:299}],
 [{k:2,s:16,v:310},{k:2,s:19,v:310},{k:2,s:23,v:310},{k:2,s:24,v:310},{k:2,s:27,v:310},{k:2,s:34,v:310}],
 [{k:2,s:16,v:332},{k:2,s:19,v:332},{k:2,s:23,v:332},{k:2,s:24,v:332},{k:2,s:27,v:332},{k:2,s:34,v:332}],
 [{k:1,s:13,v:243},{k:2,s:16,v:305},{k:2,s:19,v:305},{k:2,s:23,v:305},{k:2,s:24,v:305},{k:2,s:25,v:305},{k:2,s:27,v:305},{k:2,s:32,v:305},{k:2,s:34,v:305}],
 [{k:2,s:16,v:309},{k:2,s:19,v:309},{k:2,s:23,v:309},{k:2,s:24,v:309},{k:2,s:27,v:309},{k:2,s:34,v:309}],
 [{k:1,s:25,v:244},{k:1,s:32,v:245},{k:2,s:16,v:307},{k:2,s:19,v:307},{k:2,s:23,v:307},{k:2,s:24,v:307},{k:2,s:27,v:307},{k:2,s:34,v:307}],
 [{k:1,s:9,v:246},{k:1,s:45,v:247},{k:2,s:12,v:297},{k:2,s:13,v:297},{k:2,s:16,v:297},{k:2,s:19,v:297},{k:2,s:23,v:297},{k:2,s:24,v:297},{k:2,s:25,v:297},{k:2,s:27,v:297},{k:2,s:28,v:297},{k:2,s:31,v:297},{k:2,s:32,v:297},{k:2,s:34,v:297}],
 [{k:1,s:28,v:248},{k:2,s:13,v:301},{k:2,s:16,v:301},{k:2,s:19,v:301},{k:2,s:23,v:301},{k:2,s:24,v:301},{k:2,s:25,v:301},{k:2,s:27,v:301},{k:2,s:31,v:301},{k:2,s:32,v:301},{k:2,s:34,v:301}],
 [{k:1,s:16,v:249}],
 [{k:1,s:31,v:250},{k:2,s:13,v:303},{k:2,s:16,v:303},{k:2,s:19,v:303},{k:2,s:23,v:303},{k:2,s:24,v:303},{k:2,s:25,v:303},{k:2,s:27,v:303},{k:2,s:32,v:303},{k:2,s:34,v:303}],
 [{k:1,s:10,v:251},{k:1,s:17,v:252},{k:1,s:21,v:253},{k:2,s:6,v:282},{k:2,s:9,v:282},{k:2,s:12,v:282},{k:2,s:13,v:282},{k:2,s:16,v:282},{k:2,s:19,v:282},{k:2,s:23,v:282},{k:2,s:24,v:282},{k:2,s:25,v:282},{k:2,s:27,v:282},{k:2,s:28,v:282},{k:2,s:31,v:282},{k:2,s:32,v:282},{k:2,s:34,v:282},{k:2,s:36,v:282},{k:2,s:39,v:282},{k:2,s:40,v:282},{k:2,s:42,v:282},{k:2,s:45,v:282},{k:2,s:46,v:282},{k:2,s:47,v:282},{k:2,s:48,v:282},{k:2,s:78,v:282}],
 [{k:1,s:15,v:218},{k:1,s:20,v:219},{k:1,s:26,v:239},{k:2,s:6,v:258},{k:2,s:7,v:258},{k:2,s:9,v:258},{k:2,s:10,v:258},{k:2,s:12,v:258},{k:2,s:13,v:258},{k:2,s:16,v:258},{k:2,s:17,v:258},{k:2,s:19,v:258},{k:2,s:21,v:258},{k:2,s:23,v:258},{k:2,s:24,v:258},{k:2,s:25,v:258},{k:2,s:27,v:258},{k:2,s:28,v:258},{k:2,s:31,v:258},{k:2,s:32,v:258},{k:2,s:34,v:258},{k:2,s:36,v:258},{k:2,s:37,v:258},{k:2,s:39,v:258},{k:2,s:40,v:258},{k:2,s:42,v:258},{k:2,s:45,v:258},{k:2,s:46,v:258},{k:2,s:47,v:258},{k:2,s:48,v:258},{k:2,s:78,v:258},{k:2,s:11,v:312},{k:2,s:14,v:312},{k:2,s:18,v:312},{k:2,s:22,v:312},{k:2,s:29,v:312},{k:2,s:33,v:312},{k:2,s:38,v:312},{k:2,s:41,v:312},{k:2,s:43,v:312},{k:2,s:44,v:312},{k:2,s:49,v:312},{k:2,s:50,v:312}],
 [{k:1,s:39,v:254},{k:1,s:42,v:255},{k:1,s:46,v:256},{k:1,s:47,v:257},{k:1,s:78,v:258},{k:2,s:9,v:294},{k:2,s:12,v:294},{k:2,s:13,v:294},{k:2,s:16,v:294},{k:2,s:19,v:294},{k:2,s:23,v:294},{k:2,s:24,v:294},{k:2,s:25,v:294},{k:2,s:27,v:294},{k:2,s:28,v:294},{k:2,s:31,v:294},{k:2,s:32,v:294},{k:2,s:34,v:294},{k:2,s:45,v:294}],
 [{k:1,s:40,v:259},{k:1,s:48,v:260},{k:2,s:9,v:288},{k:2,s:12,v:288},{k:2,s:13,v:288},{k:2,s:16,v:288},{k:2,s:19,v:288},{k:2,s:23,v:288},{k:2,s:24,v:288},{k:2,s:25,v:288},{k:2,s:27,v:288},{k:2,s:28,v:288},{k:2,s:31,v:288},{k:2,s:32,v:288},{k:2,s:34,v:288},{k:2,s:39,v:288},{k:2,s:42,v:288},{k:2,s:45,v:288},{k:2,s:46,v:288},{k:2,s:47,v:288},{k:2,s:78,v:288}],
 [{k:2,s:6,v:278},{k:2,s:9,v:278},{k:2,s:10,v:278},{k:2,s:12,v:278},{k:2,s:13,v:278},{k:2,s:16,v:278},{k:2,s:17,v:278},{k:2,s:19,v:278},{k:2,s:21,v:278},{k:2,s:23,v:278},{k:2,s:24,v:278},{k:2,s:25,v:278},{k:2,s:27,v:278},{k:2,s:28,v:278},{k:2,s:31,v:278},{k:2,s:32,v:278},{k:2,s:34,v:278},{k:2,s:36,v:278},{k:2,s:39,v:278},{k:2,s:40,v:278},{k:2,s:42,v:278},{k:2,s:45,v:278},{k:2,s:46,v:278},{k:2,s:47,v:278},{k:2,s:48,v:278},{k:2,s:78,v:278}],
 [{k:2,s:0,v:140},{k:2,s:7,v:140},{k:2,s:15,v:140},{k:2,s:24,v:140},{k:2,s:30,v:140},{k:2,s:34,v:140},{k:2,s:37,v:140},{k:2,s:51,v:140},{k:2,s:52,v:140},{k:2,s:53,v:140},{k:2,s:54,v:140},{k:2,s:55,v:140},{k:2,s:56,v:140},{k:2,s:57,v:140},{k:2,s:58,v:140},{k:2,s:59,v:140},{k:2,s:60,v:140},{k:2,s:61,v:140},{k:2,s:62,v:140},{k:2,s:63,v:140},{k:2,s:64,v:140},{k:2,s:65,v:140},{k:2,s:66,v:140},{k:2,s:68,v:140},{k:2,s:69,v:140},{k:2,s:70,v:140},{k:2,s:71,v:140},{k:2,s:72,v:140},{k:2,s:73,v:140},{k:2,s:74,v:140},{k:2,s:75,v:140},{k:2,s:79,v:140},{k:2,s:80,v:140},{k:2,s:81,v:140},{k:2,s:82,v:140},{k:2,s:83,v:140},{k:2,s:84,v:140},{k:2,s:85,v:140},{k:2,s:86,v:140},{k:2,s:87,v:140},{k:2,s:88,v:140},{k:2,s:89,v:140},{k:2,s:90,v:140},{k:2,s:91,v:140},{k:2,s:92,v:140},{k:2,s:93,v:140},{k:2,s:94,v:140},{k:2,s:95,v:140},{k:2,s:96,v:140},{k:2,s:97,v:140},{k:2,s:98,v:140},{k:2,s:100,v:140},{k:2,s:101,v:140},{k:2,s:102,v:140},{k:2,s:103,v:140},{k:2,s:104,v:140},{k:2,s:105,v:140}],
 [{k:2,s:7,v:141},{k:2,s:15,v:141},{k:2,s:24,v:141},{k:2,s:30,v:141},{k:2,s:34,v:141},{k:2,s:37,v:141},{k:2,s:51,v:141},{k:2,s:52,v:141},{k:2,s:53,v:141},{k:2,s:54,v:141},{k:2,s:55,v:141},{k:2,s:56,v:141},{k:2,s:58,v:141},{k:2,s:59,v:141},{k:2,s:61,v:141},{k:2,s:62,v:141},{k:2,s:63,v:141},{k:2,s:64,v:141},{k:2,s:65,v:141},{k:2,s:68,v:141},{k:2,s:69,v:141},{k:2,s:70,v:141},{k:2,s:71,v:141},{k:2,s:72,v:141},{k:2,s:73,v:141},{k:2,s:74,v:141},{k:2,s:75,v:141},{k:2,s:79,v:141},{k:2,s:80,v:141},{k:2,s:81,v:141},{k:2,s:82,v:141},{k:2,s:83,v:141},{k:2,s:84,v:141},{k:2,s:85,v:141},{k:2,s:86,v:141},{k:2,s:87,v:141},{k:2,s:88,v:141},{k:2,s:89,v:141},{k:2,s:90,v:141},{k:2,s:91,v:141},{k:2,s:92,v:141},{k:2,s:93,v:141},{k:2,s:94,v:141},{k:2,s:95,v:141},{k:2,s:96,v:141},{k:2,s:97,v:141},{k:2,s:98,v:141},{k:2,s:100,v:141},{k:2,s:101,v:141},{k:2,s:103,v:141},{k:2,s:104,v:141},{k:2,s:105,v:141}],
 [{k:1,s:7,v:1},{k:1,s:15,v:2},{k:1,s:24,v:3},{k:1,s:30,v:4},{k:1,s:34,v:261},{k:1,s:37,v:5},{k:1,s:51,v:6},{k:1,s:52,v:7},{k:1,s:53,v:8},{k:1,s:54,v:9},{k:1,s:55,v:10},{k:1,s:58,v:11},{k:1,s:59,v:12},{k:1,s:61,v:14},{k:1,s:62,v:15},{k:1,s:64,v:16},{k:1,s:65,v:17},{k:1,s:68,v:18},{k:1,s:69,v:19},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:72,v:22},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:75,v:25},{k:1,s:79,v:27},{k:1,s:80,v:28},{k:1,s:81,v:29},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:85,v:33},{k:1,s:86,v:34},{k:1,s:87,v:35},{k:1,s:88,v:36},{k:1,s:89,v:37},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:92,v:40},{k:1,s:93,v:41},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:96,v:44},{k:1,s:97,v:45},{k:1,s:98,v:46},{k:1,s:100,v:47},{k:1,s:101,v:48},{k:1,s:103,v:50},{k:1,s:104,v:51},{k:1,s:105,v:52},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:112,v:55},{k:3,s:113,v:56},{k:3,s:116,v:57},{k:3,s:117,v:262},{k:3,s:119,v:58},{k:3,s:127,v:60},{k:3,s:129,v:62},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:142,v:66},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:148,v:69},{k:3,s:149,v:70},{k:3,s:154,v:71},{k:3,s:155,v:72},{k:3,s:157,v:74},{k:3,s:158,v:75},{k:3,s:162,v:76},{k:3,s:169,v:81},{k:3,s:171,v:82},{k:3,s:175,v:85},{k:3,s:176,v:86},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:182,v:160},{k:3,s:183,v:161},{k:3,s:188,v:91},{k:3,s:189,v:92},{k:3,s:190,v:162},{k:3,s:192,v:94},{k:3,s:193,v:95},{k:3,s:194,v:96},{k:3,s:195,v:97},{k:3,s:196,v:98},{k:3,s:197,v:99},{k:3,s:198,v:100},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:201,v:103},{k:3,s:202,v:104},{k:3,s:203,v:105},{k:3,s:205,v:106},{k:3,s:207,v:107},{k:3,s:209,v:163},{k:3,s:210,v:110},{k:3,s:213,v:111},{k:3,s:220,v:112},{k:3,s:222,v:113},{k:3,s:223,v:164},{k:3,s:232,v:116}],
 [{k:1,s:24,v:263}],
 [{k:2,s:7,v:143},{k:2,s:15,v:143},{k:2,s:24,v:143},{k:2,s:30,v:143},{k:2,s:34,v:143},{k:2,s:37,v:143},{k:2,s:51,v:143},{k:2,s:52,v:143},{k:2,s:53,v:143},{k:2,s:54,v:143},{k:2,s:55,v:143},{k:2,s:56,v:143},{k:2,s:58,v:143},{k:2,s:59,v:143},{k:2,s:61,v:143},{k:2,s:62,v:143},{k:2,s:63,v:143},{k:2,s:64,v:143},{k:2,s:65,v:143},{k:2,s:68,v:143},{k:2,s:69,v:143},{k:2,s:70,v:143},{k:2,s:71,v:143},{k:2,s:72,v:143},{k:2,s:73,v:143},{k:2,s:74,v:143},{k:2,s:75,v:143},{k:2,s:79,v:143},{k:2,s:80,v:143},{k:2,s:81,v:143},{k:2,s:82,v:143},{k:2,s:83,v:143},{k:2,s:84,v:143},{k:2,s:85,v:143},{k:2,s:86,v:143},{k:2,s:87,v:143},{k:2,s:88,v:143},{k:2,s:89,v:143},{k:2,s:90,v:143},{k:2,s:91,v:143},{k:2,s:92,v:143},{k:2,s:93,v:143},{k:2,s:94,v:143},{k:2,s:95,v:143},{k:2,s:96,v:143},{k:2,s:97,v:143},{k:2,s:98,v:143},{k:2,s:100,v:143},{k:2,s:101,v:143},{k:2,s:103,v:143},{k:2,s:104,v:143},{k:2,s:105,v:143}],
 [{k:1,s:51,v:6},{k:1,s:52,v:174},{k:1,s:55,v:175},{k:1,s:58,v:176},{k:1,s:61,v:177},{k:1,s:65,v:17},{k:1,s:68,v:18},{k:1,s:69,v:178},{k:1,s:74,v:24},{k:1,s:79,v:179},{k:1,s:80,v:28},{k:1,s:81,v:29},{k:1,s:85,v:33},{k:1,s:86,v:34},{k:1,s:87,v:35},{k:1,s:89,v:37},{k:1,s:92,v:40},{k:1,s:93,v:41},{k:1,s:97,v:45},{k:1,s:100,v:47},{k:1,s:103,v:50},{k:3,s:112,v:55},{k:3,s:129,v:62},{k:3,s:157,v:74},{k:3,s:176,v:86},{k:3,s:189,v:215},{k:3,s:192,v:216},{k:3,s:193,v:95},{k:3,s:201,v:103},{k:3,s:202,v:104},{k:3,s:203,v:105},{k:3,s:207,v:107},{k:3,s:223,v:264}],
 [{k:2,s:7,v:144},{k:2,s:15,v:144},{k:2,s:24,v:144},{k:2,s:30,v:144},{k:2,s:34,v:144},{k:2,s:37,v:144},{k:2,s:51,v:144},{k:2,s:52,v:144},{k:2,s:53,v:144},{k:2,s:54,v:144},{k:2,s:55,v:144},{k:2,s:56,v:144},{k:2,s:58,v:144},{k:2,s:59,v:144},{k:2,s:61,v:144},{k:2,s:62,v:144},{k:2,s:63,v:144},{k:2,s:64,v:144},{k:2,s:65,v:144},{k:2,s:68,v:144},{k:2,s:69,v:144},{k:2,s:70,v:144},{k:2,s:71,v:144},{k:2,s:72,v:144},{k:2,s:73,v:144},{k:2,s:74,v:144},{k:2,s:75,v:144},{k:2,s:79,v:144},{k:2,s:80,v:144},{k:2,s:81,v:144},{k:2,s:82,v:144},{k:2,s:83,v:144},{k:2,s:84,v:144},{k:2,s:85,v:144},{k:2,s:86,v:144},{k:2,s:87,v:144},{k:2,s:88,v:144},{k:2,s:89,v:144},{k:2,s:90,v:144},{k:2,s:91,v:144},{k:2,s:92,v:144},{k:2,s:93,v:144},{k:2,s:94,v:144},{k:2,s:95,v:144},{k:2,s:96,v:144},{k:2,s:97,v:144},{k:2,s:98,v:144},{k:2,s:100,v:144},{k:2,s:101,v:144},{k:2,s:103,v:144},{k:2,s:104,v:144},{k:2,s:105,v:144}],
 [{k:1,s:74,v:265},{k:3,s:227,v:229},{k:3,s:228,v:230},{k:3,s:229,v:266}],
 [{k:2,s:6,v:268},{k:2,s:9,v:268},{k:2,s:10,v:268},{k:2,s:12,v:268},{k:2,s:13,v:268},{k:2,s:16,v:268},{k:2,s:17,v:268},{k:2,s:19,v:268},{k:2,s:21,v:268},{k:2,s:23,v:268},{k:2,s:24,v:268},{k:2,s:25,v:268},{k:2,s:27,v:268},{k:2,s:28,v:268},{k:2,s:31,v:268},{k:2,s:32,v:268},{k:2,s:34,v:268},{k:2,s:36,v:268},{k:2,s:39,v:268},{k:2,s:40,v:268},{k:2,s:42,v:268},{k:2,s:45,v:268},{k:2,s:46,v:268},{k:2,s:47,v:268},{k:2,s:48,v:268},{k:2,s:78,v:268}],
 [{k:2,s:0,v:214},{k:2,s:7,v:214},{k:2,s:15,v:214},{k:2,s:24,v:214},{k:2,s:30,v:214},{k:2,s:34,v:214},{k:2,s:37,v:214},{k:2,s:51,v:214},{k:2,s:52,v:214},{k:2,s:53,v:214},{k:2,s:54,v:214},{k:2,s:55,v:214},{k:2,s:56,v:214},{k:2,s:58,v:214},{k:2,s:59,v:214},{k:2,s:60,v:214},{k:2,s:61,v:214},{k:2,s:62,v:214},{k:2,s:63,v:214},{k:2,s:64,v:214},{k:2,s:65,v:214},{k:2,s:66,v:214},{k:2,s:68,v:214},{k:2,s:69,v:214},{k:2,s:70,v:214},{k:2,s:71,v:214},{k:2,s:72,v:214},{k:2,s:73,v:214},{k:2,s:74,v:214},{k:2,s:75,v:214},{k:2,s:79,v:214},{k:2,s:80,v:214},{k:2,s:81,v:214},{k:2,s:82,v:214},{k:2,s:83,v:214},{k:2,s:84,v:214},{k:2,s:85,v:214},{k:2,s:86,v:214},{k:2,s:87,v:214},{k:2,s:88,v:214},{k:2,s:89,v:214},{k:2,s:90,v:214},{k:2,s:91,v:214},{k:2,s:92,v:214},{k:2,s:93,v:214},{k:2,s:94,v:214},{k:2,s:95,v:214},{k:2,s:96,v:214},{k:2,s:97,v:214},{k:2,s:98,v:214},{k:2,s:100,v:214},{k:2,s:101,v:214},{k:2,s:102,v:214},{k:2,s:103,v:214},{k:2,s:104,v:214},{k:2,s:105,v:214}],
 [{k:1,s:30,v:267},{k:1,s:67,v:268},{k:1,s:76,v:269},{k:3,s:123,v:270},{k:3,s:177,v:271},{k:3,s:214,v:272}],
 [{k:1,s:6,v:117},{k:1,s:7,v:1},{k:1,s:8,v:118},{k:1,s:15,v:119},{k:1,s:35,v:120},{k:1,s:36,v:121},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:106,v:141},{k:3,s:107,v:142},{k:3,s:108,v:273},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:113,v:143},{k:3,s:114,v:144},{k:3,s:120,v:129},{k:3,s:127,v:130},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:135,v:145},{k:3,s:136,v:146},{k:3,s:137,v:147},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:150,v:148},{k:3,s:151,v:149},{k:3,s:153,v:274},{k:3,s:155,v:72},{k:3,s:158,v:75},{k:3,s:174,v:151},{k:3,s:175,v:85},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:188,v:132},{k:3,s:191,v:152},{k:3,s:192,v:153},{k:3,s:194,v:134},{k:3,s:195,v:135},{k:3,s:196,v:136},{k:3,s:197,v:137},{k:3,s:198,v:138},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:204,v:154},{k:3,s:206,v:155},{k:3,s:207,v:107},{k:3,s:225,v:156},{k:3,s:226,v:140}],
 [{k:2,s:0,v:215},{k:2,s:7,v:215},{k:2,s:15,v:215},{k:2,s:24,v:215},{k:2,s:30,v:215},{k:2,s:34,v:215},{k:2,s:37,v:215},{k:2,s:51,v:215},{k:2,s:52,v:215},{k:2,s:53,v:215},{k:2,s:54,v:215},{k:2,s:55,v:215},{k:2,s:56,v:215},{k:2,s:58,v:215},{k:2,s:59,v:215},{k:2,s:60,v:215},{k:2,s:61,v:215},{k:2,s:62,v:215},{k:2,s:63,v:215},{k:2,s:64,v:215},{k:2,s:65,v:215},{k:2,s:66,v:215},{k:2,s:68,v:215},{k:2,s:69,v:215},{k:2,s:70,v:215},{k:2,s:71,v:215},{k:2,s:72,v:215},{k:2,s:73,v:215},{k:2,s:74,v:215},{k:2,s:75,v:215},{k:2,s:79,v:215},{k:2,s:80,v:215},{k:2,s:81,v:215},{k:2,s:82,v:215},{k:2,s:83,v:215},{k:2,s:84,v:215},{k:2,s:85,v:215},{k:2,s:86,v:215},{k:2,s:87,v:215},{k:2,s:88,v:215},{k:2,s:89,v:215},{k:2,s:90,v:215},{k:2,s:91,v:215},{k:2,s:92,v:215},{k:2,s:93,v:215},{k:2,s:94,v:215},{k:2,s:95,v:215},{k:2,s:96,v:215},{k:2,s:97,v:215},{k:2,s:98,v:215},{k:2,s:100,v:215},{k:2,s:101,v:215},{k:2,s:102,v:215},{k:2,s:103,v:215},{k:2,s:104,v:215},{k:2,s:105,v:215}],
 [{k:1,s:105,v:275}],
 [{k:1,s:7,v:1},{k:1,s:15,v:2},{k:1,s:24,v:276},{k:1,s:37,v:5},{k:1,s:51,v:6},{k:1,s:52,v:7},{k:1,s:53,v:8},{k:1,s:55,v:10},{k:1,s:58,v:11},{k:1,s:59,v:12},{k:1,s:61,v:14},{k:1,s:65,v:17},{k:1,s:68,v:18},{k:1,s:69,v:19},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:27},{k:1,s:80,v:28},{k:1,s:81,v:29},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:85,v:33},{k:1,s:86,v:34},{k:1,s:87,v:35},{k:1,s:89,v:37},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:92,v:40},{k:1,s:93,v:41},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:97,v:45},{k:1,s:98,v:46},{k:1,s:100,v:47},{k:1,s:103,v:50},{k:1,s:104,v:51},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:112,v:55},{k:3,s:113,v:56},{k:3,s:127,v:60},{k:3,s:129,v:62},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:155,v:72},{k:3,s:157,v:74},{k:3,s:158,v:75},{k:3,s:159,v:277},{k:3,s:175,v:85},{k:3,s:176,v:86},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:182,v:278},{k:3,s:188,v:91},{k:3,s:189,v:92},{k:3,s:190,v:162},{k:3,s:192,v:94},{k:3,s:193,v:95},{k:3,s:194,v:96},{k:3,s:195,v:97},{k:3,s:196,v:98},{k:3,s:197,v:99},{k:3,s:198,v:100},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:201,v:103},{k:3,s:202,v:104},{k:3,s:203,v:105},{k:3,s:207,v:107},{k:3,s:210,v:279},{k:3,s:211,v:280},{k:3,s:223,v:164}],
 [{k:1,s:6,v:117},{k:1,s:7,v:1},{k:1,s:8,v:118},{k:1,s:15,v:119},{k:1,s:35,v:120},{k:1,s:36,v:121},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:106,v:141},{k:3,s:107,v:142},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:113,v:143},{k:3,s:114,v:144},{k:3,s:120,v:129},{k:3,s:127,v:130},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:135,v:145},{k:3,s:136,v:146},{k:3,s:137,v:147},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:150,v:148},{k:3,s:151,v:149},{k:3,s:153,v:281},{k:3,s:155,v:72},{k:3,s:158,v:75},{k:3,s:174,v:151},{k:3,s:175,v:85},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:188,v:132},{k:3,s:191,v:152},{k:3,s:192,v:153},{k:3,s:194,v:134},{k:3,s:195,v:135},{k:3,s:196,v:136},{k:3,s:197,v:137},{k:3,s:198,v:138},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:204,v:154},{k:3,s:206,v:155},{k:3,s:207,v:107},{k:3,s:225,v:156},{k:3,s:226,v:140}],
 [{k:1,s:20,v:282},{k:1,s:24,v:283}],
 [{k:2,s:26,v:18},{k:2,s:74,v:18}],
 [{k:2,s:26,v:21},{k:2,s:74,v:21}],
 [{k:2,s:26,v:25},{k:2,s:74,v:25}],
 [{k:2,s:26,v:26},{k:2,s:74,v:26}],
 [{k:2,s:26,v:27},{k:2,s:74,v:27}],
 [{k:2,s:26,v:23},{k:2,s:74,v:23}],
 [{k:1,s:26,v:284},{k:3,s:145,v:285},{k:3,s:146,v:286},{k:2,s:15,v:33}],
 [{k:1,s:15,v:287}],
 [{k:1,s:20,v:219},{k:2,s:15,v:32},{k:2,s:19,v:32},{k:2,s:24,v:32},{k:2,s:26,v:32},{k:2,s:30,v:32},{k:2,s:76,v:32}],
 [{k:1,s:26,v:284},{k:3,s:145,v:285},{k:3,s:146,v:288}],
 [{k:2,s:0,v:217},{k:2,s:7,v:217},{k:2,s:15,v:217},{k:2,s:24,v:217},{k:2,s:30,v:217},{k:2,s:34,v:217},{k:2,s:37,v:217},{k:2,s:51,v:217},{k:2,s:52,v:217},{k:2,s:53,v:217},{k:2,s:54,v:217},{k:2,s:55,v:217},{k:2,s:56,v:217},{k:2,s:58,v:217},{k:2,s:59,v:217},{k:2,s:60,v:217},{k:2,s:61,v:217},{k:2,s:62,v:217},{k:2,s:63,v:217},{k:2,s:64,v:217},{k:2,s:65,v:217},{k:2,s:66,v:217},{k:2,s:68,v:217},{k:2,s:69,v:217},{k:2,s:70,v:217},{k:2,s:71,v:217},{k:2,s:72,v:217},{k:2,s:73,v:217},{k:2,s:74,v:217},{k:2,s:75,v:217},{k:2,s:79,v:217},{k:2,s:80,v:217},{k:2,s:81,v:217},{k:2,s:82,v:217},{k:2,s:83,v:217},{k:2,s:84,v:217},{k:2,s:85,v:217},{k:2,s:86,v:217},{k:2,s:87,v:217},{k:2,s:88,v:217},{k:2,s:89,v:217},{k:2,s:90,v:217},{k:2,s:91,v:217},{k:2,s:92,v:217},{k:2,s:93,v:217},{k:2,s:94,v:217},{k:2,s:95,v:217},{k:2,s:96,v:217},{k:2,s:97,v:217},{k:2,s:98,v:217},{k:2,s:100,v:217},{k:2,s:101,v:217},{k:2,s:102,v:217},{k:2,s:103,v:217},{k:2,s:104,v:217},{k:2,s:105,v:217}],
 [{k:1,s:24,v:289}],
 [{k:1,s:74,v:290}],
 [{k:1,s:6,v:117},{k:1,s:7,v:1},{k:1,s:8,v:118},{k:1,s:15,v:119},{k:1,s:35,v:120},{k:1,s:36,v:121},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:106,v:141},{k:3,s:107,v:142},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:113,v:143},{k:3,s:114,v:144},{k:3,s:120,v:129},{k:3,s:127,v:130},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:135,v:145},{k:3,s:136,v:146},{k:3,s:137,v:147},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:150,v:148},{k:3,s:151,v:149},{k:3,s:153,v:291},{k:3,s:155,v:72},{k:3,s:158,v:75},{k:3,s:174,v:151},{k:3,s:175,v:85},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:188,v:132},{k:3,s:191,v:152},{k:3,s:192,v:153},{k:3,s:194,v:134},{k:3,s:195,v:135},{k:3,s:196,v:136},{k:3,s:197,v:137},{k:3,s:198,v:138},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:204,v:154},{k:3,s:206,v:155},{k:3,s:207,v:107},{k:3,s:225,v:156},{k:3,s:226,v:140}],
 [{k:1,s:57,v:292},{k:3,s:121,v:293},{k:3,s:122,v:294}],
 [{k:1,s:15,v:295}],
 [{k:1,s:26,v:296},{k:1,s:99,v:297},{k:3,s:221,v:298},{k:2,s:24,v:107},{k:2,s:30,v:107}],
 [{k:1,s:6,v:117},{k:1,s:7,v:1},{k:1,s:8,v:118},{k:1,s:15,v:119},{k:1,s:35,v:120},{k:1,s:36,v:121},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:106,v:141},{k:3,s:107,v:142},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:113,v:143},{k:3,s:114,v:144},{k:3,s:120,v:129},{k:3,s:127,v:130},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:135,v:145},{k:3,s:136,v:146},{k:3,s:137,v:147},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:150,v:148},{k:3,s:151,v:149},{k:3,s:153,v:299},{k:3,s:155,v:72},{k:3,s:158,v:75},{k:3,s:174,v:151},{k:3,s:175,v:85},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:188,v:132},{k:3,s:191,v:152},{k:3,s:192,v:153},{k:3,s:194,v:134},{k:3,s:195,v:135},{k:3,s:196,v:136},{k:3,s:197,v:137},{k:3,s:198,v:138},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:204,v:154},{k:3,s:206,v:155},{k:3,s:207,v:107},{k:3,s:225,v:156},{k:3,s:226,v:140}],
 [{k:1,s:27,v:300}],
 [{k:1,s:6,v:117},{k:1,s:7,v:1},{k:1,s:8,v:118},{k:1,s:15,v:119},{k:1,s:35,v:120},{k:1,s:36,v:121},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:106,v:141},{k:3,s:107,v:142},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:113,v:143},{k:3,s:114,v:144},{k:3,s:120,v:129},{k:3,s:127,v:130},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:135,v:145},{k:3,s:136,v:146},{k:3,s:137,v:147},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:150,v:148},{k:3,s:151,v:149},{k:3,s:153,v:301},{k:3,s:155,v:72},{k:3,s:158,v:75},{k:3,s:174,v:151},{k:3,s:175,v:85},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:188,v:132},{k:3,s:191,v:152},{k:3,s:192,v:153},{k:3,s:194,v:134},{k:3,s:195,v:135},{k:3,s:196,v:136},{k:3,s:197,v:137},{k:3,s:198,v:138},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:204,v:154},{k:3,s:206,v:155},{k:3,s:207,v:107},{k:3,s:225,v:156},{k:3,s:226,v:140}],
 [{k:2,s:0,v:47},{k:2,s:7,v:47},{k:2,s:15,v:47},{k:2,s:24,v:47},{k:2,s:30,v:47},{k:2,s:37,v:47},{k:2,s:51,v:47},{k:2,s:52,v:47},{k:2,s:53,v:47},{k:2,s:54,v:47},{k:2,s:55,v:47},{k:2,s:58,v:47},{k:2,s:59,v:47},{k:2,s:60,v:47},{k:2,s:61,v:47},{k:2,s:62,v:47},{k:2,s:64,v:47},{k:2,s:65,v:47},{k:2,s:68,v:47},{k:2,s:69,v:47},{k:2,s:70,v:47},{k:2,s:71,v:47},{k:2,s:72,v:47},{k:2,s:73,v:47},{k:2,s:74,v:47},{k:2,s:75,v:47},{k:2,s:79,v:47},{k:2,s:80,v:47},{k:2,s:81,v:47},{k:2,s:82,v:47},{k:2,s:83,v:47},{k:2,s:84,v:47},{k:2,s:85,v:47},{k:2,s:86,v:47},{k:2,s:87,v:47},{k:2,s:88,v:47},{k:2,s:89,v:47},{k:2,s:90,v:47},{k:2,s:91,v:47},{k:2,s:92,v:47},{k:2,s:93,v:47},{k:2,s:94,v:47},{k:2,s:95,v:47},{k:2,s:96,v:47},{k:2,s:97,v:47},{k:2,s:98,v:47},{k:2,s:100,v:47},{k:2,s:101,v:47},{k:2,s:102,v:47},{k:2,s:103,v:47},{k:2,s:104,v:47},{k:2,s:105,v:47}],
 [{k:1,s:7,v:1},{k:1,s:15,v:2},{k:1,s:24,v:3},{k:1,s:30,v:4},{k:1,s:37,v:5},{k:1,s:51,v:6},{k:1,s:52,v:7},{k:1,s:53,v:8},{k:1,s:54,v:9},{k:1,s:55,v:10},{k:1,s:58,v:11},{k:1,s:59,v:12},{k:1,s:60,v:13},{k:1,s:61,v:14},{k:1,s:62,v:15},{k:1,s:64,v:16},{k:1,s:65,v:17},{k:1,s:68,v:18},{k:1,s:69,v:19},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:72,v:22},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:75,v:25},{k:1,s:79,v:27},{k:1,s:80,v:28},{k:1,s:81,v:29},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:85,v:33},{k:1,s:86,v:34},{k:1,s:87,v:35},{k:1,s:88,v:36},{k:1,s:89,v:37},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:92,v:40},{k:1,s:93,v:41},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:96,v:44},{k:1,s:97,v:45},{k:1,s:98,v:46},{k:1,s:100,v:47},{k:1,s:101,v:48},{k:1,s:102,v:49},{k:1,s:103,v:50},{k:1,s:104,v:51},{k:1,s:105,v:52},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:112,v:55},{k:3,s:113,v:56},{k:3,s:116,v:57},{k:3,s:119,v:58},{k:3,s:126,v:59},{k:3,s:127,v:60},{k:3,s:128,v:61},{k:3,s:129,v:62},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:142,v:66},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:148,v:69},{k:3,s:149,v:70},{k:3,s:154,v:71},{k:3,s:155,v:72},{k:3,s:156,v:73},{k:3,s:157,v:74},{k:3,s:158,v:75},{k:3,s:162,v:76},{k:3,s:165,v:194},{k:3,s:167,v:79},{k:3,s:168,v:80},{k:3,s:169,v:81},{k:3,s:171,v:82},{k:3,s:175,v:85},{k:3,s:176,v:86},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:185,v:89},{k:3,s:187,v:90},{k:3,s:188,v:91},{k:3,s:189,v:92},{k:3,s:190,v:93},{k:3,s:192,v:94},{k:3,s:193,v:95},{k:3,s:194,v:96},{k:3,s:195,v:97},{k:3,s:196,v:98},{k:3,s:197,v:99},{k:3,s:198,v:100},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:201,v:103},{k:3,s:202,v:104},{k:3,s:203,v:105},{k:3,s:205,v:106},{k:3,s:207,v:107},{k:3,s:209,v:109},{k:3,s:210,v:110},{k:3,s:213,v:111},{k:3,s:220,v:112},{k:3,s:222,v:113},{k:3,s:223,v:114},{k:3,s:232,v:116},{k:2,s:0,v:42}],
 [{k:2,s:7,v:45},{k:2,s:15,v:45},{k:2,s:24,v:45},{k:2,s:30,v:45},{k:2,s:37,v:45},{k:2,s:51,v:45},{k:2,s:52,v:45},{k:2,s:53,v:45},{k:2,s:54,v:45},{k:2,s:55,v:45},{k:2,s:58,v:45},{k:2,s:59,v:45},{k:2,s:60,v:45},{k:2,s:61,v:45},{k:2,s:62,v:45},{k:2,s:64,v:45},{k:2,s:65,v:45},{k:2,s:68,v:45},{k:2,s:69,v:45},{k:2,s:70,v:45},{k:2,s:71,v:45},{k:2,s:72,v:45},{k:2,s:73,v:45},{k:2,s:74,v:45},{k:2,s:75,v:45},{k:2,s:77,v:45},{k:2,s:79,v:45},{k:2,s:80,v:45},{k:2,s:81,v:45},{k:2,s:82,v:45},{k:2,s:83,v:45},{k:2,s:84,v:45},{k:2,s:85,v:45},{k:2,s:86,v:45},{k:2,s:87,v:45},{k:2,s:88,v:45},{k:2,s:89,v:45},{k:2,s:90,v:45},{k:2,s:91,v:45},{k:2,s:92,v:45},{k:2,s:93,v:45},{k:2,s:94,v:45},{k:2,s:95,v:45},{k:2,s:96,v:45},{k:2,s:97,v:45},{k:2,s:98,v:45},{k:2,s:100,v:45},{k:2,s:101,v:45},{k:2,s:102,v:45},{k:2,s:103,v:45},{k:2,s:104,v:45},{k:2,s:105,v:45}],
 [{k:2,s:6,v:318},{k:2,s:7,v:318},{k:2,s:8,v:318},{k:2,s:15,v:318},{k:2,s:35,v:318},{k:2,s:36,v:318},{k:2,s:37,v:318},{k:2,s:52,v:318},{k:2,s:53,v:318},{k:2,s:55,v:318},{k:2,s:58,v:318},{k:2,s:59,v:318},{k:2,s:61,v:318},{k:2,s:69,v:318},{k:2,s:70,v:318},{k:2,s:71,v:318},{k:2,s:73,v:318},{k:2,s:74,v:318},{k:2,s:79,v:318},{k:2,s:82,v:318},{k:2,s:83,v:318},{k:2,s:84,v:318},{k:2,s:90,v:318},{k:2,s:91,v:318},{k:2,s:94,v:318},{k:2,s:95,v:318},{k:2,s:98,v:318},{k:2,s:104,v:318}],
 [{k:2,s:6,v:324},{k:2,s:7,v:324},{k:2,s:8,v:324},{k:2,s:15,v:324},{k:2,s:35,v:324},{k:2,s:36,v:324},{k:2,s:37,v:324},{k:2,s:52,v:324},{k:2,s:53,v:324},{k:2,s:55,v:324},{k:2,s:58,v:324},{k:2,s:59,v:324},{k:2,s:61,v:324},{k:2,s:69,v:324},{k:2,s:70,v:324},{k:2,s:71,v:324},{k:2,s:73,v:324},{k:2,s:74,v:324},{k:2,s:79,v:324},{k:2,s:82,v:324},{k:2,s:83,v:324},{k:2,s:84,v:324},{k:2,s:90,v:324},{k:2,s:91,v:324},{k:2,s:94,v:324},{k:2,s:95,v:324},{k:2,s:98,v:324},{k:2,s:104,v:324}],
 [{k:2,s:6,v:316},{k:2,s:7,v:316},{k:2,s:8,v:316},{k:2,s:15,v:316},{k:2,s:35,v:316},{k:2,s:36,v:316},{k:2,s:37,v:316},{k:2,s:52,v:316},{k:2,s:53,v:316},{k:2,s:55,v:316},{k:2,s:58,v:316},{k:2,s:59,v:316},{k:2,s:61,v:316},{k:2,s:69,v:316},{k:2,s:70,v:316},{k:2,s:71,v:316},{k:2,s:73,v:316},{k:2,s:74,v:316},{k:2,s:79,v:316},{k:2,s:82,v:316},{k:2,s:83,v:316},{k:2,s:84,v:316},{k:2,s:90,v:316},{k:2,s:91,v:316},{k:2,s:94,v:316},{k:2,s:95,v:316},{k:2,s:98,v:316},{k:2,s:104,v:316}],
 [{k:2,s:6,v:317},{k:2,s:7,v:317},{k:2,s:8,v:317},{k:2,s:15,v:317},{k:2,s:35,v:317},{k:2,s:36,v:317},{k:2,s:37,v:317},{k:2,s:52,v:317},{k:2,s:53,v:317},{k:2,s:55,v:317},{k:2,s:58,v:317},{k:2,s:59,v:317},{k:2,s:61,v:317},{k:2,s:69,v:317},{k:2,s:70,v:317},{k:2,s:71,v:317},{k:2,s:73,v:317},{k:2,s:74,v:317},{k:2,s:79,v:317},{k:2,s:82,v:317},{k:2,s:83,v:317},{k:2,s:84,v:317},{k:2,s:90,v:317},{k:2,s:91,v:317},{k:2,s:94,v:317},{k:2,s:95,v:317},{k:2,s:98,v:317},{k:2,s:104,v:317}],
 [{k:2,s:6,v:325},{k:2,s:7,v:325},{k:2,s:8,v:325},{k:2,s:15,v:325},{k:2,s:35,v:325},{k:2,s:36,v:325},{k:2,s:37,v:325},{k:2,s:52,v:325},{k:2,s:53,v:325},{k:2,s:55,v:325},{k:2,s:58,v:325},{k:2,s:59,v:325},{k:2,s:61,v:325},{k:2,s:69,v:325},{k:2,s:70,v:325},{k:2,s:71,v:325},{k:2,s:73,v:325},{k:2,s:74,v:325},{k:2,s:79,v:325},{k:2,s:82,v:325},{k:2,s:83,v:325},{k:2,s:84,v:325},{k:2,s:90,v:325},{k:2,s:91,v:325},{k:2,s:94,v:325},{k:2,s:95,v:325},{k:2,s:98,v:325},{k:2,s:104,v:325}],
 [{k:2,s:6,v:326},{k:2,s:7,v:326},{k:2,s:8,v:326},{k:2,s:15,v:326},{k:2,s:35,v:326},{k:2,s:36,v:326},{k:2,s:37,v:326},{k:2,s:52,v:326},{k:2,s:53,v:326},{k:2,s:55,v:326},{k:2,s:58,v:326},{k:2,s:59,v:326},{k:2,s:61,v:326},{k:2,s:69,v:326},{k:2,s:70,v:326},{k:2,s:71,v:326},{k:2,s:73,v:326},{k:2,s:74,v:326},{k:2,s:79,v:326},{k:2,s:82,v:326},{k:2,s:83,v:326},{k:2,s:84,v:326},{k:2,s:90,v:326},{k:2,s:91,v:326},{k:2,s:94,v:326},{k:2,s:95,v:326},{k:2,s:98,v:326},{k:2,s:104,v:326}],
 [{k:2,s:6,v:319},{k:2,s:7,v:319},{k:2,s:8,v:319},{k:2,s:15,v:319},{k:2,s:35,v:319},{k:2,s:36,v:319},{k:2,s:37,v:319},{k:2,s:52,v:319},{k:2,s:53,v:319},{k:2,s:55,v:319},{k:2,s:58,v:319},{k:2,s:59,v:319},{k:2,s:61,v:319},{k:2,s:69,v:319},{k:2,s:70,v:319},{k:2,s:71,v:319},{k:2,s:73,v:319},{k:2,s:74,v:319},{k:2,s:79,v:319},{k:2,s:82,v:319},{k:2,s:83,v:319},{k:2,s:84,v:319},{k:2,s:90,v:319},{k:2,s:91,v:319},{k:2,s:94,v:319},{k:2,s:95,v:319},{k:2,s:98,v:319},{k:2,s:104,v:319}],
 [{k:2,s:6,v:321},{k:2,s:7,v:321},{k:2,s:8,v:321},{k:2,s:15,v:321},{k:2,s:35,v:321},{k:2,s:36,v:321},{k:2,s:37,v:321},{k:2,s:52,v:321},{k:2,s:53,v:321},{k:2,s:55,v:321},{k:2,s:58,v:321},{k:2,s:59,v:321},{k:2,s:61,v:321},{k:2,s:69,v:321},{k:2,s:70,v:321},{k:2,s:71,v:321},{k:2,s:73,v:321},{k:2,s:74,v:321},{k:2,s:79,v:321},{k:2,s:82,v:321},{k:2,s:83,v:321},{k:2,s:84,v:321},{k:2,s:90,v:321},{k:2,s:91,v:321},{k:2,s:94,v:321},{k:2,s:95,v:321},{k:2,s:98,v:321},{k:2,s:104,v:321}],
 [{k:2,s:6,v:315},{k:2,s:7,v:315},{k:2,s:8,v:315},{k:2,s:15,v:315},{k:2,s:35,v:315},{k:2,s:36,v:315},{k:2,s:37,v:315},{k:2,s:52,v:315},{k:2,s:53,v:315},{k:2,s:55,v:315},{k:2,s:58,v:315},{k:2,s:59,v:315},{k:2,s:61,v:315},{k:2,s:69,v:315},{k:2,s:70,v:315},{k:2,s:71,v:315},{k:2,s:73,v:315},{k:2,s:74,v:315},{k:2,s:79,v:315},{k:2,s:82,v:315},{k:2,s:83,v:315},{k:2,s:84,v:315},{k:2,s:90,v:315},{k:2,s:91,v:315},{k:2,s:94,v:315},{k:2,s:95,v:315},{k:2,s:98,v:315},{k:2,s:104,v:315}],
 [{k:2,s:6,v:320},{k:2,s:7,v:320},{k:2,s:8,v:320},{k:2,s:15,v:320},{k:2,s:35,v:320},{k:2,s:36,v:320},{k:2,s:37,v:320},{k:2,s:52,v:320},{k:2,s:53,v:320},{k:2,s:55,v:320},{k:2,s:58,v:320},{k:2,s:59,v:320},{k:2,s:61,v:320},{k:2,s:69,v:320},{k:2,s:70,v:320},{k:2,s:71,v:320},{k:2,s:73,v:320},{k:2,s:74,v:320},{k:2,s:79,v:320},{k:2,s:82,v:320},{k:2,s:83,v:320},{k:2,s:84,v:320},{k:2,s:90,v:320},{k:2,s:91,v:320},{k:2,s:94,v:320},{k:2,s:95,v:320},{k:2,s:98,v:320},{k:2,s:104,v:320}],
 [{k:2,s:6,v:322},{k:2,s:7,v:322},{k:2,s:8,v:322},{k:2,s:15,v:322},{k:2,s:35,v:322},{k:2,s:36,v:322},{k:2,s:37,v:322},{k:2,s:52,v:322},{k:2,s:53,v:322},{k:2,s:55,v:322},{k:2,s:58,v:322},{k:2,s:59,v:322},{k:2,s:61,v:322},{k:2,s:69,v:322},{k:2,s:70,v:322},{k:2,s:71,v:322},{k:2,s:73,v:322},{k:2,s:74,v:322},{k:2,s:79,v:322},{k:2,s:82,v:322},{k:2,s:83,v:322},{k:2,s:84,v:322},{k:2,s:90,v:322},{k:2,s:91,v:322},{k:2,s:94,v:322},{k:2,s:95,v:322},{k:2,s:98,v:322},{k:2,s:104,v:322}],
 [{k:2,s:6,v:323},{k:2,s:7,v:323},{k:2,s:8,v:323},{k:2,s:15,v:323},{k:2,s:35,v:323},{k:2,s:36,v:323},{k:2,s:37,v:323},{k:2,s:52,v:323},{k:2,s:53,v:323},{k:2,s:55,v:323},{k:2,s:58,v:323},{k:2,s:59,v:323},{k:2,s:61,v:323},{k:2,s:69,v:323},{k:2,s:70,v:323},{k:2,s:71,v:323},{k:2,s:73,v:323},{k:2,s:74,v:323},{k:2,s:79,v:323},{k:2,s:82,v:323},{k:2,s:83,v:323},{k:2,s:84,v:323},{k:2,s:90,v:323},{k:2,s:91,v:323},{k:2,s:94,v:323},{k:2,s:95,v:323},{k:2,s:98,v:323},{k:2,s:104,v:323}],
 [{k:1,s:6,v:117},{k:1,s:7,v:1},{k:1,s:8,v:118},{k:1,s:15,v:119},{k:1,s:35,v:120},{k:1,s:36,v:121},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:106,v:141},{k:3,s:107,v:142},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:113,v:143},{k:3,s:114,v:302},{k:3,s:120,v:129},{k:3,s:127,v:130},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:135,v:145},{k:3,s:136,v:146},{k:3,s:137,v:147},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:150,v:148},{k:3,s:151,v:149},{k:3,s:155,v:72},{k:3,s:158,v:75},{k:3,s:174,v:151},{k:3,s:175,v:85},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:188,v:132},{k:3,s:191,v:152},{k:3,s:192,v:153},{k:3,s:194,v:134},{k:3,s:195,v:135},{k:3,s:196,v:136},{k:3,s:197,v:137},{k:3,s:198,v:138},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:204,v:154},{k:3,s:206,v:155},{k:3,s:207,v:107},{k:3,s:225,v:156},{k:3,s:226,v:140}],
 [{k:2,s:0,v:118},{k:2,s:7,v:118},{k:2,s:15,v:118},{k:2,s:24,v:118},{k:2,s:30,v:118},{k:2,s:34,v:118},{k:2,s:37,v:118},{k:2,s:51,v:118},{k:2,s:52,v:118},{k:2,s:53,v:118},{k:2,s:54,v:118},{k:2,s:55,v:118},{k:2,s:58,v:118},{k:2,s:59,v:118},{k:2,s:60,v:118},{k:2,s:61,v:118},{k:2,s:62,v:118},{k:2,s:64,v:118},{k:2,s:65,v:118},{k:2,s:68,v:118},{k:2,s:69,v:118},{k:2,s:70,v:118},{k:2,s:71,v:118},{k:2,s:72,v:118},{k:2,s:73,v:118},{k:2,s:74,v:118},{k:2,s:75,v:118},{k:2,s:79,v:118},{k:2,s:80,v:118},{k:2,s:81,v:118},{k:2,s:82,v:118},{k:2,s:83,v:118},{k:2,s:84,v:118},{k:2,s:85,v:118},{k:2,s:86,v:118},{k:2,s:87,v:118},{k:2,s:88,v:118},{k:2,s:89,v:118},{k:2,s:90,v:118},{k:2,s:91,v:118},{k:2,s:92,v:118},{k:2,s:93,v:118},{k:2,s:94,v:118},{k:2,s:95,v:118},{k:2,s:96,v:118},{k:2,s:97,v:118},{k:2,s:98,v:118},{k:2,s:100,v:118},{k:2,s:101,v:118},{k:2,s:102,v:118},{k:2,s:103,v:118},{k:2,s:104,v:118},{k:2,s:105,v:118}],
 [{k:2,s:0,v:117},{k:2,s:7,v:117},{k:2,s:15,v:117},{k:2,s:24,v:117},{k:2,s:30,v:117},{k:2,s:34,v:117},{k:2,s:37,v:117},{k:2,s:51,v:117},{k:2,s:52,v:117},{k:2,s:53,v:117},{k:2,s:54,v:117},{k:2,s:55,v:117},{k:2,s:58,v:117},{k:2,s:59,v:117},{k:2,s:60,v:117},{k:2,s:61,v:117},{k:2,s:62,v:117},{k:2,s:64,v:117},{k:2,s:65,v:117},{k:2,s:68,v:117},{k:2,s:69,v:117},{k:2,s:70,v:117},{k:2,s:71,v:117},{k:2,s:72,v:117},{k:2,s:73,v:117},{k:2,s:74,v:117},{k:2,s:75,v:117},{k:2,s:79,v:117},{k:2,s:80,v:117},{k:2,s:81,v:117},{k:2,s:82,v:117},{k:2,s:83,v:117},{k:2,s:84,v:117},{k:2,s:85,v:117},{k:2,s:86,v:117},{k:2,s:87,v:117},{k:2,s:88,v:117},{k:2,s:89,v:117},{k:2,s:90,v:117},{k:2,s:91,v:117},{k:2,s:92,v:117},{k:2,s:93,v:117},{k:2,s:94,v:117},{k:2,s:95,v:117},{k:2,s:96,v:117},{k:2,s:97,v:117},{k:2,s:98,v:117},{k:2,s:100,v:117},{k:2,s:101,v:117},{k:2,s:102,v:117},{k:2,s:103,v:117},{k:2,s:104,v:117},{k:2,s:105,v:117}],
 [{k:2,s:0,v:99},{k:2,s:7,v:99},{k:2,s:15,v:99},{k:2,s:24,v:99},{k:2,s:30,v:99},{k:2,s:34,v:99},{k:2,s:37,v:99},{k:2,s:51,v:99},{k:2,s:52,v:99},{k:2,s:53,v:99},{k:2,s:54,v:99},{k:2,s:55,v:99},{k:2,s:58,v:99},{k:2,s:59,v:99},{k:2,s:60,v:99},{k:2,s:61,v:99},{k:2,s:62,v:99},{k:2,s:64,v:99},{k:2,s:65,v:99},{k:2,s:68,v:99},{k:2,s:69,v:99},{k:2,s:70,v:99},{k:2,s:71,v:99},{k:2,s:72,v:99},{k:2,s:73,v:99},{k:2,s:74,v:99},{k:2,s:75,v:99},{k:2,s:79,v:99},{k:2,s:80,v:99},{k:2,s:81,v:99},{k:2,s:82,v:99},{k:2,s:83,v:99},{k:2,s:84,v:99},{k:2,s:85,v:99},{k:2,s:86,v:99},{k:2,s:87,v:99},{k:2,s:88,v:99},{k:2,s:89,v:99},{k:2,s:90,v:99},{k:2,s:91,v:99},{k:2,s:92,v:99},{k:2,s:93,v:99},{k:2,s:94,v:99},{k:2,s:95,v:99},{k:2,s:96,v:99},{k:2,s:97,v:99},{k:2,s:98,v:99},{k:2,s:100,v:99},{k:2,s:101,v:99},{k:2,s:102,v:99},{k:2,s:103,v:99},{k:2,s:104,v:99},{k:2,s:105,v:99}],
 [{k:1,s:74,v:303}],
 [{k:1,s:74,v:189},{k:3,s:186,v:304}],
 [{k:2,s:51,v:58},{k:2,s:52,v:58},{k:2,s:55,v:58},{k:2,s:58,v:58},{k:2,s:60,v:58},{k:2,s:61,v:58},{k:2,s:65,v:58},{k:2,s:68,v:58},{k:2,s:69,v:58},{k:2,s:74,v:58},{k:2,s:79,v:58},{k:2,s:80,v:58},{k:2,s:81,v:58},{k:2,s:85,v:58},{k:2,s:86,v:58},{k:2,s:87,v:58},{k:2,s:89,v:58},{k:2,s:92,v:58},{k:2,s:93,v:58},{k:2,s:97,v:58},{k:2,s:100,v:58},{k:2,s:102,v:58},{k:2,s:103,v:58}],
 [{k:1,s:20,v:219},{k:1,s:26,v:305},{k:2,s:9,v:32},{k:2,s:12,v:32},{k:2,s:13,v:32},{k:2,s:16,v:32},{k:2,s:19,v:32},{k:2,s:23,v:32},{k:2,s:24,v:32},{k:2,s:25,v:32},{k:2,s:27,v:32},{k:2,s:28,v:32},{k:2,s:31,v:32},{k:2,s:32,v:32},{k:2,s:34,v:32},{k:2,s:39,v:32},{k:2,s:42,v:32},{k:2,s:45,v:32},{k:2,s:46,v:32},{k:2,s:47,v:32},{k:2,s:74,v:32},{k:2,s:78,v:32}],
 [{k:1,s:74,v:227},{k:3,s:186,v:306},{k:3,s:227,v:229},{k:3,s:228,v:230},{k:3,s:229,v:307}],
 [{k:1,s:6,v:117},{k:1,s:7,v:1},{k:1,s:8,v:118},{k:1,s:15,v:119},{k:1,s:16,v:308},{k:1,s:35,v:120},{k:1,s:36,v:121},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:106,v:141},{k:3,s:107,v:142},{k:3,s:108,v:309},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:113,v:143},{k:3,s:114,v:144},{k:3,s:120,v:129},{k:3,s:127,v:130},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:135,v:145},{k:3,s:136,v:146},{k:3,s:137,v:147},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:150,v:148},{k:3,s:151,v:149},{k:3,s:153,v:274},{k:3,s:155,v:72},{k:3,s:158,v:75},{k:3,s:174,v:151},{k:3,s:175,v:85},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:188,v:132},{k:3,s:191,v:152},{k:3,s:192,v:153},{k:3,s:194,v:134},{k:3,s:195,v:135},{k:3,s:196,v:136},{k:3,s:197,v:137},{k:3,s:198,v:138},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:204,v:154},{k:3,s:206,v:155},{k:3,s:207,v:107},{k:3,s:225,v:156},{k:3,s:226,v:140}],
 [{k:1,s:74,v:310}],
 [{k:1,s:6,v:117},{k:1,s:7,v:1},{k:1,s:8,v:118},{k:1,s:15,v:119},{k:1,s:27,v:311},{k:1,s:35,v:120},{k:1,s:36,v:121},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:106,v:141},{k:3,s:107,v:142},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:113,v:143},{k:3,s:114,v:144},{k:3,s:120,v:129},{k:3,s:127,v:130},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:135,v:145},{k:3,s:136,v:146},{k:3,s:137,v:147},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:150,v:148},{k:3,s:151,v:149},{k:3,s:153,v:312},{k:3,s:155,v:72},{k:3,s:158,v:75},{k:3,s:174,v:151},{k:3,s:175,v:85},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:188,v:132},{k:3,s:191,v:152},{k:3,s:192,v:153},{k:3,s:194,v:134},{k:3,s:195,v:135},{k:3,s:196,v:136},{k:3,s:197,v:137},{k:3,s:198,v:138},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:204,v:154},{k:3,s:206,v:155},{k:3,s:207,v:107},{k:3,s:225,v:156},{k:3,s:226,v:140}],
 [{k:2,s:6,v:262},{k:2,s:7,v:262},{k:2,s:9,v:262},{k:2,s:10,v:262},{k:2,s:12,v:262},{k:2,s:13,v:262},{k:2,s:16,v:262},{k:2,s:17,v:262},{k:2,s:19,v:262},{k:2,s:21,v:262},{k:2,s:23,v:262},{k:2,s:24,v:262},{k:2,s:25,v:262},{k:2,s:27,v:262},{k:2,s:28,v:262},{k:2,s:31,v:262},{k:2,s:32,v:262},{k:2,s:34,v:262},{k:2,s:36,v:262},{k:2,s:37,v:262},{k:2,s:39,v:262},{k:2,s:40,v:262},{k:2,s:42,v:262},{k:2,s:45,v:262},{k:2,s:46,v:262},{k:2,s:47,v:262},{k:2,s:48,v:262},{k:2,s:78,v:262}],
 [{k:2,s:6,v:261},{k:2,s:7,v:261},{k:2,s:9,v:261},{k:2,s:10,v:261},{k:2,s:12,v:261},{k:2,s:13,v:261},{k:2,s:16,v:261},{k:2,s:17,v:261},{k:2,s:19,v:261},{k:2,s:21,v:261},{k:2,s:23,v:261},{k:2,s:24,v:261},{k:2,s:25,v:261},{k:2,s:27,v:261},{k:2,s:28,v:261},{k:2,s:31,v:261},{k:2,s:32,v:261},{k:2,s:34,v:261},{k:2,s:36,v:261},{k:2,s:37,v:261},{k:2,s:39,v:261},{k:2,s:40,v:261},{k:2,s:42,v:261},{k:2,s:45,v:261},{k:2,s:46,v:261},{k:2,s:47,v:261},{k:2,s:48,v:261},{k:2,s:78,v:261}],
 [{k:1,s:74,v:313}],
 [{k:1,s:6,v:117},{k:1,s:7,v:1},{k:1,s:8,v:118},{k:1,s:15,v:119},{k:1,s:35,v:120},{k:1,s:36,v:121},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:106,v:141},{k:3,s:107,v:142},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:113,v:143},{k:3,s:114,v:144},{k:3,s:120,v:129},{k:3,s:127,v:130},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:135,v:145},{k:3,s:136,v:146},{k:3,s:137,v:147},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:150,v:148},{k:3,s:151,v:149},{k:3,s:153,v:314},{k:3,s:155,v:72},{k:3,s:158,v:75},{k:3,s:174,v:151},{k:3,s:175,v:85},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:188,v:132},{k:3,s:191,v:152},{k:3,s:192,v:153},{k:3,s:194,v:134},{k:3,s:195,v:135},{k:3,s:196,v:136},{k:3,s:197,v:137},{k:3,s:198,v:138},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:204,v:154},{k:3,s:206,v:155},{k:3,s:207,v:107},{k:3,s:225,v:156},{k:3,s:226,v:140}],
 [{k:1,s:27,v:315}],
 [{k:2,s:0,v:167},{k:2,s:7,v:167},{k:2,s:15,v:167},{k:2,s:24,v:167},{k:2,s:30,v:167},{k:2,s:34,v:167},{k:2,s:37,v:167},{k:2,s:51,v:167},{k:2,s:52,v:167},{k:2,s:53,v:167},{k:2,s:54,v:167},{k:2,s:55,v:167},{k:2,s:56,v:167},{k:2,s:58,v:167},{k:2,s:59,v:167},{k:2,s:60,v:167},{k:2,s:61,v:167},{k:2,s:62,v:167},{k:2,s:63,v:167},{k:2,s:64,v:167},{k:2,s:65,v:167},{k:2,s:66,v:167},{k:2,s:68,v:167},{k:2,s:69,v:167},{k:2,s:70,v:167},{k:2,s:71,v:167},{k:2,s:72,v:167},{k:2,s:73,v:167},{k:2,s:74,v:167},{k:2,s:75,v:167},{k:2,s:79,v:167},{k:2,s:80,v:167},{k:2,s:81,v:167},{k:2,s:82,v:167},{k:2,s:83,v:167},{k:2,s:84,v:167},{k:2,s:85,v:167},{k:2,s:86,v:167},{k:2,s:87,v:167},{k:2,s:88,v:167},{k:2,s:89,v:167},{k:2,s:90,v:167},{k:2,s:91,v:167},{k:2,s:92,v:167},{k:2,s:93,v:167},{k:2,s:94,v:167},{k:2,s:95,v:167},{k:2,s:96,v:167},{k:2,s:97,v:167},{k:2,s:98,v:167},{k:2,s:100,v:167},{k:2,s:101,v:167},{k:2,s:102,v:167},{k:2,s:103,v:167},{k:2,s:104,v:167},{k:2,s:105,v:167}],
 [{k:1,s:15,v:295},{k:2,s:19,v:95},{k:2,s:24,v:95},{k:2,s:26,v:95},{k:2,s:43,v:95}],
 [{k:1,s:26,v:296},{k:1,s:99,v:297},{k:3,s:221,v:316},{k:2,s:24,v:103},{k:2,s:30,v:103}],
 [{k:2,s:19,v:91},{k:2,s:24,v:91}],
 [{k:1,s:26,v:317},{k:1,s:43,v:318},{k:2,s:19,v:93},{k:2,s:24,v:93}],
 [{k:1,s:19,v:319},{k:1,s:24,v:320}],
 [{k:2,s:6,v:266},{k:2,s:9,v:266},{k:2,s:10,v:266},{k:2,s:12,v:266},{k:2,s:13,v:266},{k:2,s:16,v:266},{k:2,s:17,v:266},{k:2,s:19,v:266},{k:2,s:21,v:266},{k:2,s:23,v:266},{k:2,s:24,v:266},{k:2,s:25,v:266},{k:2,s:27,v:266},{k:2,s:28,v:266},{k:2,s:31,v:266},{k:2,s:32,v:266},{k:2,s:34,v:266},{k:2,s:36,v:266},{k:2,s:39,v:266},{k:2,s:40,v:266},{k:2,s:42,v:266},{k:2,s:45,v:266},{k:2,s:46,v:266},{k:2,s:47,v:266},{k:2,s:48,v:266},{k:2,s:78,v:266}],
 [{k:2,s:6,v:271},{k:2,s:9,v:271},{k:2,s:10,v:271},{k:2,s:12,v:271},{k:2,s:13,v:271},{k:2,s:16,v:271},{k:2,s:17,v:271},{k:2,s:19,v:271},{k:2,s:21,v:271},{k:2,s:23,v:271},{k:2,s:24,v:271},{k:2,s:25,v:271},{k:2,s:27,v:271},{k:2,s:28,v:271},{k:2,s:31,v:271},{k:2,s:32,v:271},{k:2,s:34,v:271},{k:2,s:36,v:271},{k:2,s:39,v:271},{k:2,s:40,v:271},{k:2,s:42,v:271},{k:2,s:45,v:271},{k:2,s:46,v:271},{k:2,s:47,v:271},{k:2,s:48,v:271},{k:2,s:78,v:271}],
 [{k:1,s:16,v:321}],
 [{k:1,s:15,v:218},{k:1,s:20,v:219},{k:1,s:26,v:322},{k:3,s:147,v:323},{k:2,s:6,v:258},{k:2,s:7,v:258},{k:2,s:9,v:258},{k:2,s:10,v:258},{k:2,s:12,v:258},{k:2,s:13,v:258},{k:2,s:16,v:258},{k:2,s:17,v:258},{k:2,s:21,v:258},{k:2,s:25,v:258},{k:2,s:28,v:258},{k:2,s:31,v:258},{k:2,s:32,v:258},{k:2,s:36,v:258},{k:2,s:37,v:258},{k:2,s:39,v:258},{k:2,s:40,v:258},{k:2,s:42,v:258},{k:2,s:45,v:258},{k:2,s:46,v:258},{k:2,s:47,v:258},{k:2,s:48,v:258},{k:2,s:78,v:258},{k:2,s:11,v:312},{k:2,s:14,v:312},{k:2,s:18,v:312},{k:2,s:22,v:312},{k:2,s:29,v:312},{k:2,s:33,v:312},{k:2,s:38,v:312},{k:2,s:41,v:312},{k:2,s:43,v:312},{k:2,s:44,v:312},{k:2,s:49,v:312},{k:2,s:50,v:312}],
 [{k:1,s:16,v:324},{k:1,s:26,v:325},{k:3,s:147,v:326}],
 [{k:2,s:6,v:272},{k:2,s:9,v:272},{k:2,s:10,v:272},{k:2,s:12,v:272},{k:2,s:13,v:272},{k:2,s:16,v:272},{k:2,s:17,v:272},{k:2,s:19,v:272},{k:2,s:21,v:272},{k:2,s:23,v:272},{k:2,s:24,v:272},{k:2,s:25,v:272},{k:2,s:27,v:272},{k:2,s:28,v:272},{k:2,s:31,v:272},{k:2,s:32,v:272},{k:2,s:34,v:272},{k:2,s:36,v:272},{k:2,s:39,v:272},{k:2,s:40,v:272},{k:2,s:42,v:272},{k:2,s:45,v:272},{k:2,s:46,v:272},{k:2,s:47,v:272},{k:2,s:48,v:272},{k:2,s:78,v:272}],
 [{k:2,s:6,v:265},{k:2,s:9,v:265},{k:2,s:10,v:265},{k:2,s:12,v:265},{k:2,s:13,v:265},{k:2,s:16,v:265},{k:2,s:17,v:265},{k:2,s:19,v:265},{k:2,s:21,v:265},{k:2,s:23,v:265},{k:2,s:24,v:265},{k:2,s:25,v:265},{k:2,s:27,v:265},{k:2,s:28,v:265},{k:2,s:31,v:265},{k:2,s:32,v:265},{k:2,s:34,v:265},{k:2,s:36,v:265},{k:2,s:39,v:265},{k:2,s:40,v:265},{k:2,s:42,v:265},{k:2,s:45,v:265},{k:2,s:46,v:265},{k:2,s:47,v:265},{k:2,s:48,v:265},{k:2,s:78,v:265}],
 [{k:1,s:6,v:117},{k:1,s:7,v:1},{k:1,s:8,v:118},{k:1,s:15,v:119},{k:1,s:35,v:120},{k:1,s:36,v:121},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:106,v:141},{k:3,s:107,v:142},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:113,v:143},{k:3,s:114,v:144},{k:3,s:120,v:129},{k:3,s:127,v:130},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:135,v:145},{k:3,s:136,v:146},{k:3,s:137,v:147},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:150,v:148},{k:3,s:151,v:149},{k:3,s:153,v:312},{k:3,s:155,v:72},{k:3,s:158,v:75},{k:3,s:174,v:151},{k:3,s:175,v:85},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:188,v:132},{k:3,s:191,v:152},{k:3,s:192,v:153},{k:3,s:194,v:134},{k:3,s:195,v:135},{k:3,s:196,v:136},{k:3,s:197,v:137},{k:3,s:198,v:138},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:204,v:154},{k:3,s:206,v:155},{k:3,s:207,v:107},{k:3,s:225,v:156},{k:3,s:226,v:140}],
 [{k:1,s:6,v:117},{k:1,s:7,v:1},{k:1,s:8,v:118},{k:1,s:15,v:119},{k:1,s:35,v:120},{k:1,s:36,v:121},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:109,v:128},{k:3,s:110,v:54},{k:3,s:120,v:129},{k:3,s:127,v:130},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:155,v:131},{k:3,s:158,v:75},{k:3,s:175,v:85},{k:3,s:181,v:88},{k:3,s:188,v:132},{k:3,s:191,v:327},{k:3,s:192,v:133},{k:3,s:194,v:134},{k:3,s:195,v:135},{k:3,s:196,v:136},{k:3,s:197,v:137},{k:3,s:198,v:138},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:207,v:107},{k:3,s:225,v:156},{k:3,s:226,v:140}],
 [{k:1,s:6,v:117},{k:1,s:7,v:1},{k:1,s:8,v:118},{k:1,s:15,v:119},{k:1,s:35,v:120},{k:1,s:36,v:121},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:109,v:128},{k:3,s:110,v:54},{k:3,s:120,v:129},{k:3,s:127,v:130},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:155,v:131},{k:3,s:158,v:75},{k:3,s:175,v:85},{k:3,s:181,v:88},{k:3,s:188,v:132},{k:3,s:191,v:328},{k:3,s:192,v:133},{k:3,s:194,v:134},{k:3,s:195,v:135},{k:3,s:196,v:136},{k:3,s:197,v:137},{k:3,s:198,v:138},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:207,v:107},{k:3,s:225,v:156},{k:3,s:226,v:140}],
 [{k:1,s:6,v:117},{k:1,s:7,v:1},{k:1,s:8,v:118},{k:1,s:15,v:119},{k:1,s:35,v:120},{k:1,s:36,v:121},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:106,v:141},{k:3,s:109,v:128},{k:3,s:110,v:54},{k:3,s:120,v:129},{k:3,s:127,v:130},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:150,v:329},{k:3,s:155,v:131},{k:3,s:158,v:75},{k:3,s:175,v:85},{k:3,s:181,v:88},{k:3,s:188,v:132},{k:3,s:191,v:152},{k:3,s:192,v:133},{k:3,s:194,v:134},{k:3,s:195,v:135},{k:3,s:196,v:136},{k:3,s:197,v:137},{k:3,s:198,v:138},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:204,v:154},{k:3,s:206,v:155},{k:3,s:207,v:107},{k:3,s:225,v:156},{k:3,s:226,v:140}],
 [{k:1,s:6,v:117},{k:1,s:7,v:1},{k:1,s:8,v:118},{k:1,s:15,v:119},{k:1,s:35,v:120},{k:1,s:36,v:121},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:106,v:141},{k:3,s:107,v:142},{k:3,s:109,v:128},{k:3,s:110,v:54},{k:3,s:120,v:129},{k:3,s:127,v:130},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:150,v:148},{k:3,s:151,v:149},{k:3,s:155,v:131},{k:3,s:158,v:75},{k:3,s:174,v:330},{k:3,s:175,v:85},{k:3,s:181,v:88},{k:3,s:188,v:132},{k:3,s:191,v:152},{k:3,s:192,v:133},{k:3,s:194,v:134},{k:3,s:195,v:135},{k:3,s:196,v:136},{k:3,s:197,v:137},{k:3,s:198,v:138},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:204,v:154},{k:3,s:206,v:155},{k:3,s:207,v:107},{k:3,s:225,v:156},{k:3,s:226,v:140}],
 [{k:1,s:6,v:117},{k:1,s:7,v:1},{k:1,s:8,v:118},{k:1,s:15,v:119},{k:1,s:35,v:120},{k:1,s:36,v:121},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:106,v:141},{k:3,s:107,v:142},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:113,v:143},{k:3,s:114,v:144},{k:3,s:120,v:129},{k:3,s:127,v:130},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:135,v:145},{k:3,s:136,v:146},{k:3,s:137,v:147},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:150,v:148},{k:3,s:151,v:149},{k:3,s:153,v:331},{k:3,s:155,v:72},{k:3,s:158,v:75},{k:3,s:174,v:151},{k:3,s:175,v:85},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:188,v:132},{k:3,s:191,v:152},{k:3,s:192,v:153},{k:3,s:194,v:134},{k:3,s:195,v:135},{k:3,s:196,v:136},{k:3,s:197,v:137},{k:3,s:198,v:138},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:204,v:154},{k:3,s:206,v:155},{k:3,s:207,v:107},{k:3,s:225,v:156},{k:3,s:226,v:140}],
 [{k:1,s:6,v:117},{k:1,s:7,v:1},{k:1,s:8,v:118},{k:1,s:15,v:119},{k:1,s:35,v:120},{k:1,s:36,v:121},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:106,v:141},{k:3,s:107,v:142},{k:3,s:109,v:128},{k:3,s:110,v:54},{k:3,s:120,v:129},{k:3,s:127,v:130},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:135,v:332},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:150,v:148},{k:3,s:151,v:149},{k:3,s:155,v:131},{k:3,s:158,v:75},{k:3,s:174,v:151},{k:3,s:175,v:85},{k:3,s:181,v:88},{k:3,s:188,v:132},{k:3,s:191,v:152},{k:3,s:192,v:133},{k:3,s:194,v:134},{k:3,s:195,v:135},{k:3,s:196,v:136},{k:3,s:197,v:137},{k:3,s:198,v:138},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:204,v:154},{k:3,s:206,v:155},{k:3,s:207,v:107},{k:3,s:225,v:156},{k:3,s:226,v:140}],
 [{k:1,s:6,v:117},{k:1,s:7,v:1},{k:1,s:8,v:118},{k:1,s:15,v:119},{k:1,s:35,v:120},{k:1,s:36,v:121},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:106,v:141},{k:3,s:109,v:128},{k:3,s:110,v:54},{k:3,s:120,v:129},{k:3,s:127,v:130},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:155,v:131},{k:3,s:158,v:75},{k:3,s:175,v:85},{k:3,s:181,v:88},{k:3,s:188,v:132},{k:3,s:191,v:152},{k:3,s:192,v:133},{k:3,s:194,v:134},{k:3,s:195,v:135},{k:3,s:196,v:136},{k:3,s:197,v:137},{k:3,s:198,v:138},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:204,v:333},{k:3,s:206,v:155},{k:3,s:207,v:107},{k:3,s:225,v:156},{k:3,s:226,v:140}],
 [{k:1,s:6,v:117},{k:1,s:7,v:1},{k:1,s:8,v:118},{k:1,s:15,v:119},{k:1,s:35,v:120},{k:1,s:36,v:121},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:106,v:141},{k:3,s:109,v:128},{k:3,s:110,v:54},{k:3,s:120,v:129},{k:3,s:127,v:130},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:155,v:131},{k:3,s:158,v:75},{k:3,s:175,v:85},{k:3,s:181,v:88},{k:3,s:188,v:132},{k:3,s:191,v:152},{k:3,s:192,v:133},{k:3,s:194,v:134},{k:3,s:195,v:135},{k:3,s:196,v:136},{k:3,s:197,v:137},{k:3,s:198,v:138},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:204,v:334},{k:3,s:206,v:155},{k:3,s:207,v:107},{k:3,s:225,v:156},{k:3,s:226,v:140}],
 [{k:1,s:6,v:117},{k:1,s:7,v:1},{k:1,s:8,v:118},{k:1,s:15,v:119},{k:1,s:35,v:120},{k:1,s:36,v:121},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:106,v:141},{k:3,s:107,v:335},{k:3,s:109,v:128},{k:3,s:110,v:54},{k:3,s:120,v:129},{k:3,s:127,v:130},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:150,v:148},{k:3,s:155,v:131},{k:3,s:158,v:75},{k:3,s:175,v:85},{k:3,s:181,v:88},{k:3,s:188,v:132},{k:3,s:191,v:152},{k:3,s:192,v:133},{k:3,s:194,v:134},{k:3,s:195,v:135},{k:3,s:196,v:136},{k:3,s:197,v:137},{k:3,s:198,v:138},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:204,v:154},{k:3,s:206,v:155},{k:3,s:207,v:107},{k:3,s:225,v:156},{k:3,s:226,v:140}],
 [{k:2,s:7,v:226},{k:2,s:20,v:226},{k:2,s:26,v:226},{k:2,s:37,v:226}],
 [{k:1,s:6,v:117},{k:1,s:7,v:1},{k:1,s:8,v:118},{k:1,s:15,v:119},{k:1,s:35,v:120},{k:1,s:36,v:121},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:106,v:141},{k:3,s:107,v:142},{k:3,s:109,v:128},{k:3,s:110,v:54},{k:3,s:120,v:129},{k:3,s:127,v:130},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:150,v:148},{k:3,s:151,v:336},{k:3,s:155,v:131},{k:3,s:158,v:75},{k:3,s:175,v:85},{k:3,s:181,v:88},{k:3,s:188,v:132},{k:3,s:191,v:152},{k:3,s:192,v:133},{k:3,s:194,v:134},{k:3,s:195,v:135},{k:3,s:196,v:136},{k:3,s:197,v:137},{k:3,s:198,v:138},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:204,v:154},{k:3,s:206,v:155},{k:3,s:207,v:107},{k:3,s:225,v:156},{k:3,s:226,v:140}],
 [{k:1,s:6,v:117},{k:1,s:7,v:1},{k:1,s:8,v:118},{k:1,s:15,v:119},{k:1,s:35,v:120},{k:1,s:36,v:121},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:109,v:128},{k:3,s:110,v:54},{k:3,s:120,v:129},{k:3,s:127,v:130},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:155,v:131},{k:3,s:158,v:75},{k:3,s:175,v:85},{k:3,s:181,v:88},{k:3,s:188,v:132},{k:3,s:192,v:133},{k:3,s:194,v:134},{k:3,s:195,v:135},{k:3,s:196,v:136},{k:3,s:197,v:137},{k:3,s:198,v:138},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:207,v:107},{k:3,s:225,v:337},{k:3,s:226,v:140}],
 [{k:1,s:6,v:117},{k:1,s:7,v:1},{k:1,s:8,v:118},{k:1,s:15,v:119},{k:1,s:35,v:120},{k:1,s:36,v:121},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:109,v:128},{k:3,s:110,v:54},{k:3,s:120,v:129},{k:3,s:127,v:130},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:155,v:131},{k:3,s:158,v:75},{k:3,s:175,v:85},{k:3,s:181,v:88},{k:3,s:188,v:132},{k:3,s:192,v:133},{k:3,s:194,v:134},{k:3,s:195,v:135},{k:3,s:196,v:136},{k:3,s:197,v:137},{k:3,s:198,v:138},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:207,v:107},{k:3,s:225,v:338},{k:3,s:226,v:140}],
 [{k:1,s:6,v:117},{k:1,s:7,v:1},{k:1,s:8,v:118},{k:1,s:15,v:119},{k:1,s:35,v:120},{k:1,s:36,v:121},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:109,v:128},{k:3,s:110,v:54},{k:3,s:120,v:129},{k:3,s:127,v:130},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:155,v:131},{k:3,s:158,v:75},{k:3,s:175,v:85},{k:3,s:181,v:88},{k:3,s:188,v:132},{k:3,s:192,v:133},{k:3,s:194,v:134},{k:3,s:195,v:135},{k:3,s:196,v:136},{k:3,s:197,v:137},{k:3,s:198,v:138},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:207,v:107},{k:3,s:225,v:339},{k:3,s:226,v:140}],
 [{k:1,s:6,v:117},{k:1,s:7,v:1},{k:1,s:8,v:118},{k:1,s:15,v:119},{k:1,s:35,v:120},{k:1,s:36,v:121},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:106,v:141},{k:3,s:109,v:128},{k:3,s:110,v:54},{k:3,s:120,v:129},{k:3,s:127,v:130},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:155,v:131},{k:3,s:158,v:75},{k:3,s:175,v:85},{k:3,s:181,v:88},{k:3,s:188,v:132},{k:3,s:191,v:152},{k:3,s:192,v:133},{k:3,s:194,v:134},{k:3,s:195,v:135},{k:3,s:196,v:136},{k:3,s:197,v:137},{k:3,s:198,v:138},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:206,v:340},{k:3,s:207,v:107},{k:3,s:225,v:156},{k:3,s:226,v:140}],
 [{k:1,s:6,v:117},{k:1,s:7,v:1},{k:1,s:8,v:118},{k:1,s:15,v:119},{k:1,s:35,v:120},{k:1,s:36,v:121},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:106,v:141},{k:3,s:109,v:128},{k:3,s:110,v:54},{k:3,s:120,v:129},{k:3,s:127,v:130},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:155,v:131},{k:3,s:158,v:75},{k:3,s:175,v:85},{k:3,s:181,v:88},{k:3,s:188,v:132},{k:3,s:191,v:152},{k:3,s:192,v:133},{k:3,s:194,v:134},{k:3,s:195,v:135},{k:3,s:196,v:136},{k:3,s:197,v:137},{k:3,s:198,v:138},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:206,v:341},{k:3,s:207,v:107},{k:3,s:225,v:156},{k:3,s:226,v:140}],
 [{k:1,s:6,v:117},{k:1,s:7,v:1},{k:1,s:8,v:118},{k:1,s:15,v:119},{k:1,s:35,v:120},{k:1,s:36,v:121},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:106,v:141},{k:3,s:109,v:128},{k:3,s:110,v:54},{k:3,s:120,v:129},{k:3,s:127,v:130},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:155,v:131},{k:3,s:158,v:75},{k:3,s:175,v:85},{k:3,s:181,v:88},{k:3,s:188,v:132},{k:3,s:191,v:152},{k:3,s:192,v:133},{k:3,s:194,v:134},{k:3,s:195,v:135},{k:3,s:196,v:136},{k:3,s:197,v:137},{k:3,s:198,v:138},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:206,v:342},{k:3,s:207,v:107},{k:3,s:225,v:156},{k:3,s:226,v:140}],
 [{k:1,s:6,v:117},{k:1,s:7,v:1},{k:1,s:8,v:118},{k:1,s:15,v:119},{k:1,s:35,v:120},{k:1,s:36,v:121},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:106,v:141},{k:3,s:109,v:128},{k:3,s:110,v:54},{k:3,s:120,v:129},{k:3,s:127,v:130},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:155,v:131},{k:3,s:158,v:75},{k:3,s:175,v:85},{k:3,s:181,v:88},{k:3,s:188,v:132},{k:3,s:191,v:152},{k:3,s:192,v:133},{k:3,s:194,v:134},{k:3,s:195,v:135},{k:3,s:196,v:136},{k:3,s:197,v:137},{k:3,s:198,v:138},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:206,v:343},{k:3,s:207,v:107},{k:3,s:225,v:156},{k:3,s:226,v:140}],
 [{k:1,s:52,v:174},{k:1,s:55,v:175},{k:1,s:58,v:176},{k:1,s:61,v:177},{k:1,s:65,v:17},{k:1,s:69,v:178},{k:1,s:74,v:24},{k:1,s:79,v:179},{k:1,s:80,v:28},{k:1,s:89,v:37},{k:1,s:93,v:41},{k:3,s:112,v:55},{k:3,s:129,v:62},{k:3,s:157,v:74},{k:3,s:176,v:86},{k:3,s:192,v:216},{k:3,s:193,v:95},{k:3,s:201,v:344},{k:3,s:202,v:104},{k:3,s:203,v:345},{k:3,s:207,v:107}],
 [{k:1,s:6,v:117},{k:1,s:7,v:1},{k:1,s:8,v:118},{k:1,s:15,v:119},{k:1,s:35,v:120},{k:1,s:36,v:121},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:106,v:346},{k:3,s:109,v:128},{k:3,s:110,v:54},{k:3,s:120,v:129},{k:3,s:127,v:130},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:155,v:131},{k:3,s:158,v:75},{k:3,s:175,v:85},{k:3,s:181,v:88},{k:3,s:188,v:132},{k:3,s:191,v:152},{k:3,s:192,v:133},{k:3,s:194,v:134},{k:3,s:195,v:135},{k:3,s:196,v:136},{k:3,s:197,v:137},{k:3,s:198,v:138},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:207,v:107},{k:3,s:225,v:156},{k:3,s:226,v:140}],
 [{k:1,s:6,v:117},{k:1,s:7,v:1},{k:1,s:8,v:118},{k:1,s:15,v:119},{k:1,s:35,v:120},{k:1,s:36,v:121},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:106,v:347},{k:3,s:109,v:128},{k:3,s:110,v:54},{k:3,s:120,v:129},{k:3,s:127,v:130},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:155,v:131},{k:3,s:158,v:75},{k:3,s:175,v:85},{k:3,s:181,v:88},{k:3,s:188,v:132},{k:3,s:191,v:152},{k:3,s:192,v:133},{k:3,s:194,v:134},{k:3,s:195,v:135},{k:3,s:196,v:136},{k:3,s:197,v:137},{k:3,s:198,v:138},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:207,v:107},{k:3,s:225,v:156},{k:3,s:226,v:140}],
 [{k:2,s:0,v:139},{k:2,s:7,v:139},{k:2,s:15,v:139},{k:2,s:24,v:139},{k:2,s:30,v:139},{k:2,s:34,v:139},{k:2,s:37,v:139},{k:2,s:51,v:139},{k:2,s:52,v:139},{k:2,s:53,v:139},{k:2,s:54,v:139},{k:2,s:55,v:139},{k:2,s:56,v:139},{k:2,s:57,v:139},{k:2,s:58,v:139},{k:2,s:59,v:139},{k:2,s:60,v:139},{k:2,s:61,v:139},{k:2,s:62,v:139},{k:2,s:63,v:139},{k:2,s:64,v:139},{k:2,s:65,v:139},{k:2,s:66,v:139},{k:2,s:68,v:139},{k:2,s:69,v:139},{k:2,s:70,v:139},{k:2,s:71,v:139},{k:2,s:72,v:139},{k:2,s:73,v:139},{k:2,s:74,v:139},{k:2,s:75,v:139},{k:2,s:79,v:139},{k:2,s:80,v:139},{k:2,s:81,v:139},{k:2,s:82,v:139},{k:2,s:83,v:139},{k:2,s:84,v:139},{k:2,s:85,v:139},{k:2,s:86,v:139},{k:2,s:87,v:139},{k:2,s:88,v:139},{k:2,s:89,v:139},{k:2,s:90,v:139},{k:2,s:91,v:139},{k:2,s:92,v:139},{k:2,s:93,v:139},{k:2,s:94,v:139},{k:2,s:95,v:139},{k:2,s:96,v:139},{k:2,s:97,v:139},{k:2,s:98,v:139},{k:2,s:100,v:139},{k:2,s:101,v:139},{k:2,s:102,v:139},{k:2,s:103,v:139},{k:2,s:104,v:139},{k:2,s:105,v:139}],
 [{k:2,s:7,v:142},{k:2,s:15,v:142},{k:2,s:24,v:142},{k:2,s:30,v:142},{k:2,s:34,v:142},{k:2,s:37,v:142},{k:2,s:51,v:142},{k:2,s:52,v:142},{k:2,s:53,v:142},{k:2,s:54,v:142},{k:2,s:55,v:142},{k:2,s:56,v:142},{k:2,s:58,v:142},{k:2,s:59,v:142},{k:2,s:61,v:142},{k:2,s:62,v:142},{k:2,s:63,v:142},{k:2,s:64,v:142},{k:2,s:65,v:142},{k:2,s:68,v:142},{k:2,s:69,v:142},{k:2,s:70,v:142},{k:2,s:71,v:142},{k:2,s:72,v:142},{k:2,s:73,v:142},{k:2,s:74,v:142},{k:2,s:75,v:142},{k:2,s:79,v:142},{k:2,s:80,v:142},{k:2,s:81,v:142},{k:2,s:82,v:142},{k:2,s:83,v:142},{k:2,s:84,v:142},{k:2,s:85,v:142},{k:2,s:86,v:142},{k:2,s:87,v:142},{k:2,s:88,v:142},{k:2,s:89,v:142},{k:2,s:90,v:142},{k:2,s:91,v:142},{k:2,s:92,v:142},{k:2,s:93,v:142},{k:2,s:94,v:142},{k:2,s:95,v:142},{k:2,s:96,v:142},{k:2,s:97,v:142},{k:2,s:98,v:142},{k:2,s:100,v:142},{k:2,s:101,v:142},{k:2,s:103,v:142},{k:2,s:104,v:142},{k:2,s:105,v:142}],
 [{k:2,s:7,v:145},{k:2,s:15,v:145},{k:2,s:24,v:145},{k:2,s:30,v:145},{k:2,s:34,v:145},{k:2,s:37,v:145},{k:2,s:51,v:145},{k:2,s:52,v:145},{k:2,s:53,v:145},{k:2,s:54,v:145},{k:2,s:55,v:145},{k:2,s:56,v:145},{k:2,s:58,v:145},{k:2,s:59,v:145},{k:2,s:61,v:145},{k:2,s:62,v:145},{k:2,s:63,v:145},{k:2,s:64,v:145},{k:2,s:65,v:145},{k:2,s:68,v:145},{k:2,s:69,v:145},{k:2,s:70,v:145},{k:2,s:71,v:145},{k:2,s:72,v:145},{k:2,s:73,v:145},{k:2,s:74,v:145},{k:2,s:75,v:145},{k:2,s:79,v:145},{k:2,s:80,v:145},{k:2,s:81,v:145},{k:2,s:82,v:145},{k:2,s:83,v:145},{k:2,s:84,v:145},{k:2,s:85,v:145},{k:2,s:86,v:145},{k:2,s:87,v:145},{k:2,s:88,v:145},{k:2,s:89,v:145},{k:2,s:90,v:145},{k:2,s:91,v:145},{k:2,s:92,v:145},{k:2,s:93,v:145},{k:2,s:94,v:145},{k:2,s:95,v:145},{k:2,s:96,v:145},{k:2,s:97,v:145},{k:2,s:98,v:145},{k:2,s:100,v:145},{k:2,s:101,v:145},{k:2,s:103,v:145},{k:2,s:104,v:145},{k:2,s:105,v:145}],
 [{k:1,s:74,v:265},{k:3,s:227,v:229},{k:3,s:228,v:230},{k:3,s:229,v:348}],
 [{k:2,s:16,v:95},{k:2,s:19,v:95},{k:2,s:24,v:95},{k:2,s:26,v:95},{k:2,s:43,v:95}],
 [{k:1,s:19,v:319},{k:2,s:24,v:147}],
 [{k:1,s:34,v:349},{k:1,s:51,v:6},{k:1,s:52,v:174},{k:1,s:55,v:175},{k:1,s:58,v:176},{k:1,s:61,v:177},{k:1,s:65,v:17},{k:1,s:68,v:18},{k:1,s:69,v:178},{k:1,s:74,v:24},{k:1,s:79,v:179},{k:1,s:80,v:28},{k:1,s:81,v:29},{k:1,s:85,v:33},{k:1,s:86,v:34},{k:1,s:87,v:35},{k:1,s:89,v:37},{k:1,s:92,v:40},{k:1,s:93,v:41},{k:1,s:97,v:45},{k:1,s:100,v:47},{k:1,s:102,v:49},{k:1,s:103,v:50},{k:3,s:112,v:55},{k:3,s:124,v:350},{k:3,s:125,v:351},{k:3,s:128,v:352},{k:3,s:129,v:62},{k:3,s:140,v:353},{k:3,s:141,v:354},{k:3,s:156,v:73},{k:3,s:157,v:74},{k:3,s:176,v:86},{k:3,s:185,v:89},{k:3,s:187,v:90},{k:3,s:189,v:92},{k:3,s:190,v:355},{k:3,s:192,v:216},{k:3,s:193,v:95},{k:3,s:201,v:103},{k:3,s:202,v:104},{k:3,s:203,v:105},{k:3,s:207,v:356},{k:3,s:223,v:114}],
 [{k:1,s:74,v:24},{k:3,s:129,v:357},{k:3,s:130,v:358},{k:3,s:192,v:182},{k:3,s:202,v:104},{k:3,s:207,v:107}],
 [{k:1,s:74,v:24},{k:3,s:129,v:359},{k:3,s:178,v:360},{k:3,s:179,v:361},{k:3,s:192,v:182},{k:3,s:202,v:104},{k:3,s:207,v:107}],
 [{k:2,s:0,v:76},{k:2,s:7,v:76},{k:2,s:15,v:76},{k:2,s:24,v:76},{k:2,s:30,v:76},{k:2,s:37,v:76},{k:2,s:51,v:76},{k:2,s:52,v:76},{k:2,s:53,v:76},{k:2,s:54,v:76},{k:2,s:55,v:76},{k:2,s:58,v:76},{k:2,s:59,v:76},{k:2,s:60,v:76},{k:2,s:61,v:76},{k:2,s:62,v:76},{k:2,s:64,v:76},{k:2,s:65,v:76},{k:2,s:68,v:76},{k:2,s:69,v:76},{k:2,s:70,v:76},{k:2,s:71,v:76},{k:2,s:72,v:76},{k:2,s:73,v:76},{k:2,s:74,v:76},{k:2,s:75,v:76},{k:2,s:79,v:76},{k:2,s:80,v:76},{k:2,s:81,v:76},{k:2,s:82,v:76},{k:2,s:83,v:76},{k:2,s:84,v:76},{k:2,s:85,v:76},{k:2,s:86,v:76},{k:2,s:87,v:76},{k:2,s:88,v:76},{k:2,s:89,v:76},{k:2,s:90,v:76},{k:2,s:91,v:76},{k:2,s:92,v:76},{k:2,s:93,v:76},{k:2,s:94,v:76},{k:2,s:95,v:76},{k:2,s:96,v:76},{k:2,s:97,v:76},{k:2,s:98,v:76},{k:2,s:100,v:76},{k:2,s:101,v:76},{k:2,s:102,v:76},{k:2,s:103,v:76},{k:2,s:104,v:76},{k:2,s:105,v:76}],
 [{k:1,s:30,v:267},{k:3,s:123,v:362}],
 [{k:1,s:30,v:267},{k:1,s:76,v:269},{k:3,s:123,v:363},{k:3,s:177,v:364}],
 [{k:1,s:16,v:365},{k:1,s:19,v:366}],
 [{k:2,s:16,v:235},{k:2,s:19,v:235}],
 [{k:1,s:15,v:367}],
 [{k:1,s:6,v:117},{k:1,s:7,v:1},{k:1,s:8,v:118},{k:1,s:15,v:119},{k:1,s:24,v:368},{k:1,s:35,v:120},{k:1,s:36,v:121},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:106,v:141},{k:3,s:107,v:142},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:113,v:143},{k:3,s:114,v:144},{k:3,s:120,v:129},{k:3,s:127,v:130},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:135,v:145},{k:3,s:136,v:146},{k:3,s:137,v:147},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:150,v:148},{k:3,s:151,v:149},{k:3,s:153,v:369},{k:3,s:155,v:72},{k:3,s:158,v:75},{k:3,s:174,v:151},{k:3,s:175,v:85},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:188,v:132},{k:3,s:191,v:152},{k:3,s:192,v:153},{k:3,s:194,v:134},{k:3,s:195,v:135},{k:3,s:196,v:136},{k:3,s:197,v:137},{k:3,s:198,v:138},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:204,v:154},{k:3,s:206,v:155},{k:3,s:207,v:107},{k:3,s:225,v:156},{k:3,s:226,v:140}],
 [{k:1,s:24,v:370}],
 [{k:2,s:24,v:210}],
 [{k:2,s:16,v:212},{k:2,s:19,v:212},{k:2,s:24,v:212}],
 [{k:1,s:19,v:371},{k:2,s:24,v:209}],
 [{k:1,s:16,v:372}],
 [{k:1,s:17,v:373},{k:1,s:74,v:310}],
 [{k:2,s:7,v:55},{k:2,s:15,v:55},{k:2,s:24,v:55},{k:2,s:30,v:55},{k:2,s:37,v:55},{k:2,s:51,v:55},{k:2,s:52,v:55},{k:2,s:53,v:55},{k:2,s:54,v:55},{k:2,s:55,v:55},{k:2,s:58,v:55},{k:2,s:59,v:55},{k:2,s:60,v:55},{k:2,s:61,v:55},{k:2,s:62,v:55},{k:2,s:64,v:55},{k:2,s:65,v:55},{k:2,s:68,v:55},{k:2,s:69,v:55},{k:2,s:70,v:55},{k:2,s:71,v:55},{k:2,s:72,v:55},{k:2,s:73,v:55},{k:2,s:74,v:55},{k:2,s:75,v:55},{k:2,s:77,v:55},{k:2,s:79,v:55},{k:2,s:80,v:55},{k:2,s:81,v:55},{k:2,s:82,v:55},{k:2,s:83,v:55},{k:2,s:84,v:55},{k:2,s:85,v:55},{k:2,s:86,v:55},{k:2,s:87,v:55},{k:2,s:88,v:55},{k:2,s:89,v:55},{k:2,s:90,v:55},{k:2,s:91,v:55},{k:2,s:92,v:55},{k:2,s:93,v:55},{k:2,s:94,v:55},{k:2,s:95,v:55},{k:2,s:96,v:55},{k:2,s:97,v:55},{k:2,s:98,v:55},{k:2,s:100,v:55},{k:2,s:101,v:55},{k:2,s:102,v:55},{k:2,s:103,v:55},{k:2,s:104,v:55},{k:2,s:105,v:55}],
 [{k:1,s:6,v:117},{k:1,s:7,v:1},{k:1,s:8,v:118},{k:1,s:15,v:119},{k:1,s:35,v:120},{k:1,s:36,v:121},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:106,v:141},{k:3,s:107,v:142},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:113,v:143},{k:3,s:114,v:144},{k:3,s:120,v:129},{k:3,s:127,v:130},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:135,v:145},{k:3,s:136,v:146},{k:3,s:137,v:147},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:150,v:148},{k:3,s:151,v:149},{k:3,s:153,v:374},{k:3,s:155,v:72},{k:3,s:158,v:75},{k:3,s:174,v:151},{k:3,s:175,v:85},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:188,v:132},{k:3,s:191,v:152},{k:3,s:192,v:153},{k:3,s:194,v:134},{k:3,s:195,v:135},{k:3,s:196,v:136},{k:3,s:197,v:137},{k:3,s:198,v:138},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:204,v:154},{k:3,s:206,v:155},{k:3,s:207,v:107},{k:3,s:225,v:156},{k:3,s:226,v:140}],
 [{k:2,s:6,v:241},{k:2,s:7,v:241},{k:2,s:9,v:241},{k:2,s:10,v:241},{k:2,s:12,v:241},{k:2,s:13,v:241},{k:2,s:16,v:241},{k:2,s:17,v:241},{k:2,s:19,v:241},{k:2,s:20,v:241},{k:2,s:21,v:241},{k:2,s:23,v:241},{k:2,s:24,v:241},{k:2,s:25,v:241},{k:2,s:26,v:241},{k:2,s:27,v:241},{k:2,s:28,v:241},{k:2,s:31,v:241},{k:2,s:32,v:241},{k:2,s:34,v:241},{k:2,s:36,v:241},{k:2,s:37,v:241},{k:2,s:39,v:241},{k:2,s:40,v:241},{k:2,s:42,v:241},{k:2,s:45,v:241},{k:2,s:46,v:241},{k:2,s:47,v:241},{k:2,s:48,v:241},{k:2,s:78,v:241}],
 [{k:1,s:26,v:375},{k:3,s:145,v:376},{k:3,s:147,v:377},{k:2,s:6,v:240},{k:2,s:7,v:240},{k:2,s:9,v:240},{k:2,s:10,v:240},{k:2,s:12,v:240},{k:2,s:13,v:240},{k:2,s:16,v:240},{k:2,s:17,v:240},{k:2,s:19,v:240},{k:2,s:20,v:240},{k:2,s:21,v:240},{k:2,s:23,v:240},{k:2,s:24,v:240},{k:2,s:25,v:240},{k:2,s:27,v:240},{k:2,s:28,v:240},{k:2,s:31,v:240},{k:2,s:32,v:240},{k:2,s:34,v:240},{k:2,s:36,v:240},{k:2,s:37,v:240},{k:2,s:39,v:240},{k:2,s:40,v:240},{k:2,s:42,v:240},{k:2,s:45,v:240},{k:2,s:46,v:240},{k:2,s:47,v:240},{k:2,s:48,v:240},{k:2,s:78,v:240}],
 [{k:1,s:6,v:117},{k:1,s:7,v:1},{k:1,s:8,v:118},{k:1,s:15,v:119},{k:1,s:16,v:378},{k:1,s:35,v:120},{k:1,s:36,v:121},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:106,v:141},{k:3,s:107,v:142},{k:3,s:108,v:379},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:113,v:143},{k:3,s:114,v:144},{k:3,s:120,v:129},{k:3,s:127,v:130},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:135,v:145},{k:3,s:136,v:146},{k:3,s:137,v:147},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:150,v:148},{k:3,s:151,v:149},{k:3,s:153,v:274},{k:3,s:155,v:72},{k:3,s:158,v:75},{k:3,s:174,v:151},{k:3,s:175,v:85},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:188,v:132},{k:3,s:191,v:152},{k:3,s:192,v:153},{k:3,s:194,v:134},{k:3,s:195,v:135},{k:3,s:196,v:136},{k:3,s:197,v:137},{k:3,s:198,v:138},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:204,v:154},{k:3,s:206,v:155},{k:3,s:207,v:107},{k:3,s:225,v:156},{k:3,s:226,v:140}],
 [{k:1,s:26,v:375},{k:3,s:145,v:376},{k:3,s:147,v:380},{k:2,s:6,v:238},{k:2,s:7,v:238},{k:2,s:9,v:238},{k:2,s:10,v:238},{k:2,s:12,v:238},{k:2,s:13,v:238},{k:2,s:16,v:238},{k:2,s:17,v:238},{k:2,s:19,v:238},{k:2,s:20,v:238},{k:2,s:21,v:238},{k:2,s:23,v:238},{k:2,s:24,v:238},{k:2,s:25,v:238},{k:2,s:27,v:238},{k:2,s:28,v:238},{k:2,s:31,v:238},{k:2,s:32,v:238},{k:2,s:34,v:238},{k:2,s:36,v:238},{k:2,s:37,v:238},{k:2,s:39,v:238},{k:2,s:40,v:238},{k:2,s:42,v:238},{k:2,s:45,v:238},{k:2,s:46,v:238},{k:2,s:47,v:238},{k:2,s:48,v:238},{k:2,s:78,v:238}],
 [{k:2,s:0,v:216},{k:2,s:7,v:216},{k:2,s:15,v:216},{k:2,s:24,v:216},{k:2,s:30,v:216},{k:2,s:34,v:216},{k:2,s:37,v:216},{k:2,s:51,v:216},{k:2,s:52,v:216},{k:2,s:53,v:216},{k:2,s:54,v:216},{k:2,s:55,v:216},{k:2,s:56,v:216},{k:2,s:58,v:216},{k:2,s:59,v:216},{k:2,s:60,v:216},{k:2,s:61,v:216},{k:2,s:62,v:216},{k:2,s:63,v:216},{k:2,s:64,v:216},{k:2,s:65,v:216},{k:2,s:66,v:216},{k:2,s:68,v:216},{k:2,s:69,v:216},{k:2,s:70,v:216},{k:2,s:71,v:216},{k:2,s:72,v:216},{k:2,s:73,v:216},{k:2,s:74,v:216},{k:2,s:75,v:216},{k:2,s:79,v:216},{k:2,s:80,v:216},{k:2,s:81,v:216},{k:2,s:82,v:216},{k:2,s:83,v:216},{k:2,s:84,v:216},{k:2,s:85,v:216},{k:2,s:86,v:216},{k:2,s:87,v:216},{k:2,s:88,v:216},{k:2,s:89,v:216},{k:2,s:90,v:216},{k:2,s:91,v:216},{k:2,s:92,v:216},{k:2,s:93,v:216},{k:2,s:94,v:216},{k:2,s:95,v:216},{k:2,s:96,v:216},{k:2,s:97,v:216},{k:2,s:98,v:216},{k:2,s:100,v:216},{k:2,s:101,v:216},{k:2,s:102,v:216},{k:2,s:103,v:216},{k:2,s:104,v:216},{k:2,s:105,v:216}],
 [{k:1,s:15,v:381},{k:2,s:6,v:247},{k:2,s:7,v:247},{k:2,s:9,v:247},{k:2,s:10,v:247},{k:2,s:11,v:247},{k:2,s:12,v:247},{k:2,s:13,v:247},{k:2,s:14,v:247},{k:2,s:16,v:247},{k:2,s:17,v:247},{k:2,s:18,v:247},{k:2,s:19,v:247},{k:2,s:20,v:247},{k:2,s:21,v:247},{k:2,s:22,v:247},{k:2,s:23,v:247},{k:2,s:24,v:247},{k:2,s:25,v:247},{k:2,s:26,v:247},{k:2,s:27,v:247},{k:2,s:28,v:247},{k:2,s:29,v:247},{k:2,s:31,v:247},{k:2,s:32,v:247},{k:2,s:33,v:247},{k:2,s:34,v:247},{k:2,s:36,v:247},{k:2,s:37,v:247},{k:2,s:38,v:247},{k:2,s:39,v:247},{k:2,s:40,v:247},{k:2,s:41,v:247},{k:2,s:42,v:247},{k:2,s:43,v:247},{k:2,s:44,v:247},{k:2,s:45,v:247},{k:2,s:46,v:247},{k:2,s:47,v:247},{k:2,s:48,v:247},{k:2,s:49,v:247},{k:2,s:50,v:247},{k:2,s:78,v:247}],
 [{k:1,s:16,v:382}],
 [{k:1,s:15,v:383}],
 [{k:2,s:0,v:219},{k:2,s:7,v:219},{k:2,s:15,v:219},{k:2,s:24,v:219},{k:2,s:30,v:219},{k:2,s:34,v:219},{k:2,s:37,v:219},{k:2,s:51,v:219},{k:2,s:52,v:219},{k:2,s:53,v:219},{k:2,s:54,v:219},{k:2,s:55,v:219},{k:2,s:56,v:219},{k:2,s:57,v:219},{k:2,s:58,v:219},{k:2,s:59,v:219},{k:2,s:60,v:219},{k:2,s:61,v:219},{k:2,s:62,v:219},{k:2,s:63,v:219},{k:2,s:64,v:219},{k:2,s:65,v:219},{k:2,s:66,v:219},{k:2,s:68,v:219},{k:2,s:69,v:219},{k:2,s:70,v:219},{k:2,s:71,v:219},{k:2,s:72,v:219},{k:2,s:73,v:219},{k:2,s:74,v:219},{k:2,s:75,v:219},{k:2,s:79,v:219},{k:2,s:80,v:219},{k:2,s:81,v:219},{k:2,s:82,v:219},{k:2,s:83,v:219},{k:2,s:84,v:219},{k:2,s:85,v:219},{k:2,s:86,v:219},{k:2,s:87,v:219},{k:2,s:88,v:219},{k:2,s:89,v:219},{k:2,s:90,v:219},{k:2,s:91,v:219},{k:2,s:92,v:219},{k:2,s:93,v:219},{k:2,s:94,v:219},{k:2,s:95,v:219},{k:2,s:96,v:219},{k:2,s:97,v:219},{k:2,s:98,v:219},{k:2,s:100,v:219},{k:2,s:101,v:219},{k:2,s:102,v:219},{k:2,s:103,v:219},{k:2,s:104,v:219},{k:2,s:105,v:219}],
 [{k:1,s:57,v:292},{k:3,s:121,v:384},{k:2,s:0,v:218},{k:2,s:7,v:218},{k:2,s:15,v:218},{k:2,s:24,v:218},{k:2,s:30,v:218},{k:2,s:34,v:218},{k:2,s:37,v:218},{k:2,s:51,v:218},{k:2,s:52,v:218},{k:2,s:53,v:218},{k:2,s:54,v:218},{k:2,s:55,v:218},{k:2,s:56,v:218},{k:2,s:58,v:218},{k:2,s:59,v:218},{k:2,s:60,v:218},{k:2,s:61,v:218},{k:2,s:62,v:218},{k:2,s:63,v:218},{k:2,s:64,v:218},{k:2,s:65,v:218},{k:2,s:66,v:218},{k:2,s:68,v:218},{k:2,s:69,v:218},{k:2,s:70,v:218},{k:2,s:71,v:218},{k:2,s:72,v:218},{k:2,s:73,v:218},{k:2,s:74,v:218},{k:2,s:75,v:218},{k:2,s:79,v:218},{k:2,s:80,v:218},{k:2,s:81,v:218},{k:2,s:82,v:218},{k:2,s:83,v:218},{k:2,s:84,v:218},{k:2,s:85,v:218},{k:2,s:86,v:218},{k:2,s:87,v:218},{k:2,s:88,v:218},{k:2,s:89,v:218},{k:2,s:90,v:218},{k:2,s:91,v:218},{k:2,s:92,v:218},{k:2,s:93,v:218},{k:2,s:94,v:218},{k:2,s:95,v:218},{k:2,s:96,v:218},{k:2,s:97,v:218},{k:2,s:98,v:218},{k:2,s:100,v:218},{k:2,s:101,v:218},{k:2,s:102,v:218},{k:2,s:103,v:218},{k:2,s:104,v:218},{k:2,s:105,v:218}],
 [{k:1,s:16,v:385},{k:1,s:52,v:174},{k:1,s:55,v:175},{k:1,s:58,v:176},{k:1,s:61,v:177},{k:1,s:65,v:17},{k:1,s:69,v:178},{k:1,s:74,v:24},{k:1,s:79,v:179},{k:1,s:80,v:28},{k:1,s:89,v:37},{k:1,s:93,v:41},{k:3,s:112,v:55},{k:3,s:129,v:62},{k:3,s:157,v:74},{k:3,s:160,v:386},{k:3,s:161,v:387},{k:3,s:176,v:86},{k:3,s:192,v:216},{k:3,s:193,v:95},{k:3,s:201,v:103},{k:3,s:202,v:104},{k:3,s:203,v:105},{k:3,s:207,v:107},{k:3,s:223,v:388}],
 [{k:1,s:27,v:389}],
 [{k:1,s:74,v:24},{k:3,s:129,v:357},{k:3,s:130,v:390},{k:3,s:131,v:391},{k:3,s:192,v:182},{k:3,s:202,v:104},{k:3,s:207,v:107}],
 [{k:2,s:24,v:106},{k:2,s:30,v:106}],
 [{k:1,s:16,v:392}],
 [{k:2,s:9,v:37},{k:2,s:12,v:37},{k:2,s:13,v:37},{k:2,s:16,v:37},{k:2,s:19,v:37},{k:2,s:23,v:37},{k:2,s:24,v:37},{k:2,s:25,v:37},{k:2,s:26,v:37},{k:2,s:27,v:37},{k:2,s:28,v:37},{k:2,s:31,v:37},{k:2,s:32,v:37},{k:2,s:34,v:37},{k:2,s:39,v:37},{k:2,s:42,v:37},{k:2,s:45,v:37},{k:2,s:46,v:37},{k:2,s:47,v:37},{k:2,s:74,v:37},{k:2,s:78,v:37}],
 [{k:1,s:16,v:393}],
 [{k:2,s:16,v:311},{k:2,s:19,v:311},{k:2,s:23,v:311},{k:2,s:24,v:311},{k:2,s:27,v:311},{k:2,s:34,v:311}],
 [{k:1,s:30,v:267},{k:1,s:67,v:268},{k:1,s:76,v:269},{k:3,s:123,v:394},{k:3,s:177,v:395},{k:3,s:214,v:396}],
 [{k:1,s:26,v:296},{k:1,s:99,v:297},{k:3,s:221,v:397},{k:2,s:24,v:105},{k:2,s:30,v:105}],
 [{k:1,s:27,v:311}],
 [{k:1,s:26,v:296},{k:1,s:99,v:297},{k:3,s:221,v:398},{k:2,s:24,v:101},{k:2,s:30,v:101}],
 [{k:1,s:19,v:319},{k:1,s:24,v:399}],
 [{k:2,s:6,v:249},{k:2,s:7,v:249},{k:2,s:9,v:249},{k:2,s:10,v:249},{k:2,s:12,v:249},{k:2,s:13,v:249},{k:2,s:16,v:249},{k:2,s:17,v:249},{k:2,s:19,v:249},{k:2,s:20,v:249},{k:2,s:21,v:249},{k:2,s:23,v:249},{k:2,s:24,v:249},{k:2,s:25,v:249},{k:2,s:26,v:249},{k:2,s:27,v:249},{k:2,s:28,v:249},{k:2,s:31,v:249},{k:2,s:32,v:249},{k:2,s:34,v:249},{k:2,s:36,v:249},{k:2,s:37,v:249},{k:2,s:39,v:249},{k:2,s:40,v:249},{k:2,s:42,v:249},{k:2,s:45,v:249},{k:2,s:46,v:249},{k:2,s:47,v:249},{k:2,s:48,v:249},{k:2,s:78,v:249}],
 [{k:1,s:16,v:400},{k:1,s:19,v:366}],
 [{k:2,s:6,v:41},{k:2,s:7,v:41},{k:2,s:9,v:41},{k:2,s:10,v:41},{k:2,s:11,v:41},{k:2,s:12,v:41},{k:2,s:13,v:41},{k:2,s:14,v:41},{k:2,s:15,v:41},{k:2,s:16,v:41},{k:2,s:17,v:41},{k:2,s:18,v:41},{k:2,s:19,v:41},{k:2,s:20,v:41},{k:2,s:21,v:41},{k:2,s:22,v:41},{k:2,s:23,v:41},{k:2,s:24,v:41},{k:2,s:25,v:41},{k:2,s:26,v:41},{k:2,s:27,v:41},{k:2,s:28,v:41},{k:2,s:29,v:41},{k:2,s:30,v:41},{k:2,s:31,v:41},{k:2,s:32,v:41},{k:2,s:33,v:41},{k:2,s:34,v:41},{k:2,s:36,v:41},{k:2,s:37,v:41},{k:2,s:38,v:41},{k:2,s:39,v:41},{k:2,s:40,v:41},{k:2,s:41,v:41},{k:2,s:42,v:41},{k:2,s:43,v:41},{k:2,s:44,v:41},{k:2,s:45,v:41},{k:2,s:46,v:41},{k:2,s:47,v:41},{k:2,s:48,v:41},{k:2,s:49,v:41},{k:2,s:50,v:41},{k:2,s:74,v:41},{k:2,s:76,v:41},{k:2,s:78,v:41}],
 [{k:2,s:9,v:36},{k:2,s:12,v:36},{k:2,s:13,v:36},{k:2,s:16,v:36},{k:2,s:19,v:36},{k:2,s:23,v:36},{k:2,s:24,v:36},{k:2,s:25,v:36},{k:2,s:26,v:36},{k:2,s:27,v:36},{k:2,s:28,v:36},{k:2,s:31,v:36},{k:2,s:32,v:36},{k:2,s:34,v:36},{k:2,s:39,v:36},{k:2,s:42,v:36},{k:2,s:45,v:36},{k:2,s:46,v:36},{k:2,s:47,v:36},{k:2,s:74,v:36},{k:2,s:78,v:36}],
 [{k:1,s:27,v:401}],
 [{k:1,s:15,v:402},{k:2,s:6,v:246},{k:2,s:7,v:246},{k:2,s:9,v:246},{k:2,s:10,v:246},{k:2,s:11,v:246},{k:2,s:12,v:246},{k:2,s:13,v:246},{k:2,s:14,v:246},{k:2,s:16,v:246},{k:2,s:17,v:246},{k:2,s:18,v:246},{k:2,s:19,v:246},{k:2,s:20,v:246},{k:2,s:21,v:246},{k:2,s:22,v:246},{k:2,s:23,v:246},{k:2,s:24,v:246},{k:2,s:25,v:246},{k:2,s:26,v:246},{k:2,s:27,v:246},{k:2,s:28,v:246},{k:2,s:29,v:246},{k:2,s:31,v:246},{k:2,s:32,v:246},{k:2,s:33,v:246},{k:2,s:34,v:246},{k:2,s:36,v:246},{k:2,s:37,v:246},{k:2,s:38,v:246},{k:2,s:39,v:246},{k:2,s:40,v:246},{k:2,s:41,v:246},{k:2,s:42,v:246},{k:2,s:43,v:246},{k:2,s:44,v:246},{k:2,s:45,v:246},{k:2,s:46,v:246},{k:2,s:47,v:246},{k:2,s:48,v:246},{k:2,s:49,v:246},{k:2,s:50,v:246},{k:2,s:78,v:246}],
 [{k:1,s:27,v:403}],
 [{k:2,s:9,v:35},{k:2,s:12,v:35},{k:2,s:13,v:35},{k:2,s:16,v:35},{k:2,s:19,v:35},{k:2,s:23,v:35},{k:2,s:24,v:35},{k:2,s:25,v:35},{k:2,s:26,v:35},{k:2,s:27,v:35},{k:2,s:28,v:35},{k:2,s:31,v:35},{k:2,s:32,v:35},{k:2,s:34,v:35},{k:2,s:39,v:35},{k:2,s:42,v:35},{k:2,s:45,v:35},{k:2,s:46,v:35},{k:2,s:47,v:35},{k:2,s:74,v:35},{k:2,s:78,v:35}],
 [{k:2,s:24,v:102},{k:2,s:30,v:102}],
 [{k:1,s:27,v:404}],
 [{k:1,s:6,v:117},{k:1,s:7,v:1},{k:1,s:8,v:118},{k:1,s:15,v:119},{k:1,s:30,v:405},{k:1,s:35,v:120},{k:1,s:36,v:121},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:106,v:141},{k:3,s:107,v:142},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:111,v:406},{k:3,s:113,v:143},{k:3,s:114,v:144},{k:3,s:120,v:129},{k:3,s:127,v:130},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:135,v:145},{k:3,s:136,v:146},{k:3,s:137,v:147},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:150,v:148},{k:3,s:151,v:149},{k:3,s:153,v:407},{k:3,s:155,v:72},{k:3,s:158,v:75},{k:3,s:174,v:151},{k:3,s:175,v:85},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:188,v:132},{k:3,s:191,v:152},{k:3,s:192,v:153},{k:3,s:194,v:134},{k:3,s:195,v:135},{k:3,s:196,v:136},{k:3,s:197,v:137},{k:3,s:198,v:138},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:204,v:154},{k:3,s:206,v:155},{k:3,s:207,v:107},{k:3,s:225,v:156},{k:3,s:226,v:140},{k:3,s:230,v:408}],
 [{k:1,s:74,v:265},{k:3,s:227,v:409},{k:3,s:228,v:230}],
 [{k:2,s:0,v:90},{k:2,s:7,v:90},{k:2,s:15,v:90},{k:2,s:24,v:90},{k:2,s:30,v:90},{k:2,s:34,v:90},{k:2,s:37,v:90},{k:2,s:51,v:90},{k:2,s:52,v:90},{k:2,s:53,v:90},{k:2,s:54,v:90},{k:2,s:55,v:90},{k:2,s:58,v:90},{k:2,s:59,v:90},{k:2,s:60,v:90},{k:2,s:61,v:90},{k:2,s:62,v:90},{k:2,s:64,v:90},{k:2,s:65,v:90},{k:2,s:68,v:90},{k:2,s:69,v:90},{k:2,s:70,v:90},{k:2,s:71,v:90},{k:2,s:72,v:90},{k:2,s:73,v:90},{k:2,s:74,v:90},{k:2,s:75,v:90},{k:2,s:79,v:90},{k:2,s:80,v:90},{k:2,s:81,v:90},{k:2,s:82,v:90},{k:2,s:83,v:90},{k:2,s:84,v:90},{k:2,s:85,v:90},{k:2,s:86,v:90},{k:2,s:87,v:90},{k:2,s:88,v:90},{k:2,s:89,v:90},{k:2,s:90,v:90},{k:2,s:91,v:90},{k:2,s:92,v:90},{k:2,s:93,v:90},{k:2,s:94,v:90},{k:2,s:95,v:90},{k:2,s:96,v:90},{k:2,s:97,v:90},{k:2,s:98,v:90},{k:2,s:100,v:90},{k:2,s:101,v:90},{k:2,s:102,v:90},{k:2,s:103,v:90},{k:2,s:104,v:90},{k:2,s:105,v:90}],
 [{k:1,s:8,v:118},{k:1,s:15,v:119},{k:1,s:35,v:120},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:109,v:128},{k:3,s:110,v:54},{k:3,s:120,v:129},{k:3,s:127,v:130},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:155,v:131},{k:3,s:158,v:75},{k:3,s:175,v:85},{k:3,s:181,v:88},{k:3,s:188,v:132},{k:3,s:192,v:133},{k:3,s:194,v:134},{k:3,s:195,v:135},{k:3,s:196,v:136},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:207,v:107},{k:3,s:226,v:410},{k:2,s:6,v:226},{k:2,s:7,v:226},{k:2,s:9,v:226},{k:2,s:10,v:226},{k:2,s:12,v:226},{k:2,s:13,v:226},{k:2,s:16,v:226},{k:2,s:17,v:226},{k:2,s:19,v:226},{k:2,s:20,v:226},{k:2,s:21,v:226},{k:2,s:23,v:226},{k:2,s:24,v:226},{k:2,s:25,v:226},{k:2,s:26,v:226},{k:2,s:27,v:226},{k:2,s:28,v:226},{k:2,s:31,v:226},{k:2,s:32,v:226},{k:2,s:34,v:226},{k:2,s:36,v:226},{k:2,s:37,v:226},{k:2,s:39,v:226},{k:2,s:40,v:226},{k:2,s:42,v:226},{k:2,s:45,v:226},{k:2,s:46,v:226},{k:2,s:47,v:226},{k:2,s:48,v:226},{k:2,s:78,v:226}],
 [{k:1,s:6,v:117},{k:1,s:7,v:1},{k:1,s:8,v:118},{k:1,s:15,v:119},{k:1,s:27,v:411},{k:1,s:35,v:120},{k:1,s:36,v:121},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:106,v:141},{k:3,s:107,v:142},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:113,v:143},{k:3,s:114,v:144},{k:3,s:120,v:129},{k:3,s:127,v:130},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:135,v:145},{k:3,s:136,v:146},{k:3,s:137,v:147},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:150,v:148},{k:3,s:151,v:149},{k:3,s:153,v:312},{k:3,s:155,v:72},{k:3,s:158,v:75},{k:3,s:174,v:151},{k:3,s:175,v:85},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:188,v:132},{k:3,s:191,v:152},{k:3,s:192,v:153},{k:3,s:194,v:134},{k:3,s:195,v:135},{k:3,s:196,v:136},{k:3,s:197,v:137},{k:3,s:198,v:138},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:204,v:154},{k:3,s:206,v:155},{k:3,s:207,v:107},{k:3,s:225,v:156},{k:3,s:226,v:140}],
 [{k:1,s:16,v:412},{k:1,s:26,v:413}],
 [{k:1,s:6,v:117},{k:1,s:7,v:1},{k:1,s:8,v:118},{k:1,s:15,v:119},{k:1,s:35,v:120},{k:1,s:36,v:121},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:109,v:128},{k:3,s:110,v:54},{k:3,s:120,v:129},{k:3,s:127,v:130},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:155,v:131},{k:3,s:158,v:75},{k:3,s:175,v:85},{k:3,s:181,v:88},{k:3,s:188,v:132},{k:3,s:192,v:133},{k:3,s:194,v:134},{k:3,s:195,v:135},{k:3,s:196,v:136},{k:3,s:197,v:137},{k:3,s:198,v:138},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:207,v:107},{k:3,s:225,v:414},{k:3,s:226,v:140}],
 [{k:1,s:27,v:411}],
 [{k:1,s:16,v:415},{k:1,s:26,v:413}],
 [{k:1,s:10,v:251},{k:1,s:17,v:252},{k:1,s:21,v:253},{k:2,s:6,v:284},{k:2,s:9,v:284},{k:2,s:12,v:284},{k:2,s:13,v:284},{k:2,s:16,v:284},{k:2,s:19,v:284},{k:2,s:23,v:284},{k:2,s:24,v:284},{k:2,s:25,v:284},{k:2,s:27,v:284},{k:2,s:28,v:284},{k:2,s:31,v:284},{k:2,s:32,v:284},{k:2,s:34,v:284},{k:2,s:36,v:284},{k:2,s:39,v:284},{k:2,s:40,v:284},{k:2,s:42,v:284},{k:2,s:45,v:284},{k:2,s:46,v:284},{k:2,s:47,v:284},{k:2,s:48,v:284},{k:2,s:78,v:284}],
 [{k:1,s:10,v:251},{k:1,s:17,v:252},{k:1,s:21,v:253},{k:2,s:6,v:283},{k:2,s:9,v:283},{k:2,s:12,v:283},{k:2,s:13,v:283},{k:2,s:16,v:283},{k:2,s:19,v:283},{k:2,s:23,v:283},{k:2,s:24,v:283},{k:2,s:25,v:283},{k:2,s:27,v:283},{k:2,s:28,v:283},{k:2,s:31,v:283},{k:2,s:32,v:283},{k:2,s:34,v:283},{k:2,s:36,v:283},{k:2,s:39,v:283},{k:2,s:40,v:283},{k:2,s:42,v:283},{k:2,s:45,v:283},{k:2,s:46,v:283},{k:2,s:47,v:283},{k:2,s:48,v:283},{k:2,s:78,v:283}],
 [{k:1,s:9,v:246},{k:1,s:45,v:247},{k:2,s:12,v:298},{k:2,s:13,v:298},{k:2,s:16,v:298},{k:2,s:19,v:298},{k:2,s:23,v:298},{k:2,s:24,v:298},{k:2,s:25,v:298},{k:2,s:27,v:298},{k:2,s:28,v:298},{k:2,s:31,v:298},{k:2,s:32,v:298},{k:2,s:34,v:298}],
 [{k:1,s:31,v:250},{k:2,s:13,v:304},{k:2,s:16,v:304},{k:2,s:19,v:304},{k:2,s:23,v:304},{k:2,s:24,v:304},{k:2,s:25,v:304},{k:2,s:27,v:304},{k:2,s:32,v:304},{k:2,s:34,v:304}],
 [{k:1,s:23,v:416}],
 [{k:1,s:13,v:243},{k:2,s:16,v:306},{k:2,s:19,v:306},{k:2,s:23,v:306},{k:2,s:24,v:306},{k:2,s:25,v:306},{k:2,s:27,v:306},{k:2,s:32,v:306},{k:2,s:34,v:306}],
 [{k:1,s:39,v:254},{k:1,s:42,v:255},{k:1,s:46,v:256},{k:1,s:47,v:257},{k:1,s:78,v:258},{k:2,s:9,v:296},{k:2,s:12,v:296},{k:2,s:13,v:296},{k:2,s:16,v:296},{k:2,s:19,v:296},{k:2,s:23,v:296},{k:2,s:24,v:296},{k:2,s:25,v:296},{k:2,s:27,v:296},{k:2,s:28,v:296},{k:2,s:31,v:296},{k:2,s:32,v:296},{k:2,s:34,v:296},{k:2,s:45,v:296}],
 [{k:1,s:39,v:254},{k:1,s:42,v:255},{k:1,s:46,v:256},{k:1,s:47,v:257},{k:1,s:78,v:258},{k:2,s:9,v:295},{k:2,s:12,v:295},{k:2,s:13,v:295},{k:2,s:16,v:295},{k:2,s:19,v:295},{k:2,s:23,v:295},{k:2,s:24,v:295},{k:2,s:25,v:295},{k:2,s:27,v:295},{k:2,s:28,v:295},{k:2,s:31,v:295},{k:2,s:32,v:295},{k:2,s:34,v:295},{k:2,s:45,v:295}],
 [{k:1,s:12,v:242},{k:2,s:13,v:300},{k:2,s:16,v:300},{k:2,s:19,v:300},{k:2,s:23,v:300},{k:2,s:24,v:300},{k:2,s:25,v:300},{k:2,s:27,v:300},{k:2,s:28,v:300},{k:2,s:31,v:300},{k:2,s:32,v:300},{k:2,s:34,v:300}],
 [{k:1,s:28,v:248},{k:2,s:13,v:302},{k:2,s:16,v:302},{k:2,s:19,v:302},{k:2,s:23,v:302},{k:2,s:24,v:302},{k:2,s:25,v:302},{k:2,s:27,v:302},{k:2,s:31,v:302},{k:2,s:32,v:302},{k:2,s:34,v:302}],
 [{k:2,s:6,v:281},{k:2,s:9,v:281},{k:2,s:10,v:281},{k:2,s:12,v:281},{k:2,s:13,v:281},{k:2,s:16,v:281},{k:2,s:17,v:281},{k:2,s:19,v:281},{k:2,s:21,v:281},{k:2,s:23,v:281},{k:2,s:24,v:281},{k:2,s:25,v:281},{k:2,s:27,v:281},{k:2,s:28,v:281},{k:2,s:31,v:281},{k:2,s:32,v:281},{k:2,s:34,v:281},{k:2,s:36,v:281},{k:2,s:39,v:281},{k:2,s:40,v:281},{k:2,s:42,v:281},{k:2,s:45,v:281},{k:2,s:46,v:281},{k:2,s:47,v:281},{k:2,s:48,v:281},{k:2,s:78,v:281}],
 [{k:2,s:6,v:279},{k:2,s:9,v:279},{k:2,s:10,v:279},{k:2,s:12,v:279},{k:2,s:13,v:279},{k:2,s:16,v:279},{k:2,s:17,v:279},{k:2,s:19,v:279},{k:2,s:21,v:279},{k:2,s:23,v:279},{k:2,s:24,v:279},{k:2,s:25,v:279},{k:2,s:27,v:279},{k:2,s:28,v:279},{k:2,s:31,v:279},{k:2,s:32,v:279},{k:2,s:34,v:279},{k:2,s:36,v:279},{k:2,s:39,v:279},{k:2,s:40,v:279},{k:2,s:42,v:279},{k:2,s:45,v:279},{k:2,s:46,v:279},{k:2,s:47,v:279},{k:2,s:48,v:279},{k:2,s:78,v:279}],
 [{k:2,s:6,v:280},{k:2,s:9,v:280},{k:2,s:10,v:280},{k:2,s:12,v:280},{k:2,s:13,v:280},{k:2,s:16,v:280},{k:2,s:17,v:280},{k:2,s:19,v:280},{k:2,s:21,v:280},{k:2,s:23,v:280},{k:2,s:24,v:280},{k:2,s:25,v:280},{k:2,s:27,v:280},{k:2,s:28,v:280},{k:2,s:31,v:280},{k:2,s:32,v:280},{k:2,s:34,v:280},{k:2,s:36,v:280},{k:2,s:39,v:280},{k:2,s:40,v:280},{k:2,s:42,v:280},{k:2,s:45,v:280},{k:2,s:46,v:280},{k:2,s:47,v:280},{k:2,s:48,v:280},{k:2,s:78,v:280}],
 [{k:1,s:40,v:259},{k:1,s:48,v:260},{k:2,s:9,v:289},{k:2,s:12,v:289},{k:2,s:13,v:289},{k:2,s:16,v:289},{k:2,s:19,v:289},{k:2,s:23,v:289},{k:2,s:24,v:289},{k:2,s:25,v:289},{k:2,s:27,v:289},{k:2,s:28,v:289},{k:2,s:31,v:289},{k:2,s:32,v:289},{k:2,s:34,v:289},{k:2,s:39,v:289},{k:2,s:42,v:289},{k:2,s:45,v:289},{k:2,s:46,v:289},{k:2,s:47,v:289},{k:2,s:78,v:289}],
 [{k:1,s:40,v:259},{k:1,s:48,v:260},{k:2,s:9,v:291},{k:2,s:12,v:291},{k:2,s:13,v:291},{k:2,s:16,v:291},{k:2,s:19,v:291},{k:2,s:23,v:291},{k:2,s:24,v:291},{k:2,s:25,v:291},{k:2,s:27,v:291},{k:2,s:28,v:291},{k:2,s:31,v:291},{k:2,s:32,v:291},{k:2,s:34,v:291},{k:2,s:39,v:291},{k:2,s:42,v:291},{k:2,s:45,v:291},{k:2,s:46,v:291},{k:2,s:47,v:291},{k:2,s:78,v:291}],
 [{k:1,s:40,v:259},{k:1,s:48,v:260},{k:2,s:9,v:290},{k:2,s:12,v:290},{k:2,s:13,v:290},{k:2,s:16,v:290},{k:2,s:19,v:290},{k:2,s:23,v:290},{k:2,s:24,v:290},{k:2,s:25,v:290},{k:2,s:27,v:290},{k:2,s:28,v:290},{k:2,s:31,v:290},{k:2,s:32,v:290},{k:2,s:34,v:290},{k:2,s:39,v:290},{k:2,s:42,v:290},{k:2,s:45,v:290},{k:2,s:46,v:290},{k:2,s:47,v:290},{k:2,s:78,v:290}],
 [{k:1,s:40,v:259},{k:1,s:48,v:260},{k:2,s:9,v:292},{k:2,s:12,v:292},{k:2,s:13,v:292},{k:2,s:16,v:292},{k:2,s:19,v:292},{k:2,s:23,v:292},{k:2,s:24,v:292},{k:2,s:25,v:292},{k:2,s:27,v:292},{k:2,s:28,v:292},{k:2,s:31,v:292},{k:2,s:32,v:292},{k:2,s:34,v:292},{k:2,s:39,v:292},{k:2,s:42,v:292},{k:2,s:45,v:292},{k:2,s:46,v:292},{k:2,s:47,v:292},{k:2,s:78,v:292}],
 [{k:1,s:26,v:225}],
 [{k:2,s:9,v:293},{k:2,s:12,v:293},{k:2,s:13,v:293},{k:2,s:16,v:293},{k:2,s:19,v:293},{k:2,s:23,v:293},{k:2,s:24,v:293},{k:2,s:25,v:293},{k:2,s:27,v:293},{k:2,s:28,v:293},{k:2,s:31,v:293},{k:2,s:32,v:293},{k:2,s:34,v:293},{k:2,s:39,v:293},{k:2,s:42,v:293},{k:2,s:45,v:293},{k:2,s:46,v:293},{k:2,s:47,v:293},{k:2,s:78,v:293}],
 [{k:1,s:6,v:240},{k:1,s:36,v:241},{k:2,s:9,v:286},{k:2,s:12,v:286},{k:2,s:13,v:286},{k:2,s:16,v:286},{k:2,s:19,v:286},{k:2,s:23,v:286},{k:2,s:24,v:286},{k:2,s:25,v:286},{k:2,s:27,v:286},{k:2,s:28,v:286},{k:2,s:31,v:286},{k:2,s:32,v:286},{k:2,s:34,v:286},{k:2,s:39,v:286},{k:2,s:40,v:286},{k:2,s:42,v:286},{k:2,s:45,v:286},{k:2,s:46,v:286},{k:2,s:47,v:286},{k:2,s:48,v:286},{k:2,s:78,v:286}],
 [{k:1,s:6,v:240},{k:1,s:36,v:241},{k:2,s:9,v:287},{k:2,s:12,v:287},{k:2,s:13,v:287},{k:2,s:16,v:287},{k:2,s:19,v:287},{k:2,s:23,v:287},{k:2,s:24,v:287},{k:2,s:25,v:287},{k:2,s:27,v:287},{k:2,s:28,v:287},{k:2,s:31,v:287},{k:2,s:32,v:287},{k:2,s:34,v:287},{k:2,s:39,v:287},{k:2,s:40,v:287},{k:2,s:42,v:287},{k:2,s:45,v:287},{k:2,s:46,v:287},{k:2,s:47,v:287},{k:2,s:48,v:287},{k:2,s:78,v:287}],
 [{k:1,s:19,v:319},{k:2,s:24,v:146}],
 [{k:2,s:0,v:82},{k:2,s:7,v:82},{k:2,s:15,v:82},{k:2,s:24,v:82},{k:2,s:30,v:82},{k:2,s:37,v:82},{k:2,s:51,v:82},{k:2,s:52,v:82},{k:2,s:53,v:82},{k:2,s:54,v:82},{k:2,s:55,v:82},{k:2,s:58,v:82},{k:2,s:59,v:82},{k:2,s:60,v:82},{k:2,s:61,v:82},{k:2,s:62,v:82},{k:2,s:64,v:82},{k:2,s:65,v:82},{k:2,s:68,v:82},{k:2,s:69,v:82},{k:2,s:70,v:82},{k:2,s:71,v:82},{k:2,s:72,v:82},{k:2,s:73,v:82},{k:2,s:74,v:82},{k:2,s:75,v:82},{k:2,s:79,v:82},{k:2,s:80,v:82},{k:2,s:81,v:82},{k:2,s:82,v:82},{k:2,s:83,v:82},{k:2,s:84,v:82},{k:2,s:85,v:82},{k:2,s:86,v:82},{k:2,s:87,v:82},{k:2,s:88,v:82},{k:2,s:89,v:82},{k:2,s:90,v:82},{k:2,s:91,v:82},{k:2,s:92,v:82},{k:2,s:93,v:82},{k:2,s:94,v:82},{k:2,s:95,v:82},{k:2,s:96,v:82},{k:2,s:97,v:82},{k:2,s:98,v:82},{k:2,s:100,v:82},{k:2,s:101,v:82},{k:2,s:102,v:82},{k:2,s:103,v:82},{k:2,s:104,v:82},{k:2,s:105,v:82}],
 [{k:2,s:34,v:83},{k:2,s:51,v:83},{k:2,s:52,v:83},{k:2,s:55,v:83},{k:2,s:58,v:83},{k:2,s:61,v:83},{k:2,s:65,v:83},{k:2,s:68,v:83},{k:2,s:69,v:83},{k:2,s:74,v:83},{k:2,s:79,v:83},{k:2,s:80,v:83},{k:2,s:81,v:83},{k:2,s:85,v:83},{k:2,s:86,v:83},{k:2,s:87,v:83},{k:2,s:89,v:83},{k:2,s:92,v:83},{k:2,s:93,v:83},{k:2,s:97,v:83},{k:2,s:100,v:83},{k:2,s:102,v:83},{k:2,s:103,v:83}],
 [{k:1,s:34,v:417},{k:1,s:51,v:6},{k:1,s:52,v:174},{k:1,s:55,v:175},{k:1,s:58,v:176},{k:1,s:61,v:177},{k:1,s:65,v:17},{k:1,s:68,v:18},{k:1,s:69,v:178},{k:1,s:74,v:24},{k:1,s:79,v:179},{k:1,s:80,v:28},{k:1,s:81,v:29},{k:1,s:85,v:33},{k:1,s:86,v:34},{k:1,s:87,v:35},{k:1,s:89,v:37},{k:1,s:92,v:40},{k:1,s:93,v:41},{k:1,s:97,v:45},{k:1,s:100,v:47},{k:1,s:102,v:49},{k:1,s:103,v:50},{k:3,s:112,v:55},{k:3,s:124,v:418},{k:3,s:128,v:352},{k:3,s:129,v:62},{k:3,s:140,v:353},{k:3,s:141,v:354},{k:3,s:156,v:73},{k:3,s:157,v:74},{k:3,s:176,v:86},{k:3,s:185,v:89},{k:3,s:187,v:90},{k:3,s:189,v:92},{k:3,s:190,v:355},{k:3,s:192,v:216},{k:3,s:193,v:95},{k:3,s:201,v:103},{k:3,s:202,v:104},{k:3,s:203,v:105},{k:3,s:207,v:356},{k:3,s:223,v:114}],
 [{k:2,s:34,v:85},{k:2,s:51,v:85},{k:2,s:52,v:85},{k:2,s:55,v:85},{k:2,s:58,v:85},{k:2,s:61,v:85},{k:2,s:65,v:85},{k:2,s:68,v:85},{k:2,s:69,v:85},{k:2,s:74,v:85},{k:2,s:79,v:85},{k:2,s:80,v:85},{k:2,s:81,v:85},{k:2,s:85,v:85},{k:2,s:86,v:85},{k:2,s:87,v:85},{k:2,s:89,v:85},{k:2,s:92,v:85},{k:2,s:93,v:85},{k:2,s:97,v:85},{k:2,s:100,v:85},{k:2,s:102,v:85},{k:2,s:103,v:85}],
 [{k:2,s:34,v:86},{k:2,s:51,v:86},{k:2,s:52,v:86},{k:2,s:55,v:86},{k:2,s:58,v:86},{k:2,s:61,v:86},{k:2,s:65,v:86},{k:2,s:68,v:86},{k:2,s:69,v:86},{k:2,s:74,v:86},{k:2,s:79,v:86},{k:2,s:80,v:86},{k:2,s:81,v:86},{k:2,s:85,v:86},{k:2,s:86,v:86},{k:2,s:87,v:86},{k:2,s:89,v:86},{k:2,s:92,v:86},{k:2,s:93,v:86},{k:2,s:97,v:86},{k:2,s:100,v:86},{k:2,s:102,v:86},{k:2,s:103,v:86}],
 [{k:1,s:30,v:419},{k:1,s:99,v:297},{k:3,s:139,v:420},{k:3,s:221,v:421}],
 [{k:1,s:51,v:6},{k:1,s:52,v:174},{k:1,s:55,v:175},{k:1,s:58,v:176},{k:1,s:61,v:177},{k:1,s:65,v:17},{k:1,s:68,v:18},{k:1,s:69,v:178},{k:1,s:74,v:24},{k:1,s:79,v:179},{k:1,s:80,v:28},{k:1,s:81,v:29},{k:1,s:85,v:33},{k:1,s:86,v:34},{k:1,s:87,v:35},{k:1,s:89,v:37},{k:1,s:92,v:40},{k:1,s:93,v:41},{k:1,s:97,v:45},{k:1,s:100,v:47},{k:1,s:102,v:214},{k:1,s:103,v:50},{k:3,s:112,v:55},{k:3,s:129,v:62},{k:3,s:141,v:422},{k:3,s:157,v:74},{k:3,s:176,v:86},{k:3,s:189,v:215},{k:3,s:192,v:216},{k:3,s:193,v:95},{k:3,s:201,v:103},{k:3,s:202,v:104},{k:3,s:203,v:105},{k:3,s:207,v:356},{k:3,s:223,v:217}],
 [{k:1,s:15,v:423},{k:2,s:20,v:38},{k:2,s:26,v:38},{k:2,s:74,v:38}],
 [{k:2,s:19,v:33},{k:2,s:24,v:33},{k:2,s:30,v:33},{k:2,s:76,v:33}],
 [{k:2,s:30,v:77},{k:2,s:76,v:77}],
 [{k:2,s:19,v:34},{k:2,s:30,v:34}],
 [{k:2,s:19,v:79},{k:2,s:30,v:79}],
 [{k:1,s:19,v:424},{k:2,s:30,v:78}],
 [{k:2,s:0,v:75},{k:2,s:7,v:75},{k:2,s:15,v:75},{k:2,s:24,v:75},{k:2,s:30,v:75},{k:2,s:37,v:75},{k:2,s:51,v:75},{k:2,s:52,v:75},{k:2,s:53,v:75},{k:2,s:54,v:75},{k:2,s:55,v:75},{k:2,s:58,v:75},{k:2,s:59,v:75},{k:2,s:60,v:75},{k:2,s:61,v:75},{k:2,s:62,v:75},{k:2,s:64,v:75},{k:2,s:65,v:75},{k:2,s:68,v:75},{k:2,s:69,v:75},{k:2,s:70,v:75},{k:2,s:71,v:75},{k:2,s:72,v:75},{k:2,s:73,v:75},{k:2,s:74,v:75},{k:2,s:75,v:75},{k:2,s:79,v:75},{k:2,s:80,v:75},{k:2,s:81,v:75},{k:2,s:82,v:75},{k:2,s:83,v:75},{k:2,s:84,v:75},{k:2,s:85,v:75},{k:2,s:86,v:75},{k:2,s:87,v:75},{k:2,s:88,v:75},{k:2,s:89,v:75},{k:2,s:90,v:75},{k:2,s:91,v:75},{k:2,s:92,v:75},{k:2,s:93,v:75},{k:2,s:94,v:75},{k:2,s:95,v:75},{k:2,s:96,v:75},{k:2,s:97,v:75},{k:2,s:98,v:75},{k:2,s:100,v:75},{k:2,s:101,v:75},{k:2,s:102,v:75},{k:2,s:103,v:75},{k:2,s:104,v:75},{k:2,s:105,v:75}],
 [{k:2,s:0,v:74},{k:2,s:7,v:74},{k:2,s:15,v:74},{k:2,s:24,v:74},{k:2,s:30,v:74},{k:2,s:37,v:74},{k:2,s:51,v:74},{k:2,s:52,v:74},{k:2,s:53,v:74},{k:2,s:54,v:74},{k:2,s:55,v:74},{k:2,s:58,v:74},{k:2,s:59,v:74},{k:2,s:60,v:74},{k:2,s:61,v:74},{k:2,s:62,v:74},{k:2,s:64,v:74},{k:2,s:65,v:74},{k:2,s:68,v:74},{k:2,s:69,v:74},{k:2,s:70,v:74},{k:2,s:71,v:74},{k:2,s:72,v:74},{k:2,s:73,v:74},{k:2,s:74,v:74},{k:2,s:75,v:74},{k:2,s:79,v:74},{k:2,s:80,v:74},{k:2,s:81,v:74},{k:2,s:82,v:74},{k:2,s:83,v:74},{k:2,s:84,v:74},{k:2,s:85,v:74},{k:2,s:86,v:74},{k:2,s:87,v:74},{k:2,s:88,v:74},{k:2,s:89,v:74},{k:2,s:90,v:74},{k:2,s:91,v:74},{k:2,s:92,v:74},{k:2,s:93,v:74},{k:2,s:94,v:74},{k:2,s:95,v:74},{k:2,s:96,v:74},{k:2,s:97,v:74},{k:2,s:98,v:74},{k:2,s:100,v:74},{k:2,s:101,v:74},{k:2,s:102,v:74},{k:2,s:103,v:74},{k:2,s:104,v:74},{k:2,s:105,v:74}],
 [{k:1,s:30,v:267},{k:3,s:123,v:425}],
 [{k:2,s:6,v:234},{k:2,s:7,v:234},{k:2,s:9,v:234},{k:2,s:10,v:234},{k:2,s:12,v:234},{k:2,s:13,v:234},{k:2,s:16,v:234},{k:2,s:17,v:234},{k:2,s:19,v:234},{k:2,s:20,v:234},{k:2,s:21,v:234},{k:2,s:23,v:234},{k:2,s:24,v:234},{k:2,s:25,v:234},{k:2,s:26,v:234},{k:2,s:27,v:234},{k:2,s:28,v:234},{k:2,s:31,v:234},{k:2,s:32,v:234},{k:2,s:34,v:234},{k:2,s:36,v:234},{k:2,s:37,v:234},{k:2,s:39,v:234},{k:2,s:40,v:234},{k:2,s:42,v:234},{k:2,s:45,v:234},{k:2,s:46,v:234},{k:2,s:47,v:234},{k:2,s:48,v:234},{k:2,s:78,v:234}],
 [{k:1,s:6,v:117},{k:1,s:7,v:1},{k:1,s:8,v:118},{k:1,s:15,v:119},{k:1,s:35,v:120},{k:1,s:36,v:121},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:106,v:141},{k:3,s:107,v:142},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:113,v:143},{k:3,s:114,v:144},{k:3,s:120,v:129},{k:3,s:127,v:130},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:135,v:145},{k:3,s:136,v:146},{k:3,s:137,v:147},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:150,v:148},{k:3,s:151,v:149},{k:3,s:153,v:426},{k:3,s:155,v:72},{k:3,s:158,v:75},{k:3,s:174,v:151},{k:3,s:175,v:85},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:188,v:132},{k:3,s:191,v:152},{k:3,s:192,v:153},{k:3,s:194,v:134},{k:3,s:195,v:135},{k:3,s:196,v:136},{k:3,s:197,v:137},{k:3,s:198,v:138},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:204,v:154},{k:3,s:206,v:155},{k:3,s:207,v:107},{k:3,s:225,v:156},{k:3,s:226,v:140}],
 [{k:1,s:6,v:117},{k:1,s:7,v:1},{k:1,s:8,v:118},{k:1,s:15,v:119},{k:1,s:35,v:120},{k:1,s:36,v:121},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:106,v:141},{k:3,s:107,v:142},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:113,v:143},{k:3,s:114,v:144},{k:3,s:120,v:129},{k:3,s:127,v:130},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:135,v:145},{k:3,s:136,v:146},{k:3,s:137,v:147},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:150,v:148},{k:3,s:151,v:149},{k:3,s:153,v:427},{k:3,s:155,v:72},{k:3,s:158,v:75},{k:3,s:174,v:151},{k:3,s:175,v:85},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:188,v:132},{k:3,s:191,v:152},{k:3,s:192,v:153},{k:3,s:194,v:134},{k:3,s:195,v:135},{k:3,s:196,v:136},{k:3,s:197,v:137},{k:3,s:198,v:138},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:204,v:154},{k:3,s:206,v:155},{k:3,s:207,v:107},{k:3,s:225,v:156},{k:3,s:226,v:140}],
 [{k:1,s:7,v:1},{k:1,s:15,v:2},{k:1,s:16,v:428},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:113,v:56},{k:3,s:127,v:60},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:155,v:72},{k:3,s:158,v:75},{k:3,s:164,v:429},{k:3,s:175,v:85},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:188,v:91},{k:3,s:192,v:153},{k:3,s:194,v:96},{k:3,s:195,v:97},{k:3,s:196,v:98},{k:3,s:197,v:99},{k:3,s:198,v:100},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:207,v:107},{k:3,s:210,v:279},{k:3,s:211,v:430}],
 [{k:1,s:24,v:431}],
 [{k:1,s:6,v:117},{k:1,s:7,v:1},{k:1,s:8,v:118},{k:1,s:15,v:119},{k:1,s:24,v:432},{k:1,s:35,v:120},{k:1,s:36,v:121},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:106,v:141},{k:3,s:107,v:142},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:113,v:143},{k:3,s:114,v:144},{k:3,s:120,v:129},{k:3,s:127,v:130},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:135,v:145},{k:3,s:136,v:146},{k:3,s:137,v:147},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:150,v:148},{k:3,s:151,v:149},{k:3,s:153,v:433},{k:3,s:155,v:72},{k:3,s:158,v:75},{k:3,s:174,v:151},{k:3,s:175,v:85},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:188,v:132},{k:3,s:191,v:152},{k:3,s:192,v:153},{k:3,s:194,v:134},{k:3,s:195,v:135},{k:3,s:196,v:136},{k:3,s:197,v:137},{k:3,s:198,v:138},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:204,v:154},{k:3,s:206,v:155},{k:3,s:207,v:107},{k:3,s:225,v:156},{k:3,s:226,v:140}],
 [{k:1,s:7,v:1},{k:1,s:15,v:2},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:113,v:56},{k:3,s:127,v:60},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:155,v:72},{k:3,s:158,v:75},{k:3,s:175,v:85},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:188,v:91},{k:3,s:192,v:153},{k:3,s:194,v:96},{k:3,s:195,v:97},{k:3,s:196,v:98},{k:3,s:197,v:99},{k:3,s:198,v:100},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:207,v:107},{k:3,s:210,v:434}],
 [{k:1,s:7,v:1},{k:1,s:15,v:2},{k:1,s:24,v:3},{k:1,s:30,v:4},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:54,v:9},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:62,v:15},{k:1,s:64,v:16},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:72,v:435},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:75,v:436},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:88,v:36},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:96,v:44},{k:1,s:98,v:46},{k:1,s:101,v:48},{k:1,s:104,v:51},{k:1,s:105,v:437},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:113,v:56},{k:3,s:116,v:57},{k:3,s:119,v:58},{k:3,s:127,v:60},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:142,v:66},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:148,v:69},{k:3,s:149,v:70},{k:3,s:154,v:71},{k:3,s:155,v:72},{k:3,s:158,v:75},{k:3,s:162,v:76},{k:3,s:163,v:438},{k:3,s:169,v:81},{k:3,s:170,v:439},{k:3,s:171,v:82},{k:3,s:175,v:85},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:188,v:91},{k:3,s:192,v:153},{k:3,s:194,v:96},{k:3,s:195,v:97},{k:3,s:196,v:98},{k:3,s:197,v:99},{k:3,s:198,v:100},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:205,v:106},{k:3,s:207,v:107},{k:3,s:209,v:440},{k:3,s:210,v:110},{k:3,s:212,v:441},{k:3,s:213,v:442},{k:3,s:220,v:112},{k:3,s:222,v:113},{k:3,s:232,v:116},{k:3,s:233,v:443}],
 [{k:1,s:24,v:444}],
 [{k:1,s:27,v:445}],
 [{k:1,s:6,v:117},{k:1,s:7,v:1},{k:1,s:8,v:118},{k:1,s:15,v:119},{k:1,s:27,v:411},{k:1,s:35,v:120},{k:1,s:36,v:121},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:106,v:141},{k:3,s:107,v:142},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:113,v:143},{k:3,s:114,v:144},{k:3,s:120,v:129},{k:3,s:127,v:130},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:135,v:145},{k:3,s:136,v:146},{k:3,s:137,v:147},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:150,v:148},{k:3,s:151,v:149},{k:3,s:153,v:374},{k:3,s:155,v:72},{k:3,s:158,v:75},{k:3,s:174,v:151},{k:3,s:175,v:85},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:188,v:132},{k:3,s:191,v:152},{k:3,s:192,v:153},{k:3,s:194,v:134},{k:3,s:195,v:135},{k:3,s:196,v:136},{k:3,s:197,v:137},{k:3,s:198,v:138},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:204,v:154},{k:3,s:206,v:155},{k:3,s:207,v:107},{k:3,s:225,v:156},{k:3,s:226,v:140}],
 [{k:2,s:6,v:242},{k:2,s:7,v:242},{k:2,s:9,v:242},{k:2,s:10,v:242},{k:2,s:12,v:242},{k:2,s:13,v:242},{k:2,s:16,v:242},{k:2,s:17,v:242},{k:2,s:19,v:242},{k:2,s:20,v:242},{k:2,s:21,v:242},{k:2,s:23,v:242},{k:2,s:24,v:242},{k:2,s:25,v:242},{k:2,s:26,v:242},{k:2,s:27,v:242},{k:2,s:28,v:242},{k:2,s:31,v:242},{k:2,s:32,v:242},{k:2,s:34,v:242},{k:2,s:36,v:242},{k:2,s:37,v:242},{k:2,s:39,v:242},{k:2,s:40,v:242},{k:2,s:42,v:242},{k:2,s:45,v:242},{k:2,s:46,v:242},{k:2,s:47,v:242},{k:2,s:48,v:242},{k:2,s:78,v:242}],
 [{k:1,s:26,v:413},{k:2,s:6,v:239},{k:2,s:7,v:239},{k:2,s:9,v:239},{k:2,s:10,v:239},{k:2,s:12,v:239},{k:2,s:13,v:239},{k:2,s:16,v:239},{k:2,s:17,v:239},{k:2,s:19,v:239},{k:2,s:20,v:239},{k:2,s:21,v:239},{k:2,s:23,v:239},{k:2,s:24,v:239},{k:2,s:25,v:239},{k:2,s:27,v:239},{k:2,s:28,v:239},{k:2,s:31,v:239},{k:2,s:32,v:239},{k:2,s:34,v:239},{k:2,s:36,v:239},{k:2,s:37,v:239},{k:2,s:39,v:239},{k:2,s:40,v:239},{k:2,s:42,v:239},{k:2,s:45,v:239},{k:2,s:46,v:239},{k:2,s:47,v:239},{k:2,s:48,v:239},{k:2,s:78,v:239}],
 [{k:2,s:6,v:232},{k:2,s:7,v:232},{k:2,s:9,v:232},{k:2,s:10,v:232},{k:2,s:12,v:232},{k:2,s:13,v:232},{k:2,s:16,v:232},{k:2,s:17,v:232},{k:2,s:19,v:232},{k:2,s:20,v:232},{k:2,s:21,v:232},{k:2,s:23,v:232},{k:2,s:24,v:232},{k:2,s:25,v:232},{k:2,s:26,v:232},{k:2,s:27,v:232},{k:2,s:28,v:232},{k:2,s:31,v:232},{k:2,s:32,v:232},{k:2,s:34,v:232},{k:2,s:36,v:232},{k:2,s:37,v:232},{k:2,s:39,v:232},{k:2,s:40,v:232},{k:2,s:42,v:232},{k:2,s:45,v:232},{k:2,s:46,v:232},{k:2,s:47,v:232},{k:2,s:48,v:232},{k:2,s:78,v:232}],
 [{k:1,s:16,v:446},{k:1,s:19,v:366}],
 [{k:1,s:26,v:413},{k:2,s:6,v:237},{k:2,s:7,v:237},{k:2,s:9,v:237},{k:2,s:10,v:237},{k:2,s:12,v:237},{k:2,s:13,v:237},{k:2,s:16,v:237},{k:2,s:17,v:237},{k:2,s:19,v:237},{k:2,s:20,v:237},{k:2,s:21,v:237},{k:2,s:23,v:237},{k:2,s:24,v:237},{k:2,s:25,v:237},{k:2,s:27,v:237},{k:2,s:28,v:237},{k:2,s:31,v:237},{k:2,s:32,v:237},{k:2,s:34,v:237},{k:2,s:36,v:237},{k:2,s:37,v:237},{k:2,s:39,v:237},{k:2,s:40,v:237},{k:2,s:42,v:237},{k:2,s:45,v:237},{k:2,s:46,v:237},{k:2,s:47,v:237},{k:2,s:48,v:237},{k:2,s:78,v:237}],
 [{k:1,s:6,v:117},{k:1,s:7,v:1},{k:1,s:8,v:118},{k:1,s:15,v:119},{k:1,s:16,v:447},{k:1,s:35,v:120},{k:1,s:36,v:121},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:106,v:141},{k:3,s:107,v:142},{k:3,s:108,v:448},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:113,v:143},{k:3,s:114,v:144},{k:3,s:120,v:129},{k:3,s:127,v:130},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:135,v:145},{k:3,s:136,v:146},{k:3,s:137,v:147},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:150,v:148},{k:3,s:151,v:149},{k:3,s:153,v:274},{k:3,s:155,v:72},{k:3,s:158,v:75},{k:3,s:174,v:151},{k:3,s:175,v:85},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:188,v:132},{k:3,s:191,v:152},{k:3,s:192,v:153},{k:3,s:194,v:134},{k:3,s:195,v:135},{k:3,s:196,v:136},{k:3,s:197,v:137},{k:3,s:198,v:138},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:204,v:154},{k:3,s:206,v:155},{k:3,s:207,v:107},{k:3,s:225,v:156},{k:3,s:226,v:140}],
 [{k:1,s:30,v:449},{k:3,s:215,v:450}],
 [{k:1,s:52,v:174},{k:1,s:55,v:175},{k:1,s:58,v:176},{k:1,s:61,v:177},{k:1,s:65,v:17},{k:1,s:69,v:178},{k:1,s:74,v:24},{k:1,s:79,v:179},{k:1,s:80,v:28},{k:1,s:89,v:37},{k:1,s:93,v:41},{k:3,s:112,v:55},{k:3,s:129,v:62},{k:3,s:157,v:74},{k:3,s:160,v:451},{k:3,s:176,v:86},{k:3,s:192,v:216},{k:3,s:193,v:95},{k:3,s:201,v:103},{k:3,s:202,v:104},{k:3,s:203,v:105},{k:3,s:207,v:107},{k:3,s:223,v:388}],
 [{k:2,s:0,v:220},{k:2,s:7,v:220},{k:2,s:15,v:220},{k:2,s:24,v:220},{k:2,s:30,v:220},{k:2,s:34,v:220},{k:2,s:37,v:220},{k:2,s:51,v:220},{k:2,s:52,v:220},{k:2,s:53,v:220},{k:2,s:54,v:220},{k:2,s:55,v:220},{k:2,s:56,v:220},{k:2,s:57,v:220},{k:2,s:58,v:220},{k:2,s:59,v:220},{k:2,s:60,v:220},{k:2,s:61,v:220},{k:2,s:62,v:220},{k:2,s:63,v:220},{k:2,s:64,v:220},{k:2,s:65,v:220},{k:2,s:66,v:220},{k:2,s:68,v:220},{k:2,s:69,v:220},{k:2,s:70,v:220},{k:2,s:71,v:220},{k:2,s:72,v:220},{k:2,s:73,v:220},{k:2,s:74,v:220},{k:2,s:75,v:220},{k:2,s:79,v:220},{k:2,s:80,v:220},{k:2,s:81,v:220},{k:2,s:82,v:220},{k:2,s:83,v:220},{k:2,s:84,v:220},{k:2,s:85,v:220},{k:2,s:86,v:220},{k:2,s:87,v:220},{k:2,s:88,v:220},{k:2,s:89,v:220},{k:2,s:90,v:220},{k:2,s:91,v:220},{k:2,s:92,v:220},{k:2,s:93,v:220},{k:2,s:94,v:220},{k:2,s:95,v:220},{k:2,s:96,v:220},{k:2,s:97,v:220},{k:2,s:98,v:220},{k:2,s:100,v:220},{k:2,s:101,v:220},{k:2,s:102,v:220},{k:2,s:103,v:220},{k:2,s:104,v:220},{k:2,s:105,v:220}],
 [{k:2,s:24,v:109},{k:2,s:26,v:109},{k:2,s:30,v:109},{k:2,s:99,v:109}],
 [{k:2,s:16,v:111},{k:2,s:19,v:111}],
 [{k:1,s:16,v:452},{k:1,s:19,v:453}],
 [{k:1,s:74,v:265},{k:3,s:228,v:454}],
 [{k:2,s:24,v:110},{k:2,s:26,v:110},{k:2,s:30,v:110},{k:2,s:99,v:110}],
 [{k:2,s:19,v:115},{k:2,s:24,v:115},{k:2,s:30,v:115}],
 [{k:1,s:19,v:455},{k:2,s:24,v:114},{k:2,s:30,v:114}],
 [{k:1,s:7,v:1},{k:1,s:15,v:2},{k:1,s:24,v:3},{k:1,s:30,v:4},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:54,v:9},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:62,v:15},{k:1,s:64,v:16},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:72,v:22},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:75,v:25},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:88,v:36},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:96,v:44},{k:1,s:98,v:46},{k:1,s:101,v:48},{k:1,s:104,v:51},{k:1,s:105,v:52},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:113,v:56},{k:3,s:116,v:57},{k:3,s:119,v:58},{k:3,s:127,v:60},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:142,v:66},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:148,v:69},{k:3,s:149,v:70},{k:3,s:154,v:71},{k:3,s:155,v:72},{k:3,s:158,v:75},{k:3,s:162,v:76},{k:3,s:169,v:81},{k:3,s:171,v:82},{k:3,s:175,v:85},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:188,v:91},{k:3,s:192,v:153},{k:3,s:194,v:96},{k:3,s:195,v:97},{k:3,s:196,v:98},{k:3,s:197,v:99},{k:3,s:198,v:100},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:205,v:106},{k:3,s:207,v:107},{k:3,s:209,v:456},{k:3,s:210,v:110},{k:3,s:213,v:111},{k:3,s:220,v:112},{k:3,s:222,v:113},{k:3,s:232,v:116}],
 [{k:2,s:6,v:254},{k:2,s:7,v:254},{k:2,s:9,v:254},{k:2,s:10,v:254},{k:2,s:12,v:254},{k:2,s:13,v:254},{k:2,s:16,v:254},{k:2,s:17,v:254},{k:2,s:19,v:254},{k:2,s:20,v:254},{k:2,s:21,v:254},{k:2,s:23,v:254},{k:2,s:24,v:254},{k:2,s:25,v:254},{k:2,s:26,v:254},{k:2,s:27,v:254},{k:2,s:28,v:254},{k:2,s:31,v:254},{k:2,s:32,v:254},{k:2,s:34,v:254},{k:2,s:36,v:254},{k:2,s:37,v:254},{k:2,s:39,v:254},{k:2,s:40,v:254},{k:2,s:42,v:254},{k:2,s:45,v:254},{k:2,s:46,v:254},{k:2,s:47,v:254},{k:2,s:48,v:254},{k:2,s:78,v:254}],
 [{k:2,s:0,v:72},{k:2,s:7,v:72},{k:2,s:15,v:72},{k:2,s:24,v:72},{k:2,s:30,v:72},{k:2,s:37,v:72},{k:2,s:51,v:72},{k:2,s:52,v:72},{k:2,s:53,v:72},{k:2,s:54,v:72},{k:2,s:55,v:72},{k:2,s:58,v:72},{k:2,s:59,v:72},{k:2,s:60,v:72},{k:2,s:61,v:72},{k:2,s:62,v:72},{k:2,s:64,v:72},{k:2,s:65,v:72},{k:2,s:68,v:72},{k:2,s:69,v:72},{k:2,s:70,v:72},{k:2,s:71,v:72},{k:2,s:72,v:72},{k:2,s:73,v:72},{k:2,s:74,v:72},{k:2,s:75,v:72},{k:2,s:79,v:72},{k:2,s:80,v:72},{k:2,s:81,v:72},{k:2,s:82,v:72},{k:2,s:83,v:72},{k:2,s:84,v:72},{k:2,s:85,v:72},{k:2,s:86,v:72},{k:2,s:87,v:72},{k:2,s:88,v:72},{k:2,s:89,v:72},{k:2,s:90,v:72},{k:2,s:91,v:72},{k:2,s:92,v:72},{k:2,s:93,v:72},{k:2,s:94,v:72},{k:2,s:95,v:72},{k:2,s:96,v:72},{k:2,s:97,v:72},{k:2,s:98,v:72},{k:2,s:100,v:72},{k:2,s:101,v:72},{k:2,s:102,v:72},{k:2,s:103,v:72},{k:2,s:104,v:72},{k:2,s:105,v:72}],
 [{k:1,s:30,v:267},{k:3,s:123,v:457}],
 [{k:1,s:30,v:267},{k:1,s:76,v:269},{k:3,s:123,v:458},{k:3,s:177,v:459}],
 [{k:2,s:24,v:104},{k:2,s:30,v:104}],
 [{k:2,s:24,v:100},{k:2,s:30,v:100}],
 [{k:2,s:0,v:89},{k:2,s:7,v:89},{k:2,s:15,v:89},{k:2,s:24,v:89},{k:2,s:30,v:89},{k:2,s:34,v:89},{k:2,s:37,v:89},{k:2,s:51,v:89},{k:2,s:52,v:89},{k:2,s:53,v:89},{k:2,s:54,v:89},{k:2,s:55,v:89},{k:2,s:58,v:89},{k:2,s:59,v:89},{k:2,s:60,v:89},{k:2,s:61,v:89},{k:2,s:62,v:89},{k:2,s:64,v:89},{k:2,s:65,v:89},{k:2,s:68,v:89},{k:2,s:69,v:89},{k:2,s:70,v:89},{k:2,s:71,v:89},{k:2,s:72,v:89},{k:2,s:73,v:89},{k:2,s:74,v:89},{k:2,s:75,v:89},{k:2,s:79,v:89},{k:2,s:80,v:89},{k:2,s:81,v:89},{k:2,s:82,v:89},{k:2,s:83,v:89},{k:2,s:84,v:89},{k:2,s:85,v:89},{k:2,s:86,v:89},{k:2,s:87,v:89},{k:2,s:88,v:89},{k:2,s:89,v:89},{k:2,s:90,v:89},{k:2,s:91,v:89},{k:2,s:92,v:89},{k:2,s:93,v:89},{k:2,s:94,v:89},{k:2,s:95,v:89},{k:2,s:96,v:89},{k:2,s:97,v:89},{k:2,s:98,v:89},{k:2,s:100,v:89},{k:2,s:101,v:89},{k:2,s:102,v:89},{k:2,s:103,v:89},{k:2,s:104,v:89},{k:2,s:105,v:89}],
 [{k:2,s:6,v:248},{k:2,s:7,v:248},{k:2,s:9,v:248},{k:2,s:10,v:248},{k:2,s:12,v:248},{k:2,s:13,v:248},{k:2,s:16,v:248},{k:2,s:17,v:248},{k:2,s:19,v:248},{k:2,s:20,v:248},{k:2,s:21,v:248},{k:2,s:23,v:248},{k:2,s:24,v:248},{k:2,s:25,v:248},{k:2,s:26,v:248},{k:2,s:27,v:248},{k:2,s:28,v:248},{k:2,s:31,v:248},{k:2,s:32,v:248},{k:2,s:34,v:248},{k:2,s:36,v:248},{k:2,s:37,v:248},{k:2,s:39,v:248},{k:2,s:40,v:248},{k:2,s:42,v:248},{k:2,s:45,v:248},{k:2,s:46,v:248},{k:2,s:47,v:248},{k:2,s:48,v:248},{k:2,s:78,v:248}],
 [{k:2,s:6,v:255},{k:2,s:7,v:255},{k:2,s:9,v:255},{k:2,s:10,v:255},{k:2,s:11,v:255},{k:2,s:12,v:255},{k:2,s:13,v:255},{k:2,s:14,v:255},{k:2,s:16,v:255},{k:2,s:17,v:255},{k:2,s:18,v:255},{k:2,s:19,v:255},{k:2,s:20,v:255},{k:2,s:21,v:255},{k:2,s:22,v:255},{k:2,s:23,v:255},{k:2,s:24,v:255},{k:2,s:25,v:255},{k:2,s:26,v:255},{k:2,s:27,v:255},{k:2,s:28,v:255},{k:2,s:29,v:255},{k:2,s:31,v:255},{k:2,s:32,v:255},{k:2,s:33,v:255},{k:2,s:34,v:255},{k:2,s:36,v:255},{k:2,s:37,v:255},{k:2,s:38,v:255},{k:2,s:39,v:255},{k:2,s:40,v:255},{k:2,s:41,v:255},{k:2,s:42,v:255},{k:2,s:43,v:255},{k:2,s:44,v:255},{k:2,s:45,v:255},{k:2,s:46,v:255},{k:2,s:47,v:255},{k:2,s:48,v:255},{k:2,s:49,v:255},{k:2,s:50,v:255},{k:2,s:78,v:255}],
 [{k:1,s:6,v:117},{k:1,s:7,v:1},{k:1,s:8,v:118},{k:1,s:15,v:119},{k:1,s:16,v:460},{k:1,s:35,v:120},{k:1,s:36,v:121},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:106,v:141},{k:3,s:107,v:142},{k:3,s:108,v:461},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:113,v:143},{k:3,s:114,v:144},{k:3,s:120,v:129},{k:3,s:127,v:130},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:135,v:145},{k:3,s:136,v:146},{k:3,s:137,v:147},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:150,v:148},{k:3,s:151,v:149},{k:3,s:153,v:274},{k:3,s:155,v:72},{k:3,s:158,v:75},{k:3,s:174,v:151},{k:3,s:175,v:85},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:188,v:132},{k:3,s:191,v:152},{k:3,s:192,v:153},{k:3,s:194,v:134},{k:3,s:195,v:135},{k:3,s:196,v:136},{k:3,s:197,v:137},{k:3,s:198,v:138},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:204,v:154},{k:3,s:206,v:155},{k:3,s:207,v:107},{k:3,s:225,v:156},{k:3,s:226,v:140}],
 [{k:2,s:6,v:256},{k:2,s:7,v:256},{k:2,s:9,v:256},{k:2,s:10,v:256},{k:2,s:11,v:256},{k:2,s:12,v:256},{k:2,s:13,v:256},{k:2,s:14,v:256},{k:2,s:16,v:256},{k:2,s:17,v:256},{k:2,s:18,v:256},{k:2,s:19,v:256},{k:2,s:20,v:256},{k:2,s:21,v:256},{k:2,s:22,v:256},{k:2,s:23,v:256},{k:2,s:24,v:256},{k:2,s:25,v:256},{k:2,s:26,v:256},{k:2,s:27,v:256},{k:2,s:28,v:256},{k:2,s:29,v:256},{k:2,s:31,v:256},{k:2,s:32,v:256},{k:2,s:33,v:256},{k:2,s:34,v:256},{k:2,s:36,v:256},{k:2,s:37,v:256},{k:2,s:38,v:256},{k:2,s:39,v:256},{k:2,s:40,v:256},{k:2,s:41,v:256},{k:2,s:42,v:256},{k:2,s:43,v:256},{k:2,s:44,v:256},{k:2,s:45,v:256},{k:2,s:46,v:256},{k:2,s:47,v:256},{k:2,s:48,v:256},{k:2,s:49,v:256},{k:2,s:50,v:256},{k:2,s:78,v:256}],
 [{k:2,s:16,v:96},{k:2,s:19,v:96},{k:2,s:24,v:96},{k:2,s:26,v:96},{k:2,s:43,v:96}],
 [{k:1,s:6,v:117},{k:1,s:7,v:1},{k:1,s:8,v:118},{k:1,s:15,v:119},{k:1,s:19,v:462},{k:1,s:30,v:405},{k:1,s:34,v:463},{k:1,s:35,v:120},{k:1,s:36,v:121},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:106,v:141},{k:3,s:107,v:142},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:111,v:406},{k:3,s:113,v:143},{k:3,s:114,v:144},{k:3,s:120,v:129},{k:3,s:127,v:130},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:135,v:145},{k:3,s:136,v:146},{k:3,s:137,v:147},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:150,v:148},{k:3,s:151,v:149},{k:3,s:153,v:407},{k:3,s:155,v:72},{k:3,s:158,v:75},{k:3,s:174,v:151},{k:3,s:175,v:85},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:188,v:132},{k:3,s:191,v:152},{k:3,s:192,v:153},{k:3,s:194,v:134},{k:3,s:195,v:135},{k:3,s:196,v:136},{k:3,s:197,v:137},{k:3,s:198,v:138},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:204,v:154},{k:3,s:206,v:155},{k:3,s:207,v:107},{k:3,s:225,v:156},{k:3,s:226,v:140},{k:3,s:230,v:464},{k:3,s:231,v:465}],
 [{k:2,s:19,v:98},{k:2,s:24,v:98},{k:2,s:34,v:98}],
 [{k:2,s:19,v:97},{k:2,s:24,v:97},{k:2,s:34,v:97}],
 [{k:2,s:19,v:94},{k:2,s:24,v:94}],
 [{k:2,s:19,v:92},{k:2,s:24,v:92}],
 [{k:2,s:6,v:276},{k:2,s:9,v:276},{k:2,s:10,v:276},{k:2,s:12,v:276},{k:2,s:13,v:276},{k:2,s:16,v:276},{k:2,s:17,v:276},{k:2,s:19,v:276},{k:2,s:21,v:276},{k:2,s:23,v:276},{k:2,s:24,v:276},{k:2,s:25,v:276},{k:2,s:27,v:276},{k:2,s:28,v:276},{k:2,s:31,v:276},{k:2,s:32,v:276},{k:2,s:34,v:276},{k:2,s:36,v:276},{k:2,s:39,v:276},{k:2,s:40,v:276},{k:2,s:42,v:276},{k:2,s:45,v:276},{k:2,s:46,v:276},{k:2,s:47,v:276},{k:2,s:48,v:276},{k:2,s:78,v:276}],
 [{k:2,s:6,v:244},{k:2,s:7,v:244},{k:2,s:9,v:244},{k:2,s:10,v:244},{k:2,s:12,v:244},{k:2,s:13,v:244},{k:2,s:16,v:244},{k:2,s:17,v:244},{k:2,s:19,v:244},{k:2,s:20,v:244},{k:2,s:21,v:244},{k:2,s:23,v:244},{k:2,s:24,v:244},{k:2,s:25,v:244},{k:2,s:26,v:244},{k:2,s:27,v:244},{k:2,s:28,v:244},{k:2,s:31,v:244},{k:2,s:32,v:244},{k:2,s:34,v:244},{k:2,s:36,v:244},{k:2,s:37,v:244},{k:2,s:39,v:244},{k:2,s:40,v:244},{k:2,s:42,v:244},{k:2,s:45,v:244},{k:2,s:46,v:244},{k:2,s:47,v:244},{k:2,s:48,v:244},{k:2,s:78,v:244}],
 [{k:1,s:8,v:118},{k:1,s:15,v:119},{k:1,s:35,v:120},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:109,v:128},{k:3,s:110,v:54},{k:3,s:120,v:129},{k:3,s:127,v:130},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:155,v:131},{k:3,s:158,v:75},{k:3,s:175,v:85},{k:3,s:181,v:88},{k:3,s:188,v:132},{k:3,s:192,v:133},{k:3,s:194,v:134},{k:3,s:195,v:135},{k:3,s:196,v:136},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:207,v:107},{k:3,s:226,v:466}],
 [{k:1,s:27,v:467}],
 [{k:2,s:6,v:275},{k:2,s:9,v:275},{k:2,s:10,v:275},{k:2,s:12,v:275},{k:2,s:13,v:275},{k:2,s:16,v:275},{k:2,s:17,v:275},{k:2,s:19,v:275},{k:2,s:21,v:275},{k:2,s:23,v:275},{k:2,s:24,v:275},{k:2,s:25,v:275},{k:2,s:27,v:275},{k:2,s:28,v:275},{k:2,s:31,v:275},{k:2,s:32,v:275},{k:2,s:34,v:275},{k:2,s:36,v:275},{k:2,s:39,v:275},{k:2,s:40,v:275},{k:2,s:42,v:275},{k:2,s:45,v:275},{k:2,s:46,v:275},{k:2,s:47,v:275},{k:2,s:48,v:275},{k:2,s:78,v:275}],
 [{k:1,s:6,v:117},{k:1,s:7,v:1},{k:1,s:8,v:118},{k:1,s:15,v:119},{k:1,s:35,v:120},{k:1,s:36,v:121},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:109,v:128},{k:3,s:110,v:54},{k:3,s:120,v:129},{k:3,s:127,v:130},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:155,v:131},{k:3,s:158,v:75},{k:3,s:175,v:85},{k:3,s:181,v:88},{k:3,s:188,v:132},{k:3,s:192,v:133},{k:3,s:194,v:134},{k:3,s:195,v:135},{k:3,s:196,v:136},{k:3,s:197,v:137},{k:3,s:198,v:138},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:207,v:107},{k:3,s:225,v:468},{k:3,s:226,v:140}],
 [{k:1,s:6,v:117},{k:1,s:7,v:1},{k:1,s:8,v:118},{k:1,s:15,v:119},{k:1,s:35,v:120},{k:1,s:36,v:121},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:106,v:141},{k:3,s:107,v:142},{k:3,s:109,v:128},{k:3,s:110,v:54},{k:3,s:120,v:129},{k:3,s:127,v:130},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:135,v:145},{k:3,s:136,v:469},{k:3,s:137,v:147},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:150,v:148},{k:3,s:151,v:149},{k:3,s:155,v:131},{k:3,s:158,v:75},{k:3,s:174,v:151},{k:3,s:175,v:85},{k:3,s:181,v:88},{k:3,s:188,v:132},{k:3,s:191,v:152},{k:3,s:192,v:133},{k:3,s:194,v:134},{k:3,s:195,v:135},{k:3,s:196,v:136},{k:3,s:197,v:137},{k:3,s:198,v:138},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:204,v:154},{k:3,s:206,v:155},{k:3,s:207,v:107},{k:3,s:225,v:156},{k:3,s:226,v:140}],
 [{k:2,s:0,v:81},{k:2,s:7,v:81},{k:2,s:15,v:81},{k:2,s:24,v:81},{k:2,s:30,v:81},{k:2,s:37,v:81},{k:2,s:51,v:81},{k:2,s:52,v:81},{k:2,s:53,v:81},{k:2,s:54,v:81},{k:2,s:55,v:81},{k:2,s:58,v:81},{k:2,s:59,v:81},{k:2,s:60,v:81},{k:2,s:61,v:81},{k:2,s:62,v:81},{k:2,s:64,v:81},{k:2,s:65,v:81},{k:2,s:68,v:81},{k:2,s:69,v:81},{k:2,s:70,v:81},{k:2,s:71,v:81},{k:2,s:72,v:81},{k:2,s:73,v:81},{k:2,s:74,v:81},{k:2,s:75,v:81},{k:2,s:79,v:81},{k:2,s:80,v:81},{k:2,s:81,v:81},{k:2,s:82,v:81},{k:2,s:83,v:81},{k:2,s:84,v:81},{k:2,s:85,v:81},{k:2,s:86,v:81},{k:2,s:87,v:81},{k:2,s:88,v:81},{k:2,s:89,v:81},{k:2,s:90,v:81},{k:2,s:91,v:81},{k:2,s:92,v:81},{k:2,s:93,v:81},{k:2,s:94,v:81},{k:2,s:95,v:81},{k:2,s:96,v:81},{k:2,s:97,v:81},{k:2,s:98,v:81},{k:2,s:100,v:81},{k:2,s:101,v:81},{k:2,s:102,v:81},{k:2,s:103,v:81},{k:2,s:104,v:81},{k:2,s:105,v:81}],
 [{k:2,s:34,v:84},{k:2,s:51,v:84},{k:2,s:52,v:84},{k:2,s:55,v:84},{k:2,s:58,v:84},{k:2,s:61,v:84},{k:2,s:65,v:84},{k:2,s:68,v:84},{k:2,s:69,v:84},{k:2,s:74,v:84},{k:2,s:79,v:84},{k:2,s:80,v:84},{k:2,s:81,v:84},{k:2,s:85,v:84},{k:2,s:86,v:84},{k:2,s:87,v:84},{k:2,s:89,v:84},{k:2,s:92,v:84},{k:2,s:93,v:84},{k:2,s:97,v:84},{k:2,s:100,v:84},{k:2,s:102,v:84},{k:2,s:103,v:84}],
 [{k:1,s:7,v:1},{k:1,s:15,v:2},{k:1,s:24,v:3},{k:1,s:30,v:4},{k:1,s:34,v:470},{k:1,s:37,v:5},{k:1,s:51,v:6},{k:1,s:52,v:7},{k:1,s:53,v:8},{k:1,s:54,v:9},{k:1,s:55,v:10},{k:1,s:58,v:11},{k:1,s:59,v:12},{k:1,s:61,v:14},{k:1,s:62,v:15},{k:1,s:64,v:16},{k:1,s:65,v:17},{k:1,s:68,v:18},{k:1,s:69,v:19},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:72,v:22},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:75,v:25},{k:1,s:79,v:27},{k:1,s:80,v:28},{k:1,s:81,v:29},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:85,v:33},{k:1,s:86,v:34},{k:1,s:87,v:35},{k:1,s:88,v:36},{k:1,s:89,v:37},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:92,v:40},{k:1,s:93,v:41},{k:1,s:94,v:42},{k:1,s:95,v:471},{k:1,s:96,v:44},{k:1,s:97,v:45},{k:1,s:98,v:472},{k:1,s:100,v:47},{k:1,s:101,v:48},{k:1,s:103,v:50},{k:1,s:104,v:51},{k:1,s:105,v:52},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:112,v:55},{k:3,s:113,v:56},{k:3,s:116,v:57},{k:3,s:117,v:158},{k:3,s:118,v:473},{k:3,s:119,v:58},{k:3,s:127,v:60},{k:3,s:129,v:62},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:142,v:66},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:148,v:69},{k:3,s:149,v:70},{k:3,s:152,v:474},{k:3,s:154,v:71},{k:3,s:155,v:72},{k:3,s:157,v:74},{k:3,s:158,v:75},{k:3,s:162,v:76},{k:3,s:169,v:81},{k:3,s:171,v:82},{k:3,s:175,v:85},{k:3,s:176,v:86},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:182,v:160},{k:3,s:183,v:161},{k:3,s:188,v:91},{k:3,s:189,v:92},{k:3,s:190,v:162},{k:3,s:192,v:94},{k:3,s:193,v:95},{k:3,s:194,v:96},{k:3,s:195,v:97},{k:3,s:196,v:98},{k:3,s:197,v:99},{k:3,s:198,v:100},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:201,v:103},{k:3,s:202,v:104},{k:3,s:203,v:105},{k:3,s:205,v:106},{k:3,s:207,v:107},{k:3,s:209,v:163},{k:3,s:210,v:110},{k:3,s:213,v:111},{k:3,s:220,v:112},{k:3,s:222,v:113},{k:3,s:223,v:164},{k:3,s:232,v:116}],
 [{k:2,s:34,v:122},{k:2,s:51,v:122},{k:2,s:52,v:122},{k:2,s:55,v:122},{k:2,s:58,v:122},{k:2,s:61,v:122},{k:2,s:65,v:122},{k:2,s:68,v:122},{k:2,s:69,v:122},{k:2,s:74,v:122},{k:2,s:79,v:122},{k:2,s:80,v:122},{k:2,s:81,v:122},{k:2,s:85,v:122},{k:2,s:86,v:122},{k:2,s:87,v:122},{k:2,s:89,v:122},{k:2,s:92,v:122},{k:2,s:93,v:122},{k:2,s:97,v:122},{k:2,s:100,v:122},{k:2,s:102,v:122},{k:2,s:103,v:122}],
 [{k:1,s:30,v:419},{k:3,s:139,v:475}],
 [{k:1,s:30,v:419},{k:1,s:99,v:297},{k:3,s:139,v:476},{k:3,s:221,v:477}],
 [{k:1,s:16,v:478},{k:1,s:52,v:174},{k:1,s:55,v:175},{k:1,s:58,v:176},{k:1,s:61,v:177},{k:1,s:65,v:17},{k:1,s:69,v:178},{k:1,s:74,v:24},{k:1,s:79,v:179},{k:1,s:80,v:28},{k:1,s:89,v:37},{k:1,s:93,v:41},{k:3,s:112,v:55},{k:3,s:129,v:62},{k:3,s:157,v:74},{k:3,s:160,v:386},{k:3,s:161,v:479},{k:3,s:176,v:86},{k:3,s:192,v:216},{k:3,s:193,v:95},{k:3,s:201,v:103},{k:3,s:202,v:104},{k:3,s:203,v:105},{k:3,s:207,v:107},{k:3,s:223,v:388}],
 [{k:1,s:74,v:24},{k:3,s:129,v:359},{k:3,s:178,v:480},{k:3,s:192,v:182},{k:3,s:202,v:104},{k:3,s:207,v:107}],
 [{k:2,s:0,v:73},{k:2,s:7,v:73},{k:2,s:15,v:73},{k:2,s:24,v:73},{k:2,s:30,v:73},{k:2,s:37,v:73},{k:2,s:51,v:73},{k:2,s:52,v:73},{k:2,s:53,v:73},{k:2,s:54,v:73},{k:2,s:55,v:73},{k:2,s:58,v:73},{k:2,s:59,v:73},{k:2,s:60,v:73},{k:2,s:61,v:73},{k:2,s:62,v:73},{k:2,s:64,v:73},{k:2,s:65,v:73},{k:2,s:68,v:73},{k:2,s:69,v:73},{k:2,s:70,v:73},{k:2,s:71,v:73},{k:2,s:72,v:73},{k:2,s:73,v:73},{k:2,s:74,v:73},{k:2,s:75,v:73},{k:2,s:79,v:73},{k:2,s:80,v:73},{k:2,s:81,v:73},{k:2,s:82,v:73},{k:2,s:83,v:73},{k:2,s:84,v:73},{k:2,s:85,v:73},{k:2,s:86,v:73},{k:2,s:87,v:73},{k:2,s:88,v:73},{k:2,s:89,v:73},{k:2,s:90,v:73},{k:2,s:91,v:73},{k:2,s:92,v:73},{k:2,s:93,v:73},{k:2,s:94,v:73},{k:2,s:95,v:73},{k:2,s:96,v:73},{k:2,s:97,v:73},{k:2,s:98,v:73},{k:2,s:100,v:73},{k:2,s:101,v:73},{k:2,s:102,v:73},{k:2,s:103,v:73},{k:2,s:104,v:73},{k:2,s:105,v:73}],
 [{k:2,s:16,v:236},{k:2,s:19,v:236}],
 [{k:1,s:16,v:481}],
 [{k:1,s:7,v:1},{k:1,s:15,v:2},{k:1,s:24,v:3},{k:1,s:30,v:4},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:54,v:9},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:62,v:15},{k:1,s:64,v:16},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:72,v:22},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:75,v:25},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:88,v:36},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:96,v:44},{k:1,s:98,v:46},{k:1,s:101,v:48},{k:1,s:104,v:51},{k:1,s:105,v:52},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:113,v:56},{k:3,s:116,v:57},{k:3,s:119,v:58},{k:3,s:127,v:60},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:142,v:66},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:148,v:69},{k:3,s:149,v:70},{k:3,s:154,v:71},{k:3,s:155,v:72},{k:3,s:158,v:75},{k:3,s:162,v:76},{k:3,s:169,v:81},{k:3,s:171,v:82},{k:3,s:175,v:85},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:188,v:91},{k:3,s:192,v:153},{k:3,s:194,v:96},{k:3,s:195,v:97},{k:3,s:196,v:98},{k:3,s:197,v:99},{k:3,s:198,v:100},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:205,v:106},{k:3,s:207,v:107},{k:3,s:209,v:482},{k:3,s:210,v:110},{k:3,s:213,v:111},{k:3,s:220,v:112},{k:3,s:222,v:113},{k:3,s:232,v:116}],
 [{k:1,s:16,v:483}],
 [{k:1,s:19,v:371},{k:2,s:16,v:211}],
 [{k:1,s:7,v:1},{k:1,s:15,v:2},{k:1,s:16,v:484},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:113,v:56},{k:3,s:127,v:60},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:155,v:72},{k:3,s:158,v:75},{k:3,s:164,v:485},{k:3,s:175,v:85},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:188,v:91},{k:3,s:192,v:153},{k:3,s:194,v:96},{k:3,s:195,v:97},{k:3,s:196,v:98},{k:3,s:197,v:99},{k:3,s:198,v:100},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:207,v:107},{k:3,s:210,v:279},{k:3,s:211,v:430}],
 [{k:1,s:7,v:1},{k:1,s:15,v:2},{k:1,s:16,v:486},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:113,v:56},{k:3,s:127,v:60},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:155,v:72},{k:3,s:158,v:75},{k:3,s:164,v:487},{k:3,s:175,v:85},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:188,v:91},{k:3,s:192,v:153},{k:3,s:194,v:96},{k:3,s:195,v:97},{k:3,s:196,v:98},{k:3,s:197,v:99},{k:3,s:198,v:100},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:207,v:107},{k:3,s:210,v:279},{k:3,s:211,v:430}],
 [{k:1,s:24,v:488}],
 [{k:2,s:16,v:213},{k:2,s:19,v:213},{k:2,s:24,v:213}],
 [{k:1,s:15,v:489}],
 [{k:1,s:15,v:490}],
 [{k:1,s:15,v:491}],
 [{k:2,s:66,v:156}],
 [{k:2,s:66,v:154}],
 [{k:2,s:0,v:175},{k:2,s:7,v:175},{k:2,s:15,v:175},{k:2,s:24,v:175},{k:2,s:30,v:175},{k:2,s:34,v:175},{k:2,s:37,v:175},{k:2,s:51,v:175},{k:2,s:52,v:175},{k:2,s:53,v:175},{k:2,s:54,v:175},{k:2,s:55,v:175},{k:2,s:56,v:175},{k:2,s:58,v:175},{k:2,s:59,v:175},{k:2,s:60,v:175},{k:2,s:61,v:175},{k:2,s:62,v:175},{k:2,s:63,v:175},{k:2,s:64,v:175},{k:2,s:65,v:175},{k:2,s:68,v:175},{k:2,s:69,v:175},{k:2,s:70,v:175},{k:2,s:71,v:175},{k:2,s:72,v:175},{k:2,s:73,v:175},{k:2,s:74,v:175},{k:2,s:75,v:175},{k:2,s:79,v:175},{k:2,s:80,v:175},{k:2,s:81,v:175},{k:2,s:82,v:175},{k:2,s:83,v:175},{k:2,s:84,v:175},{k:2,s:85,v:175},{k:2,s:86,v:175},{k:2,s:87,v:175},{k:2,s:88,v:175},{k:2,s:89,v:175},{k:2,s:90,v:175},{k:2,s:91,v:175},{k:2,s:92,v:175},{k:2,s:93,v:175},{k:2,s:94,v:175},{k:2,s:95,v:175},{k:2,s:96,v:175},{k:2,s:97,v:175},{k:2,s:98,v:175},{k:2,s:100,v:175},{k:2,s:101,v:175},{k:2,s:102,v:175},{k:2,s:103,v:175},{k:2,s:104,v:175},{k:2,s:105,v:175}],
 [{k:1,s:66,v:492}],
 [{k:2,s:0,v:148},{k:2,s:7,v:148},{k:2,s:15,v:148},{k:2,s:24,v:148},{k:2,s:30,v:148},{k:2,s:34,v:148},{k:2,s:37,v:148},{k:2,s:51,v:148},{k:2,s:52,v:148},{k:2,s:53,v:148},{k:2,s:54,v:148},{k:2,s:55,v:148},{k:2,s:56,v:148},{k:2,s:58,v:148},{k:2,s:59,v:148},{k:2,s:60,v:148},{k:2,s:61,v:148},{k:2,s:62,v:148},{k:2,s:63,v:148},{k:2,s:64,v:148},{k:2,s:65,v:148},{k:2,s:68,v:148},{k:2,s:69,v:148},{k:2,s:70,v:148},{k:2,s:71,v:148},{k:2,s:72,v:148},{k:2,s:73,v:148},{k:2,s:74,v:148},{k:2,s:75,v:148},{k:2,s:79,v:148},{k:2,s:80,v:148},{k:2,s:81,v:148},{k:2,s:82,v:148},{k:2,s:83,v:148},{k:2,s:84,v:148},{k:2,s:85,v:148},{k:2,s:86,v:148},{k:2,s:87,v:148},{k:2,s:88,v:148},{k:2,s:89,v:148},{k:2,s:90,v:148},{k:2,s:91,v:148},{k:2,s:92,v:148},{k:2,s:93,v:148},{k:2,s:94,v:148},{k:2,s:95,v:148},{k:2,s:96,v:148},{k:2,s:97,v:148},{k:2,s:98,v:148},{k:2,s:100,v:148},{k:2,s:101,v:148},{k:2,s:102,v:148},{k:2,s:103,v:148},{k:2,s:104,v:148},{k:2,s:105,v:148},{k:2,s:66,v:153}],
 [{k:2,s:66,v:155}],
 [{k:2,s:7,v:56},{k:2,s:15,v:56},{k:2,s:24,v:56},{k:2,s:30,v:56},{k:2,s:37,v:56},{k:2,s:51,v:56},{k:2,s:52,v:56},{k:2,s:53,v:56},{k:2,s:54,v:56},{k:2,s:55,v:56},{k:2,s:58,v:56},{k:2,s:59,v:56},{k:2,s:60,v:56},{k:2,s:61,v:56},{k:2,s:62,v:56},{k:2,s:64,v:56},{k:2,s:65,v:56},{k:2,s:68,v:56},{k:2,s:69,v:56},{k:2,s:70,v:56},{k:2,s:71,v:56},{k:2,s:72,v:56},{k:2,s:73,v:56},{k:2,s:74,v:56},{k:2,s:75,v:56},{k:2,s:77,v:56},{k:2,s:79,v:56},{k:2,s:80,v:56},{k:2,s:81,v:56},{k:2,s:82,v:56},{k:2,s:83,v:56},{k:2,s:84,v:56},{k:2,s:85,v:56},{k:2,s:86,v:56},{k:2,s:87,v:56},{k:2,s:88,v:56},{k:2,s:89,v:56},{k:2,s:90,v:56},{k:2,s:91,v:56},{k:2,s:92,v:56},{k:2,s:93,v:56},{k:2,s:94,v:56},{k:2,s:95,v:56},{k:2,s:96,v:56},{k:2,s:97,v:56},{k:2,s:98,v:56},{k:2,s:100,v:56},{k:2,s:101,v:56},{k:2,s:102,v:56},{k:2,s:103,v:56},{k:2,s:104,v:56},{k:2,s:105,v:56}],
 [{k:2,s:6,v:243},{k:2,s:7,v:243},{k:2,s:9,v:243},{k:2,s:10,v:243},{k:2,s:12,v:243},{k:2,s:13,v:243},{k:2,s:16,v:243},{k:2,s:17,v:243},{k:2,s:19,v:243},{k:2,s:20,v:243},{k:2,s:21,v:243},{k:2,s:23,v:243},{k:2,s:24,v:243},{k:2,s:25,v:243},{k:2,s:26,v:243},{k:2,s:27,v:243},{k:2,s:28,v:243},{k:2,s:31,v:243},{k:2,s:32,v:243},{k:2,s:34,v:243},{k:2,s:36,v:243},{k:2,s:37,v:243},{k:2,s:39,v:243},{k:2,s:40,v:243},{k:2,s:42,v:243},{k:2,s:45,v:243},{k:2,s:46,v:243},{k:2,s:47,v:243},{k:2,s:48,v:243},{k:2,s:78,v:243}],
 [{k:2,s:6,v:231},{k:2,s:7,v:231},{k:2,s:9,v:231},{k:2,s:10,v:231},{k:2,s:12,v:231},{k:2,s:13,v:231},{k:2,s:16,v:231},{k:2,s:17,v:231},{k:2,s:19,v:231},{k:2,s:20,v:231},{k:2,s:21,v:231},{k:2,s:23,v:231},{k:2,s:24,v:231},{k:2,s:25,v:231},{k:2,s:26,v:231},{k:2,s:27,v:231},{k:2,s:28,v:231},{k:2,s:31,v:231},{k:2,s:32,v:231},{k:2,s:34,v:231},{k:2,s:36,v:231},{k:2,s:37,v:231},{k:2,s:39,v:231},{k:2,s:40,v:231},{k:2,s:42,v:231},{k:2,s:45,v:231},{k:2,s:46,v:231},{k:2,s:47,v:231},{k:2,s:48,v:231},{k:2,s:78,v:231}],
 [{k:2,s:6,v:253},{k:2,s:7,v:253},{k:2,s:9,v:253},{k:2,s:10,v:253},{k:2,s:12,v:253},{k:2,s:13,v:253},{k:2,s:16,v:253},{k:2,s:17,v:253},{k:2,s:19,v:253},{k:2,s:20,v:253},{k:2,s:21,v:253},{k:2,s:23,v:253},{k:2,s:24,v:253},{k:2,s:25,v:253},{k:2,s:26,v:253},{k:2,s:27,v:253},{k:2,s:28,v:253},{k:2,s:31,v:253},{k:2,s:32,v:253},{k:2,s:34,v:253},{k:2,s:36,v:253},{k:2,s:37,v:253},{k:2,s:39,v:253},{k:2,s:40,v:253},{k:2,s:42,v:253},{k:2,s:45,v:253},{k:2,s:46,v:253},{k:2,s:47,v:253},{k:2,s:48,v:253},{k:2,s:78,v:253}],
 [{k:1,s:16,v:493},{k:1,s:19,v:366}],
 [{k:1,s:34,v:494},{k:1,s:56,v:495},{k:1,s:63,v:496},{k:3,s:216,v:497},{k:3,s:217,v:498},{k:3,s:218,v:499},{k:3,s:219,v:500}],
 [{k:2,s:0,v:178},{k:2,s:7,v:178},{k:2,s:15,v:178},{k:2,s:24,v:178},{k:2,s:30,v:178},{k:2,s:34,v:178},{k:2,s:37,v:178},{k:2,s:51,v:178},{k:2,s:52,v:178},{k:2,s:53,v:178},{k:2,s:54,v:178},{k:2,s:55,v:178},{k:2,s:56,v:178},{k:2,s:58,v:178},{k:2,s:59,v:178},{k:2,s:60,v:178},{k:2,s:61,v:178},{k:2,s:62,v:178},{k:2,s:63,v:178},{k:2,s:64,v:178},{k:2,s:65,v:178},{k:2,s:66,v:178},{k:2,s:68,v:178},{k:2,s:69,v:178},{k:2,s:70,v:178},{k:2,s:71,v:178},{k:2,s:72,v:178},{k:2,s:73,v:178},{k:2,s:74,v:178},{k:2,s:75,v:178},{k:2,s:79,v:178},{k:2,s:80,v:178},{k:2,s:81,v:178},{k:2,s:82,v:178},{k:2,s:83,v:178},{k:2,s:84,v:178},{k:2,s:85,v:178},{k:2,s:86,v:178},{k:2,s:87,v:178},{k:2,s:88,v:178},{k:2,s:89,v:178},{k:2,s:90,v:178},{k:2,s:91,v:178},{k:2,s:92,v:178},{k:2,s:93,v:178},{k:2,s:94,v:178},{k:2,s:95,v:178},{k:2,s:96,v:178},{k:2,s:97,v:178},{k:2,s:98,v:178},{k:2,s:100,v:178},{k:2,s:101,v:178},{k:2,s:102,v:178},{k:2,s:103,v:178},{k:2,s:104,v:178},{k:2,s:105,v:178}],
 [{k:1,s:16,v:501}],
 [{k:2,s:24,v:108},{k:2,s:26,v:108},{k:2,s:30,v:108},{k:2,s:99,v:108}],
 [{k:1,s:52,v:174},{k:1,s:55,v:175},{k:1,s:58,v:176},{k:1,s:61,v:177},{k:1,s:65,v:17},{k:1,s:69,v:178},{k:1,s:74,v:24},{k:1,s:79,v:179},{k:1,s:80,v:28},{k:1,s:89,v:37},{k:1,s:93,v:41},{k:3,s:112,v:55},{k:3,s:129,v:62},{k:3,s:157,v:74},{k:3,s:160,v:502},{k:3,s:176,v:86},{k:3,s:192,v:216},{k:3,s:193,v:95},{k:3,s:201,v:103},{k:3,s:202,v:104},{k:3,s:203,v:105},{k:3,s:207,v:107},{k:3,s:223,v:388}],
 [{k:1,s:26,v:317},{k:2,s:16,v:113},{k:2,s:19,v:113}],
 [{k:1,s:74,v:24},{k:3,s:129,v:357},{k:3,s:130,v:503},{k:3,s:192,v:182},{k:3,s:202,v:104},{k:3,s:207,v:107}],
 [{k:2,s:0,v:190},{k:2,s:7,v:190},{k:2,s:15,v:190},{k:2,s:24,v:190},{k:2,s:30,v:190},{k:2,s:34,v:190},{k:2,s:37,v:190},{k:2,s:51,v:190},{k:2,s:52,v:190},{k:2,s:53,v:190},{k:2,s:54,v:190},{k:2,s:55,v:190},{k:2,s:56,v:190},{k:2,s:58,v:190},{k:2,s:59,v:190},{k:2,s:60,v:190},{k:2,s:61,v:190},{k:2,s:62,v:190},{k:2,s:63,v:190},{k:2,s:64,v:190},{k:2,s:65,v:190},{k:2,s:68,v:190},{k:2,s:69,v:190},{k:2,s:70,v:190},{k:2,s:71,v:190},{k:2,s:72,v:190},{k:2,s:73,v:190},{k:2,s:74,v:190},{k:2,s:75,v:190},{k:2,s:79,v:190},{k:2,s:80,v:190},{k:2,s:81,v:190},{k:2,s:82,v:190},{k:2,s:83,v:190},{k:2,s:84,v:190},{k:2,s:85,v:190},{k:2,s:86,v:190},{k:2,s:87,v:190},{k:2,s:88,v:190},{k:2,s:89,v:190},{k:2,s:90,v:190},{k:2,s:91,v:190},{k:2,s:92,v:190},{k:2,s:93,v:190},{k:2,s:94,v:190},{k:2,s:95,v:190},{k:2,s:96,v:190},{k:2,s:97,v:190},{k:2,s:98,v:190},{k:2,s:100,v:190},{k:2,s:101,v:190},{k:2,s:102,v:190},{k:2,s:103,v:190},{k:2,s:104,v:190},{k:2,s:105,v:190}],
 [{k:2,s:0,v:71},{k:2,s:7,v:71},{k:2,s:15,v:71},{k:2,s:24,v:71},{k:2,s:30,v:71},{k:2,s:37,v:71},{k:2,s:51,v:71},{k:2,s:52,v:71},{k:2,s:53,v:71},{k:2,s:54,v:71},{k:2,s:55,v:71},{k:2,s:58,v:71},{k:2,s:59,v:71},{k:2,s:60,v:71},{k:2,s:61,v:71},{k:2,s:62,v:71},{k:2,s:64,v:71},{k:2,s:65,v:71},{k:2,s:68,v:71},{k:2,s:69,v:71},{k:2,s:70,v:71},{k:2,s:71,v:71},{k:2,s:72,v:71},{k:2,s:73,v:71},{k:2,s:74,v:71},{k:2,s:75,v:71},{k:2,s:79,v:71},{k:2,s:80,v:71},{k:2,s:81,v:71},{k:2,s:82,v:71},{k:2,s:83,v:71},{k:2,s:84,v:71},{k:2,s:85,v:71},{k:2,s:86,v:71},{k:2,s:87,v:71},{k:2,s:88,v:71},{k:2,s:89,v:71},{k:2,s:90,v:71},{k:2,s:91,v:71},{k:2,s:92,v:71},{k:2,s:93,v:71},{k:2,s:94,v:71},{k:2,s:95,v:71},{k:2,s:96,v:71},{k:2,s:97,v:71},{k:2,s:98,v:71},{k:2,s:100,v:71},{k:2,s:101,v:71},{k:2,s:102,v:71},{k:2,s:103,v:71},{k:2,s:104,v:71},{k:2,s:105,v:71}],
 [{k:2,s:0,v:70},{k:2,s:7,v:70},{k:2,s:15,v:70},{k:2,s:24,v:70},{k:2,s:30,v:70},{k:2,s:37,v:70},{k:2,s:51,v:70},{k:2,s:52,v:70},{k:2,s:53,v:70},{k:2,s:54,v:70},{k:2,s:55,v:70},{k:2,s:58,v:70},{k:2,s:59,v:70},{k:2,s:60,v:70},{k:2,s:61,v:70},{k:2,s:62,v:70},{k:2,s:64,v:70},{k:2,s:65,v:70},{k:2,s:68,v:70},{k:2,s:69,v:70},{k:2,s:70,v:70},{k:2,s:71,v:70},{k:2,s:72,v:70},{k:2,s:73,v:70},{k:2,s:74,v:70},{k:2,s:75,v:70},{k:2,s:79,v:70},{k:2,s:80,v:70},{k:2,s:81,v:70},{k:2,s:82,v:70},{k:2,s:83,v:70},{k:2,s:84,v:70},{k:2,s:85,v:70},{k:2,s:86,v:70},{k:2,s:87,v:70},{k:2,s:88,v:70},{k:2,s:89,v:70},{k:2,s:90,v:70},{k:2,s:91,v:70},{k:2,s:92,v:70},{k:2,s:93,v:70},{k:2,s:94,v:70},{k:2,s:95,v:70},{k:2,s:96,v:70},{k:2,s:97,v:70},{k:2,s:98,v:70},{k:2,s:100,v:70},{k:2,s:101,v:70},{k:2,s:102,v:70},{k:2,s:103,v:70},{k:2,s:104,v:70},{k:2,s:105,v:70}],
 [{k:1,s:30,v:267},{k:3,s:123,v:504}],
 [{k:2,s:6,v:251},{k:2,s:7,v:251},{k:2,s:9,v:251},{k:2,s:10,v:251},{k:2,s:12,v:251},{k:2,s:13,v:251},{k:2,s:16,v:251},{k:2,s:17,v:251},{k:2,s:19,v:251},{k:2,s:20,v:251},{k:2,s:21,v:251},{k:2,s:23,v:251},{k:2,s:24,v:251},{k:2,s:25,v:251},{k:2,s:26,v:251},{k:2,s:27,v:251},{k:2,s:28,v:251},{k:2,s:31,v:251},{k:2,s:32,v:251},{k:2,s:34,v:251},{k:2,s:36,v:251},{k:2,s:37,v:251},{k:2,s:39,v:251},{k:2,s:40,v:251},{k:2,s:42,v:251},{k:2,s:45,v:251},{k:2,s:46,v:251},{k:2,s:47,v:251},{k:2,s:48,v:251},{k:2,s:78,v:251}],
 [{k:1,s:16,v:505},{k:1,s:19,v:366}],
 [{k:1,s:34,v:506}],
 [{k:2,s:19,v:136},{k:2,s:24,v:136},{k:2,s:34,v:136}],
 [{k:2,s:19,v:137},{k:2,s:34,v:137}],
 [{k:1,s:19,v:507},{k:1,s:34,v:508}],
 [{k:2,s:6,v:277},{k:2,s:9,v:277},{k:2,s:10,v:277},{k:2,s:12,v:277},{k:2,s:13,v:277},{k:2,s:16,v:277},{k:2,s:17,v:277},{k:2,s:19,v:277},{k:2,s:21,v:277},{k:2,s:23,v:277},{k:2,s:24,v:277},{k:2,s:25,v:277},{k:2,s:27,v:277},{k:2,s:28,v:277},{k:2,s:31,v:277},{k:2,s:32,v:277},{k:2,s:34,v:277},{k:2,s:36,v:277},{k:2,s:39,v:277},{k:2,s:40,v:277},{k:2,s:42,v:277},{k:2,s:45,v:277},{k:2,s:46,v:277},{k:2,s:47,v:277},{k:2,s:48,v:277},{k:2,s:78,v:277}],
 [{k:2,s:6,v:245},{k:2,s:7,v:245},{k:2,s:9,v:245},{k:2,s:10,v:245},{k:2,s:12,v:245},{k:2,s:13,v:245},{k:2,s:16,v:245},{k:2,s:17,v:245},{k:2,s:19,v:245},{k:2,s:20,v:245},{k:2,s:21,v:245},{k:2,s:23,v:245},{k:2,s:24,v:245},{k:2,s:25,v:245},{k:2,s:26,v:245},{k:2,s:27,v:245},{k:2,s:28,v:245},{k:2,s:31,v:245},{k:2,s:32,v:245},{k:2,s:34,v:245},{k:2,s:36,v:245},{k:2,s:37,v:245},{k:2,s:39,v:245},{k:2,s:40,v:245},{k:2,s:42,v:245},{k:2,s:45,v:245},{k:2,s:46,v:245},{k:2,s:47,v:245},{k:2,s:48,v:245},{k:2,s:78,v:245}],
 [{k:2,s:6,v:274},{k:2,s:9,v:274},{k:2,s:10,v:274},{k:2,s:12,v:274},{k:2,s:13,v:274},{k:2,s:16,v:274},{k:2,s:17,v:274},{k:2,s:19,v:274},{k:2,s:21,v:274},{k:2,s:23,v:274},{k:2,s:24,v:274},{k:2,s:25,v:274},{k:2,s:27,v:274},{k:2,s:28,v:274},{k:2,s:31,v:274},{k:2,s:32,v:274},{k:2,s:34,v:274},{k:2,s:36,v:274},{k:2,s:39,v:274},{k:2,s:40,v:274},{k:2,s:42,v:274},{k:2,s:45,v:274},{k:2,s:46,v:274},{k:2,s:47,v:274},{k:2,s:48,v:274},{k:2,s:78,v:274}],
 [{k:2,s:16,v:308},{k:2,s:19,v:308},{k:2,s:23,v:308},{k:2,s:24,v:308},{k:2,s:27,v:308},{k:2,s:34,v:308}],
 [{k:2,s:34,v:128},{k:2,s:51,v:128},{k:2,s:52,v:128},{k:2,s:55,v:128},{k:2,s:58,v:128},{k:2,s:61,v:128},{k:2,s:65,v:128},{k:2,s:68,v:128},{k:2,s:69,v:128},{k:2,s:74,v:128},{k:2,s:79,v:128},{k:2,s:80,v:128},{k:2,s:81,v:128},{k:2,s:85,v:128},{k:2,s:86,v:128},{k:2,s:87,v:128},{k:2,s:89,v:128},{k:2,s:92,v:128},{k:2,s:93,v:128},{k:2,s:97,v:128},{k:2,s:100,v:128},{k:2,s:102,v:128},{k:2,s:103,v:128}],
 [{k:1,s:15,v:509},{k:1,s:20,v:186}],
 [{k:1,s:15,v:510},{k:2,s:7,v:225},{k:2,s:20,v:225},{k:2,s:26,v:225},{k:2,s:37,v:225}],
 [{k:1,s:7,v:1},{k:1,s:15,v:2},{k:1,s:24,v:3},{k:1,s:30,v:4},{k:1,s:34,v:511},{k:1,s:37,v:5},{k:1,s:51,v:6},{k:1,s:52,v:7},{k:1,s:53,v:8},{k:1,s:54,v:9},{k:1,s:55,v:10},{k:1,s:58,v:11},{k:1,s:59,v:12},{k:1,s:61,v:14},{k:1,s:62,v:15},{k:1,s:64,v:16},{k:1,s:65,v:17},{k:1,s:68,v:18},{k:1,s:69,v:19},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:72,v:22},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:75,v:25},{k:1,s:79,v:27},{k:1,s:80,v:28},{k:1,s:81,v:29},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:85,v:33},{k:1,s:86,v:34},{k:1,s:87,v:35},{k:1,s:88,v:36},{k:1,s:89,v:37},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:92,v:40},{k:1,s:93,v:41},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:96,v:44},{k:1,s:97,v:45},{k:1,s:98,v:46},{k:1,s:100,v:47},{k:1,s:101,v:48},{k:1,s:103,v:50},{k:1,s:104,v:51},{k:1,s:105,v:52},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:112,v:55},{k:3,s:113,v:56},{k:3,s:116,v:57},{k:3,s:117,v:262},{k:3,s:119,v:58},{k:3,s:127,v:60},{k:3,s:129,v:62},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:142,v:66},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:148,v:69},{k:3,s:149,v:70},{k:3,s:154,v:71},{k:3,s:155,v:72},{k:3,s:157,v:74},{k:3,s:158,v:75},{k:3,s:162,v:76},{k:3,s:169,v:81},{k:3,s:171,v:82},{k:3,s:175,v:85},{k:3,s:176,v:86},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:182,v:160},{k:3,s:183,v:161},{k:3,s:188,v:91},{k:3,s:189,v:92},{k:3,s:190,v:162},{k:3,s:192,v:94},{k:3,s:193,v:95},{k:3,s:194,v:96},{k:3,s:195,v:97},{k:3,s:196,v:98},{k:3,s:197,v:99},{k:3,s:198,v:100},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:201,v:103},{k:3,s:202,v:104},{k:3,s:203,v:105},{k:3,s:205,v:106},{k:3,s:207,v:107},{k:3,s:209,v:163},{k:3,s:210,v:110},{k:3,s:213,v:111},{k:3,s:220,v:112},{k:3,s:222,v:113},{k:3,s:223,v:164},{k:3,s:232,v:116}],
 [{k:1,s:7,v:1},{k:1,s:15,v:2},{k:1,s:24,v:3},{k:1,s:30,v:4},{k:1,s:34,v:512},{k:1,s:37,v:5},{k:1,s:51,v:6},{k:1,s:52,v:7},{k:1,s:53,v:8},{k:1,s:54,v:9},{k:1,s:55,v:10},{k:1,s:58,v:11},{k:1,s:59,v:12},{k:1,s:61,v:14},{k:1,s:62,v:15},{k:1,s:64,v:16},{k:1,s:65,v:17},{k:1,s:68,v:18},{k:1,s:69,v:19},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:72,v:22},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:75,v:25},{k:1,s:79,v:27},{k:1,s:80,v:28},{k:1,s:81,v:29},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:85,v:33},{k:1,s:86,v:34},{k:1,s:87,v:35},{k:1,s:88,v:36},{k:1,s:89,v:37},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:92,v:40},{k:1,s:93,v:41},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:96,v:44},{k:1,s:97,v:45},{k:1,s:98,v:46},{k:1,s:100,v:47},{k:1,s:101,v:48},{k:1,s:103,v:50},{k:1,s:104,v:51},{k:1,s:105,v:52},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:112,v:55},{k:3,s:113,v:56},{k:3,s:116,v:57},{k:3,s:117,v:158},{k:3,s:118,v:513},{k:3,s:119,v:58},{k:3,s:127,v:60},{k:3,s:129,v:62},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:142,v:66},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:148,v:69},{k:3,s:149,v:70},{k:3,s:154,v:71},{k:3,s:155,v:72},{k:3,s:157,v:74},{k:3,s:158,v:75},{k:3,s:162,v:76},{k:3,s:169,v:81},{k:3,s:171,v:82},{k:3,s:175,v:85},{k:3,s:176,v:86},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:182,v:160},{k:3,s:183,v:161},{k:3,s:188,v:91},{k:3,s:189,v:92},{k:3,s:190,v:162},{k:3,s:192,v:94},{k:3,s:193,v:95},{k:3,s:194,v:96},{k:3,s:195,v:97},{k:3,s:196,v:98},{k:3,s:197,v:99},{k:3,s:198,v:100},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:201,v:103},{k:3,s:202,v:104},{k:3,s:203,v:105},{k:3,s:205,v:106},{k:3,s:207,v:107},{k:3,s:209,v:163},{k:3,s:210,v:110},{k:3,s:213,v:111},{k:3,s:220,v:112},{k:3,s:222,v:113},{k:3,s:223,v:164},{k:3,s:232,v:116}],
 [{k:2,s:34,v:121},{k:2,s:51,v:121},{k:2,s:52,v:121},{k:2,s:55,v:121},{k:2,s:58,v:121},{k:2,s:61,v:121},{k:2,s:65,v:121},{k:2,s:68,v:121},{k:2,s:69,v:121},{k:2,s:74,v:121},{k:2,s:79,v:121},{k:2,s:80,v:121},{k:2,s:81,v:121},{k:2,s:85,v:121},{k:2,s:86,v:121},{k:2,s:87,v:121},{k:2,s:89,v:121},{k:2,s:92,v:121},{k:2,s:93,v:121},{k:2,s:97,v:121},{k:2,s:100,v:121},{k:2,s:102,v:121},{k:2,s:103,v:121}],
 [{k:2,s:34,v:120},{k:2,s:51,v:120},{k:2,s:52,v:120},{k:2,s:55,v:120},{k:2,s:58,v:120},{k:2,s:61,v:120},{k:2,s:65,v:120},{k:2,s:68,v:120},{k:2,s:69,v:120},{k:2,s:74,v:120},{k:2,s:79,v:120},{k:2,s:80,v:120},{k:2,s:81,v:120},{k:2,s:85,v:120},{k:2,s:86,v:120},{k:2,s:87,v:120},{k:2,s:89,v:120},{k:2,s:92,v:120},{k:2,s:93,v:120},{k:2,s:97,v:120},{k:2,s:100,v:120},{k:2,s:102,v:120},{k:2,s:103,v:120}],
 [{k:1,s:30,v:419},{k:3,s:139,v:514}],
 [{k:2,s:30,v:124},{k:2,s:99,v:124}],
 [{k:1,s:16,v:515},{k:1,s:19,v:453}],
 [{k:2,s:19,v:80},{k:2,s:30,v:80}],
 [{k:1,s:24,v:516}],
 [{k:2,s:0,v:200},{k:2,s:7,v:200},{k:2,s:15,v:200},{k:2,s:24,v:200},{k:2,s:30,v:200},{k:2,s:34,v:200},{k:2,s:37,v:200},{k:2,s:51,v:200},{k:2,s:52,v:200},{k:2,s:53,v:200},{k:2,s:54,v:200},{k:2,s:55,v:200},{k:2,s:56,v:200},{k:2,s:58,v:200},{k:2,s:59,v:200},{k:2,s:60,v:200},{k:2,s:61,v:200},{k:2,s:62,v:200},{k:2,s:63,v:200},{k:2,s:64,v:200},{k:2,s:65,v:200},{k:2,s:68,v:200},{k:2,s:69,v:200},{k:2,s:70,v:200},{k:2,s:71,v:200},{k:2,s:72,v:200},{k:2,s:73,v:200},{k:2,s:74,v:200},{k:2,s:75,v:200},{k:2,s:79,v:200},{k:2,s:80,v:200},{k:2,s:81,v:200},{k:2,s:82,v:200},{k:2,s:83,v:200},{k:2,s:84,v:200},{k:2,s:85,v:200},{k:2,s:86,v:200},{k:2,s:87,v:200},{k:2,s:88,v:200},{k:2,s:89,v:200},{k:2,s:90,v:200},{k:2,s:91,v:200},{k:2,s:92,v:200},{k:2,s:93,v:200},{k:2,s:94,v:200},{k:2,s:95,v:200},{k:2,s:96,v:200},{k:2,s:97,v:200},{k:2,s:98,v:200},{k:2,s:100,v:200},{k:2,s:101,v:200},{k:2,s:102,v:200},{k:2,s:103,v:200},{k:2,s:104,v:200},{k:2,s:105,v:200}],
 [{k:1,s:7,v:1},{k:1,s:15,v:2},{k:1,s:24,v:3},{k:1,s:30,v:4},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:54,v:9},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:62,v:15},{k:1,s:64,v:16},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:72,v:22},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:75,v:25},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:88,v:36},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:96,v:44},{k:1,s:98,v:46},{k:1,s:101,v:48},{k:1,s:104,v:51},{k:1,s:105,v:52},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:113,v:56},{k:3,s:116,v:57},{k:3,s:119,v:58},{k:3,s:127,v:60},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:142,v:66},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:148,v:69},{k:3,s:149,v:70},{k:3,s:154,v:71},{k:3,s:155,v:72},{k:3,s:158,v:75},{k:3,s:162,v:76},{k:3,s:169,v:81},{k:3,s:171,v:82},{k:3,s:175,v:85},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:188,v:91},{k:3,s:192,v:153},{k:3,s:194,v:96},{k:3,s:195,v:97},{k:3,s:196,v:98},{k:3,s:197,v:99},{k:3,s:198,v:100},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:205,v:106},{k:3,s:207,v:107},{k:3,s:209,v:517},{k:3,s:210,v:110},{k:3,s:213,v:111},{k:3,s:220,v:112},{k:3,s:222,v:113},{k:3,s:232,v:116}],
 [{k:1,s:7,v:1},{k:1,s:15,v:2},{k:1,s:24,v:3},{k:1,s:30,v:4},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:54,v:9},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:62,v:15},{k:1,s:64,v:16},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:72,v:22},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:75,v:25},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:88,v:36},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:96,v:44},{k:1,s:98,v:46},{k:1,s:101,v:48},{k:1,s:104,v:51},{k:1,s:105,v:52},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:113,v:56},{k:3,s:116,v:57},{k:3,s:119,v:58},{k:3,s:127,v:60},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:142,v:66},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:148,v:69},{k:3,s:149,v:70},{k:3,s:154,v:71},{k:3,s:155,v:72},{k:3,s:158,v:75},{k:3,s:162,v:76},{k:3,s:169,v:81},{k:3,s:171,v:82},{k:3,s:175,v:85},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:188,v:91},{k:3,s:192,v:153},{k:3,s:194,v:96},{k:3,s:195,v:97},{k:3,s:196,v:98},{k:3,s:197,v:99},{k:3,s:198,v:100},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:205,v:106},{k:3,s:207,v:107},{k:3,s:209,v:518},{k:3,s:210,v:110},{k:3,s:213,v:111},{k:3,s:220,v:112},{k:3,s:222,v:113},{k:3,s:232,v:116}],
 [{k:1,s:16,v:519}],
 [{k:1,s:7,v:1},{k:1,s:15,v:2},{k:1,s:24,v:3},{k:1,s:30,v:4},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:54,v:9},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:62,v:15},{k:1,s:64,v:16},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:72,v:22},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:75,v:25},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:88,v:36},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:96,v:44},{k:1,s:98,v:46},{k:1,s:101,v:48},{k:1,s:104,v:51},{k:1,s:105,v:52},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:113,v:56},{k:3,s:116,v:57},{k:3,s:119,v:58},{k:3,s:127,v:60},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:142,v:66},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:148,v:69},{k:3,s:149,v:70},{k:3,s:154,v:71},{k:3,s:155,v:72},{k:3,s:158,v:75},{k:3,s:162,v:76},{k:3,s:169,v:81},{k:3,s:171,v:82},{k:3,s:175,v:85},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:188,v:91},{k:3,s:192,v:153},{k:3,s:194,v:96},{k:3,s:195,v:97},{k:3,s:196,v:98},{k:3,s:197,v:99},{k:3,s:198,v:100},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:205,v:106},{k:3,s:207,v:107},{k:3,s:209,v:520},{k:3,s:210,v:110},{k:3,s:213,v:111},{k:3,s:220,v:112},{k:3,s:222,v:113},{k:3,s:232,v:116}],
 [{k:1,s:16,v:521}],
 [{k:1,s:7,v:1},{k:1,s:15,v:2},{k:1,s:16,v:522},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:113,v:56},{k:3,s:127,v:60},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:155,v:72},{k:3,s:158,v:75},{k:3,s:164,v:523},{k:3,s:175,v:85},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:188,v:91},{k:3,s:192,v:153},{k:3,s:194,v:96},{k:3,s:195,v:97},{k:3,s:196,v:98},{k:3,s:197,v:99},{k:3,s:198,v:100},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:207,v:107},{k:3,s:210,v:279},{k:3,s:211,v:430}],
 [{k:1,s:7,v:1},{k:1,s:15,v:2},{k:1,s:24,v:524},{k:1,s:37,v:5},{k:1,s:51,v:6},{k:1,s:52,v:7},{k:1,s:53,v:8},{k:1,s:55,v:10},{k:1,s:58,v:11},{k:1,s:59,v:12},{k:1,s:61,v:14},{k:1,s:65,v:17},{k:1,s:68,v:18},{k:1,s:69,v:19},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:27},{k:1,s:80,v:28},{k:1,s:81,v:29},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:85,v:33},{k:1,s:86,v:34},{k:1,s:87,v:35},{k:1,s:89,v:37},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:92,v:40},{k:1,s:93,v:41},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:97,v:45},{k:1,s:98,v:46},{k:1,s:100,v:47},{k:1,s:103,v:50},{k:1,s:104,v:51},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:112,v:55},{k:3,s:113,v:56},{k:3,s:127,v:60},{k:3,s:129,v:62},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:155,v:72},{k:3,s:157,v:74},{k:3,s:158,v:75},{k:3,s:159,v:525},{k:3,s:175,v:85},{k:3,s:176,v:86},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:182,v:278},{k:3,s:188,v:91},{k:3,s:189,v:92},{k:3,s:190,v:162},{k:3,s:192,v:94},{k:3,s:193,v:95},{k:3,s:194,v:96},{k:3,s:195,v:97},{k:3,s:196,v:98},{k:3,s:197,v:99},{k:3,s:198,v:100},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:201,v:103},{k:3,s:202,v:104},{k:3,s:203,v:105},{k:3,s:207,v:107},{k:3,s:210,v:279},{k:3,s:211,v:280},{k:3,s:223,v:164}],
 [{k:1,s:6,v:117},{k:1,s:7,v:1},{k:1,s:8,v:118},{k:1,s:15,v:119},{k:1,s:35,v:120},{k:1,s:36,v:121},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:106,v:141},{k:3,s:107,v:142},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:113,v:143},{k:3,s:114,v:144},{k:3,s:120,v:129},{k:3,s:127,v:130},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:135,v:145},{k:3,s:136,v:146},{k:3,s:137,v:147},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:150,v:148},{k:3,s:151,v:149},{k:3,s:153,v:526},{k:3,s:155,v:72},{k:3,s:158,v:75},{k:3,s:174,v:151},{k:3,s:175,v:85},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:188,v:132},{k:3,s:191,v:152},{k:3,s:192,v:153},{k:3,s:194,v:134},{k:3,s:195,v:135},{k:3,s:196,v:136},{k:3,s:197,v:137},{k:3,s:198,v:138},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:204,v:154},{k:3,s:206,v:155},{k:3,s:207,v:107},{k:3,s:225,v:156},{k:3,s:226,v:140}],
 [{k:1,s:6,v:117},{k:1,s:7,v:1},{k:1,s:8,v:118},{k:1,s:15,v:119},{k:1,s:35,v:120},{k:1,s:36,v:121},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:106,v:141},{k:3,s:107,v:142},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:113,v:143},{k:3,s:114,v:144},{k:3,s:120,v:129},{k:3,s:127,v:130},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:135,v:145},{k:3,s:136,v:146},{k:3,s:137,v:147},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:150,v:148},{k:3,s:151,v:149},{k:3,s:153,v:527},{k:3,s:155,v:72},{k:3,s:158,v:75},{k:3,s:174,v:151},{k:3,s:175,v:85},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:188,v:132},{k:3,s:191,v:152},{k:3,s:192,v:153},{k:3,s:194,v:134},{k:3,s:195,v:135},{k:3,s:196,v:136},{k:3,s:197,v:137},{k:3,s:198,v:138},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:204,v:154},{k:3,s:206,v:155},{k:3,s:207,v:107},{k:3,s:225,v:156},{k:3,s:226,v:140}],
 [{k:1,s:7,v:1},{k:1,s:15,v:2},{k:1,s:24,v:3},{k:1,s:30,v:4},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:54,v:9},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:62,v:15},{k:1,s:64,v:16},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:72,v:22},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:75,v:25},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:88,v:36},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:96,v:44},{k:1,s:98,v:46},{k:1,s:101,v:48},{k:1,s:104,v:51},{k:1,s:105,v:52},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:113,v:56},{k:3,s:116,v:57},{k:3,s:119,v:58},{k:3,s:127,v:60},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:142,v:66},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:148,v:69},{k:3,s:149,v:70},{k:3,s:154,v:71},{k:3,s:155,v:72},{k:3,s:158,v:75},{k:3,s:162,v:76},{k:3,s:169,v:81},{k:3,s:171,v:82},{k:3,s:175,v:85},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:188,v:91},{k:3,s:192,v:153},{k:3,s:194,v:96},{k:3,s:195,v:97},{k:3,s:196,v:98},{k:3,s:197,v:99},{k:3,s:198,v:100},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:205,v:106},{k:3,s:207,v:107},{k:3,s:209,v:528},{k:3,s:210,v:110},{k:3,s:213,v:111},{k:3,s:220,v:112},{k:3,s:222,v:113},{k:3,s:232,v:116}],
 [{k:2,s:6,v:252},{k:2,s:7,v:252},{k:2,s:9,v:252},{k:2,s:10,v:252},{k:2,s:12,v:252},{k:2,s:13,v:252},{k:2,s:16,v:252},{k:2,s:17,v:252},{k:2,s:19,v:252},{k:2,s:20,v:252},{k:2,s:21,v:252},{k:2,s:23,v:252},{k:2,s:24,v:252},{k:2,s:25,v:252},{k:2,s:26,v:252},{k:2,s:27,v:252},{k:2,s:28,v:252},{k:2,s:31,v:252},{k:2,s:32,v:252},{k:2,s:34,v:252},{k:2,s:36,v:252},{k:2,s:37,v:252},{k:2,s:39,v:252},{k:2,s:40,v:252},{k:2,s:42,v:252},{k:2,s:45,v:252},{k:2,s:46,v:252},{k:2,s:47,v:252},{k:2,s:48,v:252},{k:2,s:78,v:252}],
 [{k:2,s:0,v:182},{k:2,s:7,v:182},{k:2,s:15,v:182},{k:2,s:24,v:182},{k:2,s:30,v:182},{k:2,s:34,v:182},{k:2,s:37,v:182},{k:2,s:51,v:182},{k:2,s:52,v:182},{k:2,s:53,v:182},{k:2,s:54,v:182},{k:2,s:55,v:182},{k:2,s:56,v:182},{k:2,s:58,v:182},{k:2,s:59,v:182},{k:2,s:60,v:182},{k:2,s:61,v:182},{k:2,s:62,v:182},{k:2,s:63,v:182},{k:2,s:64,v:182},{k:2,s:65,v:182},{k:2,s:66,v:182},{k:2,s:68,v:182},{k:2,s:69,v:182},{k:2,s:70,v:182},{k:2,s:71,v:182},{k:2,s:72,v:182},{k:2,s:73,v:182},{k:2,s:74,v:182},{k:2,s:75,v:182},{k:2,s:79,v:182},{k:2,s:80,v:182},{k:2,s:81,v:182},{k:2,s:82,v:182},{k:2,s:83,v:182},{k:2,s:84,v:182},{k:2,s:85,v:182},{k:2,s:86,v:182},{k:2,s:87,v:182},{k:2,s:88,v:182},{k:2,s:89,v:182},{k:2,s:90,v:182},{k:2,s:91,v:182},{k:2,s:92,v:182},{k:2,s:93,v:182},{k:2,s:94,v:182},{k:2,s:95,v:182},{k:2,s:96,v:182},{k:2,s:97,v:182},{k:2,s:98,v:182},{k:2,s:100,v:182},{k:2,s:101,v:182},{k:2,s:102,v:182},{k:2,s:103,v:182},{k:2,s:104,v:182},{k:2,s:105,v:182}],
 [{k:1,s:6,v:117},{k:1,s:7,v:1},{k:1,s:8,v:118},{k:1,s:15,v:119},{k:1,s:35,v:120},{k:1,s:36,v:121},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:106,v:141},{k:3,s:107,v:142},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:113,v:143},{k:3,s:114,v:144},{k:3,s:120,v:129},{k:3,s:127,v:130},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:135,v:145},{k:3,s:136,v:146},{k:3,s:137,v:147},{k:3,s:138,v:529},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:150,v:148},{k:3,s:151,v:149},{k:3,s:153,v:530},{k:3,s:155,v:72},{k:3,s:158,v:75},{k:3,s:174,v:151},{k:3,s:175,v:85},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:188,v:132},{k:3,s:191,v:152},{k:3,s:192,v:153},{k:3,s:194,v:134},{k:3,s:195,v:135},{k:3,s:196,v:136},{k:3,s:197,v:137},{k:3,s:198,v:138},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:204,v:154},{k:3,s:206,v:155},{k:3,s:207,v:107},{k:3,s:225,v:156},{k:3,s:226,v:140}],
 [{k:1,s:23,v:531}],
 [{k:2,s:34,v:183},{k:2,s:56,v:183},{k:2,s:63,v:183}],
 [{k:1,s:34,v:532},{k:1,s:56,v:495},{k:1,s:63,v:496},{k:3,s:216,v:533},{k:3,s:218,v:499},{k:3,s:219,v:534}],
 [{k:2,s:7,v:186},{k:2,s:15,v:186},{k:2,s:24,v:186},{k:2,s:30,v:186},{k:2,s:34,v:186},{k:2,s:37,v:186},{k:2,s:51,v:186},{k:2,s:52,v:186},{k:2,s:53,v:186},{k:2,s:54,v:186},{k:2,s:55,v:186},{k:2,s:56,v:186},{k:2,s:58,v:186},{k:2,s:59,v:186},{k:2,s:61,v:186},{k:2,s:62,v:186},{k:2,s:63,v:186},{k:2,s:64,v:186},{k:2,s:65,v:186},{k:2,s:68,v:186},{k:2,s:69,v:186},{k:2,s:70,v:186},{k:2,s:71,v:186},{k:2,s:72,v:186},{k:2,s:73,v:186},{k:2,s:74,v:186},{k:2,s:75,v:186},{k:2,s:79,v:186},{k:2,s:80,v:186},{k:2,s:81,v:186},{k:2,s:82,v:186},{k:2,s:83,v:186},{k:2,s:84,v:186},{k:2,s:85,v:186},{k:2,s:86,v:186},{k:2,s:87,v:186},{k:2,s:88,v:186},{k:2,s:89,v:186},{k:2,s:90,v:186},{k:2,s:91,v:186},{k:2,s:92,v:186},{k:2,s:93,v:186},{k:2,s:94,v:186},{k:2,s:95,v:186},{k:2,s:96,v:186},{k:2,s:97,v:186},{k:2,s:98,v:186},{k:2,s:100,v:186},{k:2,s:101,v:186},{k:2,s:103,v:186},{k:2,s:104,v:186},{k:2,s:105,v:186}],
 [{k:1,s:7,v:1},{k:1,s:15,v:2},{k:1,s:24,v:3},{k:1,s:30,v:4},{k:1,s:34,v:535},{k:1,s:37,v:5},{k:1,s:51,v:6},{k:1,s:52,v:7},{k:1,s:53,v:8},{k:1,s:54,v:9},{k:1,s:55,v:10},{k:1,s:56,v:495},{k:1,s:58,v:11},{k:1,s:59,v:12},{k:1,s:61,v:14},{k:1,s:62,v:15},{k:1,s:63,v:496},{k:1,s:64,v:16},{k:1,s:65,v:17},{k:1,s:68,v:18},{k:1,s:69,v:19},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:72,v:22},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:75,v:25},{k:1,s:79,v:27},{k:1,s:80,v:28},{k:1,s:81,v:29},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:85,v:33},{k:1,s:86,v:34},{k:1,s:87,v:35},{k:1,s:88,v:36},{k:1,s:89,v:37},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:92,v:40},{k:1,s:93,v:41},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:96,v:44},{k:1,s:97,v:45},{k:1,s:98,v:46},{k:1,s:100,v:47},{k:1,s:101,v:48},{k:1,s:103,v:50},{k:1,s:104,v:51},{k:1,s:105,v:52},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:112,v:55},{k:3,s:113,v:56},{k:3,s:116,v:57},{k:3,s:117,v:158},{k:3,s:118,v:536},{k:3,s:119,v:58},{k:3,s:127,v:60},{k:3,s:129,v:62},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:142,v:66},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:148,v:69},{k:3,s:149,v:70},{k:3,s:154,v:71},{k:3,s:155,v:72},{k:3,s:157,v:74},{k:3,s:158,v:75},{k:3,s:162,v:76},{k:3,s:169,v:81},{k:3,s:171,v:82},{k:3,s:175,v:85},{k:3,s:176,v:86},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:182,v:160},{k:3,s:183,v:161},{k:3,s:188,v:91},{k:3,s:189,v:92},{k:3,s:190,v:162},{k:3,s:192,v:94},{k:3,s:193,v:95},{k:3,s:194,v:96},{k:3,s:195,v:97},{k:3,s:196,v:98},{k:3,s:197,v:99},{k:3,s:198,v:100},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:201,v:103},{k:3,s:202,v:104},{k:3,s:203,v:105},{k:3,s:205,v:106},{k:3,s:207,v:107},{k:3,s:209,v:163},{k:3,s:210,v:110},{k:3,s:213,v:111},{k:3,s:218,v:537},{k:3,s:220,v:112},{k:3,s:222,v:113},{k:3,s:223,v:164},{k:3,s:232,v:116}],
 [{k:1,s:30,v:4},{k:3,s:116,v:538}],
 [{k:2,s:16,v:112},{k:2,s:19,v:112}],
 [{k:2,s:19,v:116},{k:2,s:24,v:116},{k:2,s:30,v:116}],
 [{k:2,s:0,v:69},{k:2,s:7,v:69},{k:2,s:15,v:69},{k:2,s:24,v:69},{k:2,s:30,v:69},{k:2,s:37,v:69},{k:2,s:51,v:69},{k:2,s:52,v:69},{k:2,s:53,v:69},{k:2,s:54,v:69},{k:2,s:55,v:69},{k:2,s:58,v:69},{k:2,s:59,v:69},{k:2,s:60,v:69},{k:2,s:61,v:69},{k:2,s:62,v:69},{k:2,s:64,v:69},{k:2,s:65,v:69},{k:2,s:68,v:69},{k:2,s:69,v:69},{k:2,s:70,v:69},{k:2,s:71,v:69},{k:2,s:72,v:69},{k:2,s:73,v:69},{k:2,s:74,v:69},{k:2,s:75,v:69},{k:2,s:79,v:69},{k:2,s:80,v:69},{k:2,s:81,v:69},{k:2,s:82,v:69},{k:2,s:83,v:69},{k:2,s:84,v:69},{k:2,s:85,v:69},{k:2,s:86,v:69},{k:2,s:87,v:69},{k:2,s:88,v:69},{k:2,s:89,v:69},{k:2,s:90,v:69},{k:2,s:91,v:69},{k:2,s:92,v:69},{k:2,s:93,v:69},{k:2,s:94,v:69},{k:2,s:95,v:69},{k:2,s:96,v:69},{k:2,s:97,v:69},{k:2,s:98,v:69},{k:2,s:100,v:69},{k:2,s:101,v:69},{k:2,s:102,v:69},{k:2,s:103,v:69},{k:2,s:104,v:69},{k:2,s:105,v:69}],
 [{k:2,s:6,v:250},{k:2,s:7,v:250},{k:2,s:9,v:250},{k:2,s:10,v:250},{k:2,s:12,v:250},{k:2,s:13,v:250},{k:2,s:16,v:250},{k:2,s:17,v:250},{k:2,s:19,v:250},{k:2,s:20,v:250},{k:2,s:21,v:250},{k:2,s:23,v:250},{k:2,s:24,v:250},{k:2,s:25,v:250},{k:2,s:26,v:250},{k:2,s:27,v:250},{k:2,s:28,v:250},{k:2,s:31,v:250},{k:2,s:32,v:250},{k:2,s:34,v:250},{k:2,s:36,v:250},{k:2,s:37,v:250},{k:2,s:39,v:250},{k:2,s:40,v:250},{k:2,s:42,v:250},{k:2,s:45,v:250},{k:2,s:46,v:250},{k:2,s:47,v:250},{k:2,s:48,v:250},{k:2,s:78,v:250}],
 [{k:2,s:19,v:135},{k:2,s:24,v:135},{k:2,s:34,v:135}],
 [{k:1,s:6,v:117},{k:1,s:7,v:1},{k:1,s:8,v:118},{k:1,s:15,v:119},{k:1,s:30,v:405},{k:1,s:34,v:539},{k:1,s:35,v:120},{k:1,s:36,v:121},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:106,v:141},{k:3,s:107,v:142},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:111,v:406},{k:3,s:113,v:143},{k:3,s:114,v:144},{k:3,s:120,v:129},{k:3,s:127,v:130},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:135,v:145},{k:3,s:136,v:146},{k:3,s:137,v:147},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:150,v:148},{k:3,s:151,v:149},{k:3,s:153,v:407},{k:3,s:155,v:72},{k:3,s:158,v:75},{k:3,s:174,v:151},{k:3,s:175,v:85},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:188,v:132},{k:3,s:191,v:152},{k:3,s:192,v:153},{k:3,s:194,v:134},{k:3,s:195,v:135},{k:3,s:196,v:136},{k:3,s:197,v:137},{k:3,s:198,v:138},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:204,v:154},{k:3,s:206,v:155},{k:3,s:207,v:107},{k:3,s:225,v:156},{k:3,s:226,v:140},{k:3,s:230,v:540}],
 [{k:2,s:19,v:134},{k:2,s:24,v:134},{k:2,s:34,v:134}],
 [{k:1,s:6,v:117},{k:1,s:7,v:1},{k:1,s:8,v:118},{k:1,s:15,v:119},{k:1,s:16,v:541},{k:1,s:35,v:120},{k:1,s:36,v:121},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:106,v:141},{k:3,s:107,v:142},{k:3,s:108,v:542},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:113,v:143},{k:3,s:114,v:144},{k:3,s:120,v:129},{k:3,s:127,v:130},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:135,v:145},{k:3,s:136,v:146},{k:3,s:137,v:147},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:150,v:148},{k:3,s:151,v:149},{k:3,s:153,v:274},{k:3,s:155,v:72},{k:3,s:158,v:75},{k:3,s:174,v:151},{k:3,s:175,v:85},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:188,v:132},{k:3,s:191,v:152},{k:3,s:192,v:153},{k:3,s:194,v:134},{k:3,s:195,v:135},{k:3,s:196,v:136},{k:3,s:197,v:137},{k:3,s:198,v:138},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:204,v:154},{k:3,s:206,v:155},{k:3,s:207,v:107},{k:3,s:225,v:156},{k:3,s:226,v:140}],
 [{k:1,s:6,v:117},{k:1,s:7,v:1},{k:1,s:8,v:118},{k:1,s:15,v:119},{k:1,s:16,v:543},{k:1,s:35,v:120},{k:1,s:36,v:121},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:106,v:141},{k:3,s:107,v:142},{k:3,s:108,v:544},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:113,v:143},{k:3,s:114,v:144},{k:3,s:120,v:129},{k:3,s:127,v:130},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:135,v:145},{k:3,s:136,v:146},{k:3,s:137,v:147},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:150,v:148},{k:3,s:151,v:149},{k:3,s:153,v:274},{k:3,s:155,v:72},{k:3,s:158,v:75},{k:3,s:174,v:151},{k:3,s:175,v:85},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:188,v:132},{k:3,s:191,v:152},{k:3,s:192,v:153},{k:3,s:194,v:134},{k:3,s:195,v:135},{k:3,s:196,v:136},{k:3,s:197,v:137},{k:3,s:198,v:138},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:204,v:154},{k:3,s:206,v:155},{k:3,s:207,v:107},{k:3,s:225,v:156},{k:3,s:226,v:140}],
 [{k:2,s:34,v:127},{k:2,s:51,v:127},{k:2,s:52,v:127},{k:2,s:55,v:127},{k:2,s:58,v:127},{k:2,s:61,v:127},{k:2,s:65,v:127},{k:2,s:68,v:127},{k:2,s:69,v:127},{k:2,s:74,v:127},{k:2,s:79,v:127},{k:2,s:80,v:127},{k:2,s:81,v:127},{k:2,s:85,v:127},{k:2,s:86,v:127},{k:2,s:87,v:127},{k:2,s:89,v:127},{k:2,s:92,v:127},{k:2,s:93,v:127},{k:2,s:97,v:127},{k:2,s:100,v:127},{k:2,s:102,v:127},{k:2,s:103,v:127}],
 [{k:2,s:34,v:126},{k:2,s:51,v:126},{k:2,s:52,v:126},{k:2,s:55,v:126},{k:2,s:58,v:126},{k:2,s:61,v:126},{k:2,s:65,v:126},{k:2,s:68,v:126},{k:2,s:69,v:126},{k:2,s:74,v:126},{k:2,s:79,v:126},{k:2,s:80,v:126},{k:2,s:81,v:126},{k:2,s:85,v:126},{k:2,s:86,v:126},{k:2,s:87,v:126},{k:2,s:89,v:126},{k:2,s:92,v:126},{k:2,s:93,v:126},{k:2,s:97,v:126},{k:2,s:100,v:126},{k:2,s:102,v:126},{k:2,s:103,v:126}],
 [{k:1,s:7,v:1},{k:1,s:15,v:2},{k:1,s:24,v:3},{k:1,s:30,v:4},{k:1,s:34,v:545},{k:1,s:37,v:5},{k:1,s:51,v:6},{k:1,s:52,v:7},{k:1,s:53,v:8},{k:1,s:54,v:9},{k:1,s:55,v:10},{k:1,s:58,v:11},{k:1,s:59,v:12},{k:1,s:61,v:14},{k:1,s:62,v:15},{k:1,s:64,v:16},{k:1,s:65,v:17},{k:1,s:68,v:18},{k:1,s:69,v:19},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:72,v:22},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:75,v:25},{k:1,s:79,v:27},{k:1,s:80,v:28},{k:1,s:81,v:29},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:85,v:33},{k:1,s:86,v:34},{k:1,s:87,v:35},{k:1,s:88,v:36},{k:1,s:89,v:37},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:92,v:40},{k:1,s:93,v:41},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:96,v:44},{k:1,s:97,v:45},{k:1,s:98,v:46},{k:1,s:100,v:47},{k:1,s:101,v:48},{k:1,s:103,v:50},{k:1,s:104,v:51},{k:1,s:105,v:52},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:112,v:55},{k:3,s:113,v:56},{k:3,s:116,v:57},{k:3,s:117,v:262},{k:3,s:119,v:58},{k:3,s:127,v:60},{k:3,s:129,v:62},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:142,v:66},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:148,v:69},{k:3,s:149,v:70},{k:3,s:154,v:71},{k:3,s:155,v:72},{k:3,s:157,v:74},{k:3,s:158,v:75},{k:3,s:162,v:76},{k:3,s:169,v:81},{k:3,s:171,v:82},{k:3,s:175,v:85},{k:3,s:176,v:86},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:182,v:160},{k:3,s:183,v:161},{k:3,s:188,v:91},{k:3,s:189,v:92},{k:3,s:190,v:162},{k:3,s:192,v:94},{k:3,s:193,v:95},{k:3,s:194,v:96},{k:3,s:195,v:97},{k:3,s:196,v:98},{k:3,s:197,v:99},{k:3,s:198,v:100},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:201,v:103},{k:3,s:202,v:104},{k:3,s:203,v:105},{k:3,s:205,v:106},{k:3,s:207,v:107},{k:3,s:209,v:163},{k:3,s:210,v:110},{k:3,s:213,v:111},{k:3,s:220,v:112},{k:3,s:222,v:113},{k:3,s:223,v:164},{k:3,s:232,v:116}],
 [{k:2,s:34,v:119},{k:2,s:51,v:119},{k:2,s:52,v:119},{k:2,s:55,v:119},{k:2,s:58,v:119},{k:2,s:61,v:119},{k:2,s:65,v:119},{k:2,s:68,v:119},{k:2,s:69,v:119},{k:2,s:74,v:119},{k:2,s:79,v:119},{k:2,s:80,v:119},{k:2,s:81,v:119},{k:2,s:85,v:119},{k:2,s:86,v:119},{k:2,s:87,v:119},{k:2,s:89,v:119},{k:2,s:92,v:119},{k:2,s:93,v:119},{k:2,s:97,v:119},{k:2,s:100,v:119},{k:2,s:102,v:119},{k:2,s:103,v:119}],
 [{k:2,s:30,v:123},{k:2,s:99,v:123}],
 [{k:2,s:0,v:192},{k:2,s:7,v:192},{k:2,s:15,v:192},{k:2,s:24,v:192},{k:2,s:30,v:192},{k:2,s:34,v:192},{k:2,s:37,v:192},{k:2,s:51,v:192},{k:2,s:52,v:192},{k:2,s:53,v:192},{k:2,s:54,v:192},{k:2,s:55,v:192},{k:2,s:56,v:192},{k:2,s:58,v:192},{k:2,s:59,v:192},{k:2,s:60,v:192},{k:2,s:61,v:192},{k:2,s:62,v:192},{k:2,s:63,v:192},{k:2,s:64,v:192},{k:2,s:65,v:192},{k:2,s:66,v:192},{k:2,s:68,v:192},{k:2,s:69,v:192},{k:2,s:70,v:192},{k:2,s:71,v:192},{k:2,s:72,v:192},{k:2,s:73,v:192},{k:2,s:74,v:192},{k:2,s:75,v:192},{k:2,s:79,v:192},{k:2,s:80,v:192},{k:2,s:81,v:192},{k:2,s:82,v:192},{k:2,s:83,v:192},{k:2,s:84,v:192},{k:2,s:85,v:192},{k:2,s:86,v:192},{k:2,s:87,v:192},{k:2,s:88,v:192},{k:2,s:89,v:192},{k:2,s:90,v:192},{k:2,s:91,v:192},{k:2,s:92,v:192},{k:2,s:93,v:192},{k:2,s:94,v:192},{k:2,s:95,v:192},{k:2,s:96,v:192},{k:2,s:97,v:192},{k:2,s:98,v:192},{k:2,s:100,v:192},{k:2,s:101,v:192},{k:2,s:102,v:192},{k:2,s:103,v:192},{k:2,s:104,v:192},{k:2,s:105,v:192}],
 [{k:2,s:0,v:199},{k:2,s:7,v:199},{k:2,s:15,v:199},{k:2,s:24,v:199},{k:2,s:30,v:199},{k:2,s:34,v:199},{k:2,s:37,v:199},{k:2,s:51,v:199},{k:2,s:52,v:199},{k:2,s:53,v:199},{k:2,s:54,v:199},{k:2,s:55,v:199},{k:2,s:56,v:199},{k:2,s:58,v:199},{k:2,s:59,v:199},{k:2,s:60,v:199},{k:2,s:61,v:199},{k:2,s:62,v:199},{k:2,s:63,v:199},{k:2,s:64,v:199},{k:2,s:65,v:199},{k:2,s:68,v:199},{k:2,s:69,v:199},{k:2,s:70,v:199},{k:2,s:71,v:199},{k:2,s:72,v:199},{k:2,s:73,v:199},{k:2,s:74,v:199},{k:2,s:75,v:199},{k:2,s:79,v:199},{k:2,s:80,v:199},{k:2,s:81,v:199},{k:2,s:82,v:199},{k:2,s:83,v:199},{k:2,s:84,v:199},{k:2,s:85,v:199},{k:2,s:86,v:199},{k:2,s:87,v:199},{k:2,s:88,v:199},{k:2,s:89,v:199},{k:2,s:90,v:199},{k:2,s:91,v:199},{k:2,s:92,v:199},{k:2,s:93,v:199},{k:2,s:94,v:199},{k:2,s:95,v:199},{k:2,s:96,v:199},{k:2,s:97,v:199},{k:2,s:98,v:199},{k:2,s:100,v:199},{k:2,s:101,v:199},{k:2,s:102,v:199},{k:2,s:103,v:199},{k:2,s:104,v:199},{k:2,s:105,v:199}],
 [{k:2,s:0,v:198},{k:2,s:7,v:198},{k:2,s:15,v:198},{k:2,s:24,v:198},{k:2,s:30,v:198},{k:2,s:34,v:198},{k:2,s:37,v:198},{k:2,s:51,v:198},{k:2,s:52,v:198},{k:2,s:53,v:198},{k:2,s:54,v:198},{k:2,s:55,v:198},{k:2,s:56,v:198},{k:2,s:58,v:198},{k:2,s:59,v:198},{k:2,s:60,v:198},{k:2,s:61,v:198},{k:2,s:62,v:198},{k:2,s:63,v:198},{k:2,s:64,v:198},{k:2,s:65,v:198},{k:2,s:68,v:198},{k:2,s:69,v:198},{k:2,s:70,v:198},{k:2,s:71,v:198},{k:2,s:72,v:198},{k:2,s:73,v:198},{k:2,s:74,v:198},{k:2,s:75,v:198},{k:2,s:79,v:198},{k:2,s:80,v:198},{k:2,s:81,v:198},{k:2,s:82,v:198},{k:2,s:83,v:198},{k:2,s:84,v:198},{k:2,s:85,v:198},{k:2,s:86,v:198},{k:2,s:87,v:198},{k:2,s:88,v:198},{k:2,s:89,v:198},{k:2,s:90,v:198},{k:2,s:91,v:198},{k:2,s:92,v:198},{k:2,s:93,v:198},{k:2,s:94,v:198},{k:2,s:95,v:198},{k:2,s:96,v:198},{k:2,s:97,v:198},{k:2,s:98,v:198},{k:2,s:100,v:198},{k:2,s:101,v:198},{k:2,s:102,v:198},{k:2,s:103,v:198},{k:2,s:104,v:198},{k:2,s:105,v:198}],
 [{k:1,s:7,v:1},{k:1,s:15,v:2},{k:1,s:24,v:3},{k:1,s:30,v:4},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:54,v:9},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:62,v:15},{k:1,s:64,v:16},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:72,v:22},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:75,v:25},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:88,v:36},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:96,v:44},{k:1,s:98,v:46},{k:1,s:101,v:48},{k:1,s:104,v:51},{k:1,s:105,v:52},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:113,v:56},{k:3,s:116,v:57},{k:3,s:119,v:58},{k:3,s:127,v:60},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:142,v:66},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:148,v:69},{k:3,s:149,v:70},{k:3,s:154,v:71},{k:3,s:155,v:72},{k:3,s:158,v:75},{k:3,s:162,v:76},{k:3,s:169,v:81},{k:3,s:171,v:82},{k:3,s:175,v:85},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:188,v:91},{k:3,s:192,v:153},{k:3,s:194,v:96},{k:3,s:195,v:97},{k:3,s:196,v:98},{k:3,s:197,v:99},{k:3,s:198,v:100},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:205,v:106},{k:3,s:207,v:107},{k:3,s:209,v:546},{k:3,s:210,v:110},{k:3,s:213,v:111},{k:3,s:220,v:112},{k:3,s:222,v:113},{k:3,s:232,v:116}],
 [{k:2,s:0,v:196},{k:2,s:7,v:196},{k:2,s:15,v:196},{k:2,s:24,v:196},{k:2,s:30,v:196},{k:2,s:34,v:196},{k:2,s:37,v:196},{k:2,s:51,v:196},{k:2,s:52,v:196},{k:2,s:53,v:196},{k:2,s:54,v:196},{k:2,s:55,v:196},{k:2,s:56,v:196},{k:2,s:58,v:196},{k:2,s:59,v:196},{k:2,s:60,v:196},{k:2,s:61,v:196},{k:2,s:62,v:196},{k:2,s:63,v:196},{k:2,s:64,v:196},{k:2,s:65,v:196},{k:2,s:68,v:196},{k:2,s:69,v:196},{k:2,s:70,v:196},{k:2,s:71,v:196},{k:2,s:72,v:196},{k:2,s:73,v:196},{k:2,s:74,v:196},{k:2,s:75,v:196},{k:2,s:79,v:196},{k:2,s:80,v:196},{k:2,s:81,v:196},{k:2,s:82,v:196},{k:2,s:83,v:196},{k:2,s:84,v:196},{k:2,s:85,v:196},{k:2,s:86,v:196},{k:2,s:87,v:196},{k:2,s:88,v:196},{k:2,s:89,v:196},{k:2,s:90,v:196},{k:2,s:91,v:196},{k:2,s:92,v:196},{k:2,s:93,v:196},{k:2,s:94,v:196},{k:2,s:95,v:196},{k:2,s:96,v:196},{k:2,s:97,v:196},{k:2,s:98,v:196},{k:2,s:100,v:196},{k:2,s:101,v:196},{k:2,s:102,v:196},{k:2,s:103,v:196},{k:2,s:104,v:196},{k:2,s:105,v:196}],
 [{k:1,s:7,v:1},{k:1,s:15,v:2},{k:1,s:24,v:3},{k:1,s:30,v:4},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:54,v:9},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:62,v:15},{k:1,s:64,v:16},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:72,v:22},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:75,v:25},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:88,v:36},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:96,v:44},{k:1,s:98,v:46},{k:1,s:101,v:48},{k:1,s:104,v:51},{k:1,s:105,v:52},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:113,v:56},{k:3,s:116,v:57},{k:3,s:119,v:58},{k:3,s:127,v:60},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:142,v:66},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:148,v:69},{k:3,s:149,v:70},{k:3,s:154,v:71},{k:3,s:155,v:72},{k:3,s:158,v:75},{k:3,s:162,v:76},{k:3,s:169,v:81},{k:3,s:171,v:82},{k:3,s:175,v:85},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:188,v:91},{k:3,s:192,v:153},{k:3,s:194,v:96},{k:3,s:195,v:97},{k:3,s:196,v:98},{k:3,s:197,v:99},{k:3,s:198,v:100},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:205,v:106},{k:3,s:207,v:107},{k:3,s:209,v:547},{k:3,s:210,v:110},{k:3,s:213,v:111},{k:3,s:220,v:112},{k:3,s:222,v:113},{k:3,s:232,v:116}],
 [{k:1,s:7,v:1},{k:1,s:15,v:2},{k:1,s:24,v:3},{k:1,s:30,v:4},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:54,v:9},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:62,v:15},{k:1,s:64,v:16},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:72,v:22},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:75,v:25},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:88,v:36},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:96,v:44},{k:1,s:98,v:46},{k:1,s:101,v:48},{k:1,s:104,v:51},{k:1,s:105,v:52},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:113,v:56},{k:3,s:116,v:57},{k:3,s:119,v:58},{k:3,s:127,v:60},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:142,v:66},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:148,v:69},{k:3,s:149,v:70},{k:3,s:154,v:71},{k:3,s:155,v:72},{k:3,s:158,v:75},{k:3,s:162,v:76},{k:3,s:169,v:81},{k:3,s:171,v:82},{k:3,s:175,v:85},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:188,v:91},{k:3,s:192,v:153},{k:3,s:194,v:96},{k:3,s:195,v:97},{k:3,s:196,v:98},{k:3,s:197,v:99},{k:3,s:198,v:100},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:205,v:106},{k:3,s:207,v:107},{k:3,s:209,v:548},{k:3,s:210,v:110},{k:3,s:213,v:111},{k:3,s:220,v:112},{k:3,s:222,v:113},{k:3,s:232,v:116}],
 [{k:1,s:16,v:549}],
 [{k:1,s:6,v:117},{k:1,s:7,v:1},{k:1,s:8,v:118},{k:1,s:15,v:119},{k:1,s:24,v:550},{k:1,s:35,v:120},{k:1,s:36,v:121},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:106,v:141},{k:3,s:107,v:142},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:113,v:143},{k:3,s:114,v:144},{k:3,s:120,v:129},{k:3,s:127,v:130},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:135,v:145},{k:3,s:136,v:146},{k:3,s:137,v:147},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:150,v:148},{k:3,s:151,v:149},{k:3,s:153,v:551},{k:3,s:155,v:72},{k:3,s:158,v:75},{k:3,s:174,v:151},{k:3,s:175,v:85},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:188,v:132},{k:3,s:191,v:152},{k:3,s:192,v:153},{k:3,s:194,v:134},{k:3,s:195,v:135},{k:3,s:196,v:136},{k:3,s:197,v:137},{k:3,s:198,v:138},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:204,v:154},{k:3,s:206,v:155},{k:3,s:207,v:107},{k:3,s:225,v:156},{k:3,s:226,v:140}],
 [{k:1,s:24,v:552}],
 [{k:1,s:16,v:553}],
 [{k:1,s:16,v:554}],
 [{k:2,s:0,v:176},{k:2,s:7,v:176},{k:2,s:15,v:176},{k:2,s:24,v:176},{k:2,s:30,v:176},{k:2,s:34,v:176},{k:2,s:37,v:176},{k:2,s:51,v:176},{k:2,s:52,v:176},{k:2,s:53,v:176},{k:2,s:54,v:176},{k:2,s:55,v:176},{k:2,s:56,v:176},{k:2,s:58,v:176},{k:2,s:59,v:176},{k:2,s:60,v:176},{k:2,s:61,v:176},{k:2,s:62,v:176},{k:2,s:63,v:176},{k:2,s:64,v:176},{k:2,s:65,v:176},{k:2,s:68,v:176},{k:2,s:69,v:176},{k:2,s:70,v:176},{k:2,s:71,v:176},{k:2,s:72,v:176},{k:2,s:73,v:176},{k:2,s:74,v:176},{k:2,s:75,v:176},{k:2,s:79,v:176},{k:2,s:80,v:176},{k:2,s:81,v:176},{k:2,s:82,v:176},{k:2,s:83,v:176},{k:2,s:84,v:176},{k:2,s:85,v:176},{k:2,s:86,v:176},{k:2,s:87,v:176},{k:2,s:88,v:176},{k:2,s:89,v:176},{k:2,s:90,v:176},{k:2,s:91,v:176},{k:2,s:92,v:176},{k:2,s:93,v:176},{k:2,s:94,v:176},{k:2,s:95,v:176},{k:2,s:96,v:176},{k:2,s:97,v:176},{k:2,s:98,v:176},{k:2,s:100,v:176},{k:2,s:101,v:176},{k:2,s:102,v:176},{k:2,s:103,v:176},{k:2,s:104,v:176},{k:2,s:105,v:176}],
 [{k:1,s:23,v:555}],
 [{k:2,s:23,v:333}],
 [{k:2,s:7,v:189},{k:2,s:15,v:189},{k:2,s:24,v:189},{k:2,s:30,v:189},{k:2,s:34,v:189},{k:2,s:37,v:189},{k:2,s:51,v:189},{k:2,s:52,v:189},{k:2,s:53,v:189},{k:2,s:54,v:189},{k:2,s:55,v:189},{k:2,s:56,v:189},{k:2,s:58,v:189},{k:2,s:59,v:189},{k:2,s:61,v:189},{k:2,s:62,v:189},{k:2,s:63,v:189},{k:2,s:64,v:189},{k:2,s:65,v:189},{k:2,s:68,v:189},{k:2,s:69,v:189},{k:2,s:70,v:189},{k:2,s:71,v:189},{k:2,s:72,v:189},{k:2,s:73,v:189},{k:2,s:74,v:189},{k:2,s:75,v:189},{k:2,s:79,v:189},{k:2,s:80,v:189},{k:2,s:81,v:189},{k:2,s:82,v:189},{k:2,s:83,v:189},{k:2,s:84,v:189},{k:2,s:85,v:189},{k:2,s:86,v:189},{k:2,s:87,v:189},{k:2,s:88,v:189},{k:2,s:89,v:189},{k:2,s:90,v:189},{k:2,s:91,v:189},{k:2,s:92,v:189},{k:2,s:93,v:189},{k:2,s:94,v:189},{k:2,s:95,v:189},{k:2,s:96,v:189},{k:2,s:97,v:189},{k:2,s:98,v:189},{k:2,s:100,v:189},{k:2,s:101,v:189},{k:2,s:103,v:189},{k:2,s:104,v:189},{k:2,s:105,v:189}],
 [{k:2,s:0,v:180},{k:2,s:7,v:180},{k:2,s:15,v:180},{k:2,s:24,v:180},{k:2,s:30,v:180},{k:2,s:34,v:180},{k:2,s:37,v:180},{k:2,s:51,v:180},{k:2,s:52,v:180},{k:2,s:53,v:180},{k:2,s:54,v:180},{k:2,s:55,v:180},{k:2,s:56,v:180},{k:2,s:58,v:180},{k:2,s:59,v:180},{k:2,s:60,v:180},{k:2,s:61,v:180},{k:2,s:62,v:180},{k:2,s:63,v:180},{k:2,s:64,v:180},{k:2,s:65,v:180},{k:2,s:66,v:180},{k:2,s:68,v:180},{k:2,s:69,v:180},{k:2,s:70,v:180},{k:2,s:71,v:180},{k:2,s:72,v:180},{k:2,s:73,v:180},{k:2,s:74,v:180},{k:2,s:75,v:180},{k:2,s:79,v:180},{k:2,s:80,v:180},{k:2,s:81,v:180},{k:2,s:82,v:180},{k:2,s:83,v:180},{k:2,s:84,v:180},{k:2,s:85,v:180},{k:2,s:86,v:180},{k:2,s:87,v:180},{k:2,s:88,v:180},{k:2,s:89,v:180},{k:2,s:90,v:180},{k:2,s:91,v:180},{k:2,s:92,v:180},{k:2,s:93,v:180},{k:2,s:94,v:180},{k:2,s:95,v:180},{k:2,s:96,v:180},{k:2,s:97,v:180},{k:2,s:98,v:180},{k:2,s:100,v:180},{k:2,s:101,v:180},{k:2,s:102,v:180},{k:2,s:103,v:180},{k:2,s:104,v:180},{k:2,s:105,v:180}],
 [{k:2,s:34,v:184},{k:2,s:56,v:184},{k:2,s:63,v:184}],
 [{k:1,s:7,v:1},{k:1,s:15,v:2},{k:1,s:24,v:3},{k:1,s:30,v:4},{k:1,s:34,v:556},{k:1,s:37,v:5},{k:1,s:51,v:6},{k:1,s:52,v:7},{k:1,s:53,v:8},{k:1,s:54,v:9},{k:1,s:55,v:10},{k:1,s:56,v:495},{k:1,s:58,v:11},{k:1,s:59,v:12},{k:1,s:61,v:14},{k:1,s:62,v:15},{k:1,s:63,v:496},{k:1,s:64,v:16},{k:1,s:65,v:17},{k:1,s:68,v:18},{k:1,s:69,v:19},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:72,v:22},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:75,v:25},{k:1,s:79,v:27},{k:1,s:80,v:28},{k:1,s:81,v:29},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:85,v:33},{k:1,s:86,v:34},{k:1,s:87,v:35},{k:1,s:88,v:36},{k:1,s:89,v:37},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:92,v:40},{k:1,s:93,v:41},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:96,v:44},{k:1,s:97,v:45},{k:1,s:98,v:46},{k:1,s:100,v:47},{k:1,s:101,v:48},{k:1,s:103,v:50},{k:1,s:104,v:51},{k:1,s:105,v:52},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:112,v:55},{k:3,s:113,v:56},{k:3,s:116,v:57},{k:3,s:117,v:158},{k:3,s:118,v:536},{k:3,s:119,v:58},{k:3,s:127,v:60},{k:3,s:129,v:62},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:142,v:66},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:148,v:69},{k:3,s:149,v:70},{k:3,s:154,v:71},{k:3,s:155,v:72},{k:3,s:157,v:74},{k:3,s:158,v:75},{k:3,s:162,v:76},{k:3,s:169,v:81},{k:3,s:171,v:82},{k:3,s:175,v:85},{k:3,s:176,v:86},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:182,v:160},{k:3,s:183,v:161},{k:3,s:188,v:91},{k:3,s:189,v:92},{k:3,s:190,v:162},{k:3,s:192,v:94},{k:3,s:193,v:95},{k:3,s:194,v:96},{k:3,s:195,v:97},{k:3,s:196,v:98},{k:3,s:197,v:99},{k:3,s:198,v:100},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:201,v:103},{k:3,s:202,v:104},{k:3,s:203,v:105},{k:3,s:205,v:106},{k:3,s:207,v:107},{k:3,s:209,v:163},{k:3,s:210,v:110},{k:3,s:213,v:111},{k:3,s:218,v:537},{k:3,s:220,v:112},{k:3,s:222,v:113},{k:3,s:223,v:164},{k:3,s:232,v:116}],
 [{k:2,s:0,v:181},{k:2,s:7,v:181},{k:2,s:15,v:181},{k:2,s:24,v:181},{k:2,s:30,v:181},{k:2,s:34,v:181},{k:2,s:37,v:181},{k:2,s:51,v:181},{k:2,s:52,v:181},{k:2,s:53,v:181},{k:2,s:54,v:181},{k:2,s:55,v:181},{k:2,s:56,v:181},{k:2,s:58,v:181},{k:2,s:59,v:181},{k:2,s:60,v:181},{k:2,s:61,v:181},{k:2,s:62,v:181},{k:2,s:63,v:181},{k:2,s:64,v:181},{k:2,s:65,v:181},{k:2,s:66,v:181},{k:2,s:68,v:181},{k:2,s:69,v:181},{k:2,s:70,v:181},{k:2,s:71,v:181},{k:2,s:72,v:181},{k:2,s:73,v:181},{k:2,s:74,v:181},{k:2,s:75,v:181},{k:2,s:79,v:181},{k:2,s:80,v:181},{k:2,s:81,v:181},{k:2,s:82,v:181},{k:2,s:83,v:181},{k:2,s:84,v:181},{k:2,s:85,v:181},{k:2,s:86,v:181},{k:2,s:87,v:181},{k:2,s:88,v:181},{k:2,s:89,v:181},{k:2,s:90,v:181},{k:2,s:91,v:181},{k:2,s:92,v:181},{k:2,s:93,v:181},{k:2,s:94,v:181},{k:2,s:95,v:181},{k:2,s:96,v:181},{k:2,s:97,v:181},{k:2,s:98,v:181},{k:2,s:100,v:181},{k:2,s:101,v:181},{k:2,s:102,v:181},{k:2,s:103,v:181},{k:2,s:104,v:181},{k:2,s:105,v:181}],
 [{k:1,s:7,v:1},{k:1,s:15,v:2},{k:1,s:24,v:3},{k:1,s:30,v:4},{k:1,s:37,v:5},{k:1,s:51,v:6},{k:1,s:52,v:7},{k:1,s:53,v:8},{k:1,s:54,v:9},{k:1,s:55,v:10},{k:1,s:58,v:11},{k:1,s:59,v:12},{k:1,s:61,v:14},{k:1,s:62,v:15},{k:1,s:64,v:16},{k:1,s:65,v:17},{k:1,s:68,v:18},{k:1,s:69,v:19},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:72,v:22},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:75,v:25},{k:1,s:79,v:27},{k:1,s:80,v:28},{k:1,s:81,v:29},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:85,v:33},{k:1,s:86,v:34},{k:1,s:87,v:35},{k:1,s:88,v:36},{k:1,s:89,v:37},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:92,v:40},{k:1,s:93,v:41},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:96,v:44},{k:1,s:97,v:45},{k:1,s:98,v:46},{k:1,s:100,v:47},{k:1,s:101,v:48},{k:1,s:103,v:50},{k:1,s:104,v:51},{k:1,s:105,v:52},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:112,v:55},{k:3,s:113,v:56},{k:3,s:116,v:57},{k:3,s:117,v:262},{k:3,s:119,v:58},{k:3,s:127,v:60},{k:3,s:129,v:62},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:142,v:66},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:148,v:69},{k:3,s:149,v:70},{k:3,s:154,v:71},{k:3,s:155,v:72},{k:3,s:157,v:74},{k:3,s:158,v:75},{k:3,s:162,v:76},{k:3,s:169,v:81},{k:3,s:171,v:82},{k:3,s:175,v:85},{k:3,s:176,v:86},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:182,v:160},{k:3,s:183,v:161},{k:3,s:188,v:91},{k:3,s:189,v:92},{k:3,s:190,v:162},{k:3,s:192,v:94},{k:3,s:193,v:95},{k:3,s:194,v:96},{k:3,s:195,v:97},{k:3,s:196,v:98},{k:3,s:197,v:99},{k:3,s:198,v:100},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:201,v:103},{k:3,s:202,v:104},{k:3,s:203,v:105},{k:3,s:205,v:106},{k:3,s:207,v:107},{k:3,s:209,v:163},{k:3,s:210,v:110},{k:3,s:213,v:111},{k:3,s:220,v:112},{k:3,s:222,v:113},{k:3,s:223,v:164},{k:3,s:232,v:116},{k:2,s:34,v:185},{k:2,s:56,v:185},{k:2,s:63,v:185}],
 [{k:2,s:7,v:187},{k:2,s:15,v:187},{k:2,s:24,v:187},{k:2,s:30,v:187},{k:2,s:34,v:187},{k:2,s:37,v:187},{k:2,s:51,v:187},{k:2,s:52,v:187},{k:2,s:53,v:187},{k:2,s:54,v:187},{k:2,s:55,v:187},{k:2,s:56,v:187},{k:2,s:58,v:187},{k:2,s:59,v:187},{k:2,s:61,v:187},{k:2,s:62,v:187},{k:2,s:63,v:187},{k:2,s:64,v:187},{k:2,s:65,v:187},{k:2,s:68,v:187},{k:2,s:69,v:187},{k:2,s:70,v:187},{k:2,s:71,v:187},{k:2,s:72,v:187},{k:2,s:73,v:187},{k:2,s:74,v:187},{k:2,s:75,v:187},{k:2,s:79,v:187},{k:2,s:80,v:187},{k:2,s:81,v:187},{k:2,s:82,v:187},{k:2,s:83,v:187},{k:2,s:84,v:187},{k:2,s:85,v:187},{k:2,s:86,v:187},{k:2,s:87,v:187},{k:2,s:88,v:187},{k:2,s:89,v:187},{k:2,s:90,v:187},{k:2,s:91,v:187},{k:2,s:92,v:187},{k:2,s:93,v:187},{k:2,s:94,v:187},{k:2,s:95,v:187},{k:2,s:96,v:187},{k:2,s:97,v:187},{k:2,s:98,v:187},{k:2,s:100,v:187},{k:2,s:101,v:187},{k:2,s:103,v:187},{k:2,s:104,v:187},{k:2,s:105,v:187}],
 [{k:2,s:0,v:221},{k:2,s:7,v:221},{k:2,s:15,v:221},{k:2,s:24,v:221},{k:2,s:30,v:221},{k:2,s:34,v:221},{k:2,s:37,v:221},{k:2,s:51,v:221},{k:2,s:52,v:221},{k:2,s:53,v:221},{k:2,s:54,v:221},{k:2,s:55,v:221},{k:2,s:56,v:221},{k:2,s:57,v:221},{k:2,s:58,v:221},{k:2,s:59,v:221},{k:2,s:60,v:221},{k:2,s:61,v:221},{k:2,s:62,v:221},{k:2,s:63,v:221},{k:2,s:64,v:221},{k:2,s:65,v:221},{k:2,s:66,v:221},{k:2,s:68,v:221},{k:2,s:69,v:221},{k:2,s:70,v:221},{k:2,s:71,v:221},{k:2,s:72,v:221},{k:2,s:73,v:221},{k:2,s:74,v:221},{k:2,s:75,v:221},{k:2,s:79,v:221},{k:2,s:80,v:221},{k:2,s:81,v:221},{k:2,s:82,v:221},{k:2,s:83,v:221},{k:2,s:84,v:221},{k:2,s:85,v:221},{k:2,s:86,v:221},{k:2,s:87,v:221},{k:2,s:88,v:221},{k:2,s:89,v:221},{k:2,s:90,v:221},{k:2,s:91,v:221},{k:2,s:92,v:221},{k:2,s:93,v:221},{k:2,s:94,v:221},{k:2,s:95,v:221},{k:2,s:96,v:221},{k:2,s:97,v:221},{k:2,s:98,v:221},{k:2,s:100,v:221},{k:2,s:101,v:221},{k:2,s:102,v:221},{k:2,s:103,v:221},{k:2,s:104,v:221},{k:2,s:105,v:221}],
 [{k:2,s:19,v:133},{k:2,s:24,v:133},{k:2,s:34,v:133}],
 [{k:2,s:19,v:138},{k:2,s:34,v:138}],
 [{k:1,s:24,v:557}],
 [{k:1,s:16,v:558},{k:1,s:19,v:366}],
 [{k:1,s:24,v:559}],
 [{k:1,s:16,v:560},{k:1,s:19,v:366}],
 [{k:2,s:34,v:125},{k:2,s:51,v:125},{k:2,s:52,v:125},{k:2,s:55,v:125},{k:2,s:58,v:125},{k:2,s:61,v:125},{k:2,s:65,v:125},{k:2,s:68,v:125},{k:2,s:69,v:125},{k:2,s:74,v:125},{k:2,s:79,v:125},{k:2,s:80,v:125},{k:2,s:81,v:125},{k:2,s:85,v:125},{k:2,s:86,v:125},{k:2,s:87,v:125},{k:2,s:89,v:125},{k:2,s:92,v:125},{k:2,s:93,v:125},{k:2,s:97,v:125},{k:2,s:100,v:125},{k:2,s:102,v:125},{k:2,s:103,v:125}],
 [{k:2,s:0,v:197},{k:2,s:7,v:197},{k:2,s:15,v:197},{k:2,s:24,v:197},{k:2,s:30,v:197},{k:2,s:34,v:197},{k:2,s:37,v:197},{k:2,s:51,v:197},{k:2,s:52,v:197},{k:2,s:53,v:197},{k:2,s:54,v:197},{k:2,s:55,v:197},{k:2,s:56,v:197},{k:2,s:58,v:197},{k:2,s:59,v:197},{k:2,s:60,v:197},{k:2,s:61,v:197},{k:2,s:62,v:197},{k:2,s:63,v:197},{k:2,s:64,v:197},{k:2,s:65,v:197},{k:2,s:68,v:197},{k:2,s:69,v:197},{k:2,s:70,v:197},{k:2,s:71,v:197},{k:2,s:72,v:197},{k:2,s:73,v:197},{k:2,s:74,v:197},{k:2,s:75,v:197},{k:2,s:79,v:197},{k:2,s:80,v:197},{k:2,s:81,v:197},{k:2,s:82,v:197},{k:2,s:83,v:197},{k:2,s:84,v:197},{k:2,s:85,v:197},{k:2,s:86,v:197},{k:2,s:87,v:197},{k:2,s:88,v:197},{k:2,s:89,v:197},{k:2,s:90,v:197},{k:2,s:91,v:197},{k:2,s:92,v:197},{k:2,s:93,v:197},{k:2,s:94,v:197},{k:2,s:95,v:197},{k:2,s:96,v:197},{k:2,s:97,v:197},{k:2,s:98,v:197},{k:2,s:100,v:197},{k:2,s:101,v:197},{k:2,s:102,v:197},{k:2,s:103,v:197},{k:2,s:104,v:197},{k:2,s:105,v:197}],
 [{k:2,s:0,v:195},{k:2,s:7,v:195},{k:2,s:15,v:195},{k:2,s:24,v:195},{k:2,s:30,v:195},{k:2,s:34,v:195},{k:2,s:37,v:195},{k:2,s:51,v:195},{k:2,s:52,v:195},{k:2,s:53,v:195},{k:2,s:54,v:195},{k:2,s:55,v:195},{k:2,s:56,v:195},{k:2,s:58,v:195},{k:2,s:59,v:195},{k:2,s:60,v:195},{k:2,s:61,v:195},{k:2,s:62,v:195},{k:2,s:63,v:195},{k:2,s:64,v:195},{k:2,s:65,v:195},{k:2,s:68,v:195},{k:2,s:69,v:195},{k:2,s:70,v:195},{k:2,s:71,v:195},{k:2,s:72,v:195},{k:2,s:73,v:195},{k:2,s:74,v:195},{k:2,s:75,v:195},{k:2,s:79,v:195},{k:2,s:80,v:195},{k:2,s:81,v:195},{k:2,s:82,v:195},{k:2,s:83,v:195},{k:2,s:84,v:195},{k:2,s:85,v:195},{k:2,s:86,v:195},{k:2,s:87,v:195},{k:2,s:88,v:195},{k:2,s:89,v:195},{k:2,s:90,v:195},{k:2,s:91,v:195},{k:2,s:92,v:195},{k:2,s:93,v:195},{k:2,s:94,v:195},{k:2,s:95,v:195},{k:2,s:96,v:195},{k:2,s:97,v:195},{k:2,s:98,v:195},{k:2,s:100,v:195},{k:2,s:101,v:195},{k:2,s:102,v:195},{k:2,s:103,v:195},{k:2,s:104,v:195},{k:2,s:105,v:195}],
 [{k:2,s:0,v:194},{k:2,s:7,v:194},{k:2,s:15,v:194},{k:2,s:24,v:194},{k:2,s:30,v:194},{k:2,s:34,v:194},{k:2,s:37,v:194},{k:2,s:51,v:194},{k:2,s:52,v:194},{k:2,s:53,v:194},{k:2,s:54,v:194},{k:2,s:55,v:194},{k:2,s:56,v:194},{k:2,s:58,v:194},{k:2,s:59,v:194},{k:2,s:60,v:194},{k:2,s:61,v:194},{k:2,s:62,v:194},{k:2,s:63,v:194},{k:2,s:64,v:194},{k:2,s:65,v:194},{k:2,s:68,v:194},{k:2,s:69,v:194},{k:2,s:70,v:194},{k:2,s:71,v:194},{k:2,s:72,v:194},{k:2,s:73,v:194},{k:2,s:74,v:194},{k:2,s:75,v:194},{k:2,s:79,v:194},{k:2,s:80,v:194},{k:2,s:81,v:194},{k:2,s:82,v:194},{k:2,s:83,v:194},{k:2,s:84,v:194},{k:2,s:85,v:194},{k:2,s:86,v:194},{k:2,s:87,v:194},{k:2,s:88,v:194},{k:2,s:89,v:194},{k:2,s:90,v:194},{k:2,s:91,v:194},{k:2,s:92,v:194},{k:2,s:93,v:194},{k:2,s:94,v:194},{k:2,s:95,v:194},{k:2,s:96,v:194},{k:2,s:97,v:194},{k:2,s:98,v:194},{k:2,s:100,v:194},{k:2,s:101,v:194},{k:2,s:102,v:194},{k:2,s:103,v:194},{k:2,s:104,v:194},{k:2,s:105,v:194}],
 [{k:1,s:7,v:1},{k:1,s:15,v:2},{k:1,s:24,v:3},{k:1,s:30,v:4},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:54,v:9},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:62,v:15},{k:1,s:64,v:16},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:72,v:22},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:75,v:25},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:88,v:36},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:96,v:44},{k:1,s:98,v:46},{k:1,s:101,v:48},{k:1,s:104,v:51},{k:1,s:105,v:52},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:113,v:56},{k:3,s:116,v:57},{k:3,s:119,v:58},{k:3,s:127,v:60},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:142,v:66},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:148,v:69},{k:3,s:149,v:70},{k:3,s:154,v:71},{k:3,s:155,v:72},{k:3,s:158,v:75},{k:3,s:162,v:76},{k:3,s:169,v:81},{k:3,s:171,v:82},{k:3,s:175,v:85},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:188,v:91},{k:3,s:192,v:153},{k:3,s:194,v:96},{k:3,s:195,v:97},{k:3,s:196,v:98},{k:3,s:197,v:99},{k:3,s:198,v:100},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:205,v:106},{k:3,s:207,v:107},{k:3,s:209,v:561},{k:3,s:210,v:110},{k:3,s:213,v:111},{k:3,s:220,v:112},{k:3,s:222,v:113},{k:3,s:232,v:116}],
 [{k:1,s:7,v:1},{k:1,s:15,v:2},{k:1,s:16,v:562},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:113,v:56},{k:3,s:127,v:60},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:155,v:72},{k:3,s:158,v:75},{k:3,s:164,v:563},{k:3,s:175,v:85},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:188,v:91},{k:3,s:192,v:153},{k:3,s:194,v:96},{k:3,s:195,v:97},{k:3,s:196,v:98},{k:3,s:197,v:99},{k:3,s:198,v:100},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:207,v:107},{k:3,s:210,v:279},{k:3,s:211,v:430}],
 [{k:1,s:24,v:564}],
 [{k:1,s:6,v:117},{k:1,s:7,v:1},{k:1,s:8,v:118},{k:1,s:15,v:119},{k:1,s:24,v:565},{k:1,s:35,v:120},{k:1,s:36,v:121},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:106,v:141},{k:3,s:107,v:142},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:113,v:143},{k:3,s:114,v:144},{k:3,s:120,v:129},{k:3,s:127,v:130},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:135,v:145},{k:3,s:136,v:146},{k:3,s:137,v:147},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:150,v:148},{k:3,s:151,v:149},{k:3,s:153,v:566},{k:3,s:155,v:72},{k:3,s:158,v:75},{k:3,s:174,v:151},{k:3,s:175,v:85},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:188,v:132},{k:3,s:191,v:152},{k:3,s:192,v:153},{k:3,s:194,v:134},{k:3,s:195,v:135},{k:3,s:196,v:136},{k:3,s:197,v:137},{k:3,s:198,v:138},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:204,v:154},{k:3,s:206,v:155},{k:3,s:207,v:107},{k:3,s:225,v:156},{k:3,s:226,v:140}],
 [{k:1,s:7,v:1},{k:1,s:15,v:2},{k:1,s:24,v:3},{k:1,s:30,v:4},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:54,v:9},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:62,v:15},{k:1,s:64,v:16},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:72,v:435},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:75,v:436},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:88,v:36},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:96,v:44},{k:1,s:98,v:46},{k:1,s:101,v:48},{k:1,s:104,v:51},{k:1,s:105,v:437},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:113,v:56},{k:3,s:116,v:57},{k:3,s:119,v:58},{k:3,s:127,v:60},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:142,v:66},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:148,v:69},{k:3,s:149,v:70},{k:3,s:154,v:71},{k:3,s:155,v:72},{k:3,s:158,v:75},{k:3,s:162,v:76},{k:3,s:163,v:438},{k:3,s:169,v:81},{k:3,s:170,v:439},{k:3,s:171,v:82},{k:3,s:175,v:85},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:188,v:91},{k:3,s:192,v:153},{k:3,s:194,v:96},{k:3,s:195,v:97},{k:3,s:196,v:98},{k:3,s:197,v:99},{k:3,s:198,v:100},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:205,v:106},{k:3,s:207,v:107},{k:3,s:209,v:440},{k:3,s:210,v:110},{k:3,s:212,v:567},{k:3,s:213,v:442},{k:3,s:220,v:112},{k:3,s:222,v:113},{k:3,s:232,v:116},{k:3,s:233,v:443}],
 [{k:1,s:7,v:1},{k:1,s:15,v:2},{k:1,s:24,v:3},{k:1,s:30,v:4},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:54,v:9},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:62,v:15},{k:1,s:64,v:16},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:72,v:435},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:75,v:436},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:88,v:36},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:96,v:44},{k:1,s:98,v:46},{k:1,s:101,v:48},{k:1,s:104,v:51},{k:1,s:105,v:437},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:113,v:56},{k:3,s:116,v:57},{k:3,s:119,v:58},{k:3,s:127,v:60},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:142,v:66},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:148,v:69},{k:3,s:149,v:70},{k:3,s:154,v:71},{k:3,s:155,v:72},{k:3,s:158,v:75},{k:3,s:162,v:76},{k:3,s:163,v:438},{k:3,s:169,v:81},{k:3,s:170,v:439},{k:3,s:171,v:82},{k:3,s:175,v:85},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:188,v:91},{k:3,s:192,v:153},{k:3,s:194,v:96},{k:3,s:195,v:97},{k:3,s:196,v:98},{k:3,s:197,v:99},{k:3,s:198,v:100},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:205,v:106},{k:3,s:207,v:107},{k:3,s:209,v:456},{k:3,s:210,v:110},{k:3,s:212,v:568},{k:3,s:213,v:442},{k:3,s:220,v:112},{k:3,s:222,v:113},{k:3,s:232,v:116},{k:3,s:233,v:443}],
 [{k:2,s:7,v:188},{k:2,s:15,v:188},{k:2,s:24,v:188},{k:2,s:30,v:188},{k:2,s:34,v:188},{k:2,s:37,v:188},{k:2,s:51,v:188},{k:2,s:52,v:188},{k:2,s:53,v:188},{k:2,s:54,v:188},{k:2,s:55,v:188},{k:2,s:56,v:188},{k:2,s:58,v:188},{k:2,s:59,v:188},{k:2,s:61,v:188},{k:2,s:62,v:188},{k:2,s:63,v:188},{k:2,s:64,v:188},{k:2,s:65,v:188},{k:2,s:68,v:188},{k:2,s:69,v:188},{k:2,s:70,v:188},{k:2,s:71,v:188},{k:2,s:72,v:188},{k:2,s:73,v:188},{k:2,s:74,v:188},{k:2,s:75,v:188},{k:2,s:79,v:188},{k:2,s:80,v:188},{k:2,s:81,v:188},{k:2,s:82,v:188},{k:2,s:83,v:188},{k:2,s:84,v:188},{k:2,s:85,v:188},{k:2,s:86,v:188},{k:2,s:87,v:188},{k:2,s:88,v:188},{k:2,s:89,v:188},{k:2,s:90,v:188},{k:2,s:91,v:188},{k:2,s:92,v:188},{k:2,s:93,v:188},{k:2,s:94,v:188},{k:2,s:95,v:188},{k:2,s:96,v:188},{k:2,s:97,v:188},{k:2,s:98,v:188},{k:2,s:100,v:188},{k:2,s:101,v:188},{k:2,s:103,v:188},{k:2,s:104,v:188},{k:2,s:105,v:188}],
 [{k:2,s:0,v:179},{k:2,s:7,v:179},{k:2,s:15,v:179},{k:2,s:24,v:179},{k:2,s:30,v:179},{k:2,s:34,v:179},{k:2,s:37,v:179},{k:2,s:51,v:179},{k:2,s:52,v:179},{k:2,s:53,v:179},{k:2,s:54,v:179},{k:2,s:55,v:179},{k:2,s:56,v:179},{k:2,s:58,v:179},{k:2,s:59,v:179},{k:2,s:60,v:179},{k:2,s:61,v:179},{k:2,s:62,v:179},{k:2,s:63,v:179},{k:2,s:64,v:179},{k:2,s:65,v:179},{k:2,s:66,v:179},{k:2,s:68,v:179},{k:2,s:69,v:179},{k:2,s:70,v:179},{k:2,s:71,v:179},{k:2,s:72,v:179},{k:2,s:73,v:179},{k:2,s:74,v:179},{k:2,s:75,v:179},{k:2,s:79,v:179},{k:2,s:80,v:179},{k:2,s:81,v:179},{k:2,s:82,v:179},{k:2,s:83,v:179},{k:2,s:84,v:179},{k:2,s:85,v:179},{k:2,s:86,v:179},{k:2,s:87,v:179},{k:2,s:88,v:179},{k:2,s:89,v:179},{k:2,s:90,v:179},{k:2,s:91,v:179},{k:2,s:92,v:179},{k:2,s:93,v:179},{k:2,s:94,v:179},{k:2,s:95,v:179},{k:2,s:96,v:179},{k:2,s:97,v:179},{k:2,s:98,v:179},{k:2,s:100,v:179},{k:2,s:101,v:179},{k:2,s:102,v:179},{k:2,s:103,v:179},{k:2,s:104,v:179},{k:2,s:105,v:179}],
 [{k:2,s:7,v:132},{k:2,s:15,v:132},{k:2,s:24,v:132},{k:2,s:30,v:132},{k:2,s:34,v:132},{k:2,s:37,v:132},{k:2,s:51,v:132},{k:2,s:52,v:132},{k:2,s:53,v:132},{k:2,s:54,v:132},{k:2,s:55,v:132},{k:2,s:58,v:132},{k:2,s:59,v:132},{k:2,s:61,v:132},{k:2,s:62,v:132},{k:2,s:64,v:132},{k:2,s:65,v:132},{k:2,s:68,v:132},{k:2,s:69,v:132},{k:2,s:70,v:132},{k:2,s:71,v:132},{k:2,s:72,v:132},{k:2,s:73,v:132},{k:2,s:74,v:132},{k:2,s:75,v:132},{k:2,s:79,v:132},{k:2,s:80,v:132},{k:2,s:81,v:132},{k:2,s:82,v:132},{k:2,s:83,v:132},{k:2,s:84,v:132},{k:2,s:85,v:132},{k:2,s:86,v:132},{k:2,s:87,v:132},{k:2,s:88,v:132},{k:2,s:89,v:132},{k:2,s:90,v:132},{k:2,s:91,v:132},{k:2,s:92,v:132},{k:2,s:93,v:132},{k:2,s:94,v:132},{k:2,s:95,v:132},{k:2,s:96,v:132},{k:2,s:97,v:132},{k:2,s:98,v:132},{k:2,s:100,v:132},{k:2,s:101,v:132},{k:2,s:103,v:132},{k:2,s:104,v:132},{k:2,s:105,v:132}],
 [{k:1,s:24,v:569}],
 [{k:2,s:7,v:130},{k:2,s:15,v:130},{k:2,s:24,v:130},{k:2,s:30,v:130},{k:2,s:34,v:130},{k:2,s:37,v:130},{k:2,s:51,v:130},{k:2,s:52,v:130},{k:2,s:53,v:130},{k:2,s:54,v:130},{k:2,s:55,v:130},{k:2,s:58,v:130},{k:2,s:59,v:130},{k:2,s:61,v:130},{k:2,s:62,v:130},{k:2,s:64,v:130},{k:2,s:65,v:130},{k:2,s:68,v:130},{k:2,s:69,v:130},{k:2,s:70,v:130},{k:2,s:71,v:130},{k:2,s:72,v:130},{k:2,s:73,v:130},{k:2,s:74,v:130},{k:2,s:75,v:130},{k:2,s:79,v:130},{k:2,s:80,v:130},{k:2,s:81,v:130},{k:2,s:82,v:130},{k:2,s:83,v:130},{k:2,s:84,v:130},{k:2,s:85,v:130},{k:2,s:86,v:130},{k:2,s:87,v:130},{k:2,s:88,v:130},{k:2,s:89,v:130},{k:2,s:90,v:130},{k:2,s:91,v:130},{k:2,s:92,v:130},{k:2,s:93,v:130},{k:2,s:94,v:130},{k:2,s:95,v:130},{k:2,s:96,v:130},{k:2,s:97,v:130},{k:2,s:98,v:130},{k:2,s:100,v:130},{k:2,s:101,v:130},{k:2,s:103,v:130},{k:2,s:104,v:130},{k:2,s:105,v:130}],
 [{k:1,s:24,v:570}],
 [{k:2,s:0,v:193},{k:2,s:7,v:193},{k:2,s:15,v:193},{k:2,s:24,v:193},{k:2,s:30,v:193},{k:2,s:34,v:193},{k:2,s:37,v:193},{k:2,s:51,v:193},{k:2,s:52,v:193},{k:2,s:53,v:193},{k:2,s:54,v:193},{k:2,s:55,v:193},{k:2,s:56,v:193},{k:2,s:58,v:193},{k:2,s:59,v:193},{k:2,s:60,v:193},{k:2,s:61,v:193},{k:2,s:62,v:193},{k:2,s:63,v:193},{k:2,s:64,v:193},{k:2,s:65,v:193},{k:2,s:68,v:193},{k:2,s:69,v:193},{k:2,s:70,v:193},{k:2,s:71,v:193},{k:2,s:72,v:193},{k:2,s:73,v:193},{k:2,s:74,v:193},{k:2,s:75,v:193},{k:2,s:79,v:193},{k:2,s:80,v:193},{k:2,s:81,v:193},{k:2,s:82,v:193},{k:2,s:83,v:193},{k:2,s:84,v:193},{k:2,s:85,v:193},{k:2,s:86,v:193},{k:2,s:87,v:193},{k:2,s:88,v:193},{k:2,s:89,v:193},{k:2,s:90,v:193},{k:2,s:91,v:193},{k:2,s:92,v:193},{k:2,s:93,v:193},{k:2,s:94,v:193},{k:2,s:95,v:193},{k:2,s:96,v:193},{k:2,s:97,v:193},{k:2,s:98,v:193},{k:2,s:100,v:193},{k:2,s:101,v:193},{k:2,s:102,v:193},{k:2,s:103,v:193},{k:2,s:104,v:193},{k:2,s:105,v:193}],
 [{k:1,s:7,v:1},{k:1,s:15,v:2},{k:1,s:24,v:3},{k:1,s:30,v:4},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:54,v:9},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:62,v:15},{k:1,s:64,v:16},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:72,v:435},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:75,v:436},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:88,v:36},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:96,v:44},{k:1,s:98,v:46},{k:1,s:101,v:48},{k:1,s:104,v:51},{k:1,s:105,v:437},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:113,v:56},{k:3,s:116,v:57},{k:3,s:119,v:58},{k:3,s:127,v:60},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:142,v:66},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:148,v:69},{k:3,s:149,v:70},{k:3,s:154,v:71},{k:3,s:155,v:72},{k:3,s:158,v:75},{k:3,s:162,v:76},{k:3,s:163,v:438},{k:3,s:169,v:81},{k:3,s:170,v:439},{k:3,s:171,v:82},{k:3,s:175,v:85},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:188,v:91},{k:3,s:192,v:153},{k:3,s:194,v:96},{k:3,s:195,v:97},{k:3,s:196,v:98},{k:3,s:197,v:99},{k:3,s:198,v:100},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:205,v:106},{k:3,s:207,v:107},{k:3,s:209,v:482},{k:3,s:210,v:110},{k:3,s:212,v:571},{k:3,s:213,v:442},{k:3,s:220,v:112},{k:3,s:222,v:113},{k:3,s:232,v:116},{k:3,s:233,v:443}],
 [{k:1,s:16,v:572}],
 [{k:1,s:7,v:1},{k:1,s:15,v:2},{k:1,s:16,v:573},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:113,v:56},{k:3,s:127,v:60},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:155,v:72},{k:3,s:158,v:75},{k:3,s:164,v:574},{k:3,s:175,v:85},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:188,v:91},{k:3,s:192,v:153},{k:3,s:194,v:96},{k:3,s:195,v:97},{k:3,s:196,v:98},{k:3,s:197,v:99},{k:3,s:198,v:100},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:207,v:107},{k:3,s:210,v:279},{k:3,s:211,v:430}],
 [{k:1,s:7,v:1},{k:1,s:15,v:2},{k:1,s:16,v:575},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:113,v:56},{k:3,s:127,v:60},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:155,v:72},{k:3,s:158,v:75},{k:3,s:164,v:576},{k:3,s:175,v:85},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:188,v:91},{k:3,s:192,v:153},{k:3,s:194,v:96},{k:3,s:195,v:97},{k:3,s:196,v:98},{k:3,s:197,v:99},{k:3,s:198,v:100},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:207,v:107},{k:3,s:210,v:279},{k:3,s:211,v:430}],
 [{k:1,s:24,v:577}],
 [{k:1,s:66,v:578}],
 [{k:2,s:66,v:191}],
 [{k:2,s:7,v:131},{k:2,s:15,v:131},{k:2,s:24,v:131},{k:2,s:30,v:131},{k:2,s:34,v:131},{k:2,s:37,v:131},{k:2,s:51,v:131},{k:2,s:52,v:131},{k:2,s:53,v:131},{k:2,s:54,v:131},{k:2,s:55,v:131},{k:2,s:58,v:131},{k:2,s:59,v:131},{k:2,s:61,v:131},{k:2,s:62,v:131},{k:2,s:64,v:131},{k:2,s:65,v:131},{k:2,s:68,v:131},{k:2,s:69,v:131},{k:2,s:70,v:131},{k:2,s:71,v:131},{k:2,s:72,v:131},{k:2,s:73,v:131},{k:2,s:74,v:131},{k:2,s:75,v:131},{k:2,s:79,v:131},{k:2,s:80,v:131},{k:2,s:81,v:131},{k:2,s:82,v:131},{k:2,s:83,v:131},{k:2,s:84,v:131},{k:2,s:85,v:131},{k:2,s:86,v:131},{k:2,s:87,v:131},{k:2,s:88,v:131},{k:2,s:89,v:131},{k:2,s:90,v:131},{k:2,s:91,v:131},{k:2,s:92,v:131},{k:2,s:93,v:131},{k:2,s:94,v:131},{k:2,s:95,v:131},{k:2,s:96,v:131},{k:2,s:97,v:131},{k:2,s:98,v:131},{k:2,s:100,v:131},{k:2,s:101,v:131},{k:2,s:103,v:131},{k:2,s:104,v:131},{k:2,s:105,v:131}],
 [{k:2,s:7,v:129},{k:2,s:15,v:129},{k:2,s:24,v:129},{k:2,s:30,v:129},{k:2,s:34,v:129},{k:2,s:37,v:129},{k:2,s:51,v:129},{k:2,s:52,v:129},{k:2,s:53,v:129},{k:2,s:54,v:129},{k:2,s:55,v:129},{k:2,s:58,v:129},{k:2,s:59,v:129},{k:2,s:61,v:129},{k:2,s:62,v:129},{k:2,s:64,v:129},{k:2,s:65,v:129},{k:2,s:68,v:129},{k:2,s:69,v:129},{k:2,s:70,v:129},{k:2,s:71,v:129},{k:2,s:72,v:129},{k:2,s:73,v:129},{k:2,s:74,v:129},{k:2,s:75,v:129},{k:2,s:79,v:129},{k:2,s:80,v:129},{k:2,s:81,v:129},{k:2,s:82,v:129},{k:2,s:83,v:129},{k:2,s:84,v:129},{k:2,s:85,v:129},{k:2,s:86,v:129},{k:2,s:87,v:129},{k:2,s:88,v:129},{k:2,s:89,v:129},{k:2,s:90,v:129},{k:2,s:91,v:129},{k:2,s:92,v:129},{k:2,s:93,v:129},{k:2,s:94,v:129},{k:2,s:95,v:129},{k:2,s:96,v:129},{k:2,s:97,v:129},{k:2,s:98,v:129},{k:2,s:100,v:129},{k:2,s:101,v:129},{k:2,s:103,v:129},{k:2,s:104,v:129},{k:2,s:105,v:129}],
 [{k:2,s:66,v:208}],
 [{k:1,s:7,v:1},{k:1,s:15,v:2},{k:1,s:24,v:3},{k:1,s:30,v:4},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:54,v:9},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:62,v:15},{k:1,s:64,v:16},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:72,v:435},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:75,v:436},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:88,v:36},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:96,v:44},{k:1,s:98,v:46},{k:1,s:101,v:48},{k:1,s:104,v:51},{k:1,s:105,v:437},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:113,v:56},{k:3,s:116,v:57},{k:3,s:119,v:58},{k:3,s:127,v:60},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:142,v:66},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:148,v:69},{k:3,s:149,v:70},{k:3,s:154,v:71},{k:3,s:155,v:72},{k:3,s:158,v:75},{k:3,s:162,v:76},{k:3,s:163,v:438},{k:3,s:169,v:81},{k:3,s:170,v:439},{k:3,s:171,v:82},{k:3,s:175,v:85},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:188,v:91},{k:3,s:192,v:153},{k:3,s:194,v:96},{k:3,s:195,v:97},{k:3,s:196,v:98},{k:3,s:197,v:99},{k:3,s:198,v:100},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:205,v:106},{k:3,s:207,v:107},{k:3,s:209,v:517},{k:3,s:210,v:110},{k:3,s:212,v:579},{k:3,s:213,v:442},{k:3,s:220,v:112},{k:3,s:222,v:113},{k:3,s:232,v:116},{k:3,s:233,v:443}],
 [{k:1,s:7,v:1},{k:1,s:15,v:2},{k:1,s:24,v:3},{k:1,s:30,v:4},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:54,v:9},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:62,v:15},{k:1,s:64,v:16},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:72,v:435},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:75,v:436},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:88,v:36},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:96,v:44},{k:1,s:98,v:46},{k:1,s:101,v:48},{k:1,s:104,v:51},{k:1,s:105,v:437},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:113,v:56},{k:3,s:116,v:57},{k:3,s:119,v:58},{k:3,s:127,v:60},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:142,v:66},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:148,v:69},{k:3,s:149,v:70},{k:3,s:154,v:71},{k:3,s:155,v:72},{k:3,s:158,v:75},{k:3,s:162,v:76},{k:3,s:163,v:438},{k:3,s:169,v:81},{k:3,s:170,v:439},{k:3,s:171,v:82},{k:3,s:175,v:85},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:188,v:91},{k:3,s:192,v:153},{k:3,s:194,v:96},{k:3,s:195,v:97},{k:3,s:196,v:98},{k:3,s:197,v:99},{k:3,s:198,v:100},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:205,v:106},{k:3,s:207,v:107},{k:3,s:209,v:518},{k:3,s:210,v:110},{k:3,s:212,v:580},{k:3,s:213,v:442},{k:3,s:220,v:112},{k:3,s:222,v:113},{k:3,s:232,v:116},{k:3,s:233,v:443}],
 [{k:1,s:16,v:581}],
 [{k:1,s:7,v:1},{k:1,s:15,v:2},{k:1,s:24,v:3},{k:1,s:30,v:4},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:54,v:9},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:62,v:15},{k:1,s:64,v:16},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:72,v:435},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:75,v:436},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:88,v:36},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:96,v:44},{k:1,s:98,v:46},{k:1,s:101,v:48},{k:1,s:104,v:51},{k:1,s:105,v:437},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:113,v:56},{k:3,s:116,v:57},{k:3,s:119,v:58},{k:3,s:127,v:60},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:142,v:66},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:148,v:69},{k:3,s:149,v:70},{k:3,s:154,v:71},{k:3,s:155,v:72},{k:3,s:158,v:75},{k:3,s:162,v:76},{k:3,s:163,v:438},{k:3,s:169,v:81},{k:3,s:170,v:439},{k:3,s:171,v:82},{k:3,s:175,v:85},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:188,v:91},{k:3,s:192,v:153},{k:3,s:194,v:96},{k:3,s:195,v:97},{k:3,s:196,v:98},{k:3,s:197,v:99},{k:3,s:198,v:100},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:205,v:106},{k:3,s:207,v:107},{k:3,s:209,v:520},{k:3,s:210,v:110},{k:3,s:212,v:582},{k:3,s:213,v:442},{k:3,s:220,v:112},{k:3,s:222,v:113},{k:3,s:232,v:116},{k:3,s:233,v:443}],
 [{k:1,s:16,v:583}],
 [{k:1,s:7,v:1},{k:1,s:15,v:2},{k:1,s:16,v:584},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:98,v:46},{k:1,s:104,v:51},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:113,v:56},{k:3,s:127,v:60},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:155,v:72},{k:3,s:158,v:75},{k:3,s:164,v:585},{k:3,s:175,v:85},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:188,v:91},{k:3,s:192,v:153},{k:3,s:194,v:96},{k:3,s:195,v:97},{k:3,s:196,v:98},{k:3,s:197,v:99},{k:3,s:198,v:100},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:207,v:107},{k:3,s:210,v:279},{k:3,s:211,v:430}],
 [{k:1,s:7,v:1},{k:1,s:15,v:2},{k:1,s:24,v:3},{k:1,s:30,v:4},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:54,v:9},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:62,v:15},{k:1,s:64,v:16},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:72,v:435},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:75,v:436},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:88,v:36},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:96,v:44},{k:1,s:98,v:46},{k:1,s:101,v:48},{k:1,s:104,v:51},{k:1,s:105,v:437},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:113,v:56},{k:3,s:116,v:57},{k:3,s:119,v:58},{k:3,s:127,v:60},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:142,v:66},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:148,v:69},{k:3,s:149,v:70},{k:3,s:154,v:71},{k:3,s:155,v:72},{k:3,s:158,v:75},{k:3,s:162,v:76},{k:3,s:163,v:438},{k:3,s:169,v:81},{k:3,s:170,v:439},{k:3,s:171,v:82},{k:3,s:175,v:85},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:188,v:91},{k:3,s:192,v:153},{k:3,s:194,v:96},{k:3,s:195,v:97},{k:3,s:196,v:98},{k:3,s:197,v:99},{k:3,s:198,v:100},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:205,v:106},{k:3,s:207,v:107},{k:3,s:209,v:528},{k:3,s:210,v:110},{k:3,s:212,v:586},{k:3,s:213,v:442},{k:3,s:220,v:112},{k:3,s:222,v:113},{k:3,s:232,v:116},{k:3,s:233,v:443}],
 [{k:2,s:66,v:207}],
 [{k:2,s:66,v:206}],
 [{k:1,s:7,v:1},{k:1,s:15,v:2},{k:1,s:24,v:3},{k:1,s:30,v:4},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:54,v:9},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:62,v:15},{k:1,s:64,v:16},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:72,v:435},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:75,v:436},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:88,v:36},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:96,v:44},{k:1,s:98,v:46},{k:1,s:101,v:48},{k:1,s:104,v:51},{k:1,s:105,v:437},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:113,v:56},{k:3,s:116,v:57},{k:3,s:119,v:58},{k:3,s:127,v:60},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:142,v:66},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:148,v:69},{k:3,s:149,v:70},{k:3,s:154,v:71},{k:3,s:155,v:72},{k:3,s:158,v:75},{k:3,s:162,v:76},{k:3,s:163,v:438},{k:3,s:169,v:81},{k:3,s:170,v:439},{k:3,s:171,v:82},{k:3,s:175,v:85},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:188,v:91},{k:3,s:192,v:153},{k:3,s:194,v:96},{k:3,s:195,v:97},{k:3,s:196,v:98},{k:3,s:197,v:99},{k:3,s:198,v:100},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:205,v:106},{k:3,s:207,v:107},{k:3,s:209,v:546},{k:3,s:210,v:110},{k:3,s:212,v:587},{k:3,s:213,v:442},{k:3,s:220,v:112},{k:3,s:222,v:113},{k:3,s:232,v:116},{k:3,s:233,v:443}],
 [{k:2,s:66,v:204}],
 [{k:1,s:7,v:1},{k:1,s:15,v:2},{k:1,s:24,v:3},{k:1,s:30,v:4},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:54,v:9},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:62,v:15},{k:1,s:64,v:16},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:72,v:435},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:75,v:436},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:88,v:36},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:96,v:44},{k:1,s:98,v:46},{k:1,s:101,v:48},{k:1,s:104,v:51},{k:1,s:105,v:437},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:113,v:56},{k:3,s:116,v:57},{k:3,s:119,v:58},{k:3,s:127,v:60},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:142,v:66},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:148,v:69},{k:3,s:149,v:70},{k:3,s:154,v:71},{k:3,s:155,v:72},{k:3,s:158,v:75},{k:3,s:162,v:76},{k:3,s:163,v:438},{k:3,s:169,v:81},{k:3,s:170,v:439},{k:3,s:171,v:82},{k:3,s:175,v:85},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:188,v:91},{k:3,s:192,v:153},{k:3,s:194,v:96},{k:3,s:195,v:97},{k:3,s:196,v:98},{k:3,s:197,v:99},{k:3,s:198,v:100},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:205,v:106},{k:3,s:207,v:107},{k:3,s:209,v:547},{k:3,s:210,v:110},{k:3,s:212,v:588},{k:3,s:213,v:442},{k:3,s:220,v:112},{k:3,s:222,v:113},{k:3,s:232,v:116},{k:3,s:233,v:443}],
 [{k:1,s:7,v:1},{k:1,s:15,v:2},{k:1,s:24,v:3},{k:1,s:30,v:4},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:54,v:9},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:62,v:15},{k:1,s:64,v:16},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:72,v:435},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:75,v:436},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:88,v:36},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:96,v:44},{k:1,s:98,v:46},{k:1,s:101,v:48},{k:1,s:104,v:51},{k:1,s:105,v:437},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:113,v:56},{k:3,s:116,v:57},{k:3,s:119,v:58},{k:3,s:127,v:60},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:142,v:66},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:148,v:69},{k:3,s:149,v:70},{k:3,s:154,v:71},{k:3,s:155,v:72},{k:3,s:158,v:75},{k:3,s:162,v:76},{k:3,s:163,v:438},{k:3,s:169,v:81},{k:3,s:170,v:439},{k:3,s:171,v:82},{k:3,s:175,v:85},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:188,v:91},{k:3,s:192,v:153},{k:3,s:194,v:96},{k:3,s:195,v:97},{k:3,s:196,v:98},{k:3,s:197,v:99},{k:3,s:198,v:100},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:205,v:106},{k:3,s:207,v:107},{k:3,s:209,v:548},{k:3,s:210,v:110},{k:3,s:212,v:589},{k:3,s:213,v:442},{k:3,s:220,v:112},{k:3,s:222,v:113},{k:3,s:232,v:116},{k:3,s:233,v:443}],
 [{k:1,s:16,v:590}],
 [{k:2,s:66,v:177}],
 [{k:2,s:66,v:205}],
 [{k:2,s:66,v:203}],
 [{k:2,s:66,v:202}],
 [{k:1,s:7,v:1},{k:1,s:15,v:2},{k:1,s:24,v:3},{k:1,s:30,v:4},{k:1,s:37,v:5},{k:1,s:52,v:122},{k:1,s:53,v:8},{k:1,s:54,v:9},{k:1,s:55,v:123},{k:1,s:58,v:124},{k:1,s:59,v:12},{k:1,s:61,v:125},{k:1,s:62,v:15},{k:1,s:64,v:16},{k:1,s:69,v:126},{k:1,s:70,v:20},{k:1,s:71,v:21},{k:1,s:72,v:435},{k:1,s:73,v:23},{k:1,s:74,v:24},{k:1,s:75,v:436},{k:1,s:79,v:127},{k:1,s:82,v:30},{k:1,s:83,v:31},{k:1,s:84,v:32},{k:1,s:88,v:36},{k:1,s:90,v:38},{k:1,s:91,v:39},{k:1,s:94,v:42},{k:1,s:95,v:43},{k:1,s:96,v:44},{k:1,s:98,v:46},{k:1,s:101,v:48},{k:1,s:104,v:51},{k:1,s:105,v:437},{k:3,s:109,v:53},{k:3,s:110,v:54},{k:3,s:113,v:56},{k:3,s:116,v:57},{k:3,s:119,v:58},{k:3,s:127,v:60},{k:3,s:132,v:63},{k:3,s:133,v:64},{k:3,s:142,v:66},{k:3,s:143,v:67},{k:3,s:144,v:68},{k:3,s:148,v:69},{k:3,s:149,v:70},{k:3,s:154,v:71},{k:3,s:155,v:72},{k:3,s:158,v:75},{k:3,s:162,v:76},{k:3,s:163,v:438},{k:3,s:169,v:81},{k:3,s:170,v:439},{k:3,s:171,v:82},{k:3,s:175,v:85},{k:3,s:180,v:87},{k:3,s:181,v:88},{k:3,s:188,v:91},{k:3,s:192,v:153},{k:3,s:194,v:96},{k:3,s:195,v:97},{k:3,s:196,v:98},{k:3,s:197,v:99},{k:3,s:198,v:100},{k:3,s:199,v:101},{k:3,s:200,v:102},{k:3,s:202,v:104},{k:3,s:205,v:106},{k:3,s:207,v:107},{k:3,s:209,v:561},{k:3,s:210,v:110},{k:3,s:212,v:591},{k:3,s:213,v:442},{k:3,s:220,v:112},{k:3,s:222,v:113},{k:3,s:232,v:116},{k:3,s:233,v:443}],
 [{k:2,s:66,v:201}],
 ],
 lalrTableInitialState: 0
};

})();
