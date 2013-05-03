var s3upload = (function(){
var initialize = function(evt){
  	
		var upload = {

		};	
		var that = this;
		//initiate multipartupload.
		//on response start sending chuncks
		//save chunk ids with chunk numbers as private table.
		that.response = function(){
			console.log(this);
			upload.document = this.responseXML;
			upload.id = upload.document.getElementsByTagName("UploadId")[0].childNodes[0].nodeValue;
		};
		
		that.setup =(function(){

			$.ajax({
            url: "/certif/"+parseUtils.curr().id+"",
            dataType: "JSON",
            success: function(data){
            	console.log(data);
	            var post = {
	            "AWSAccessKeyId": data.s3Key,
	            "key": "mixes/"+parseUtils.curr().id + "/",
	            "acl": "public-read",
	            "policy": data.s3PolicyBase64,
	            "signature": data.s3Signature
	        	};

	       	var request = new XMLHttpRequest();
	       	request.withCredentials = true;
	       	request.open("POST", "http://fuuzik.s3.amazonaws.com/mixes/"+parseUtils.curr().id+"/?uploads", true);	      
	       	request.setRequestHeader("Authorization", "AWS AWSID:"+data.s3Signature+"");
	  	request.setRequestHeader("X-Amz-Date" , data.s3Policy.expires);
	      	request.setRequestHeader("Content-Type","binary/octel-stream");
	      	request.onload = that.response;
	       	request.send();

            },
            error: function (res, status, error) {
                //do some error handling here
                console.log("ERROR: " + error + " status: " + status + " response: " + res);
            }
        });
		})();
		that.upload = function(blob){
			var send = new XMLHttpRequest();
			request.open("POST",)
		};
		// called when a file is selected so this points to the event
		that.startupload = function(){
		that.file = this.files[0];	
		that.BYTES_PER_CHUNK = 1024 * 1024; // 1MB chunk sizes.
  		that.SIZE = blob.size;
  		that.start = 0;
  		that.end = BYTES_PER_CHUNK;

  		while(that.start < that.SIZE) {
    		that.upload(blob.slice(that.start, that.end));
			that.start = that.end;
    		that.end = that.start + that.BYTES_PER_CHUNK;
    	};	
		};


		that.signature =function(){
			//function which gets the correct signature based on the filename
		};


		





};
initialize.prototype = {

upload:function(){

},
progress:function(){

	//function which returns the progress value as a percent
},
whileuploading:function(){

	//function which continually updates with the current progress
},
status:function(){
 //returns the current status
},
resume:function(){
	//resumes this upload

},
pause:function(){
//pauses this upload
},
cancel:function(){
//cancels the upload and delets data from s3.

}
}
return initialize;
})();


