var Twit = require('twit'),
    T = new Twit(require('./config.js')),
    stream = T.stream('user'),
    path = require('path'),
    http = require('http'),
    fs = require('fs'),
    request = require('request'),
    face = require('./face'),
    tmpImg,
    taskHandleRate = 10 * 1000,
    queue = [];

stream.on('tweet', function (message) {
  var screenName = message.user.screen_name,
      statusId = message.id_str;
  if (message.in_reply_to_screen_name == 'magicalncute') {
    T.get('friendships/lookup', { screen_name: screenName },  function (err, data, response) {
      if (data[0].connections.toString() == 'followed_by') {
        console.log('they are following');
        if (message.in_reply_to_screen_name === 'magicalncute' && message.entities.media != null) {
          var imageUrl = message.entities.media[0].media_url;
          enqueueTask(imageUrl, statusId, screenName);
        }
        if (message.in_reply_to_screen_name === 'magicalncute' && message.entities.media == null && screenName != 'magicalncute') {
          T.post('statuses/update', {in_reply_to_status_id: message.id_str, status: '@' + screenName + ' ' + 'you have to attach a selfie if you want me to cutiefy it!'}, function(err, data, response){ 
            console.log('reply sent for false media attachment');
          });
        }
      }
      else {
        console.log('telling the person that they arent following');
         T.post('statuses/update', {in_reply_to_status_id: message.id_str, status: '@' + screenName + ' ' + 'you have to follow if you want things cuteified'}, function(err, data, response){ 
           console.log('reply sent for non following');
         });
      }
    })
  }
});

function enqueueTask(imageUrl, statusId, screenName) {
  console.log('enqueue');
  queue.push({imageUrl: imageUrl, statusId: statusId, screenName: screenName});
}

setInterval(function() {
  if (queue.length > 0) {
    console.log('running task');
    var front = queue[0];
    queue = queue.splice(1);
    runTask(front.imageUrl, front.statusId, front.screenName);
  } else {
    console.log('no work to do');
  }
}, taskHandleRate);

function runTask(imageUrl, statusId, screenName) {
  console.log('run task');
  file = fs.createWriteStream('temporary.jpg'),
  request = http.get(imageUrl, function(response) {
    response.pipe(file);
    response.on('end',  function(){
      face.cuterImage('temporary.jpg', function(){
        console.log('ready');
        sendTweet('output.jpg', statusId, screenName);
      });
    });
  });
}
    
function sendTweet(imageFile, statusId, screenName) {
  var b64content = fs.readFileSync(imageFile, { encoding: 'base64' });

  T.post('media/upload', { media_data: b64content }, function (err, data, response) {

    var mediaIdStr = data.media_id_string
    var altText = "def some cuties."
    var meta_params = { media_id: mediaIdStr, alt_text: { text: altText } }

    T.post('media/metadata/create', meta_params, function (err, data, response) {
      if (!err) {
        var params = { in_reply_to_status_id: statusId, status: '@' + screenName + ' ', media_ids: [mediaIdStr] }

        T.post('statuses/update', params, function (err, data, response) {
          console.log(data)
        })
      }
    })
  });
}
