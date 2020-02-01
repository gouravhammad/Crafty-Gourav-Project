const { check, validationResult } = require('express-validator');
const connection = require('../utility/mysqlConn')
const syncConnection = require('../utility/sync-mysql')
const commonFun = require('../utility/commonFun')
const mail = require('../utility/mail')
const express = require('express')
const fs = require('fs')
const multer = require('multer')
const path = require('path')
const stripe = require('stripe')(process.env.STRIPE_KEY)

const router = express.Router()

var states = commonFun.getStates()
var categories = commonFun.getCategories()

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'public/profilePic')
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
}).single('profilePic')


router.use('/',function(req,res,next){
    try
    {
        if(req.session.user === null || req.session.user === undefined)
        {
            res.render('Alert',{
                type:"error",
                title:"Login To Continue",
                text:"You have been logged out, please login",
                link:"../login"
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

router.get('/logout',function(req,res){
    try
    {
        req.session.user = null;

        res.render('Alert',{
            type:"success",
            title:"Logged Out",
            text:"You have successfully logged out",
            link:"../login"
        })
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.get('/home',function(req,res){
    try
    {
        var user = req.session.user

        var sql1 = "select * from product ; "
        var sql2 = "select count(pId) as count from cart where email='"+user.email+"' ; "
        var sql = sql1 + sql2
  
        connection.query(sql,function(error,result){
            
            if(error) throw error

            res.render('UserHome',{
                result: result[0],
                cartTotal: result[1],
                categories
            })    
        }) 
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.post('/addToCart',function(req,res){  
    try
    {
        var pId = req.body.pId
        var user = req.session.user
        var quantity = 1

        var sql = "insert into cart values ?"
                
        var x = [[user.email,pId,quantity]]
                
        connection.query(sql,[x],function(err,result){
            try
            {
                if(err) throw err

                res.render('Alert',{
                    type:"success",
                    title:"Added to cart",
                    text:"Product has been added to cart",
                    link:"/user/home"
                }) 
            }
            catch(e)
            {
                res.render('Alert',{
                    type:"info",
                    title:"Already added",
                    text:"Product is already there in cart",
                    link:"/user/home"
                })
            }
        })
    } 
    catch(e)
    {
        res.redirect('/')
    }
})

router.post('/buyNow',function(req,res){  
    try
    {
        var pId = req.body.pId
        var user = req.session.user
        var quantity = 1

        var sql = "insert into cart values ?"
                
        var x = [[user.email,pId,quantity]]
                
        connection.query(sql,[x],function(err,result){
            try
            {
                if(err) throw err

                res.redirect('cart')
            }
            catch(e)
            {
                res.redirect('cart')
            }
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
        var user = req.session.user
        var pId = req.query.pId

        var sql1 = "select * from product where pId="+pId+" ; "
        var sql2 = "select count(pId) as count from cart where email='"+user.email+"' ; "
        var sql = sql1 + sql2

        connection.query(sql,function(error,result){
    
            if(error || result[0].length == 0)
            {
                return res.render('Alert',{
                    type:"error",
                    title:"Product doesn't exists",
                    text:"This product is not available now!",
                    link:"home"
                })
            }
            else
            {
                res.render('ProductDetailsUser',{
                    result: result[0],
                    cartTotal: result[1]
                })    
            }
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
        var user = req.session.user

        var sql1 = "select * from product where pCategory LIKE('%"+search+"%') OR pName LIKE('%"+search+"%') ;"
        var sql2 = "select count(pId) as count from cart where email='"+user.email+"' ; "
        var sql = sql1 + sql2

        connection.query(sql,function(error,result){
            
            if(error) throw error

            if(result[0].length > 0)
            {
                res.render('UserHome',{
                    result: result[0],
                    cartTotal: result[1],
                    username: user.username,
                    categories
                })    
            }
            else
            {
                res.render('EmptyMessageUser',{
                    cartTotal: result[1],
                    username: user.username
                })    
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
        var user = req.session.user
        var sql1 = ''

        if(filter == 'ASC')
        {
            sql1 = "select * from product order by pPrice ASC;"
        }
        else if(filter == 'DESC')
        {
            sql1 = "select * from product order by pPrice DESC ;"
        }
        else
        {
            sql1 = "select * from product where pCategory LIKE('%"+filter+"%') ;"
        }

        var sql2 = "select count(pId) as count from cart where email='"+user.email+"' ; "
        var sql = sql1 + sql2

        connection.query(sql,function(error,result){
            
            if(error) throw error
            
            res.render('UserHome',{
                result: result[0],
                cartTotal: result[1],
                username: user.username,
                categories
            })    
        }) 
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.get('/account',function(req,res){
    try
    {
        var user = req.session.user

        var sql1 = "select * from user where email='"+user.email+"' ; "
        var sql2 = "select count(pId) as count from cart where email='"+user.email+"' ; "
        var sql = sql1 + sql2

        connection.query(sql,function(error,result){
            
            if(error) throw error
            
            var x = result[0]
            req.session.user = x[0]

            res.render('Account',{
                user: result[0],
                cartTotal: result[1],
            })    
        }) 
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.get('/updateUser',function(req,res){
    try
    {
        var user = req.session.user

        var error = {
            usernameError: null,
            mobilenoError: null,
            addressError: null
        }

        var sql = "select count(pId) as count from cart where email='"+user.email+"' ; "
    
        connection.query(sql,function(err,result){
            
            if(err) throw err
            
            res.render('UpdateAccount',{
                user,
                error,
                states,
                cartTotal: result,
            })    
        }) 
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.post('/saveChangesUser', [
    check('username','Must be of Min 3 and Max 30 length').trim().isLength({ min: 3 , max: 30}),
    check('mobileno','Must be of 10 digits').trim().isLength({ min: 10 , max: 10}),
    check('address','Must be of Min 5 and Max 40 length').trim().isLength({ min: 5 , max: 40})
    ], (req, res) => {

    try
    {
        const errors = validationResult(req);
        
        var user = {
            email : req.body.email,
            username: req.body.username,
            mobileno: req.body.mobileno,
            state: req.body.state,
            address: req.body.address
        }

        var error = {
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
            else if(name === 'mobileno')
            {
                error.mobilenoError = errors.errors[i].msg
            }
            else
            {
                error.addressError = errors.errors[i].msg
            }
        }

        if (!errors.isEmpty())
        {
            var sql = "select count(pId) as count from cart where email='"+user.email+"' ; "
    
            connection.query(sql,function(err,result){
                
                if(err) throw err
                
                res.render('UpdateAccount',{
                    user,
                    error,
                    states,
                    cartTotal: result,
                })    
            }) 
        }
        else
        {
            var sql = "update user SET username='"+user.username+"', mobileno="+user.mobileno+", state='"+user.state+"', address='"+user.address+"' where email='"+user.email+"' ; "
    
            connection.query(sql,function(err,result){
                
                if(err) throw err
                
                res.redirect('account')
            }) 
        }
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.get('/changePassword',function(req,res){
    try
    {    
        var user = req.session.user

        var values = {
            old: null,
            new: null, 
            confirm: null
        }
        var passError = {
            old: null,
            new: null,
            confirm: null
        }

        var confirm = null
        var wrong = null

        var sql = "select count(pId) as count from cart where email='"+user.email+"' ; "
    
        connection.query(sql,function(err,result){
            
            if(err) throw err
            
            res.render('ChangePassword',{
                values,
                passError,
                wrong,
                confirm,
                cartTotal: result
            }) 
        }) 
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.post('/updatePassword', [
    check('oldPassword','Must be of Min 5 and Max 15 length').trim().isLength({ min: 5 , max: 15}),
    check('newPassword','Must be of Min 5 and Max 15 length').trim().isLength({ min: 5 , max: 15}),
    check('confirmPassword','Must be of Min 5 and Max 15 length').trim().isLength({ min: 5 , max: 15})
  ], (req, res) => {

    try
    {
        var user = req.session.user
        const errors = validationResult(req);
        
        var values = {
            old: req.body.oldPassword,
            new: req.body.newPassword,
            confirm: req.body.confirmPassword
        }

        var passError = {
            old: null,
            new: null,
            confirm: null
        }

        for(i = 0; i < errors.errors.length; i++)
        {
            var name =  errors.errors[i].param

            if(name === 'oldPassword')
            {
                passError.old = errors.errors[i].msg
            }
            else if(name === 'newPassword')
            {
                passError.new = errors.errors[i].msg
            }
            else
            {
                passError.confirm = errors.errors[i].msg
            }
        }

        if (!errors.isEmpty())
        {
            var sql = "select count(pId) as count from cart where email='"+user.email+"' ; "
    
            connection.query(sql,function(err,result){
                
                if(err) throw err
                
                res.render('ChangePassword',{
                    values,
                    passError,
                    wrong: null,
                    confirm: null,
                    cartTotal: result
                }) 
            }) 
        }
        else
        {
            var password = user.password

            if(password !== values.old)
            {
                var sql = "select count(pId) as count from cart where email='"+user.email+"' ; "
    
                connection.query(sql,function(err,result){
                
                    if(err) throw err
                    
                    res.render('ChangePassword',{
                        values,
                        passError,
                        wrong: 'Wrong Password',
                        confirm: null,
                        cartTotal: result
                    }) 
                }) 
            }
            else if(values.new !== values.confirm)
            {
                var sql = "select count(pId) as count from cart where email='"+user.email+"' ; "
    
                connection.query(sql,function(err,result){
                
                    if(err) throw err
                    
                    res.render('ChangePassword',{
                        values,
                        passError,
                        wrong: null,
                        confirm: 'Password did not matched',
                        cartTotal: result
                    }) 
                }) 
            }
            else
            {
                var sql = "update user SET password='"+values.new+"' where email='"+user.email+"' ; "
                connection.query(sql,function(error,result){

                    if(error) throw error

                    req.session.user.password = values.new

                    res.render('Alert',{
                        type:"success",
                        title:"Password Changed",
                        text:"Your password has been changed",
                        link:"home"
                    }) 
                }) 
            }  
        }
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.get('/changeProfilePic',function(req,res){
    try
    {
        var user = req.session.user

        var sql = "select count(pId) as count from cart where email='"+user.email+"' ; "
    
        connection.query(sql,function(err,result){
        
            if(err) throw err
            
            res.render('ChangeProfilePic',{
                picError: null,
                profilePic: user.profilePic,
                cartTotal: result
            })
        }) 
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.post('/updateProfilePic',function(req,res){
    try
    {
        var user = req.session.user

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

                var sql = "select count(pId) as count from cart where email='"+user.email+"' ; "
                
                connection.query(sql,function(err,result){
                
                    if(err) throw err
                    
                    res.render('ChangeProfilePic',{
                        picError: msg,
                        profilePic: user.profilePic,
                        cartTotal: result
                    })
                }) 
            }
            else
            {
                req.session.user.profilePic = storage.picName

                var sql = "update user SET profilePic='"+storage.picName+"' where email='"+user.email+"' ";
                
                connection.query(sql,function(error,result){

                    if(error) throw error  
                }) 

                // START : Saving images in seperate table because heroku stores data for 2 hours
                var blobImage = fs.readFileSync("public/profilePic/" + storage.picName)
        
                var sql2 = "insert into uploads value ? "
                var data = [["public/profilePic/"+storage.picName,blobImage]]

                connection.query(sql2,[data],function(err,result){
                            
                    if(err)
                    {   console.log("ERROR IN SAVING USER PROFILE PIC")
                        throw err
                    }

                    res.redirect('account') 
                }) 
                //END
            }
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
        var user = req.session.user

        var sql = "select count(pId) as count from cart where email='"+user.email+"' ; "
    
        connection.query(sql,function(err,result){
            
            if(err) throw err
            
            res.render('UserAbout',{
                cartTotal: result
            })    
        }) 
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.get('/orders',function(req,res){
    try
    {
        var user = req.session.user

        var sql1 = "select count(pId) as count from cart where email='"+user.email+"' ; "
        var sql2 = "select * from orders where email='"+user.email+"' and orderStatus='Ordered';"
        var sql3 = "select * from orders where email='"+user.email+"' and orderStatus='Delivered';"
        var sql4 = "select * from orders where email='"+user.email+"' and orderStatus='Canceled';"
        var sql = sql1 + sql2 + sql3 + sql4
    
        connection.query(sql,function(err,result){
            
            if(err) throw err
            
            res.render('MyOrders',{
                cartTotal: result[0],
                data1: result[1],
                data2: result[2],
                data3: result[3]
            })    
        }) 
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.get('/cart',function(req,res){
    try
    {
        var user = req.session.user

        var sql1 = "select count(pId) as count from cart where email='"+user.email+"' ; "
        var sql2 = "select p.pName,p.pPrice,p.pPicture,c.quantity,c.pId from product p,cart c where p.pId = c.pId and c.email='"+user.email+"' ; "
        var sql3 = "select sum(p.pPrice*c.quantity) as total from cart c,product p where c.pId = p.pId and c.email='"+user.email+"' ; "
        var sql = sql1 + sql2 + sql3

        connection.query(sql,function(err,result){
            
            if(err) throw err

            if(result[1].length >= 1)
            {
                res.render('Cart',{
                    cartTotal: result[0],
                    items: result[1],
                    total: result[2]
                })   
            }
            else
            {
                res.render('Cart',{
                    cartTotal: result[0],
                    items: null,
                    total: result[2]
                })   
            }    
        }) 
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.post('/removeFromCart',function(req,res){ 
    try
    {
        var user = req.session.user
        var pId = req.body.pId

        var sql = "delete from cart where pId="+pId+" and email='"+user.email+"' ;"
       
        connection.query(sql,function(err,result){
            
            if(err) throw err
          
            res.redirect('cart') 
        })   
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.post('/changeQuantity',function(req,res){ 
    try
    {
        var user = req.session.user
        var quantity = req.body.name
        var pId = req.body.pId

        var sql = "update cart SET quantity="+quantity+" where pId="+pId+" and email='"+user.email+"' ; "
       
        connection.query(sql,function(err,result){
            
            if(err) throw err
          
            res.redirect('cart')
        })   
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.get('/checkout',function(req,res){
    try
    {
        var user = req.session.user

        var order = {
            mobileno: user.mobileno,
            address: user.address,
            paymentMode: 'Cash on Delivery'
        }

        var error = {
            mobilenoError: null,
            addressError: null
        }

        var sql = "select count(pId) as count from cart where email='"+user.email+"' ; "
    
        connection.query(sql,function(err,result){
            
            if(err) throw err
            
            res.render('Checkout',{
                order,
                error,
                cartTotal: result
            })    
        }) 
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.post('/placeOrder', [
    check('address','Must be of Min 5 and Max 40 length').trim().isLength({ min: 5, max: 40}),
    check('mobileno','Must be of 10 digits').trim().isLength({ min: 10, max: 10})
  ], (req, res) => {

    try
    {
        const errors = validationResult(req);

        var user = req.session.user
        
        var order = {
            mobileno: req.body.mobileno,
            address: req.body.address,
            paymentMode: req.body.paymentMode
        }

        var error = {
            mobilenoError: null,
            addressError: null
        }

        for(i = 0; i < errors.errors.length; i++)
        {
            var name =  errors.errors[i].param

            if(name === 'mobileno')
            {
                error.mobilenoError = errors.errors[i].msg
            }
            else
            {
                error.addressError = errors.errors[i].msg
            }
        }

        if (!errors.isEmpty())
        {
            var sql = "select count(pId) as count from cart where email='"+user.email+"' ; "
    
            connection.query(sql,function(err,result){
                
                if(err) throw err
                
                res.render('Checkout',{
                    order,
                    error,
                    cartTotal: result
                })    
            }) 
        }
        else if(order.paymentMode == 'Card Payment')
        {
            var sql1 = "select count(pId) as count from cart where email='"+user.email+"' ; "
            var sql2 = "select sum(p.pPrice*c.quantity) as total from cart c,product p where c.pId = p.pId and c.email='"+user.email+"' ; "
            var sql = sql1 + sql2

            connection.query(sql,function(err,result){
                
                if(err) throw err

                var tax = result[1]
                tax = ((tax[0].total*3.6)/100).toFixed(2)
                tax = parseFloat(tax)
                
                res.render('Payment',{
                    order,
                    cartTotal: result[0],
                    total: result[1],
                    tax
                })    
            })    
        }
        else
        {
            var qry = "select c.pId,c.quantity,(p.pPrice*c.quantity) as total from cart c,product p where c.pId = p.pId and c.email='"+user.email+"' ; "
            const data = syncConnection.query(qry);
         
            var date = new Date();
            date = date.toISOString().split('T')[0] + ' '+date.toTimeString().split(' ')[0]

            var totalAmount = 0
            for(i = 0; i < data.length; i++)
            {
                totalAmount += data[i].total

                var sql = "insert into orders values ?"
                var x = [[
                    null,
                    user.email,
                    data[i].pId,
                    data[i].quantity,
                    data[i].total,
                    date,
                    order.mobileno,
                    order.address,
                    order.paymentMode,
                    'Ordered'
                ]]

                connection.query(sql,[x],function(err,result){   
                    if(err) throw err
                }) 
            }

            var myMsg = "Your order has been successfully placed on "+date+"\n\nTotal Items: "+data.length+"\nTotal Amount: Rs. "+totalAmount+"\nPayment Mode: Cash On Delivery\nDelivery Address: "+order.address+"\nContact No: "+order.mobileno+"\n\nThank you for placing your order. Our team will contact you within 24 hours for more details regarding product customisation. Stay happy :) and continue shopping!"

            // SENDING MAIL TO USER FOR NOTIFICATION OF 'ORDER PLACED'
            mail.orderPlaced(user.email,myMsg)

            var adminMsg = "Order placed by "+user.username+" on "+date+"\n\nTotal Items: "+data.length+"\nTotal Amount: Rs. "+totalAmount+"\nPayment Mode: Cash On Delivery\nDelivery Address: "+order.address+"\nContact No: "+order.mobileno+"\n\n Login to see more details!"
            
            // NOTIFY ADMIN THAT ORDER IS PLACED
            mail.orderPlaced('gouravhammad477@gmail.com',adminMsg)

            var sql = "delete from cart where email='"+user.email+"' ;"
       
            connection.query(sql,function(err,result){
                
                if(err) throw err
            
                res.render('Alert',{
                    type:"success",
                    title:"Order Placed",
                    text:"Your order has been placed. Checkout your mail for more details.",
                    link:"orders"
                })
            })   
        }
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.post('/cancelOrderConfirmation',function(req,res){
    try
    {
        var orderId = req.body.orderId
        req.session.cancelOrder = orderId
       
        res.render('AlertConfirmation',{
            title: 'Cancel Order',
            text: 'Are you sure want to cancel this order?',
            yes: "cancelOrder",
            no: 'orders'
        })
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.get('/cancelOrder',function(req,res){
    try
    {
        var user = req.session.user
        var orderId = req.session.cancelOrder

        if(orderId === undefined || orderId === null)
        {
            return res.redirect('orders')
        }

        var sql1 = "select * from orders where orderId="+orderId+" ; "
        var sql2 = "update orders set orderStatus='Canceled' where orderId="+orderId+" ; "
        var sql = sql1 + sql2

        connection.query(sql,function(err,result){
            
            if(err) throw err

            var sample = result[0]
            var orderData = sample[0]
            var myMsg = ''
            var adminMsg = ''

            if(orderData.paymentMode == 'Cash On Delivery')
            {
                myMsg = "Your order has been canceled now which was placed on "+orderData.dateAndTime+"\n\nTotal Amount: Rs. "+orderData.total+"\nPayment Mode: Cash On Delivery\nDelivery Address: "+orderData.address+"\nContact No: "+orderData.mobileno+"\n\nShare your feedback with us, Stay happy :) and continue shopping!"
                adminMsg = "Order placed by "+user.username+" has been canceled now which was placed on "+orderData.dateAndTime+"\n\nTotal Amount: Rs. "+orderData.total+"\nPayment Mode: Cash On Delivery\nDelivery Address: "+orderData.address+"\nContact No: "+orderData.mobileno+"\n\nEnjoy your day :)"
            }
            else
            {
                myMsg = "Your order has been canceled now which was placed on "+orderData.dateAndTime+"\n\nTotal Amount: Rs. "+orderData.total+"\nPayment Mode: Card Payment\nDelivery Address: "+orderData.address+"\nContact No: "+orderData.mobileno+"\n\nYour amount will be refunded within 24 hours to your account. Share your feedback with us, Stay happy :) and continue shopping!"
                adminMsg = "Order placed by "+user.username+" has been canceled now which was placed on "+orderData.dateAndTime+"\n\nTotal Amount: Rs. "+orderData.total+"\nPayment Mode: Card Payment\nDelivery Address: "+orderData.address+"\nContact No: "+orderData.mobileno+"\n\nKindly refund the money within 24 hours from now."
            }
            
            // SENDING MAIL TO USER FOR NOTIFICATION OF 'ORDER CANCELED'
            mail.cancelOrder(user.email,myMsg)

            // NOTIFY ADMIN OF CANCLED ORDER
            mail.cancelOrder('gouravhammad477@gmail.com',adminMsg)

            req.session.cancelOrder = null
            
            res.render('Alert',{
                type:"success",
                title:"Order Canceled",
                text:"Your order has been canceled. Checkout your mail for more details.",
                link:"orders"
            }) 
        }) 
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.post('/savePayment',function(req,res){

    try
    {
        stripe.customers.create({
            email: req.body.stripeEmail,
            source: req.body.stripeToken,
            name: 'Gourav Hammad',
            address: {
                line1: 'Near MHOW Dear',
                postal_code: '452331',
                city: 'Indore',
                state: 'Madhya Pradesh',
                country: 'India',
            }
        })
        .then((customer) => {

            var amount = parseInt(req.body.total) * 100

            return stripe.charges.create({
                amount: amount, 
                description: 'Crafty Gourav Product',
                currency: 'INR',
                customer: customer.id
            });
        })
        .then((charge) => {

            var user = req.session.user

            var order = {
                mobileno: req.body.mobileno,
                address: req.body.address,
                paymentMode: 'Card Payment'
            }

            var qry = "select c.pId,c.quantity,(p.pPrice*c.quantity) as total from cart c,product p where c.pId = p.pId and c.email='"+user.email+"' ; "
            const data = syncConnection.query(qry);
        
            var date = new Date();
            date = date.toISOString().split('T')[0] + ' '+date.toTimeString().split(' ')[0]
        
            var tax = 0
            var totalAmount = parseInt(req.body.total)
            
            for(i = 0; i < data.length; i++)
            {
                tax = ((data[i].total*3.6)/100).toFixed(2)
                tax = parseFloat(tax)
    
                var sql = "insert into orders values ?"
                var x = [[
                    null,
                    user.email,
                    data[i].pId,
                    data[i].quantity,
                    data[i].total+tax,
                    date,
                    order.mobileno,
                    order.address,
                    order.paymentMode,
                    'Ordered'
                ]]
        
                connection.query(sql,[x],function(err,result){   
                    if(err) throw err
                }) 
            }

            var myMsg = "Your order has been successfully placed on "+date+"\n\nTotal Items: "+data.length+"\nTotal Amount: Rs. "+totalAmount+"\nPayment Mode: Card Payment \nDelivery Address: "+order.address+"\nContact No: "+order.mobileno+"\n\nThank you for placing your order. Our team will contact you within 24 hours for more details regarding product customisation. Stay happy :) and continue shopping!"
           
           // SENDING MAIL TO USER FOR NOTIFICATION OF 'ORDER PLACED'
            mail.orderPlaced(user.email,myMsg)

            var adminMsg = "Order placed by "+user.username+" on "+date+"\n\nTotal Items: "+data.length+"\nTotal Amount: Rs. "+totalAmount+"\nPayment Mode: Card Payment \nDelivery Address: "+order.address+"\nContact No: "+order.mobileno+"\n\n Checkout your account to see recieved money."
            
            // NOTIFY ADMIN THAT ORDER IS PLACED
            mail.orderPlaced('gouravhammad477@gmail.com',adminMsg)
        
            var sql = "delete from cart where email='"+user.email+"' ;"

            connection.query(sql,function(err,result){
                
                if(err) throw err
            
                res.render('Alert',{
                    type:"success",
                    title:"Order Placed",
                    text:"Your order has been placed. Checkout your mail for more details.",
                    link:"orders"
                })
            })   

        })
        .catch((err) => {
            res.send(err)
        });
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.get('/wishlist',function(req,res){
    try
    {
        var user = req.session.user

        var sql1 = "select count(pId) as count from cart where email='"+user.email+"' ; "
        var sql2 = "select p.pId, p.pPrice, p.pName, p.pPicture from wishlist w, product p where w.pId = p.pId and w.email='"+user.email+"' ; "
        var sql = sql1 + sql2

        connection.query(sql,function(err,result){
            
            if(err) throw err

            if(result[1].length >= 1)
            {
                res.render('Wishlist',{
                    cartTotal: result[0],
                    items: result[1]
                })   
            }
            else
            {
                res.render('Wishlist',{
                    cartTotal: result[0],
                    items: null
                })   
            }    
        }) 
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.post('/addToWishlist',function(req,res){  
    try
    {
        var pId = req.body.pId
        var user = req.session.user
    
        var sql = "insert into wishlist values ?"
                
        var x = [[pId,user.email]]
                
        connection.query(sql,[x],function(err,result){
            try
            {
                if(err) throw err

                res.render('Alert',{
                    type:"success",
                    title:"Added To Wishlist",
                    text:"Product has been added to wishlist",
                    link:"home"
                }) 
            }
            catch(e)
            {
                res.render('Alert',{
                    type:"info",
                    title:"Already added",
                    text:"Product is already there in wishlist",
                    link:"home"
                })
            }
        })
    } 
    catch(e)
    {
        res.redirect('/')
    }
})

router.post('/removeFromWishlist',function(req,res){ 
    try
    {
        var user = req.session.user
        var pId = req.body.pId

        var sql = "delete from wishlist where pId="+pId+" and email='"+user.email+"' ;"
       
        connection.query(sql,function(err,result){
            
            if(err) throw err
          
            res.redirect('wishlist') 
        })   
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.get('/feedback',function(req,res){
    try
    {
        var user = req.session.user

        var sql = "select count(pId) as count from cart where email='"+user.email+"' ; "
    
        connection.query(sql,function(err,result){
        
            if(err) throw err
            
            res.render('Feedback',{
                feedbackError: null,
                feedback: null,
                cartTotal: result
            })
        }) 
    }
    catch(e)
    {
        res.redirect('/')
    }
})

router.post('/saveFeedback', [
    check('feedback','Must be of Min 5 and Max 300 length').trim().isLength({ min: 5, max: 300}),
  ], (req, res) => {

    try
    {
        const errors = validationResult(req);

        var user = req.session.user
        
        var feedback = req.body.feedback
        var feedbackError = null

        if (!errors.isEmpty())
        {
            var user = req.session.user

            var sql = "select count(pId) as count from cart where email='"+user.email+"' ; "
        
            connection.query(sql,function(err,result){
            
                if(err) throw err
                
                res.render('Feedback',{
                    feedbackError: errors.errors[0].msg,
                    feedback,
                    cartTotal: result
                })
            }) 
        }
        else
        {
            var myMsg = feedback + "\n\nUsername: "+user.username+"\nEmail: "+user.email
    
            // SENDING FEEDBACK TO CRAFTY GOURAV'
            mail.sendFeedback(myMsg)

            res.render('Alert',{
                type:"success",
                title:"Feedback Shared",
                text:"Thank you for sharing your experience with us.",
                link:"home"
            }) 
        }
    }
    catch(e)
    {
        res.redirect('/')
    }
})

module.exports = router