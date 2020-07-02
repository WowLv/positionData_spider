var createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
var bodyParser=require("body-parser");
// var cors = require('cors');



const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');



const app = express();

//改写
const http = require('http');
const server = http.createServer(app);



//跨域请求

// app.all('*',function (req, res, next) {
//   res.header('Access-Control-Allow-Origin', 'http://localhost:8080');
//   res.header('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');
//   res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
//   // res.header('Access-Control-Allow-Credentials', 'true');//允许携带cookie
//   if (req.method == 'OPTIONS') {
//     res.send(200); //让options请求快速返回
//   }
//   else {
//     next();
//   }
// });
app.all('*', function(req, res ,next) {
  
  // res.header('Access-Control-Allow-Origin', 'http://localhost:8080');
  res.header('Access-Control-Allow-Origin', '*');
  res.header("Access-Control-Allow-Headers", "Content-Type,Content-Length, Authorization, Accept,X-Requested-With");
  res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
  if (req.method === 'OPTIONS') {
    res.send(200)
  } else {
    next()
  }
})

// view engine setup 模板
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//日志
// app.use(logger('dev'));
// app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(cookieParser());


app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// module.exports = app;
server.listen(3000, function() {
  console.log('server at 3000')
})