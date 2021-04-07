try {
  var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  var recognition = new SpeechRecognition();
}
catch(e) {
  console.error(e);
  $('.no-browser-support').show();
  $('.app').hide();
}

// comment..
var recording = false;
var recognition;
var apigClient = apigClientFactory.newClient({ apiKey: "2M0snczng872P1tMS7koy9fHyLfr8U8F6qI7i5hO" });
var name = '';
var encoded = null;
var fileExt = null;

window.onload = function() {
  document.getElementById('query').addEventListener("keydown", (e) => {
    if (e.keyCode === 13 && document.getElementById('query').value) {  //checks whether the pressed key is "Enter"
        submitSearch();
        e.preventDefault();
    }
  }, false);
}

function submitSearch(){
  query = document.getElementById('query').value
  document.getElementById("displayImages").innerHTML = null;
  document.getElementById("uploadResponse").innerHTML = null;
  document.getElementById("searchResponse").innerHTML = null;
  searchImages(query)
}

function searchImages(query){
  console.log("Searching images - " + query);
  if (query == ""){
    alert("Empty string provided to search");
  }
  else{
   var params = {"q":query};
    
    var body = {};

    apigClient.searchGet(params, body, {}).then(function(result){
      console.log("in searchGet block");
      console.log(result);
      if (result.hasOwnProperty('errorMessage') || result['data']['body'] == ''){
          displayS3Images(null)
        }
      else{
        // var img_list = JSON.parse(result['data']['body']);
        var img_list = result['data'];
        console.log(img_list);
        displayS3Images(img_list)
      }
    }).catch(function(result){
        console.log('ERROR: Response failed - ' + result);
    });
  }
}


function displayS3Images(img_list){
  var displayImages = document.getElementById("displayImages")
  if (img_list == null){
    document.getElementById("displayImages").innerHTML = null;
    searchErrorResponse = document.getElementById("searchResponse");
    searchErrorResponse.innerHTML = "No images found";
  }
  else{
    for (var i=0, len = img_list.length; i < len; ++i) {
       var img = new Image();
       img.src = img_list[i];
       img.style.width = "200px";
       img.style.height = "200px";
       img.style.padding = "7px";
       img.style.border = "5px solid black";
       displayImages.appendChild(img);
    }
  }
}


function previewFile(input) {
  document.getElementById("uploadResponse").innerHTML = null;
  document.getElementById("submit_upload_button").style.backgroundColor = "rgba(15, 137, 204, 1)";
  document.getElementById("submit_upload_button").style.color = "white";
  console.log("Inside preview");

  var reader = new FileReader();
  name = input.files[0].name;
  fileExt = name.split(".").pop();
  var onlyname = name.replace(/\.[^/.]+$/, "");
  var finalName = onlyname + "_" + Date.now() + "." + fileExt;
  name = finalName;

  reader.onload = function (e) {
    var src = e.target.result;
    var newImage = document.createElement("img");
    newImage.src = src;
    encoded = newImage.outerHTML;
  }
  reader.readAsDataURL(input.files[0]);
}

function uploadImage(event){
  document.getElementById("submit_upload_button").style.backgroundColor = "";
  document.getElementById("submit_upload_button").style.color = "";
  // console.log("Encoded",encoded);
  var files = document.getElementById("imgfile").files;
  let label = document.getElementById('label').value;
  
  console.log(label);
  console.log(label == "");

  if (!files.length) {
    return alert("Please choose a file to upload first.");
  }

  var file = files[0];
  var fileName = file.name;
  console.log("File:",file);
  console.log("File type:",file.type);
  last_index_quote = encoded.lastIndexOf('"');

  if(fileExt == 'jpg' || fileExt == 'jpeg'){
    encodedStr = encoded.substring(33, last_index_quote);  
    filetype = "image/jpeg"+";base64"
  }
  else{
      encodedStr = encoded.substring(32, last_index_quote);
      filetype = file.type+";base64"
  }

  var params = {
    'key': fileName,
    'Content-Type': filetype,
    'bucket': 'b2-photo-bucket',
    'x-amz-meta-customLabels': label
  };
  console.log("Params are ",params);

  var additionalParams = {
      headers: {
          'Content-Type': filetype,
          'x-amz-meta-customLabels': label
      }
  }
  

  apigClient.uploadBucketKeyPut(params, encodedStr, additionalParams).then(function(result) {
    console.log("in uploadBucketKeyPut");
    console.log(result);
    document.getElementById("uploadResponse").innerHTML = "Uploaded image successfully";
  }).catch(function(err) {
    console.log('Error!!', err);
    document.getElementById("uploadResponse").innerHTML = "Failed to upload image";
  });
}
