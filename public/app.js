$(document).ready(function() {

     $(".button-collapse").sideNav();

     console.log(window.location.pathname);
});
if(window.location.pathname === "/"){
  // Grab the articles as a json
  $.getJSON("/articles", function(data) {
    // For each one
    for (var i = 0; i < data.length; i++) {
      // Display the apropos information on the page
      var articleCard = '<div class="myCards "><div class="card green darken-1 z-depth-4"><div class="card-content white-text">';
      articleCard += "<p data-id='" + data[i]._id + "'>" + data[i].title + "</p>";
      articleCard += '</div> <div class="card-action"><a class="waves-effect waves-light btn light-blue darken-4" target="_blank" href="'+ data[i].link +'">View Article</a>';

      if(data[i].saved === false){
          articleCard += '<a id="save" class="waves-effect waves-light btn light-blue darken-4"  data-id="'+ data[i]._id +'">Save Article</a>';
      }else{
        articleCard += '<a id="save" class="waves-effect waves-light btn red darken-4"  data-id="'+ data[i]._id +'">SAVED ARTICLE</a>';
      }

      articleCard += '</div></div></div></div>';
      $("#articles").append(articleCard);
    }
  });
}

if(window.location.pathname === "/saved-articles"){
  $.getJSON("/savedArticles", function(data) {
    // For each one
    for (var i = 0; i < data.length; i++) {
      // Display the apropos information on the page
      var articleCard = '<div class="myCards "><div class="card green darken-1 z-depth-4"><div class="card-content white-text">';
      articleCard += "<p data-id='" + data[i]._id + "'>" + data[i].title + "</p>";
      articleCard += '</div> <div class="card-action"><a class="note waves-effect waves-light btn light-blue darken-4" data-id="'+ data[i]._id +'">Article Notes</a>';
      articleCard += '<a id="unsave" class="waves-effect waves-light btn light-blue darken-4"  data-id="'+ data[i]._id +'">Delete Saved Article</a>';
      articleCard += '</div></div></div></div>';
      $("#articles").append(articleCard);
    }
  });
}


$(document).on("click","#save",function(){

  var thisId = $(this).attr("data-id");
  var $self = $(this);
  $.ajax({
    method:"GET",
    url:"/marksaved/" + thisId
  }).done(function(data){
    console.log(data);
    $self.text("SAVED ARTICLE");
    $self.removeClass("light-blue");
    $self.addClass("red");
  });

});

$(document).on("click","#unsave",function(){

  var thisId = $(this).attr("data-id");

  $.ajax({
    method:"GET",
    url:"/markunsaved/" + thisId
  }).done(function(data){
    console.log(data);
    location.reload();
  });

});




// Whenever someone clicks a p tag
$(document).on("click", ".note", function() {
  // Empty the notes from the note section
  $("#notes").empty();
  // Save the id from the p tag
  var thisId = $(this).attr("data-id");

  // Now make an ajax call for the Article
  $.ajax({
    method: "GET",
    url: "/articles/" + thisId
  })
  // With that done, add the note information to the page
    .done(function(data) {
    console.log(data);


    // A textarea to add a new note body
    $("#notes").append("<textarea id='bodyinput' name='body'></textarea>");
    // A button to submit a new note, with the id of the article saved to it
    $("#notes").append("<a class='waves-effect waves-light btn'  data-id='" + data._id + "' id='savenote'>Save Note</a>");
    $("#notes").append("<a class='waves-effect waves-light btn red lighten-1 close margin-left'>Close Note</a>");

    // If there's a note in the article
    if (data.notes.length > 0) {
      var comment = "";
      // Place the body of the note in the body textarea
      $("#bodyinput").val(data.notes[0].body);

      for(var i = 0; i < data.notes.length; i++){
        comment += "<div class='comment' data-id='" + data._id + "'>" + data.notes[i].body + "</div>";
      }
      $("#notes").append(comment);
    }

    $("#notes").show();

  });
});

// When you click the savenote button
$(document).on("click", "#savenote", function() {
  // Grab the id associated with the article from the submit button
  $("#notes").hide();
  var thisId = $(this).attr("data-id");

  // Run a POST request to change the note, using what's entered in the inputs
  $.ajax({
    method: "POST",
    url: "/articles/" + thisId,
    data: {

      // Value taken from note textarea
      body: $("#bodyinput").val()
    }
  })
  // With that done
    .done(function(data) {
    // Log the response
    console.log(data);
    // Empty the notes section
    $("#notes").empty();
  });

  // Also, remove the values entered in the input and textarea for note entry

  $("#bodyinput").val("");
});


$(document).on("click", ".close", function() {
  // Grab the id associated with the article from the submit button
  $("#notes").hide();

});
