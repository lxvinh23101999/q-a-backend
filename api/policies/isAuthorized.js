module.exports = function (req, res, next) {  
    if (req.cookies && req.cookies.access_token) {
        const parts = req.cookies.access_token.split(' ');
        if (parts.length == 2) {
            const scheme = parts[0],
                credentials = parts[1];
            if (/^Bearer$/i.test(scheme)) {
                token = credentials;
            }
        } else {
            return res.json(401, { err: 'Format is Authorization: Bearer [token]' });
        }
    } else if (req.param('token')) {
        token = req.param('token');
        // We delete the token from param to not mess with blueprints
        delete req.query.token;
    } else {
        return res.json(401, { err: 'No token was found' });
    }
    jwToken.verify(token, function (err, decoded) {
        if (err) {
            if (err.name === "TokenExpiredError") {
                return res.forbidden('Phiên đăng nhập hết hạn');
            }
            else return res.forbidden('Bạn cần đăng nhập để tiếp tục');
        }
        req.token = decoded; // This is the decrypted token or the payload you provided
        next();
    });
};