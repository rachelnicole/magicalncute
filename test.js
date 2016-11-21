// Our Twitter library
var Twit = require('twit');

// We need to include our configuration file
var T = new Twit(require('./config.js')),
	  stream = T.stream('user'),
    path = require('path'),
    fs = require('fs'),
    oxford = require('project-oxford'),
    client = new oxford.Client('4f74e79df5164985b7bdd529f4f59e84'),
    request = require('request'),
    gm = require('gm'),
    tmpImg,
    sizeOf = require('image-size'),
    dimensions = sizeOf('temporary.jpg'),
    imageWidth = dimensions.width,
    imageHeight = dimensions.height;

    gm('bubble.png')
    .rotate('transparent', 30)
    .write('tmp.png', function(err) {
        if (err) throw err;

        gm('kitten.jpg')
            .draw(['image Over 950,150 362,384 tmp.png'])
            .write('output.jpg', function(err) {
                if (err) console.log(err);
            });

    });