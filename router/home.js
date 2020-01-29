const { check, validationResult } = require('express-validator');
const express = require('express')
const router = express.Router()
const connection = require('../utility/mysqlConn')
const commonFun = require('../utility/commonFun')
const mail = require('../utility/mail')
const getOTP = require('../utility/otpGen')

var states = commonFun.getStates()
var categories = commonFun.getCategories()

router.get('/',function(req,res){
    try
    {
        var sql = "select * from product ;"

        connection.query(sql,function(error,result){
            
            if(error) throw error
            
            res.render('Home',{
                result,
                categories
            })    
        }) 
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.post('/searchProduct',function(req,res){
    try
    {
        var search = req.body.search
        var sql = "select * from product where pCategory LIKE('%"+search+"%') OR pName LIKE('%"+search+"%') ;"

        connection.query(sql,function(error,result){
            
            if(error) throw error

            if(result.length > 0)
            {
                res.render('Home',{
                    result,
                    categories
                })    
            }
            else
            {
                res.render('EmptyMessage',{result: 'Oops.. No Product Found'})    
            }   
        }) 
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.post('/sort',function(req,res){
    try
    {
        var filter = req.body.filter
        var sql = ''

        if(filter == 'ASC')
        {
            sql = "select * from product order by pPrice ASC;"
        }
        else if(filter == 'DESC')
        {
            sql = "select * from product order by pPrice DESC ;"
        }
        else
        {
            sql = "select * from product where pCategory LIKE('%"+filter+"%') ;"
        }

        connection.query(sql,function(error,result){
            
            if(error) throw error
            
            res.render('Home',{
                result,
                categories
            })    
        }) 
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.get('/productDetailsHome',function(req,res){
    try
    {
        var pId = req.query.pId
        var sql = "select * from product where pId="+pId+" ; "

        connection.query(sql,function(error,result){
    
            if(error || result.length == 0)
            {
                res.render('Alert',{
                    type:"error",
                    title:"Product doesn't exists",
                    text:"This product is not available now!",
                    link:"/"
                })
            }
            else
            {
                res.render('ProductDetailsHome',{result: result[0]})    
            }
        }) 
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.get('/signup',function(req,res){
    try
    {
        var user = {
            email: null,
            password: null,
            profilePic: 'defaultPic.jpg',
            username: null,
            mobileno: null,
            state: null,
            address: null
        }

        var error = {
            emailError: null,
            passwordError: null,
            usernameError: null,
            mobilenoError: null,
            addressError: null
        }

        res.render('Signup',{
            user,
            error,
            states,
            regError:null
        })
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.get('/login',function(req,res){
    try
    {
        var user = {
            email: null,
            password: null,
        }

        var error = {
            emailError: null,
            passwordError: null
        }

        res.render('Login',{
            user,
            error
        })
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.get('/about',function(req,res){
    try
    {
        res.render('About')
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.post('/saveUser', [
    check('email','Must be of Min 8 and Max 40 length').trim().isEmail().isLength({ min: 8 , max: 40}),
    check('username','Must be of Min 3 and Max 30 length').trim().isLength({ min: 3 , max: 30}),
    check('mobileno','Must be of 10 digits').trim().isLength({ min: 10 , max: 10}),
    check('address','Must be of Min 5 and Max 40 length').trim().isLength({ min: 5 , max: 40}),
    check('password','Must be of Min 5 and Max 15 length').trim().isLength({ min: 5 , max: 15})
    ], (req, res) => {

    try
    {
        const errors = validationResult(req);
        
        var user = {
            email: req.body.email,
            password: req.body.password,
            profilePic: 'defaultPic.jpg',
            username: req.body.username,
            mobileno: req.body.mobileno,
            state: req.body.state,
            address: req.body.address
        }

        var error = {
            emailError: null,
            passwordError: null,
            usernameError: null,
            mobilenoError: null,
            addressError: null
        }

        for(i = 0; i < errors.errors.length; i++)
        {
            var name =  errors.errors[i].param

            if(name === 'username')
            {
                error.usernameError = errors.errors[i].msg
            }
            else if(name === 'email')
            {
                error.emailError = errors.errors[i].msg
            }
            else if(name === 'mobileno')
            {
                error.mobilenoError = errors.errors[i].msg
            }
            else if(name === 'address')
            {
                error.addressError = errors.errors[i].msg
            }
            else
            {
                error.passwordError = errors.errors[i].msg
            }
        }

        if (!errors.isEmpty())
        {
            res.render('Signup',{
                user,
                error,
                states,
                regError:null
            })
        }
        else
        {
            var sql = "select * from user where email = ?"
            var x = [[user.email]]
    
            connection.query(sql,[x],function(err,result){
                
                if(err) throw err
                
                if(result.length == 1)
                {
                    res.render('Signup',{
                        user,
                        error,
                        states,
                        regError:'Email already registered!'
                    })
                }
                else
                {
                    otpNumber = getOTP()
                    req.session.user = user
                    req.session.optNumber = otpNumber

                    mail.sendMail(user.email,otpNumber)
                    
                    res.render('OtpForm',{
                        email: user.email,
                        alert:false
                    })
                }
            }) 
        }
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.post('/OTPVerify',function(req,res){
    try
    {
        var userOTP = parseInt(req.body.otpNumber)
        var optNumber = req.session.optNumber
        var user = req.session.user

        if(userOTP === otpNumber)
        {
            var sql = "insert into user value ?"
            var x = [[user.email, user.password, user.profilePic, user.username, user.mobileno, user.state, user.address]]
    
            connection.query(sql,[x],function(error,result){
                
                if(error) throw error

                res.render('Alert',{
                    type:"success",
                    title:"Account Created",
                    text:"Account Verified, Please Continue Shopping",
                    link:"user/home"
                })
            }) 
        }
        else
        {
            req.session.user = null
            req.session.optNumber = null

            res.render('Alert',{
                type:"error",
                title:"Wrong OTP",
                text:"Account Not Verified, Please try again",
                link:"signup"
            })
        }
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.get('/resendOTP',function(req,res){
    try
    {
        var email = req.session.user.email
        var otpNumber = getOTP()
        req.session.optNumber = otpNumber
        
        mail.sendMail(email,otpNumber)
       
        res.render('OtpForm',{
            email,
            alert:true
        })
    }
    catch(e)
    {
       res.redirect('/')
    }
})

router.post('/loginVerify', [
    check('email','Must be of Min 8 and Max 40 length').trim().isEmail().isLength({ min: 8, max: 40}),
    check('password','Must be of Min 5 and Max 15 length').trim().isLength({ min: 5, max: 15})
  ], (req, res) => {

    try
    {
        const errors = validationResult(req);
        
        var user = {
            password: req.body.password,
            email: req.body.email,
        }

        var error = {
            passwordError: null, 
            emailError: null
        }

        for(i = 0; i < errors.errors.length; i++)
        {
            var name =  errors.errors[i].param

            if(name === 'email')
            {
                error.emailError = errors.errors[i].msg
            }
            else
            {
                error.passwordError = errors.errors[i].msg
            }
        }

        if (!errors.isEmpty())
        {
            res.render('Login',{user, error})
        }
        else
        {
            var sql = "select * from user where email='"+user.email+"' and binary password='"+user.password+"' ; ";
            connection.query(sql,function(error,result){
                    
                if(error) throw error
                    
                if(result.length == 1)
                {
                    user = result[0]
                    req.session.user = user
                    res.redirect('/user/home')
                }
                else
                {
                    res.render('Alert',{
                        type:"error",
                        title:"Oops...",
                        text:"Invalid Username/Password",
                        link:"login"
                    })
                }
            }) 
        }
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.get('/forgotPassword',function(req,res){
    try
    {
        res.render('ForgotPassword',{error:null,email:null});
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.post('/verifyForgotPassword', [
    check('email','Must be of Min 8 and Max 40 length').trim().isEmail().isLength({ min: 8 , max: 40})
  ], (req, res) => {

    try
    {
        const errors = validationResult(req);
        
        var email = req.body.email

        for(i = 0; i < errors.errors.length; i++)
        {
            var name =  errors.errors[i].param

            if(name === 'email')
            {
                error = errors.errors[i].msg
            }
        }

        if (!errors.isEmpty())
        {
            res.render('ForgotPassword',{email,error})
        }
        else
        {
            var sql = "select * from user where email='"+email+"'";
           
            connection.query(sql,function(error,result){
               
                if(error) throw error
               
                if(result.length == 1)
                {
                    mail.sendPassword(email,result[0].password)
                          
                    res.render('Alert',{
                        type:"success",
                        title:"Forgot Password",
                        text:"Your Old Password has been send to your email",
                        link:"login"
                    })
                }
                else
                {
                    res.render('ForgotPassword',{error:'Email not registered!',email})
                }
            }) 
        }
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.get('/mygallery',function(req,res){
    try
    {
        res.render('Gallery');
    }
    catch(e)
    {
        res.redirect('/')
    }
})

module.exports = router