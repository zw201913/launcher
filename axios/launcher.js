
var LAUNCHER = function(){
	//请求方式
	var METHOD = {
		GET: 'GET',
		POST: 'POST',
		PUT: 'PUT',
		DELETE: 'DELETE',
		HEAD: 'HEAD',
		PATCH: 'PATCH',
		OPTIONS: 'OPTIONS'
	}

	var BASE = {
		send: function(obj){
			//判断响应码是否正常，默认的
			function isOkResponse(status){
				return status >= 200 && status < 300;
			}

			axios.request({
				url: obj.url,
				//默认是get
				method: obj.method||METHOD.GET,
				baseURL: obj.baseURL,
				headers: obj.headers,
				params: obj.params,
				data: obj.data,
				//默认1000
				timeout: obj.timeout||1000,
				//默认json
				responseType: obj.responseType||'json',
				//上传事件
				onUploadProgress: obj.onUploadProgress||function(progressEvent){
					//默认上传进度事件，可定义全局进度条
					console.log('上传进度事件');
				},
				//定义可获得的http响应状态码
				validateStatus: obj.validateStatus||function(status){
					return isOkResponse(status);
				}
			}).then(function(response){
				//处理响应头和响应数据
				function handleResponse(res,obj){
					if(obj.handleResponse){
						obj.handleResponse(res);
					}
					if(obj.handleResponseHeaders){
						obj.handleResponseHeaders(res.headers);
					}
					if(obj.handleResponseData){
						obj.handleResponseData(res.data);
					}
				}
				//验证响应数据是否有效,全局验证
				function validateResponse(data){
					return true;
				}

				//处理非正常业务数据
				function handleErrorResponse(res,obj){
					if(obj.handleErrorResponse){
						obj.handleErrorResponse(res);
					}
					if(obj.handleResponseHeaders){
						obj.handleResponseHeaders(res.headers);
					}
					if(obj.handleErrorResponseData){
						obj.handleErrorResponseData(res);
					}
				}

				//处理非正常业务数据
				function handleErrorData(data){
					//可以自行定义弹框或提醒
					console.log(data);
				}
                //开始处理响应数据
				if(validateResponse(response)){
					//自定义响应数据验证器
					if(obj.validateResponse){
						if(obj.validateResponse(response)){
							//能调用这个方法，说明业务数据一定正确
							handleResponse(response,obj);
						}else{
							//说明是非正常业务数据，比如响应code返回非正常状态
							//如果有自定义处理非正常业务数据，就调用自定义处理器，否则调用全局处理器
							if(obj.handleErrorResponse || obj.handleErrorResponseData){
								handleErrorResponse(response,obj);
							}else{
								//调用全局处理非正常业务数据
								handleErrorData(response.data);
							}
						}
					}else{
						//能调用这个方法，说明业务数据一定正确
						handleResponse(response,obj);
					}
				}
			}).catch(function(error){
				//默认全局处理error的方式
				function handleError(error){
					//可以自行定义弹框或提醒
					console.log(error);
				}
				//如果有自定义异常处理器，就调用自定义的处理器，否则调用全局处理器
				if (obj.handleError) {
					obj.handleError(error);
				}else{
					handleError(error);
				}
    		});
		}
	}

	//抽离公共的参数
	function defaultHandleConfig(obj){
		return {
			url:obj.url,
    		baseURL:obj.baseURL,
    		headers:obj.headers,
			responseType:obj.responseType,
    		//响应状态验证器
    		validateStatus:obj.validateStatus,
    		//响应数据验证器
    		validateResponse:obj.validateResponse,
    		handleResponse:obj.handleResponse,
    		//处理响应头(正常业务数据)
    		handleResponseHeaders:obj.handleResponseHeaders,
    		//处理响应数据(正常业务数据)
    		handleResponseData:obj.handleResponseData,
    		//处理非正常响应数据(不符合validateResponseData的数据)
    		handleErrorResponse:obj.handleErrorResponse,
    		//处理非正常响应数据(不符合validateResponseData的数据)
    		handleErrorResponseData:obj.handleErrorResponseData,
    		//处理异常情况,不定义会调用全局处理器
    		handleError:obj.handleError
		}
	}

	//设置headers
    function addHeader(headers,key,value){
    	if(!headers){
    		headers = {};
    	}
    	headers[key] = value;
    	return headers;
    }

    //将data转换为json包装
    function handleData2Json(data){
    	if(!!data){
    		return JSON.stringify(data);
    	}
    	return data;
    }

    //将data转换为FormData包装
    function handleData2FormData(data){
    	//判断是不是文件
    	function isFile(file){
    		return file instanceof File;
    	}
    	//创建一个FormData，用来包装数据
    	var formData = new FormData();
    	if(!!data){
    		//抽出data的所有属性和值，放进FormData中
    		for(var attr in data){
    			var value = data[attr];
    			if(isFile(value)){
    				formData.append(attr,value);
    			}else if(typeof value === 'object'){
    				//针对{}，[]类型，要使用Blob包装
    				formData.append(attr, new Blob([JSON.stringify(value)],{type: "application/json" }));
    			}else{
    				formData.append(attr,value);
    			}
    		}
    	}
    	return formData;
    }

    return {
    	//对应所有get请求
    	get: function(obj) {
    		var config = defaultHandleConfig(obj);
    		config.params = obj.params;
    		BASE.send(config);
    	},

    	//对应spring mvc中的@RequestPart，支持文件上传
    	postFormData: function(obj){
    		var config = defaultHandleConfig(obj);
    		config.method = METHOD.POST;
    		config.headers = addHeader(obj.headers,'Content-Type','multipart/form-data');
    		config.data = handleData2FormData(obj.data);
    		config.onUploadProgress = obj.onUploadProgress;
    		BASE.send(config);
    	},

    	//对应spring mvc中的@RequestBody
    	post: function(obj){
    		var config = defaultHandleConfig(obj);
    		config.method = METHOD.POST;
    		config.headers = addHeader(obj.headers,'Content-Type','application/json;charset=UTF-8');
    		config.data = handleData2Json(obj.data);
    		BASE.send(config);

    	},

    	//和post一样，不过要保持幂等
    	put: function(obj){
    		var config = defaultHandleConfig(obj);
    		config.method = METHOD.PUT
    		config.headers = addHeader(obj.headers,'Content-Type','application/json;charset=UTF-8');
    		config.data = handleData2Json(obj.data);
    		BASE.send(config);
    	},

    	//删除
    	delete: function(obj){
    		var config = defaultHandleConfig(obj);
    		config.method = METHOD.DELETE;
    		config.params = obj.params;
    		BASE.send(config);
    	}
    };
}();