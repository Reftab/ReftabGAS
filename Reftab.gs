function Reftab(options) {

  const secretKey = options.secretKey;
  const publicKey = options.publicKey;

  function signRequest (request) {
    request.headers['x-rt-date'] = new Date().toUTCString();
    request.contentType = 'application/json';
   
    let md5 = str =>
      Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, str).reduce((str, chr) => {
        chr = (chr < 0 ? chr + 256 : chr).toString(16);
        return `${str}${chr.length == 1 ? '0' : ''}${chr}`;
      }, '');

    let token = Utilities.computeHmacSha256Signature(unescape(encodeURIComponent(
`${request.method}
${request.payload !== undefined ? md5(request.payload) : ''}
${request.payload !== undefined ? request.contentType : ''}
${request.headers['x-rt-date']}
${request.url}`
      )), secretKey);
   
    token = token.map(byte => {
      let v = (byte < 0) ? 256 + byte : byte;
      return ('0' + v.toString(16)).slice(-2);
    }).join('');
   
    request.headers.Authorization = `RT ${publicKey}:${Utilities.base64Encode(token)}`;
   
    return request;
  }

  this.request = function(method, endpoint, id, body) {
    if (id) {
      endpoint += '/' + id;
    }
    if (body) {
      body = JSON.stringify(body);
    }
    let options = {
      method: method,
      url: 'https://www.reftab.com/api/' + endpoint,
      payload: body,
      headers: {}
    };
    let response = UrlFetchApp.fetch(options.url, signRequest(options));
   
    return JSON.parse(response.getContentText());
  };
  
  this.get = function(endpoint, id) {
    return this.request('GET', endpoint, id);
  }
  
  this.put = function(endpoint, id, body) {
    return this.request('PUT', endpoint, id, body);
  }
  
  this.post = function(endpoint, body) {
    return this.request('POST', endpoint, undefined, body);
  }
  
  this.delete = function(endpoint, id) {
    return this.request('DELETE', endpoint, id);
  }

  return this;
}