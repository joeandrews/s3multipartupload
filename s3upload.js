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
			uploads3.id = encodeURI(this.responseXML.getElementsByTagName("UploadId")[0].childNodes[0].nodeValue);
			uploads3.path = encodeURI(this.responseXML.getElementsByTagName("Key")[0].childNodes[0].nodeValue);
			that.startupload();
		};
		that.getid = function(){
			return uploads3.id;
		};
		that.getpath = function(){
			return uploads3.path;
		};
		
		that.setup =function(){
			console.log(this);
			that.file = this.files[0];	
			console.log(that.file);
			//custom certification goes here, currently developing a node module to handle this.
			that.uploadoptions = {
            	type:"POST",
            	path:encodeURI("/mixes/"+that.file.name),
            	datatype:"binary/octel-stream",
            	bucket:"fuuzik",
            	endings:"?uploads"
            };
			$.ajax({
            url: "/certif",
            dataType: "JSON",
            type:"POST",
            contentType: "application/json",
            data:JSON.stringify(that.uploadoptions),
            success: function(data){
            	console.log(data);
	       	var request = new XMLHttpRequest();
	       	request.withCredentials = true;
	       	request.open("POST", "http://"+that.uploadoptions.bucket+".s3.amazonaws.com"+that.uploadoptions.path+"?uploads",true);	      	
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
		that.getparts = function(id,path,type){
			
			that.uploadoptions = {
            	type:type,
            	path:"/"+path.replace(/\s/g, ''),
            	bucket:"fuuzik",
            	endings:"?uploadId="+id.replace(/\s/g, '')
            };
			$.ajax({
            url: "/certif",
            dataType: "JSON",
            type:"POST",
            contentType: "application/json",
            data:JSON.stringify(that.uploadoptions),
            success: function(data){
            	
			var send = new XMLHttpRequest();
			send.withCredentials = true;
			send.open(type,"http://"+that.uploadoptions.bucket+".s3.amazonaws.com"+[that.uploadoptions.path]+""+[that.uploadoptions.endings]+"",true);
			send.setRequestHeader("Authorization", "AWS "+data.s3Key+":"+data.s3Signature+"");
	  		send.setRequestHeader("X-Amz-Date" , data.s3Policy.expires);
	      	
	      	
			send.onload = function(){
				console.log(this);
				that.parts = this.responseXML.getElementsByTagName("Part");
				console.log(this.responseXML);
				that.complete();
				
			};
			send.send();
	       	

            },
            error: function (res, status, error) {
                console.log(res);
                console.log("ERROR: " + error + " status: " + status + " response: " + res);
            }
        });
	
		};
		that.getbuckets = function(){
			var options = {
            	type:"GET",
            	path:"/",
            	bucket:"fuuzik",
            	endings:"?uploads"
            };

			$.ajax({
            url: "/certif",
            dataType: "JSON",
            type:"POST",
            contentType: "application/json",
            data:JSON.stringify(options),
            success: function(data){
            	

			var send = new XMLHttpRequest();
			send.withCredentials = true;
			send.open("GET","http://"+options.bucket+".s3.amazonaws.com"+options.path+""+options.endings+"",true);
			send.setRequestHeader("Authorization", "AWS "+data.s3Key+":"+data.s3Signature+"");
	  		send.setRequestHeader("X-Amz-Date" , data.s3Policy.expires);
	      	
			send.onload = function(){
				console.log(this.responseXML);
				
				var uploads = this.responseXML.getElementsByTagName("Upload");
				for (var i = 0; i < uploads.length; i++) {
				
					var options = {
		            	type:"DELETE",
		            	path:encodeURI("/"+uploads[i].getElementsByTagName("Key")[0].childNodes[0].nodeValue),
		            	
		            	bucket:"fuuzik",
		            	endings:encodeURI("?uploadId="+uploads[i].getElementsByTagName("UploadId")[0].childNodes[0].nodeValue)
		            };
		            that.getparts(uploads[i].getElementsByTagName("UploadId")[0].childNodes[0].nodeValue.toString(),uploads[i].getElementsByTagName("Key")[0].childNodes[0].nodeValue.toString(),"DELETE");
				};
			
				
			};
			send.send();
	       	

            },
            error: function (res, status, error) {
                console.log(res);
                console.log("ERROR: " + error + " status: " + status + " response: " + res);
            }
        });

		};
		//send each chunk
		that.eachchunk = function(blob){
			var options = {
            	type:"PUT",
            	path:"/"+that.getpath(),
            
            	bucket:"fuuzik",
            	endings:encodeURI("?partNumber="+blob.index+"&uploadId="+that.getid().replace(/\s/g, ''))
            };

			$.ajax({
            url: "/certif",
            dataType: "JSON",
            type:"POST",
            contentType: "application/json",
            data:JSON.stringify(options),
            success: function(data){
            	
            var progressFunction = function(e){
            	console.log((e.loaded/e.total)*100);

            };
			var send = new XMLHttpRequest();
			send.withCredentials = true;
			send.open("PUT","http://"+options.bucket+".s3.amazonaws.com"+options.path+options.endings,true);
			send.setRequestHeader("Authorization", "AWS "+data.s3Key+":"+data.s3Signature);
	  		send.setRequestHeader("X-Amz-Date" , data.s3Policy.expires);
	      	send.onreadystatechange=function(e){
	      			console.log(e);
	      			console.log(this.getAllResponseHeaders());
	      			that.chunks[blob.index] = blob;
	      			that.chunks[blob.index].etag = this.getAllResponseHeaders();
	      	};
	      	 

    		send.upload.addEventListener("progress", progressFunction, false);  
    		
    		

			send.onload = function(){
				//console.log(this.responseXML.getElementsByTagName("ETag")[0].childNodes[0].nodeValue);
				
				
			};
			send.send(blob.blob);

	       	

            },
            error: function (res, status, error) {
                console.log(res);
                console.log("ERROR: " + error + " status: " + status + " response: " + res);
            }
        });
	
		};
		that.chunks = [];

		that.complete = function(){

		

			that.uploadoptions = {
            	type:"POST",
            	path:"/"+upload.getpath(),
            	datatype:"application/xml",
            	bucket:"fuuzik",
            	endings:"?uploadId="+upload.getid()
            };
			$.ajax({
            url: "/certif",
            dataType: "JSON",
            type:"POST",
            contentType: "application/json",
            data:JSON.stringify(that.uploadoptions),
            success: function(data){
            	
            	var xml = "<CompleteMultipartUpload>";
			for (var i = 0; i < that.parts.length; i++) {
				xml = xml+"<Part>";
				xml = xml+"<PartNumber>"+that.parts[i].getElementsByTagName("PartNumber")[0].childNodes[0].nodeValue+"</PartNumber>";
				xml = xml+"<ETag>"+that.parts[i].getElementsByTagName("ETag")[0].childNodes[0].nodeValue+"</ETag>";
	
				xml = xml +"</Part>";
			};
			xml = xml+ "</CompleteMultipartUpload>";

			console.log(StringtoXML(xml));
			var complete = new XMLHttpRequest();
				complete.open("POST", "http://"+that.uploadoptions.bucket+".s3.amazonaws.com"+[that.uploadoptions.path]+""+[that.uploadoptions.endings]+"",true);	     
				complete.setRequestHeader("Authorization", "AWS "+data.s3Key+":"+data.s3Signature+"");
		  		complete.setRequestHeader("X-Amz-Date" , data.s3Policy.expires);
		      	complete.setRequestHeader("Content-Type","application/xml");
				complete.onload = function(){
					console.log(this.responseXML);
				};
				complete.send(StringtoXML(xml));	
	       	

            },
            error: function (res, status, error) {
                console.log(res);
                console.log("ERROR: " + error + " status: " + status + " response: " + res);
            }
        });
			
		};
		// called when a file is selected so this points to the event
		that.startupload = function(){

			that.BYTES_PER_CHUNK = 1024 * 1024 * 5; // 1MB chunk sizes.
	  		that.SIZE = that.file.size;
	  		that.nochunks = Math.round(that.file.size/that.BYTES_PER_CHUNK);
	  		that.start = 0;
	  		that.end = that.BYTES_PER_CHUNK;
	  		that.index = 1;
	  		 while(that.start < that.SIZE) {
	  		 	if (that.end> that.SIZE) {
	  		 		that.end = that.SIZE;
	  		 	};
			    that.eachchunk({
	    			blob:that.file.slice(that.start, that.end),
	    			index:that.index,
	    			parentid:uploads3.id,
	    			size:that.BYTES_PER_CHUNK

	    		});

			    that.start = that.end;
			    that.end = that.start + that.BYTES_PER_CHUNK;
			    that.index = that.index + 1;
				
			  }
	  
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


function StringtoXML(text){
                if (window.ActiveXObject){
                  var doc=new ActiveXObject('Microsoft.XMLDOM');
                  doc.async='false';
                  doc.loadXML(text);
                } else {
                  var parser=new DOMParser();
                  var doc=parser.parseFromString(text,'text/xml');
                }
                return doc;
            }
