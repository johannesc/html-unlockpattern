"use strict";
function UnlockPattern(node) {
  // Some constants that can be tweaked
  this.DEFAULT_SIZE = '100vmin';
  this.MARGIN_RATIO = 0.2;
  this.SMALL_CIRCLE_RATIO = 0.25;
  this.DEFAULT_X_POINTS = 3;
  this.DEFAULT_Y_POINTS = 3;

  this.node = node;

  this.canvas = this.createCanvas();
  this.context = this.canvas.getContext('2d');
  this.circleRadious = 0;
  this.pointRadious = 0;
  this.circles = [];
  this.code = [];
  this.mouseIsDown = false;
  this.currentPoint = null;
  this.submit = node.getAttribute('submit') || 'submit';

  this.numX = this.parseIntAttribute(node, 'numx', this.DEFAULT_X_POINTS);
  this.numY = this.parseIntAttribute(node, 'numy', this.DEFAULT_Y_POINTS);

  this.initSize();
  this.addEventListeners();
  this.drawBoard();
}

UnlockPattern.prototype.parseIntAttribute = function (node, name, defaultVal) {
  if (isNaN(parseInt(node.getAttribute(name), 10))) {
    return defaultVal;
  }
  return parseInt(node.getAttribute(name), 10);
};

UnlockPattern.prototype.createCanvas = function () {
  var canvas = document.createElement('canvas');
  canvas.style = this.node.getAttribute('style');
  this.node.parentNode.insertBefore(canvas, this.node);
  return canvas;
};

UnlockPattern.prototype.initSize = function () {
  var wantedSize = this.convertToPixels(this.node.getAttribute('size'));

  // Make the circles relative to the available area, use the smallest one
  var circleRadiousX = wantedSize / this.numX / 2;
  var circleRadiousY = wantedSize / this.numY / 2;
  this.circleRadious = Math.floor(Math.min(circleRadiousX, circleRadiousY));

  // Set the size of the canvas based on the rounded numbers
  this.canvas.width = this.numX * this.circleRadious * 2;
  this.canvas.height = this.numY * this.circleRadious * 2;

  this.margin = Math.floor(this.circleRadious * this.MARGIN_RATIO);
  this.circleRadious -= this.margin;
  this.pointRadious = Math.floor(this.circleRadious * this.SMALL_CIRCLE_RATIO);

  for (var y = 0; y < this.numY; y++) {
    for (var x = 0; x < this.numX; x++) {
      var circleX = x * (this.circleRadious + this.margin) * 2 + this.circleRadious + this.margin;
      var circleY = y * (this.circleRadious + this.margin) * 2 + this.circleRadious + this.margin;
      this.circles[this.circles.length] = {x:circleX, y:circleY, marked:false};
    }
  }
};

UnlockPattern.prototype.convertToPixels = function (size) {

  size = size || this.DEFAULT_SIZE;
  var splitted = this.splitSize(size);

  if (splitted.stringPart == 'vh') {
    return splitted.numberPart * window.innerHeight / 100;
  } else if (splitted.stringPart == 'vw') {
    return splitted.numberPart * window.innerWidth / 100;
  } else if (splitted.stringPart == 'vmin') {
    return Math.min(splitted.numberPart * window.innerHeight / 100,
      splitted.numberPart * window.innerWidth / 100);
  } else if (splitted.stringPart == 'vmax') {
    return Math.max(splitted.numberPart * window.innerHeight / 100,
      splitted.numberPart * window.innerWidth / 100);
  } else {
    console.log('Unknown size:' + size + ' defaulting to ' + this.DEFAULT_SIZE);
    return this.convertToPixels(this.DEFAULT_SIZE);
  }
};

UnlockPattern.prototype.splitSize = function (size) {
  if (size === null) {
    return null;
  }
  var digits;
  for (digits = 0; digits < size.length; digits++) {
    if (isNaN(parseInt(size.substring(digits, digits + 1), 10))) {
      break;
    }
  }
  var stringPart = size.substring(digits, size.length);
  var numberPart = parseInt(size.substring(0, digits), 10);
  return { numberPart: numberPart, stringPart: stringPart };
};

UnlockPattern.prototype.addEventListeners = function () {
  this.canvas.addEventListener('mousedown', this.mouseDown.bind(this), false);
  this.canvas.addEventListener('mouseup', this.mouseUp.bind(this), false);
  this.canvas.addEventListener('mousemove', this.mouseMove.bind(this), false);
  this.canvas.addEventListener('touchstart', this.touchStart.bind(this), false);
  this.canvas.addEventListener('touchmove', this.touchMove.bind(this), false);
  this.canvas.addEventListener('touchend', this.touchEnd.bind(this), false);
  window.addEventListener('resize', this.resize.bind(this), false);
};

UnlockPattern.prototype.resize = function () {
  this.circles = [];
  this.code = [];
  this.mouseIsDown = false;
  this.initSize();
  this.drawBoard();
};

UnlockPattern.prototype.getMousePos = function (event) {
  var rect = this.canvas.getBoundingClientRect();
  return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
};

UnlockPattern.prototype.getTouchPos = function (event) {
  var rect = this.canvas.getBoundingClientRect();
  return {
      x: event.targetTouches[0].pageX - rect.left,
      y: event.targetTouches[0].pageY - rect.top 
    };
};

UnlockPattern.prototype.inCircle = function (circlePoint, r, point) {
  var distance = Math.sqrt(Math.pow((circlePoint.x - point.x), 2) + Math.pow((circlePoint.y - point.y), 2));
  return (distance <= r);
};

UnlockPattern.prototype.touchStart = function (event) {
  var touchPos = this.getTouchPos(event);
  event.preventDefault();
  this.down(touchPos);
};

UnlockPattern.prototype.touchMove = function (event) {
  var touchPos = this.getTouchPos(event);
  event.preventDefault();

  if (this.mouseIsDown) {
    this.down(touchPos);
    this.drawBoard();
  }
};

UnlockPattern.prototype.touchEnd = function (event) {
  this.up();
};

UnlockPattern.prototype.mouseDown = function (event) {
  var mousePos = this.getMousePos(event);
  this.down(mousePos);
};

UnlockPattern.prototype.down = function(point) {
  this.mouseIsDown = true;
  this.currentPoint = point;

  var i;
  for (i = 0; i < this.circles.length; ++i) {
    if (this.inCircle(this.circles[i], this.pointRadious * 3, point)) {
      if (this.circles[i].marked === false) {
        this.code[this.code.length] = i;
        this.circles[i].marked = true;
      }
    }
  }
};

UnlockPattern.prototype.up = function () {
  this.mouseIsDown = false;
  this.currentPoint = null;
  var codeString = '';
  for (var i = 0; i < this.code.length; i++) {
    codeString += this.code[i];
  }

  for (i = 0; i < this.circles.length; ++i) {
    this.circles[i].marked = false;
  }
  this.code = [];
  this.drawBoard();
  if (codeString !== '') {
    window[this.submit](codeString);
  }
};

UnlockPattern.prototype.mouseUp = function (event) {
  this.up();
};

UnlockPattern.prototype.mouseMove = function (event) {
  var mousePos = this.getMousePos(event);
  if (this.mouseIsDown) {
    this.mouseDown(event);
    this.drawBoard();
  }
};

UnlockPattern.prototype.drawCircle = function (x, y, r, fill) {
    fill = fill || false;
    this.context.beginPath();
    this.context.arc(x , y, r, 0, 2 * Math.PI);
    if (fill) {
      this.context.fill();
    } else {
      this.context.stroke();
    }
};

UnlockPattern.prototype.drawBoard = function () {
  //this.context.fillStyle='#0000FF';
  //this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
  this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  for (var index = 0; index < this.circles.length; ++index) {
    var x = this.circles[index].x;
    var y = this.circles[index].y;
    if (this.circles[index].marked) {
      this.context.strokeStyle='#00FF00';
      this.drawCircle(x, y, this.circleRadious);
    }
    this.context.strokeStyle='#000000';
    var fill = this.circles[index].marked;
    this.context.fillStyle='#FF0000';
    this.drawCircle(x, y, this.pointRadious, fill);
  }

  if (this.code.length > 0) {
    this.context.beginPath();
    this.context.moveTo(this.circles[this.code[0]].x, this.circles[this.code[0]].y);
    for (var i = 1; i < this.code.length; i++) {
      this.context.lineTo(this.circles[this.code[i]].x, this.circles[this.code[i]].y);
    }
    if (this.currentPoint !== null) {
      this.context.lineTo(this.currentPoint.x, this.currentPoint.y);
    }    
    this.context.stroke();
  }
};

function createUnlockPatterns() {
  var inputs = document.getElementsByTagName('unlockpattern');
  for (var i = 0; i < inputs.length;i++){
    new UnlockPattern(inputs[i]);
    inputs[i].style.display = 'none';
  }
}

window.addEventListener('load', function(){createUnlockPatterns()}, false);
