var gm = require('gm').subClass({ imageMagick: true });

var AWS = require('aws-sdk');
var s3 = new AWS.S3();

var WIDTH  = 100;
var HEIGHT = 100;
 
exports.handler = function(event, context, callback) {
  var src = {
    Bucket: event.Records[0].s3.bucket.name,
    Key: decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g,' '))
  };
  var matchExt = src.Key.match(/\.(jpg|png)$/);

  if (!matchExt) {
    return callback('Unsupported image type.');
  }

  // DOWNLOAD
  s3.getObject(src, function(err, obj) {
    if (err) return callback(err);
    // TRANSFORM
    gm(obj.Body).size(function(err, size) {
      if (err) return callback(err);

      var scalingFactor = Math.min(
        WIDTH / size.width,
        HEIGHT / size.height
      );

      this.resize(
        scalingFactor * size.width,
        scalingFactor * size.height
      );

      this.toBuffer(matchExt[1], function(err, buffer) {
        if (err) return callback(err);

        // UPLOAD
        s3.putObject({
          Bucket: src.Bucket + '-thumbs',
          Key: src.Key,
          Body: buffer,
          ContentType: obj.ContentType
        }, callback);
      });
    });
  });
};