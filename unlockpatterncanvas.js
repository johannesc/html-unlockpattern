function UnlockPattern(node) {
  this.NUM_X = 3;
  this.NUM_Y = 3;

  this.canvas = this.createCanvas(node);
  this.context = this.canvas.getContext('2d');
  this.circleRadious = 0;
  this.pointRadious = 0;
  this.circles = [];
  this.code = [];
  this.mouseIsDown = false;
  this.currentPoint = null;

  this.initSize();
  this.addEventListeners();
  this.drawBoard();
}

UnlockPattern.prototype.createCanvas = function(node) {
  var pel = node.parentNode;
  var canvas = document.createElement('canvas');
  node.parentNode.insertBefore(canvas, node);
  return canvas;
}
 
 UnlockPattern.prototype.initSize = function() {
  var viewportWidth = window.innerWidth;
  var viewportHeight = window.innerHeight;

  // Parameters, could be defined in HTML
  var widthRatio = 1;
  var heightRatio = 0.5;
  var MARGIN = 0.2;
  var SMALL_CIRCLE_RATIO = 0.25;

  // Make the circles relative to the available area, use the smallest one
  var circleRadiousX = Math.round(viewportWidth * widthRatio) / this.NUM_X / 2;
  var circleRadiousY = Math.round(viewportHeight * heightRatio) / this.NUM_Y / 2;
  this.circleRadious = Math.round(Math.min(circleRadiousX, circleRadiousY));

  // Only make canvas as big as we have to
  this.canvas.width = this.NUM_X * this.circleRadious * 2;
  this.canvas.height = this.NUM_Y * this.circleRadious * 2;
  console.log('canvasWidth=' + this.canvas.width + ' canvasHeight=' + this.canvas.height);

  this.margin = Math.round(this.circleRadious * MARGIN);
  this.circleRadious -= this.margin;
  this.pointRadious = Math.round(this.circleRadious * SMALL_CIRCLE_RATIO);

  for (y = 0; y < this.NUM_Y; y++) {
    for (x = 0; x < this.NUM_X; x++) {
      var circleX = x * (this.circleRadious + this.margin) * 2 + this.circleRadious + this.margin;
      var circleY = y * (this.circleRadious + this.margin) * 2 + this.circleRadious + this.margin;
      this.circles[this.circles.length] = {x:circleX, y:circleY, marked:false};
    }
  }
}

UnlockPattern.prototype.addEventListeners = function() {
  this.canvas.addEventListener('mousedown', this.mouseDown.bind(this), false);
  this.canvas.addEventListener('mouseup', this.mouseUp.bind(this), false);
  this.canvas.addEventListener('mousemove', this.mouseMove.bind(this), false);
  this.canvas.addEventListener('touchstart', this.touchStart.bind(this), false);
  this.canvas.addEventListener('touchmove', this.touchMove.bind(this), false);
  this.canvas.addEventListener('touchend', this.touchEnd.bind(this), false);
  window.addEventListener('resize', this.resize.bind(this), false);
}

UnlockPattern.prototype.resize = function() {
  console.log('resize');
  this.circles = [];
  this.code = [];
  this.mouseIsDown = false;
  this.initSize();
  this.drawBoard();
}

UnlockPattern.prototype.getMousePos = function(event) {
  var rect = this.canvas.getBoundingClientRect();
  return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
}

UnlockPattern.prototype.getTouchPos = function(event) {
  var rect = this.canvas.getBoundingClientRect();
  return {
      x: event.targetTouches[0].pageX - rect.left,
      y: event.targetTouches[0].pageY - rect.top 
    };
}

UnlockPattern.prototype.inCircle = function(circlePoint, r, point) {
  var distance = Math.sqrt(
                   Math.pow((circlePoint.x - point.x), 2)
                     + Math.pow((circlePoint.y - point.y), 2)
                 );
  return (distance <= r);
}

UnlockPattern.prototype.touchStart = function(event) {
  var touchPos = this.getTouchPos(event);
  console.log('touchStart x=' +  touchPos.x + 'y=' +  touchPos.y);
  event.preventDefault();
  this.down(touchPos);
}

UnlockPattern.prototype.touchMove = function(event) {
  var touchPos = this.getTouchPos(event);
  console.log('touchMove x=' +  touchPos.x + 'y=' +  touchPos.y);
  event.preventDefault();

  if (this.mouseIsDown) {
    this.down(touchPos);
    this.drawBoard(circles);
  }
}

UnlockPattern.prototype.touchEnd = function(event) {
  this.up();
}

UnlockPattern.prototype.mouseDown = function(event) {
  var mousePos = this.getMousePos(event);
  this.down(mousePos);
}

UnlockPattern.prototype.down = function(point) {
  this.mouseIsDown = true;
  this.currentPoint = point;

  var i;
  for (i = 0; i < this.circles.length; ++i) {
    if (this.inCircle(this.circles[i], this.pointRadious * 3, point)) {
      if (this.circles[i].marked == false) {
        this.code[this.code.length] = i;
        this.circles[i].marked = true;
      }
    }
  }
}

UnlockPattern.prototype.up = function() {
  this.mouseIsDown = false;
  this.currentPoint = null;
  var codeString = '';
  for (i=0; i< this.code.length; i++) {
    codeString += this.code[i];
  }
  console.log('Code=' + codeString);
  for (i = 0; i < this.circles.length; ++i) {
    this.circles[i].marked = false;
  }
  this.code = [];
  this.drawBoard();
  sendOpen(codeString);
}

UnlockPattern.prototype.mouseUp = function(event) {
  this.up();
}

UnlockPattern.prototype.mouseMove = function(event) {
  var mousePos = this.getMousePos(event);
  if (this.mouseIsDown) {
    this.mouseDown(event);
    this.drawBoard();
  }
}

UnlockPattern.prototype.drawCircle = function(x, y, r, fill) {
    fill = fill || false;
    this.context.beginPath();
    this.context.arc(x , y, r, 0, 2 * Math.PI);
    if (fill) {
      this.context.fill();
    } else {
      this.context.stroke();
    }
}

UnlockPattern.prototype.drawBoard = function() {
  //this.context.fillStyle='#0000FF';
  //this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
  this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  for (index = 0; index < this.circles.length; ++index) {
    x = this.circles[index].x;
    y = this.circles[index].y;
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
    for (i=1; i<this.code.length; i++) {
      this.context.lineTo(this.circles[this.code[i]].x, this.circles[this.code[i]].y);
    }
    if (this.currentPoint != null) {
      this.context.lineTo(this.currentPoint.x, this.currentPoint.y);
    }    
    this.context.stroke();
  }
}

function createUnlockPatterns(){
  var inputs = document.getElementsByTagName('input');
  for (var i=0;i<inputs.length;i++){
    if(inputs[i].className == 'unlockpattern'){
      new UnlockPattern(inputs[i]);
      inputs[i].style.display = 'none';
    }
  }
};

window.addEventListener('load', function(){createUnlockPatterns()}, false);