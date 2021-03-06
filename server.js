// Dependencies
var express = require("express");
var bodyParser = require("body-parser");
var path = require('path');
var logger = require("morgan");
var mongoose = require("mongoose");
// Requiring our Note and Article models
var Note = require("./models/Note.js");
var Article = require("./models/Article.js");
// Our scraping tools
var request = require("request");
var cheerio = require("cheerio");
// Set mongoose to leverage built in JavaScript ES6 Promises
mongoose.Promise = Promise;

// Initialize Express
var app = express();
var PORT = process.env.PORT || 3000;
// Use morgan and body parser with our app
app.use(logger("dev"));
app.use(bodyParser.urlencoded({extended: false}));

// Make public a static dir
app.use(express.static("public"));

if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI);
} else {
  // Database configuration with mongoose
  mongoose.connect("mongodb://localhost/myArticles");
}

var db = mongoose.connection;

// Show any mongoose errors
db.on("error", function(error) {
  console.log("Mongoose Error: ", error);
});

// Once logged in to the db through mongoose, log a success message
db.once("open", function() {
  console.log("Mongoose connection successful.");
});

// Routes
// ======

app.get("/", function(req, res) {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

// A GET request to scrape the echojs website
app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with request
  request("http://www.lifehacker.com/", function(error, response, html) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(html);

    $("h1.headline").each(function(i, element) {

      // Save an empty result object
      var result = {};

      // Add the text and href of every link, and save them as properties of the result object
      result.link = $(this).children().attr("href");
      result.title = $(this).children().text();

      // Using our Article model, create a new entry
      // This effectively passes the result object to the entry (and the title and link)
      var entry = new Article(result);

      // Now, save that entry to the db
      entry.save(function(err, doc) {
        // Log any errors
        if (err) {
          console.log(err // Or log the doc
          );
        } else {
          console.log(doc);
        }
      });

    });
  });
  // Tell the browser that we finished scraping the text
  res.send("Scrape Complete");
});

// This will get the articles we scraped from the mongoDB
app.get("/articles", function(req, res) {
  // Grab every doc in the Articles array
  Article.find({}, function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error // Or send the doc to the browser as a json object
      );
    } else {
      res.json(doc);
    }
  });
});

app.get("/savedArticles", function(req, res) {
  // Grab every doc in the Articles array
  Article.find({
    "saved": true
  }, function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error // Or send the doc to the browser as a json object
      );
    } else {
      res.json(doc);
    }
  });
});

app.get("/saved-articles", function(req, res) {
  // Grab every doc in the Articles array
  res.sendFile(path.join(__dirname, "public/saved-articles.html"));
});

app.get("/marksaved/:id", function(req, res) {

  Article.update({
    "_id": req.params.id
  }, {

    $set: {
      "saved": true
    }
  }, function(error, edited) {

    if (error) {

      res.send(error);
    } else {

      res.send(edited);
    }
  });

});

app.get("/markunsaved/:id", function(req, res) {

  Article.update({
    "_id": req.params.id
  }, {

    $set: {
      "saved": false
    }
  }, function(error, edited) {

    if (error) {

      res.send(error);
    } else {

      res.send(edited);
    }
  });

});

// Grab an article by it's ObjectId
app.get("/articles/:id", function(req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  Article.findOne({"_id": req.params.id})
  // ..and populate all of the notes associated with it
    .populate("notes")
  // now, execute our query
    .exec(function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error // Otherwise, send the doc to the browser as a json object
      );
    } else {
      res.json(doc);
    }
  });
});

// Create a new note or replace an existing note
app.post("/articles/:id", function(req, res) {
  // Create a new note and pass the req.body to the entry
  var newNote = new Note(req.body);

  // And save the new note the db
  newNote.save(function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error // Otherwise
      );
    } else {
      // Use the article id to find and update it's note
      Article.findOneAndUpdate({
        "_id": req.params.id
      },{ $push : {
        "notes": doc._id
      }})
      // Execute the above query
        .exec(function(err, doc) {
        // Log any errors
        if (err) {
          console.log(err);
        } else {
          // Or send the document to the browser
          res.send(doc);
        }
      });
    }
  });
});


app.post("/delnote/:id", function(req, res) {
  // Create a new note and pass the req.body to the entry
  console.log(req.params.id);
  Note.remove({ _id: req.params.id }, function(err,doc) {
    if (err) {
      console.log(err);
    } else {
      // Or send the document to the browser
      res.send(doc);
    }
});

});

// Listen on port 3000
app.listen(PORT, function() {
  console.log("App running on port 3000!");
});
