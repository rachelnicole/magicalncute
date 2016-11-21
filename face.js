Array.prototype.pick = function() {
  return this[Math.floor(Math.random()*this.length)];
};

var async = require('async'),
    path = require('path'),
    tmp = require('tmp'),
    oxford = require('project-oxford'),
    client = new oxford.Client(''),
    gm = require('gm').subClass({
      imageMagick: true
    }),
    nose = require('./nose.js'),
    bottom = require('./background.js'),
    ears = require('./ears.js'),
    cheeks = require('./cheek.js'),
    sizeOf = require('image-size'),
    bottomCount = 0;

function cuterImage(imagePath, readyFunction) {
  bottomCount = 0;
  detectFace(imagePath, readyFunction);
}

function detectFace(imagePath, readyFunction) {
  console.log('detectFace');
  console.log(imagePath);
  client.face.detect({
    path: imagePath,
    analyzesFaceLandmarks: true,
    analyzesHeadPose: true
  }).then(addThingsToFace);

  function addThingsToFace(response) {
    async.reduce(response, imagePath, function (currentImage, faceData, callback) {
      makeNoseAndEars(currentImage, faceData, function(newImage) {
        callback(null, newImage);
      });
    }, function (err, finalImage) {
      gm(finalImage).write('output.jpg', function(err) {
        if (err) throw err;
        console.log('saved');
        readyFunction();
      });    
    });
  };
};


function makeNoseAndEars(currentImage, faceData, callback) {

  var noseWidth = ((faceData.faceLandmarks.noseRightAlarOutTip.x - faceData.faceLandmarks.noseLeftAlarOutTip.x) - 25),
      noseHeight = ((faceData.faceLandmarks.noseRightAlarOutTip.x - faceData.faceLandmarks.noseLeftAlarOutTip.x) - 25),
      earWidth = (faceData.faceLandmarks.eyebrowLeftInner.x - faceData.faceLandmarks.eyebrowLeftOuter.x),
      earHeight = earWidth,
      eyeWidth = (faceData.faceLandmarks.eyeLeftInner.x - faceData.faceLandmarks.eyeLeftOuter.x),
      eyeHeight = (faceData.faceLandmarks.eyeLeftBottom.y - faceData.faceLandmarks.eyeLeftTop.y),
      randomNose = nose.pick(),
      randomEars = ears.pick(),
      randomCheek = cheeks.pick();

  makeNose(currentImage);
  console.log(faceData);

  function makeNose(currentImage) {
    randomNose = nose.pick();
    combineImages(currentImage, faceData.faceLandmarks.noseTip.x - (noseWidth / 2), faceData.faceLandmarks.noseTip.y - (noseHeight / 2), noseWidth, noseHeight, randomNose, function(path) {
      makeLeftCheek(path);
    });
  };

  function makeLeftCheek(currentImage) {
    combineImages(currentImage, faceData.faceLandmarks.eyeLeftBottom.x - eyeWidth, faceData.faceLandmarks.eyeLeftBottom.y + eyeHeight, eyeWidth + 50, eyeHeight + 50, randomCheek, function(path) {
      makeRightCheek(path);
    });
  };

  function makeRightCheek(currentImage) {
    combineImages(currentImage, faceData.faceLandmarks.eyeRightBottom.x - (eyeWidth / 2), faceData.faceLandmarks.eyeRightBottom.y + eyeHeight, eyeWidth + 50, eyeHeight + 50, randomCheek, function(path) {
      makeLeftEar(path);
    });
  };

  function makeLeftEar(currentImage) {
    combineImages(currentImage, faceData.faceLandmarks.eyebrowLeftOuter.x, (faceData.faceLandmarks.eyebrowLeftOuter.y) - (eyeHeight * 10), earWidth, earHeight, randomEars, function(path) {
      makeRightEar(path);
    });
  };

  function makeRightEar(currentImage) {
    combineImages(currentImage, faceData.faceLandmarks.eyebrowRightInner.x, ((faceData.faceLandmarks.eyebrowRightInner.y) - (eyeHeight * 10)), earWidth, earHeight, randomEars.replace('-left-', '-right-'), function(path) {
      if (bottomCount == 0) {
        makeBottom(path);
      }
      else {
        callback(path);
      }
    });
  };

  function makeBottom(currentImage) {
    randomBottom = bottom.pick(),
    dimensions = sizeOf(currentImage);
    combineImages(currentImage, 0, dimensions.height - 150, dimensions.width, 150, randomBottom, function(path) {
      bottomCount++;
      callback(path);
    });
  };
};

function combineImages(inputImage, xPos, yPos, featureWidth, featureHeight, overlayImage, callback) {
  tmp.file(function(err, path, fd, cleanupCallback){
    if (err) throw err;
    gm(inputImage).draw(['image Over ' + xPos + ',' + yPos + ' ' + featureWidth + ',' + featureHeight + ' ' + overlayImage])
      .write(path, function(err) {
        if (err) console.log(err);
        callback(path);
    });
  });
};

module.exports.cuterImage = cuterImage;