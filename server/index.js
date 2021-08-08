const express = require("express");
const app = express();
const port = 5000;
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const { auth} = require("./middleware/auth");
const {User} = require("./models/User");

const config = require("./config/key");

//aplication/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: true}));
//application/json
app.use(bodyParser.json());
app.use(cookieParser());

const mongoose = require("mongoose");
mongoose
  .connect(config.mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/api/hello", (req, res) => {
  res.send("안녕하세요");
});

app.post("/api/users/register", (req, res) => {
  const user = new User(req.body);
  user.save((err, userInfo) => {
    if (err) return res.json({success: false, err});
    return res.status(200).json({
      success: true,
    });
  });
});

app.post("/api/users/login", (req, res) => {
  // 1. find out email in database
  User.findOne({email: req.body.email}, (err, user) => {
    if (!user) {
      return res.json({
        loginSuccess: false,
        message: "There is no user corresponding to the email provided.",
      });
    }
    
    // 2. check password
    user.comparePassword(req.body.password, (err, isMatch) => {
      if (!isMatch) {
        return res.json({
          loginSuccess: false,
          message: "The password is wrong.",
        });
      }
      
      // 3. generate token
      user.generateToken((err, user) => {
        if (err) return res.status(400).send(err);
        // save token to cookie
        res
          .cookie("x_auth", user.token)
          .status(200)
          .json({loginSuccess: true, email: user.email});
      });
    });
  });
});

app.get("/api/users/auth", auth, (req, res) => {
  res.status(200).json({
    email: req.user.email,
    isAdmin: req.user.role === 0 ? false: true,
    isAuth: true,
    name: req.user.name,
    lastname: req.user.lastname,
    role: req.user.role,
    image: req.user.image
  })
})

app.get("/api/users/logout", auth, (req, res) => {
  User.findOneAndUpdate(
    {email: req.user.email},
    {token: ""},
    (err, user) => {
      if (err) return res.json({success: false, err});
      return res.status(200).send({
        success: true
      });
    }
  );
})

app.listen(port, () => {
  console.log("Example app listening at http://localhost:${port}");
});
