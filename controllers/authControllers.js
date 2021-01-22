const User = require("../models/Users");
const { validationResult } = require('express-validator');
const jwt = require ('jsonwebtoken');
require('dotenv').config();

module.exports.signup_get = (req,res) => {
    res.json({
        message : 'you are in signupget'
    });
}

module.exports.signup_post =  async (req, res) => {
    const {email , password} = req.body;
    console.log(req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    User.findOne({email}).exec((err, user) => {
        if (user) {
            return res.status(400).json({
                error : 'Cannot signup, user already exists'
            })
        }
    })

    try {
    const user = await User.create({email , password});
    jwt.sign({user} ,process.env.JWTsecret , (err, token) => {
        if (err) {
            console.log('cant make token');
        }
        res.json({token})
    } )
}
 catch(err) {
    console.log(err);
    res.json({
        message : 'couldnot create user'
    })
    }
}

module.exports.login_get =  (req,res) => {
    res.json({
        message : 'you are in loginget'
    })
}

module.exports.login_post = async (req, res) => {
    const {email , password} = req.body;
    console.log(req.token);
    console.log(req.body);

    const user = await User.login(email , password);
    
    console.log(user);
    jwt.verify(req.token , process.env.JWTsecret  , (err , authData) => {
        if (err) {
          res.sendStatus(403);
          console.log('not verified');
        } else {
          res.status(201).json({authData});
    } 
})
}

module.exports.changepw = async (req , res , next) => {
    
    console.log(process.env.JWTsecret); 
    req.data = jwt.verify(req.token , process.env.JWTsecret );
    const { oldpw , newpw , rnewpw } = req.body;
    console.log(req.data.user.email);
  
    if (newpw != rnewpw) {
      res.json({
        type : "error" , 
        msg : "Repeat password doesn't match"
      })
    }
  
    else {
      let det = await User.findOne({email: req.data.user.email} , "password")
      if (!await bcrypt.compare(oldpw , det.password)) {
        res.json ({
          type : "error" , 
          msg : "current password is incorrect"
        })
      } else {
        res.cookie('jwt', '', {maxAge : 1});
        const salt = await bcrypt.genSalt();
        await User.updateOne({email : req.data.user.email} , {$set : await bcrypt.hash ( newpw, salt )})
        res.json ({
          type : "success" ,
          msg : "successfully updated , please log in now"
        })
      }
    }
  }
