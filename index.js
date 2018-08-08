const express = require('express');
const server = express();

//Require a MongoDB connection using mongoose. Include the mongoose library
//and feed it the correct url to run MongoDB.
//URL is the database it connects to.
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/hotdawgdb');

const bodyParser = require('body-parser')
server.use(express.json()); 
server.use(express.urlencoded({ extended: true }));

server.set('view engine', 'ejs');

server.use(express.static(__dirname + '/public'));

//Mongoose will need to define a schema that is used as a template.
//This will contain the model details that is used by the schema.
//the second array is for options. By default, Mongoose adds an extra
//field for versioning. This will be removed.
const loginSchema = new mongoose.Schema({
  user: { type: String },
  pass: { type: String },
  desc: { type: String }
},{ versionKey: false });

//this is the schema for our posts
const postSchema = new mongoose.Schema({
  user: { type: String },
  title: { type: String },
  desc: { type: String },
  content: { type: String },
  likes: { type: Number },
  //add time
},{versionKey: false});

//Note: mongoose will add an extra 's' at the end of the schema. So even if
//it is accessed normally, it will just include the 's' when it is seen in
//the live database.

//Then the model has to be actualized. This is what the system will interact
//with while the program is running.
const loginModel = mongoose.model('login', loginSchema);
const postModel = mongoose.model('post', postSchema);

server.get('/', function(req, resp){
   resp.render('./pages/index');
});

server.get('/signin', function(req, resp){
   resp.render('./pages/signin');
});

server.post('/signup', function(req, resp){
   //Creating a new instance can be made this way.
  const loginInstance = loginModel({
    user: req.body.user,
    pass: req.body.pass,
    desc: req.body.desc
  });
  
  //to save this into the database, call the instance's save function.
  //it will have a call-back to check if it worked.
  loginInstance.save(function (err, fluffy) {
    if(err) return console.error(err);
    resp.render('./pages/index');
  });
});

server.post('/login', function(req, resp){
  const searchQuery = { user: req.body.user, pass: req.body.pass };
  var queryResult = 0;

  //The model can be found via a search query and the information is found
  //in the login function. Access the information like a JSon array.
  loginModel.findOne(searchQuery, function (err, login) {
    if(err) return console.error(err);
    if(login != undefined && login._id != null)
      queryResult = 1;

      //Put the change of interface in here as the system does not load
      //things synchronously rather asynchronously. In this case, what is
      //displayed will depend on the information found and so the system
      //must wait for the results first.
      var strMsg;
      if(queryResult === 1)
        resp.render('./pages/index');
  });
  
});

server.post('/create-post', function(req, resp){
    //Creating a new instance can be made this way.
  const postInstance = postModel({
    user: 'testUser',
    title: req.body.title,
    desc: req.body.title,
    content: req.body.content,
    likes: 0
  });
  
  //to save this into the database, call the instance's save function.
  //it will have a call-back to check if it worked.
  postInstance.save(function (err, fluffy) {
    if(err) return console.error(err);
    resp.render('./pages/index');
  });
});

server.get('/post', function(req, resp){
//    postModel.find({}, function (err, post){
//        const passData = { post:post };
//        resp.render('./pages/post',{ data:passData });
//    });
      console.log(req.query.title);
      const findQuery = { title: req.query.title }
      
      postModel.findOne(findQuery, function (err, post) {
        console.log(post);
        resp.render('./pages/post', { data:post });
        console.log("hi");
      });
});
    
server.get('/profile', function(req, resp){
    
    console.log(req.query.username);
    const findQuery = { user: req.query.user }
    
    loginModel.findOne(findQuery, function(err, login){
        console.log(login);
        resp.render('./pages/profile', { data: login });
        console.log("hello");
    });
});

const port = process.env.PORT | 9090;
server.listen(port);