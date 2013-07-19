/**
 * The entirety of the shape game.
 * @param {Canvas} newCanvas The canvas element.
 * @param {number=} fps The fps to be used. Default is 60.
 * @public
 */
var SpiralControl = function(newCanvas, fps) {
  fps = typeof fps == 'undefined' ? 60 : fps;
  // True iff debug messages are being shown.
  this.debugMessages = false;
  // True iff function call messages are being shown.
  this.funcDebugMessages = false;

  this.canvas = newCanvas;
  this.context = this.canvas.getContext('2d');
  this.imageData = this.context.createImageData(
    this.canvas.width, this.canvas.height);

  this.spirals = [];
  setTimeout(function() {
    this.spirals.push(new Spiral(this.canvas.width / 2, this.canvas.height / 2, 0, 1, this.randomSize()))}.bind(this), 0);
  setTimeout(function() {
    this.spirals.push(new Spiral(this.canvas.width / 2, this.canvas.height / 2-1, 0, -1, this.randomSize()))}.bind(this), 1000);
  setTimeout(function() {
    this.spirals.push(new Spiral(this.canvas.width / 2, this.canvas.height / 2, Math.PI, 1, this.randomSize()))}.bind(this), 1500);
  setTimeout(function() {
    this.spirals.push(new Spiral(this.canvas.width / 2, this.canvas.height / 2-1, Math.PI, -1, this.randomSize()))}.bind(this), 2000);
};

/**
 * @return A random size.
 */
SpiralControl.prototype.randomSize = function() {
  return Math.random() * .04 + .3;
};

/**
 * The spiral shape.
 * @param {number} startX The x coordinate of the root.
 * @param {number} startY The y coordinate of the root.
 * @param {number} startDir The direction, in radians, of the spiral.
 * @param {number} startAccel The sign of the acceleration.
 * @param {number} startSizeMult The size multiplier.
 * @param {Array.<number>=} newColor The color of the spiral. Default is random.
 */
var Spiral = function(startX, startY, startDir, startAccel, startSizeMult, newColor) {
  /**
   * The coordinates of the root.
   * @type {Array.<number>}
   */
  this.root = [startX, startY];

  /**
   * The color of the spiral.
   * @type {Array.<number>}
   */
  this.color = typeof newColor == 'undefined' ?
      SpiralControl.randomColor() : newColor;

  /**
   * The direction of the spiral.
   * @type {number}
   */
  this.dir = startDir;

  /**
   * The angular acceleration of the spiral.
   * @type {number}
   */
  this.angularAccel = startAccel * .05;

  /**
   * Time since the branch started.
   * @type {number}
   */
  this.timeSinceBranch = 0;

  /**
   * Size multiplier of the spiral.
   */
  this.sizeMult = startSizeMult;

  /**
   * The speed of the spiral.
   * @type {number}
   */
  this.speed = 3 * this.sizeMult;

  /**
   * The tip of the spiral, where it grows.
   * @type {Array.<number>}
   */
  this.tip = [startX, startY];

  /**
   * The root of the branch. Null if not discovered yet.
   * @type {?Array.<number>}
   */
  this.branchRoot = null;

  /**
   * The updated coordinates that haven't been on the image yet.
   * The controller needs to clear this.
   * @type {Array.<Array.<number>>}
   */
  this.updated = [];

  /**
   * True iff the spiral is stopped.
   */
  this.stopped = false;
};

/**
 * Updates the spiral.
 */
Spiral.prototype.update = function() {
  if (this.stopped) {
    return;
  }
  var oldTip = [this.tip[0], this.tip[1]];
  this.tip[0] += this.speed * Math.cos(this.dir);
  this.tip[1] += this.speed * Math.sin(this.dir);

  this.updateLine(oldTip, this.tip);
  this.speed = this.updateSpeed(this.speed);
  console.log(this.speed);
  if (this.timeSinceBranch > 25) {
    if (this.branchRoot == null) {
      this.branchRoot = [this.tip[0], this.tip[1], this.dir, this.angularAccel];
    }
    this.dir += this.angularAccel;
  } else {
    this.dir += this.angularAccel / 2;
    this.timeSinceBranch ++;
  }
};

/**
 * Updates the speed.
 * @param {number} x The original speed.
 * @return The new speed.
 */
Spiral.prototype.updateSpeed = function(x) {
  return x * .993 - .0016 * this.sizeMult;
};

/**
 * Updates the line with the color.
 * @param {number} p1 The first point.
 * @param {number} p2 The second point.
 */
Spiral.prototype.updateLine = function(p1, p2) {
  if (Math.abs(p1[1] - p2[1]) < Math.abs(p1[0] - p2[0])) {
    var x1 = p1[0]; var y1 = p1[1];
    var x2 = p2[0]; var y2 = p2[1];
    if (p2[0] < p1[0]) {
      x1 = p2[0]; y1 = p2[1];
      x2 = p1[0]; y2 = p1[1];
    }

    var y = y1;
    var xstep = .5;
    var ystep = xstep * (y1 - y2) / (x1 - x2);

    for (var x = x1; x < x2; x += xstep) {
      y += ystep;
      this.updated.push([Math.round(x), Math.round(y), this.color]);
    }
  } else {
    var x1 = p1[0]; var y1 = p1[1];
    var x2 = p2[0]; var y2 = p2[1];
    if (p2[1] < p1[1]) {
      x1 = p2[0]; y1 = p2[1];
      x2 = p1[0]; y2 = p1[1];
    }

    var x = x1;
    var ystep = .5;
    var xstep = ystep * (x1 - x2) / (y1 - y2);

    for (var y = y1; y < y2; y += ystep) {
      x += xstep;
      this.updated.push([Math.round(x), Math.round(y), this.color]);
    }
  }
  console.log('updating line ' + x1 + ',' + y1 + ':' + x2 + ',' + y2);
};

/**
 * Updates the spirals.
 */
SpiralControl.prototype.update = function() {
  this.spirals.forEach(function(spiral, index, spirals) {
    if (!spiral.stopped) {
      spiral.update();
      this.absorbUpdates(spiral);
      this.decorateCanvas();
      if (spiral.speed < 0) {
        spiral.stopped = true;;
      }
    }
    if (spiral.branchRoot != null) {
      if (Math.random() < .001) {
        console.log('what a chance!');
        this.spirals.push(new Spiral(spiral.branchRoot[0], spiral.branchRoot[1], spiral.branchRoot[2],
                                     -1 * SpiralControl.sign(spiral.branchRoot[3]), this.randomSize()));
        spiral.branchRoot = null;
      }
    }
  }.bind(this));
};

/**
 * Takes the recent updates from the spiral into the image data.
 * @param {Spiral} spiral The spiral to be taken from.
 */
SpiralControl.prototype.absorbUpdates = function(spiral) {
  while (spiral.updated.length > 0) {
    // Each update is [x, y, [r, g, b]]
    var u = spiral.updated.pop();
    if (this.inCanvas(u[0], u[1])) {
      this.setPixel(u[0], u[1], u[2][0], u[2][1], u[2][2]);
    }
  }
};

/**
 * Decorates the canvas with pretty.
 */
SpiralControl.prototype.decorateCanvas = function() {
  this.context.putImageData(this.imageData, 0, 0); // at coords 0,0
};

/**
 * Prints out a debug message to the console.
 * @param {string} message The debug message.
 */
SpiralControl.prototype.debug = function(message) {
  if (this.debugMessage) {
    console.log('[SpiralControl]: ' + message);
  }
};

/**
 * Prints out that a function is being called to the console.
 * @param {string} message The function name.
 */
SpiralControl.prototype.funcDebug = function(message) {
  if (this.funcDebugMessages) {
    console.log('[SpiralControl]: Function ' + message + ' was called.');
  }
};

/**
 * Prints out a warning message to the console.
 * @param {string} message The warning message.
 */
SpiralControl.prototype.warning = function(message) {
  console.log('[SpiralControl]: (WARNING) ' + message);
};

/**
 * Sets pixel pos to r, g, b, alpha.
 * @param {!number} x The x position of the pixel.
 * @param {!number} y The y position of the pixel.
 * @param {number} r The red value.
 * @param {number} g The green value.
 * @param {number} b The blue value.
 * @param {number=} alpha The opaque value. Default is 255.
 */
SpiralControl.prototype.setPixel = function(x, y, r, g, b, alpha) {
  alpha = alpha != undefined ? alpha : 255;
  position = this.canvas.width * y + x;
  this.imageData.data[position*4] = r;
  this.imageData.data[position*4+1] = g;
  this.imageData.data[position*4+2] = b;
  this.imageData.data[position*4+3] = alpha;
};

/**
 * Starts the refresh loop.
 * @param {function()=} functionToRun The function to run.
 */
SpiralControl.prototype.start = function(functionToRun) {
  functionToRun = typeof functionToRun == 'undefined' ?
      (function() {
        this.update();
      }).bind(this) : functionToRun;
  this.refreshInterval = setInterval(functionToRun, this.mspf);
};

/**
 * Stops the refresh loop.
 */
SpiralControl.prototype.stop = function() {
  clearInterval(this.refreshInterval);
  this.refreshInterval = null;
};

/**
 * Returns if the point is inside the canvas.
 * @param {!number} x The x coordinate.
 * @param {!number} y The y coordinate.
 * @return {!boolean} True if the point is inside the canvas, false otherwise.
 * @public
 */
SpiralControl.prototype.inCanvas = function(x, y) {
  return this.inXRange(x) && this.inYRange(y);
};

/**
 * Returns if the number is in the range.
 * @param {!number} num The number to be tested.
 * @param {!number} end1 The first end of the range, inclusive.
 * @param {!number} end2 The second end of the range, exclusive.
 * @public
 */
SpiralControl.inRange = function(num, end1, end2) {
  return end1 <= num && num < end2;
};

/**
 * Returns if the number is in the x range, inclusive.
 * @param {!number} num The number to be tested.
 * @public
 */
SpiralControl.prototype.inXRange = function(num) {
  return SpiralControl.inRange(num, 0, this.canvas.width);
};

/**
 * Returns if the number is in the y range, inclusive.
 * @param {!number} num The number to be tested.
 * @public
 */
SpiralControl.prototype.inYRange = function(num) {
  return SpiralControl.inRange(num, 0, this.canvas.height);
};

/**
 * Returns a random color.
 * @return {!Array.<number>} An array of length 3 with values between 0 and 256.
 * @public
 */
SpiralControl.randomColor = function() {
  return [Math.floor(Math.random()*256), Math.floor(Math.random()*256),
          Math.floor(Math.random()*256)];
};

/**
 * Returns the sign of x.
 * @param {number} x The number to be signed.
 * @return The sign of x.
 */
SpiralControl.sign = function(x) {
  if (x > 0) {
    return 1;
  } else if (x < 0) {
    return -1;
  } else {
    return 0;
  }
};
  
