const jwt = require('jsonwebtoken');
const tokenSecret = "secretissecet";
module.exports.issue = function(payload) {
    return jwt.sign(
    payload,
    tokenSecret,
    {
        expiresIn : "1h" // Thời gian sống của token
    });
};
 
// Xác thực token từ request
module.exports.verify = function(token, callback) {
    return jwt.verify(
        token, // Token đã xác thực
        tokenSecret, // Same token we used to sign
        {}, // No Option,Xem thêm: https://github.com/auth0/node-jsonwebtoken#jwtverifytoken-secretorpublickey-options-callback
        callback //Pass errors or decoded token to callback
    );
};
module.exports.decoded = function(token) {
    return jwt.verify(
        token, // Token đã xác thực
        tokenSecret // Same token we used to sign
    );
};
