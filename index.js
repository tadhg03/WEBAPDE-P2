const express = require('express');
const server = express();

const crypto = require('crypto');

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
  desc: { type: String },
  dp  : { type: String }
},{ versionKey: false });

//this is the schema for our posts
const postSchema = new mongoose.Schema({
  user: { type: String },
  title: { type: String },
  desc: { type: String },
  content: { type: String },
  likes: { type: Number },
  //add time and picture
},{versionKey: false});

const commentSchema = new mongoose.Schema({
  parentPost: { type: String },
  user: { type: String },
  content: { type: String },
  //add time and picture
},{versionKey: false});

//Note: mongoose will add an extra 's' at the end of the schema. So even if
//it is accessed normally, it will just include the 's' when it is seen in
//the live database.

//Then the model has to be actualized. This is what the system will interact
//with while the program is running.
const loginModel = mongoose.model('login', loginSchema);
const postModel = mongoose.model('post', postSchema);
const commentModel = mongoose.model('comment', commentSchema);

server.get('/', function(req, resp){
    
   postModel.find({}, function(err, post){
       resp.render('./pages/index', { postData: post });
   });
    
});

server.get('/signin', function(req, resp){
   resp.render('./pages/signin');
});

server.post('/signup', function(req, resp){
   //Creating a new instance can be made this way.
  var password = req.body.pass;
  var hashedPass = crypto.createHash('md5').update(password).digest('hex');

  const loginInstance = loginModel({
    user: req.body.user,
    pass: hashedPass,
    desc: req.body.desc,
    dp: 'default.png'
  });
  
  //to save this into the database, call the instance's save function.
  //it will have a call-back to check if it worked.
  loginInstance.save(function (err, fluffy) {
    if(err) return console.error(err);
    postModel.find({}, function(err, post){
       resp.render('./pages/index', { postData: post });
    });
  });
});

server.post('/login', function(req, resp){
  
  var password = req.body.pass;
  var hashedPass = crypto.createHash('md5').update(password).digest('hex');      
  
  const searchQuery = { user: req.body.user, pass: hashedPass };
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
      if(queryResult === 1){
          postModel.find({}, function(err, post){
            resp.render('./pages/index', { postData: post });
          });
      }
  });
  
});

server.post('/create-post', function(req, resp){
    //Creating a new instance can be made this way.
  const postInstance = postModel({
    user: 'AlexRotorReyes',
    title: req.body.title,
    desc: req.body.desc,
    content: req.body.content,
    likes: 0
  });
  
  //to save this into the database, call the instance's save function.
  //it will have a call-back to check if it worked.
  postInstance.save(function (err, fluffy) {
    if(err) return console.error(err);
    postModel.find({}, function(err, post){
       resp.render('./pages/index', { postData: post });
    });
  });
});

server.get('/post', function(req, resp){
    
      var passData;
      console.log(req.query.comment + "here comment here comment here");
      if(req.query.comment != null || req.query.comment != undefined || req.query.comment == ''){
          const commentInstance = commentModel({
            user: 'AlexRotorReyes',
            content: req.query.comment,
            parentPost: req.query.title
          });

          //to save this into the database, call the instance's save function.
          //it will have a call-back to check if it worked.
          commentInstance.save(function (err, fluffy) {
            if(err) return console.error(err);
          });
      }
    
      commentModel.find({}, function (err, comment){
        passData = comment;
      });
    
      const findQuery = { title: req.query.title }
      
      postModel.findOne(findQuery, function (err, post) {
        console.log("found");
        resp.render('./pages/post', { data:post, commentData: passData });
      });
    
});

server.get('/edit-comment', function(req, resp){
    
      console.log(req.query.comment + "edit((((((()))))))");
      const editQuery = { comment: req.query.comment };

      //To update a query, first it must found. Then afterwards, its information
      //can be edited. Call the save function to update the changes.
      commentModel.findOne(editQuery, function (err, comment) {
        comment.content = req.query.editComment;
        comment.save(function (err, result) {
          if (err) return console.error(err);
          const passData = { goodStatus: 1, msg:"Comment successfully edited" };
          resp.render('./pages/editResult',{ data:passData });
        });
      });
    
});
    
server.get('/profile', function(req, resp){
    
    var passDataComment;
    var passDataPost;
    
    postModel.find({}, function(err, post){
       passDataPost = post; 
    });

    commentModel.find({}, function (err, comment){
        console.log("inside commentmodel.find" + comment);
        passDataComment = comment;
    });
    
    const findQuery = { user: req.query.user }

    loginModel.findOne(findQuery, function(err, login){
        resp.render('./pages/profile', { data: login, commentData: passDataComment, postData: passDataPost });
    });
});

const port = process.env.PORT | 9090;
server.listen(port);