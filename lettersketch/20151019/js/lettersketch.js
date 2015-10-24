
var start = new Date();
var maxTime = 4000;
var timeoutVal = Math.floor(maxTime/100);
var timeoutVar;
var on_gif = "";
var reference_image;
var ref_grey_count = 0;
var threshold = 0;
var audioElement01 = document.createElement('audio');
audioElement01.setAttribute('src', 'mp3/lower.mp3');

function updateProgress(percentage) {
  document.getElementById("pbar_innerdiv").style.width=percentage + "%";
}

function animateUpdate() {
  var now = new Date();
  var timeDiff = now.getTime() - start.getTime();
  var perc = 100 - Math.round((timeDiff/maxTime)*100);
  if (perc > 0) {
    updateProgress(perc);
    timeoutVar = setTimeout(animateUpdate, timeoutVal);
  } else {
    updateProgress(0);
    loop(); 
    if (on_gif.length == 0) {
      $.get("http://localhost:5000/wiped/no_gif")
    } else {
      $.get("http://localhost:5000/wiped/"+on_gif)
    }
  }
}

// Variables for referencing the canvas and 2dcanvas context
var canvas,ctx;

// Variables to keep track of the mouse position and left-button status 
var mouseX,mouseY,mouseDown=0;

// Variables to keep track of the touch position
var touchX,touchY;

// Draws a dot at a specific position on the supplied canvas name
// Parameters are: A canvas context, the x position, the y position, the size of the dot
function drawDot(ctx,x,y,size) {
// Let's use black by setting RGB values to 0, and 255 alpha (completely opaque)
r=255; g=0; b=0; a=255;

// Select a fill style
ctx.fillStyle = "rgba("+r+","+g+","+b+","+(a/255)+")";

// Draw a filled circle
ctx.beginPath();
ctx.arc(x, y, size, 0, Math.PI*2, true); 
ctx.closePath();
ctx.fill();
} 

// Keep track of the mouse button being pressed and draw a dot at current location
function sketchpad_mouseDown() {
  mouseDown=1;
  drawDot(ctx,mouseX,mouseY,12);
}

// Keep track of the mouse button being released
function sketchpad_mouseUp(e) {
// Update the mouse co-ordinates when released
getMousePos(e);
// console.log("Up at", mouseX, mouseY);
if (mouseX > canvas.width || mouseY > canvas.height || (mouseX < 65 && mouseY < 45)) {
  return;
}
if (mouseX > 386 && mouseY < 20) {

  if (on_gif.length == 0) {
    $.get("http://localhost:5000/clearCanvas/no_gif")
  } else {
    $.get("http://localhost:5000/clearCanvas/"+on_gif)
  }
  mouseDown=0;
  ctx.clearRect(0, 0, sketchpad.width, sketchpad.height);
  if (on_gif == "") {
    draw_background();
  } else {
    draw_example(on_gif);
  }
  updateProgress(0);
  clearTimeout(timeoutVar);
  return;
}
if (on_gif.length == 0) {
  $.get("http://localhost:5000/sketchpad_mouseUp/no_gif")
} else {
  $.get("http://localhost:5000/sketchpad_mouseUp/"+on_gif)
}

// get current image
var myImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
var data = myImageData.data;
if (on_gif != "") {
// Try to assess correctness
var ref_data = reference_image.data;

// turn any "good" red to black
for (var i = 0; i < data.length; i += 4) {
  if (data[i] != ref_data[i]) {
data[i]     = 0; //255 - data[i];     // red
data[i + 1] = 0; //255 - data[i + 1]; // green
data[i + 2] = 0; //255 - data[i + 2]; // blue
}
}
ctx.putImageData(myImageData, 0, 0);
// count up red and grey
var red_count = 0;
var grey_count = 0;
for (var i = 0; i < data.length; i += 4) {
  if (data[i] == 255 && data[i + 1] == 0) { 
    red_count += 1;
  }
  if (data[i] != 255 && data[i] != 0) { 
    grey_count += 1;
  }
}
if (red_count < threshold && grey_count < threshold) {
  console.log("Red/Grey", red_count, grey_count, "PASS")
  document.getElementById('gif').style.display = 'none';
  on_gif = "";
} else {
  console.log("Red/Grey", red_count, grey_count)
}
}

mouseDown=0;
clearTimeout(timeoutVar);
start = new Date();
animateUpdate();
}

function loop() {
/// clear canvas, set alpha and re-draw image
ctx.clearRect(0, 0, sketchpad.width, sketchpad.height);
if (on_gif == "") {
  draw_background();
} else {
  draw_example(on_gif);
}
}

function draw_background() {
  var img = new Image();
  img.onload = function(){
    ctx.drawImage(img,-3,0);
  };
  img.src = 'gif/background.png';
}

// Keep track of the mouse position and draw a dot if mouse button is currently pressed
function sketchpad_mouseMove(e) { 
// Update the mouse co-ordinates when moved
getMousePos(e);

// Draw a dot if the mouse button is currently being pressed
if (mouseDown==1) {
  drawDot(ctx,mouseX,mouseY,12);
}
}

// Get the current mouse position relative to the top-left of the canvas
function getMousePos(e) {
  if (!e)
    e = event;

  if (e.offsetX) {
    mouseX = e.offsetX;
    mouseY = e.offsetY;
  }
  else if (e.layerX) {
    mouseX = e.layerX;
    mouseY = e.layerY;
  }
}

// Draw something when a touch start is detected
function sketchpad_touchStart() {
// Update the touch co-ordinates
getTouchPos();

drawDot(ctx,touchX,touchY,12);

// Prevents an additional mousedown event being triggered
event.preventDefault();
}

// Draw something and prevent the default scrolling when touch movement is detected
function sketchpad_touchMove(e) { 
// Update the touch co-ordinates
getTouchPos(e);

// During a touchmove event, unlike a mousemove event, we don't need to check if the touch is engaged, since there will always be contact with the screen by definition.
drawDot(ctx,touchX,touchY,12); 

// Prevent a scrolling action as a result of this touchmove triggering.
event.preventDefault();
}

// Get the touch position relative to the top-left of the canvas
// When we get the raw values of pageX and pageY below, they take into account the scrolling on the page
// but not the position relative to our target div. We'll adjust them using "target.offsetLeft" and
// "target.offsetTop" to get the correct values in relation to the top left of the canvas.
function getTouchPos(e) {
  if (!e)
    e = event;

  if(e.touches) {
if (e.touches.length == 1) { // Only deal with one finger
var touch = e.touches[0]; // Get the information for finger #1
touchX=touch.pageX-touch.target.offsetLeft;
touchY=touch.pageY-touch.target.offsetTop;
}
}
}

// Set-up the canvas and add our event handlers after the page has loaded
function init() {
  $.get("http://localhost:5000/init_upper/0")
// Get the specific canvas element from the HTML document
canvas = document.getElementById('sketchpad');

// If the browser supports the canvas tag, get the 2d drawing context for this canvas
if (canvas.getContext)
  ctx = canvas.getContext('2d');

// Check that we have a valid context to draw on/with before adding event handlers
if (ctx) {
// React to mouse events on the canvas, and mouseup on the entire document
canvas.addEventListener('mousedown', sketchpad_mouseDown, false);
canvas.addEventListener('mousemove', sketchpad_mouseMove, false);
window.addEventListener('mouseup', sketchpad_mouseUp, false);

// React to touch events on the canvas
canvas.addEventListener('touchstart', sketchpad_touchStart, false);
canvas.addEventListener('touchmove', sketchpad_touchMove, false);
}
draw_background();
}

function show_gif(gif) {
  $.get("http://localhost:5000/show_gif/"+gif)
  on_gif = gif;
  document.getElementById('gif').style.display = "block";
  document.getElementById('gif').innerHTML = '<div style="float:left;"><img onclick="dismiss_demo();" src="gif/'+gif+'.gif"></div><div style="float:left; margin-left:10px"><H1><i onclick="play_audio(\''+gif+'\');" class="fa fa-play"></i></H1></div></div><br style="clear:both">';
  draw_example(gif);
}

function dismiss_demo() {
  document.getElementById('gif').style.display = "none";
  on_gif = "";
}

function play_audio(mp3) {
  $.get("http://localhost:5000/play_audio/"+mp3)
  console.log(mp3);
  audioElement01.setAttribute('src','mp3/'+ mp3+'.mp3');
  audioElement01.play();
}

function draw_example(gif){
  document.getElementById('gif').style.display = "block";
  clearTimeout(timeoutVar);
  updateProgress(0);

  var img = new Image();
  img.onload = function(){
    ctx.drawImage(img,-3,-5);
    reference_image = ctx.getImageData(0, 0, canvas.width, canvas.height);

    var ref_data = reference_image.data;

    ref_grey_count = 0;
    for (var i = 0; i < ref_data.length; i += 4) {
      if (ref_data[i] != 255 && ref_data[i] != 0 ) { 
        ref_grey_count += 1;
      }
    }
    threshold = 0.1 * ref_grey_count;
    console.log("Ref", ref_grey_count, threshold);
  };
  img.src = 'gif/'+gif+'_.gif';
  $('html, body').animate({ scrollTop: 0 }, 'fast');
}
