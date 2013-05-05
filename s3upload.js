// new s3upload() to be called on event change of file input
var s3upload = (function(){
var initialize = function(evt){
		
		var uploads3 = {

		};	
		var that = this;
		//initiate multipartupload.
		//on response start sending chuncks
		//save chunk ids with chunk numbers as private table.
		that.response = function(){
			console.log(this.responseXML);
			uploads3.id = this.responseXML.getElementsByTagName("UploadId")[0].childNodes[0].nodeValue;
			that.startupload();
		};
		
		that.setup =function(){
			console.log(this);
			that.file = this.files[0];	
			console.log(that.file);
			//custom certification goes here, currently developing a node module to handle this.
			that.uploadoptions = {
            	type:"POST",
            	path:"/mixes/"+urlEncode(that.file.name)+"?uploads",
            	datatype:"binary/octel-stream",
            	bucket:"fuuzik"
            };
			$.ajax({
            url: "/certif",
            dataType: "JSON",
            type:"POST",
            contentType: "application/json",
            data:JSON.stringify(that.uploadoptions),
            success: function(data){
            	console.log(data);
            that.data = data;	

	       	var request = new XMLHttpRequest();
	       	request.withCredentials = true;
	       	request.open("POST", "http://"+data.s3Policy.conditions[0].bucket+".s3.amazonaws.com"+that.uploadoptions.path+"", true);	      	
	       	request.setRequestHeader("Authorization", "AWS "+data.s3Key+":"+data.s3Signature+"");
	  		request.setRequestHeader("X-Amz-Date" , data.s3Policy.expires);
	      	request.setRequestHeader("Content-Type","binary/octel-stream");
	      	request.onload = that.response;
	       	request.send();

            },
            error: function (res, status, error) {
                console.log(res);
                console.log("ERROR: " + error + " status: " + status + " response: " + res);
            }
        });
		};
		//send each chunk
		that.eachchunk = function(blob){
			
			var send = new XMLHttpRequest();
			send.open("POST","http://"+that.data.s3Policy.conditions[0].bucket+".s3.amazonaws.com"+that.uploadoptions.path+"?partNumber="+blob.index+"&uploadId="+blob.parentid+" HTTP/1.1", true);
			send.setRequestHeader("Authorization", "AWS "+that.data.s3Key+":"+that.data.s3Signature+"");
	  		send.setRequestHeader("X-Amz-Date" , that.data.s3Policy.expires);
	      	send.setRequestHeader("Content-Type","binary/octel-stream");
			send.onload = function(){
				that.chunks[blob.index] = blob;
				that.chunks[blob.index].etag = this.responseXML.getElementsByTagName("ETag")[0].childNodes[0].nodeValue;
			};
			send.send(blob.blob);	
		};
		that.chunks = [];

		that.complete = function(){
			var xml = "<CompleteMultipartUpload>";
			for (var i = 0; i < that.chunks.length; i++) {
				xml = xml+"<Part><PartNumber>"+i+"</PartNumber><ETag>"+that.chunks[i].etag+"</ETag></Part>";
				
			};
			xml = xml+ "</CompleteMultipartUpload>";
			var complete = new XMLHttpRequest();
				complete.open("POST", "http://"+data.s3Policy.conditions[0].bucket+".s3.amazonaws.com"+that.uploadoptions.path+"?uploadId="+uploads3.id+"", true);	     
				complete.setRequestHeader("Authorization", "AWS "+that.data.s3Key+":"+that.data.s3Signature+"");
		  		complete.setRequestHeader("X-Amz-Date" , that.data.s3Policy.expires);
		      	complete.setRequestHeader("Content-Type","binary/octel-stream");
				complete.onload = function(){
					console.log(this.responseXML);
				};
				complete.send();	
		};
		// called when a file is selected so this points to the event
		that.startupload = function(){

			that.BYTES_PER_CHUNK = 1024 * 1024; // 1MB chunk sizes.
	  		that.SIZE = that.file.size;
	  		that.nochunks = Math.round(that.file.size/that.BYTES_PER_CHUNK);
	  		that.start = 0;
	  		that.end = that.BYTES_PER_CHUNK;

	  		for (var i = 0; i < that.nochunks; i++) {
	  		that.chunks.push({
	    			blob:that.file.slice((i*that.BYTES_PER_CHUNK), (i+1)*that.BYTES_PER_CHUNK),
	    			index:i,
	    			parentid:uploads3.id

	    		});
			that.eachchunk({
	    			blob:that.file.slice((i*that.BYTES_PER_CHUNK), (i+1)*that.BYTES_PER_CHUNK),
	    			index:i,
	    			parentid:uploads3.id

	    		});

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
//cancels the upload and deletes data from s3.

}
}
return initialize;
})();


