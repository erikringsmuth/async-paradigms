## async-paradigms
>> A walk through async paradigms from callback hell to `async`/`await`.

Let's write a geolocaiton service that gets the temperature at your location. The ideal syntax would look something like this if we didn't have to worry about blocking IO.

`geoService.js`
```js
var request = require('request');

module.exports.temperature = function temperature(ipAddress) {
  var location = request('http://freegeoip.net/json/' + ipAddress);
  var weather = request('http://api.openweathermap.org/data/2.5/weather?q=' + location.region_code + ',' + location.city);
  var temp = (weather.main.temp - 273.15) * 9/5 + 32;
  return temp;
}
```

Then we can consume the service with a simple server.
`server.js`
```js
var app        = require('httpServer'),
    geoService = require('geoService');

app.get('/temperature', function(req, res) {
  try {
    var temp = geoService.temperature(req.ip);
    res.send(200, { temperature: temp });
  } catch {
    res.send(500, { message: 'It broke!' });
  }
});

app.listen(80);
```

Okay, that was easy but now let's get back to reality. Javascript isn't multithreaded and uses run-to-completion scheduling. Node.js gets around this by using callbacks and an event loop.

### Callback hell
AKA the pyramid of doom. This is the first type of code you will probaby write in node. It will work, but it's ugly and hell to debug.

`geoService.js`
```js
var http = require('http');

module.exports.temperature = function temperature(req, res) {
  var locationRequest = http.request({
    hostname: 'freegeoip.net',
    path: '/json/' + ipAddress
  }, function (locationResponse) {
    var locationData = '';
    locationResponse.on('data', function (chunk) {
      locationData += chunk;
    });
    locationResponse.on('end', function () {
      // made it to the first response! wooo!
      var weatherRequest = http.request({
        hostname: 'freegeoip.net',
        path: '/json/' + ipAddress
      }, function (weatherResponse) {
        var weatherData = '';
        weatherResponse.on('data', function (chunk) {
          weatherData += chunk;
        });
        weatherResponse.on('end', function () {
          // we have the weather!
          var temp = (weatherData.main.temp - 273.15) * 9/5 + 32;
          res.send(200, { temperature: temp });
        });
      });
      weatherRequest.on('error', function (e) {
        res.send(500, { message: 'It broke!' });
      });
      weatherRequest.end();
    });
  });
  locationRequest.on('error', function (e) {
    res.send(500, { message: 'It broke!' });
  });
  locationRequest.end();
}
```

This was what my first node.js code looked like. You can see every event emitted. Boys and girls, this is what the event loop looks like in all it's raw glory!

That type of code doesn't last for long. We can use the [request](https://github.com/mikeal/request) module to clean this up a bit.

`geoService.js`
```js
var request = require('request');

module.exports.temperature = function temperature(req, res) {
  request('http://freegeoip.net/json/' + req.ip, function (err, httpResponse, body) {
    if (err) {
      res.send(500, { message: 'It broke!' });
    }
    request('http://api.openweathermap.org/data/2.5/weather?q=' + body.region_code + ',' + body.city, function (err, httpResponse, body) {
      if (err) {
        res.send(500, { message: 'It broke!' });
      }
      var temp = (body.main.temp - 273.15) * 9/5 + 32;
      res.send(200, { temperature: temp });
    });
  });
}
```

Much better. A couple callbacks are readable. This batched up the `data`, `end`, `error` events and the need to emit the `end()` event to send the request.

The server.
`server.js`
```js
var app        = require('httpServer'),
    geoService = require('geoService');

app.get('/temperature', geoService.temperature);

app.listen(80);
```

### Callback arguments
We can take the previous example one step further to decouple the geolocation service from the server. The service shouldn't know about the `function (req, res)` request syntax or return HTTP status codes. It should be isolated and testable.

```js
var request = require('request');

module.exports.temperature = function temperature(ipAddress, successCallback, errorCallback) {
  request('http://freegeoip.net/json/' + ipAddress, function (err, httpResponse, body) {
    if (err) {
      errorCallback(new Error('It broke!'));
    }
    request('http://api.openweathermap.org/data/2.5/weather?q=' + body.region_code + ',' + body.city, function (err, httpResponse, body) {
      if (err) {
        errorCallback(new Error('It broke!'));
      }
      var temp = (body.main.temp - 273.15) * 9/5 + 32;
      successCallback({ temperature: temp });
    });
  });
}
```

The server.
`server.js`
```js
var app        = require('httpServer'),
    geoService = require('geoService');

app.get('/temperature', function (req, res) {
  geoService.temperature(req.ip,
    function (data) {
      res.send(200, { temperature: temp });
    },
    function (error) {
      res.send(500, { message: error });
    });
});

app.listen(80);
```

Now the web and service layers are separated and won't mix the web request with the work to get the temperature.

### Promises

### Generators (semi-coroutines)

### async/await

### Run in node.js
Run `npm install` to install dev dependencies (mocha, gulp, and gulp tasks).

- `mocha` to test
- `gulp` to lint, test, and watch for changes
