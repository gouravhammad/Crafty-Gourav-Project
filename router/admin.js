const { check, validationResult } = require('express-validator');
const connection = require('../utility/mysqlConn')
const commonFun = require('../utility/commonFun')
const mail = require('../utility/mail')
const express = require('express')
const multer = require('multer')
const path = require('path')
const router = express.Router()

var categories = commonFun.getCategories()

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'public/products')
    },
    picName : '',
    filename: function (req, file, cb) {
        this.picName = file.fieldname+'-'+Date.now()+'.jpg';
        cb(null,this.picName)
    }
  })
   
const maxSize = 1 * 1000 * 1000

var upload = multer({ 
    storage: storage,
    limits: { fileSize: maxSize },
    fileFilter: function (req, file, cb) {

        var filetypes = /jpeg|jpg|png/;
        var mimetype = filetypes.test(file.mimetype);
        var extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
        if (mimetype && extname) {
          return cb(null, true);
        }
        cb({message:"Only JPEG/JPG/PNG file types are supported",code:'TYPE_ERROR'});
      } 
}).single('pPicture')


router.get('/logout',function(req,res){
    try
    {
        req.session.admin = null;

        res.render('Alert',{
            type:"success",
            title:"Logged Out",
            text:"You have successfully logged out",
            link:"/login"
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
        var admin = {
            email: null,
            password: null
        }

        var error = {
            emailError: null,
            passwordError: null
        }

        res.render("AdminLogin",{
            admin,
            error
        })
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.post('/adminLoginVerify', [
    check('email','Must be of Min 8 and Max 40 length').trim().isEmail().isLength({ min: 8, max: 40}),
    check('password','Must be of Min 5 and Max 15 length').trim().isLength({ min: 5, max: 15})
  ], (req, res) => {

    try
    {
        const errors = validationResult(req);
        
        var admin = {
            email: req.body.email,
            password: req.body.password
        }

        var error = {
            emailError: null,
            passwordError: null
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
            res.render("AdminLogin",{
                admin,
                error
            })
        }
        else
        {
            var sql = "select * from admin where email='"+admin.email+"' and binary password='"+admin.password+"' ; ";
            connection.query(sql,function(err,result){
                    
                if(err) throw err
                    
                if(result.length == 1)
                {
                    req.session.admin = admin.email
                    res.redirect('home')
                }
                else
                {
                    res.render('Alert',{
                        type:"error",
                        title:"Unauthorized access",
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

router.use('/',function(req,res,next){
    try
    {
        if(req.session.admin === null || req.session.admin === undefined)
        {
            res.render('Alert',{
                type:"error",
                title:"Login To Continue",
                text:"You have been logged out, please login",
                link:"login"
            })
        }
        else
        {
            next();
        }
    }
    catch(e)
    {
        res.redirect('/')
    }
}) 

router.get('/home',function(req,res){
    try
    {
        res.render("AdminHome")
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.get('/manageOrders',function(req,res){
    try
    {
        var sql1 = "select * from orders where orderStatus='Ordered';"
        var sql2 = "select * from orders where orderStatus='Delivered';"
        var sql3 = "select * from orders where orderStatus='Canceled';"
        var sql = sql1 + sql2 + sql3
    
        connection.query(sql,function(err,result){
            
            if(err) throw err
            
            res.render('AdminManageOrders',{
                data1: result[0],
                data2: result[1],
                data3: result[2]
            })    
        }) 
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.post('/productDetails',function(req,res){
    try
    {
        var pId = req.body.pId
        var sql = "select * from product where pId="+pId+" ; "

        connection.query(sql,function(error,result){

            if(result.length == 0)
            {
                return res.render('Alert',{
                    type:"error",
                    title:"Product doesn't exists",
                    text:"This product is not available now!",
                    link:"home"
                })
            }
    
            res.render('AdminProductDetails',{
                result: result
            })        
        }) 
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.get('/manageProducts',function(req,res){
    try
    {
        var sql = "select * from product; "

        connection.query(sql,function(error,result){
    
            res.render('AdminManageProducts',{
                data: result
            })        
        }) 
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.get('/addProduct',function(req,res){
    try
    {
        var product = {
            pId: null,
            pName: null,
            pCategory: null,
            pPrice: null,
            pDesc: null,
            pPicture: null,
            picsReq: null,
            daysReq: null
        }

        var error = {
            pNameError: null,
            pPriceError: null,
            pDescError: null,
            picsReqError: null,
            daysReqError: null
        }

        res.render('AdminAddProduct',{
            product,
            error,
            categories
        })
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.post('/addProduct', [
    check('pName','Must be of Min 10 and Max 35 length').trim().isLength({ min: 10 , max: 35}),
    check('pDesc','Must be of Min 40 and Max 130 length').trim().isLength({ min: 40 , max: 130}),
    check('pPrice','Must be of Min 49 and Max 9999 Value').trim().isInt({min: 49, max: 9999}),
    check('picsReq','Must be of Min 0 and Max 50 Value').trim().isInt({min: 0, max: 50}),
    check('daysReq','Must be of Min 1 and Max 15 value').trim().isInt({min: 1, max: 15})
    ], (req, res) => {

    try
    {
        const errors = validationResult(req);
        
        var product = {
            pId: null,
            pName: req.body.pName,
            pCategory: req.body.pCategory,
            pPrice: parseInt(req.body.pPrice),
            pDesc: req.body.pDesc,
            pPicture: 'defaultProduct.jpg',
            picsReq: parseInt(req.body.picsReq),
            daysReq: parseInt(req.body.daysReq)
        }

        var error = {
            pNameError: null,
            pPriceError: null,
            pDescError: null,
            picsReqError: null,
            daysReqError: null
        }

        for(i = 0; i < errors.errors.length; i++)
        {
            var name =  errors.errors[i].param

            if(name === 'pName')
            {
                error.pNameError = errors.errors[i].msg
            }
            else if(name === 'pDesc')
            {
                error.pDescError = errors.errors[i].msg
            }
            else if(name === 'pPrice')
            {
                error.pPriceError = errors.errors[i].msg
            }
            else if(name === 'daysReq')
            {
                error.daysReqError = errors.errors[i].msg
            }
            else
            {
                error.picsReqError = errors.errors[i].msg
            }
        }

        if (!errors.isEmpty())
        {
            res.render('AdminAddProduct',{
                product,
                error,
                categories
            })
        }
        else
        {
            req.session.product = product
            res.redirect('addProductPic')
        }
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.get('/addProductPic',function(req,res){
    try
    {
        res.render('AdminAddProductPic',{
           picError: null
        })
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.post('/addProductPic',function(req,res){
    try
    {
        upload(req,res,function(err){
            if(err)
            {
                var msg = ''

                if(err.code == 'LIMIT_FILE_SIZE')
                {
                    msg = 'Upload pic upto 1 MB'
                }
                else
                {
                    msg = err.message
                }

                res.render('AdminAddProductPic',{
                    picError: msg
                })
            }
            else
            {
                var product = req.session.product
                product.pPicture = storage.picName

                var sql = "insert into product values ?"
                var x = [[product.pId,product.pName,product.pCategory,product.pPrice,product.pDesc,product.pPicture,product.picsReq,product.daysReq]]
                
                connection.query(sql,[x],function(er,result){

                    if(er) throw er
            
                    req.session.product = null

                    res.render('Alert',{
                        type:"success",
                        title:"Product Added",
                        text:"Product has been successfully added",
                        link:"manageProducts"
                    })
                })
            }
        })
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.post('/updateProduct',function(req,res){
    try
    {
        var pId = req.body.pId

        var error = {
            pNameError: null,
            pPriceError: null,
            pDescError: null,
            picsReqError: null,
            daysReqError: null
        }

        var sql = "select * from product where pId="+pId+" ;"

        connection.query(sql,function(err,result){

            if(err) throw err
    
            res.render('AdminUpdateProduct',{
                product: result[0],
                error,
                categories
            })
        })
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.post('/saveProductChanges', [
    check('pName','Must be of Min 10 and Max 35 length').trim().isLength({ min: 10 , max: 35}),
    check('pDesc','Must be of Min 40 and Max 130 length').trim().isLength({ min: 40 , max: 130}),
    check('pPrice','Must be of Min 49 and Max 9999 Value').trim().isInt({min: 49, max: 9999}),
    check('picsReq','Must be of Min 0 and Max 50 Value').trim().isInt({min: 0, max: 50}),
    check('daysReq','Must be of Min 1 and Max 15 value').trim().isInt({min: 1, max: 15})
    ], (req, res) => {

    try
    {
        const errors = validationResult(req);
        
        var product = {
            pId: req.body.pId,
            pName: req.body.pName,
            pCategory: req.body.pCategory,
            pPrice: parseInt(req.body.pPrice),
            pDesc: req.body.pDesc,
            pPicture: 'defaultProduct.jpg',
            picsReq: parseInt(req.body.picsReq),
            daysReq: parseInt(req.body.daysReq)
        }

        var error = {
            pNameError: null,
            pPriceError: null,
            pDescError: null,
            picsReqError: null,
            daysReqError: null
        }

        for(i = 0; i < errors.errors.length; i++)
        {
            var name =  errors.errors[i].param

            if(name === 'pName')
            {
                error.pNameError = errors.errors[i].msg
            }
            else if(name === 'pDesc')
            {
                error.pDescError = errors.errors[i].msg
            }
            else if(name === 'pPrice')
            {
                error.pPriceError = errors.errors[i].msg
            }
            else if(name === 'daysReq')
            {
                error.daysReqError = errors.errors[i].msg
            }
            else
            {
                error.picsReqError = errors.errors[i].msg
            }
        }

        if (!errors.isEmpty())
        {
            res.render('AdminUpdateProduct',{
                product,
                error,
                categories
            })
        }
        else
        {
            var sql = "update product SET pName='"+product.pName+"', pCategory='"+product.pCategory+"', pPrice="+product.pPrice+", pDesc='"+product.pDesc+"', daysReq="+product.daysReq+", picsReq="+product.picsReq+" where pId="+product.pId+" ;"

            connection.query(sql,function(err,result){

                if(err) throw err
        
                res.render('Alert',{
                    type:"success",
                    title:"Details Updated",
                    text:"Product details has been successfully updated",
                    link:"manageProducts"
                })
            })
        }
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.get('/updateProductPic',function(req,res){
    try
    {
        var pId = req.query.pId
        var sql = "select pPicture,pId from product where pId="+pId+" ;"

        connection.query(sql,function(err,result){

            if(err) throw err
    
            res.render('AdminUpdateProductPic',{
                data: result,
                picError: null
             })
        })
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.post('/saveProductPicChanges',function(req,res){
    try
    {
        upload(req,res,function(err){
            if(err)
            {
                var msg = ''

                if(err.code == 'LIMIT_FILE_SIZE')
                {
                    msg = 'Upload pic upto 1 MB'
                }
                else
                {
                    msg = err.message
                }

                var pId = req.body.pId
                var sql = "select pPicture,pId from product where pId="+pId+" ;"

                connection.query(sql,function(err,result){

                    if(err) throw err
            
                    res.render('AdminUpdateProductPic',{
                        data: result,
                        picError: msg
                    })
                })
            }
            else
            {
                var pId = req.body.pId
                
                var sql = "update product SET pPicture='"+storage.picName+"' where pId="+pId+" ;"
                
                connection.query(sql,function(err,result){

                    if(err) throw err
        
                    res.render('Alert',{
                        type:"success",
                        title:"Product Pic Updated",
                        text:"Product picture has been successfully updated",
                        link:"manageProducts"
                    })
                })        
            }
        })
    }
    catch(e)
    {
        res.redirect('/')
    }
})



router.post('/removeProductConfirmation',function(req,res){
    try
    {
        var pId = req.body.pId

        res.render('AlertConfirmation',{
            title: 'Remove Product',
            text: 'Are you sure want to remove this product?',
            yes: `removeProduct?pId=${pId}`,
            no: 'manageProducts'
        })
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.get('/removeProduct',function(req,res){
    try
    {
        var pId = req.query.pId

        var sql = "delete from product where pId="+pId+" ;"

        connection.query(sql,function(err,result){

            if(err) throw err
    
            res.redirect('manageProducts')
        })
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.post('/setStatusDeliveredConfirmation',function(req,res){
    try
    {
        var orderId = req.body.orderId

        res.render('AlertConfirmation',{
            title: 'Product Delivered',
            text: 'Have you delivered this product?',
            yes: `setStatusDelivered?orderId=${orderId}`,
            no: 'manageOrders'
        })
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.get('/setStatusDelivered',function(req,res){
    try
    {
        var orderId = req.query.orderId

        var sql1 = "select * from orders where orderId="+orderId+" ; "
        var sql2 = "update orders set orderStatus='Delivered' where orderId="+orderId+" ;"
        var sql = sql1 + sql2

        connection.query(sql,function(err,result){

            if(err) throw err

            var sample = result[0]
            var order = sample[0]
            var myMsg = ''
            
            myMsg = "Your order has be delivered at Address:  "+order.address+".\n\nDate of Order: "+order.dateAndTime+"\nTotal Amount: Rs. "+order.total+"\nPayment Mode: "+order.paymentMode+"\n\nThank you for shopping from 'Crafty Gourav', Stay happy :) and continue shopping!"
            
            // MAILING "Product delivered"
            mail.sendDelivered(order.email,myMsg)
            
            res.redirect('manageOrders')
        })
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.post('/setStatusCanceledConfirmation',function(req,res){
    try
    {
        var orderId = req.body.orderId

        res.render('AlertConfirmation',{
            title: 'Unable To Process',
            text: 'Are you unable to process it now?',
            yes: `setStatusCanceled?orderId=${orderId}`,
            no: 'manageOrders'
        })
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.get('/setStatusCanceled',function(req,res){
    try
    {
        var orderId = req.query.orderId

        var sql1 = "select * from orders where orderId="+orderId+" ; "
        var sql2 = "update orders set orderStatus='Canceled' where orderId="+orderId+" ;"
        var sql = sql1 + sql2

        connection.query(sql,function(err,result){

            if(err) throw err
    
            var sample = result[0]
            var order = sample[0]
            var myMsg = ''
            
            if(order.paymentMode == 'Cash On Delivery')
            {
                myMsg = "Sorry to inform you that currently we are unable to process your order placed on "+order.dateAndTime+" of Amount: "+order.total+"/- due to busy schedule.\n\nFrom: Gourav Hammad, CEO"
            }
            else
            {
                myMsg = "Sorry to inform you that currently we are unable to process your order placed on "+order.dateAndTime+" of Amount: "+order.total+"/- due to busy schedule. Your money will be refunded in your account within 24 hours.\n\nFrom: Gourav Hammad, CEO"
            }

            // MAILING "Unable to process now, money return if cardpayment!"
            mail.sendCanNotProcess(order.email,myMsg)
            
            res.redirect('manageOrders')
        })
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.get('/manageUsers',function(req,res){
    try
    {
        var sql = "select * from user ;"

        connection.query(sql,function(err,result){

            if(err) throw err
            
            res.render('AdminManageUsers',{
                data: result
            })
        })
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.post('/removeCustomerConfirmation',function(req,res){
    try
    {
        var email = req.body.email

        res.render('AlertConfirmation',{
            title: 'Remove User',
            text: 'Are you sure want to remove this user?',
            yes: `removeUser?email=${email}`,
            no: 'manageUsers'
        })
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.get('/removeUser',function(req,res){
    try
    {
        var email = req.query.email

        var sql1 = "delete from user where email='"+email+"' ;"
        var sql2 = "delete from cart where email='"+email+"' ;"
        var sql3 = "delete from wishlist where email='"+email+"' ;"
        var sql = sql1 + sql2 + sql3

        connection.query(sql,function(err,result){

            if(err) throw err

            // MAILING "Reason to remove user"
            var myMsg = "Your account has been deleted from 'Crafty Gourav', We would be happy :) to see you on our website again!\n\nFrom: Gourav Hammad \nCEO, Crafty Gourav"
            mail.removeUser(email,myMsg)
     
            res.render('Alert',{
                type:"success",
                title:"User Removed",
                text:"This user has been successfully removed!",
                link:"manageUsers"
            })
        })
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.post('/userDetails',function(req,res){
    try
    {
        var email = req.body.email

        var sql = "select * from user where email='"+email+"'; "

        connection.query(sql,function(err,result){

            if(err) throw err

            if(result.length == 0)
            {
                return  res.render('Alert',{
                    type:"error",
                    title:"User doesn't exists",
                    text:"This user was removed!",
                    link:"manageOrders"
                })
            }
            
            res.render('AdminUserDetails',{
                data: result[0]
            })
        })
    }
    catch(e)
    {
        res.redirect('/')
    }
})

module.exports = router