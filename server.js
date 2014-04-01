var express = require('express'),
    port = process.env.PORT || process.argv[2] || 3000,
    app = express();

app.use(express.static(__dirname));
app.listen(port, function () {
  console.log('Listening at ' + port);
});
