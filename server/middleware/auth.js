const {User} = require("../models/User");

let auth = (req, res, next) => {
    //authentication
    // 1. get token from client cookie
    let token = req.cookies.x_auth;
    // 2. decrypt token and find out user
    User.findByToken(token, (err, user) => {
        if(err) throw err;
        if(!user) return res.json({isAuth: false, error: true})

        req.token = token;
        req.user = user;
        next();
    })
}

module.exports = {auth};