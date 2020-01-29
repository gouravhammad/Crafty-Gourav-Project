const nodemailer = require('nodemailer')

transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, 
    auth: {
      user: process.env.NODEMAILER_ACCOUNT,
      pass: process.env.NODEMAILER_PASSWORD 
    }
});
  

sendMail = function(email,optNumber)
{
    const msg = {
        to: email,
        from: 'CRAFTYGOURAV<gouravhammad477@gmail.com>',
        subject: 'OTP Verification',
        text: "Your OTP code is "+optNumber+" , Don't share it with anyone."
    };

    transporter.sendMail(msg,function(error,info){  
        if(error) console.log("ERROR IN SENDING MAIL : ", error)
        console.log("SUCCESS IN SENDING MAIL : ", info)
    })
}

sendPassword = function(email,password)
{
    const msg = {
        to: email,
        from: 'CRAFTYGOURAV<gouravhammad477@gmail.com>',
        subject: 'Forgot Password',
        text: "Your Old Password is "+password+" , Don't share it with anyone. Thank you for joining us"
    };

    transporter.sendMail(msg,function(error,info){  
        if(error) console.log("ERROR IN SENDING MAIL : ", error)
        console.log("SUCCESS IN SENDING MAIL : ", info)
    })
}

orderPlaced = function(email,content)
{
    const msg = {
        to: email,
        from: 'CRAFTYGOURAV<gouravhammad477@gmail.com>',
        subject: 'Order Placed',
        text: content
    };

    transporter.sendMail(msg,function(error,info){  
        if(error) console.log("ERROR IN SENDING MAIL : ", error)
        console.log("SUCCESS IN SENDING MAIL : ", info)
    })
}

cancelOrder = function(email,content)
{
    const msg = {
        to: email,
        from: 'CRAFTYGOURAV<gouravhammad477@gmail.com>',
        subject: 'Order Canceled',
        text: content
    };

    transporter.sendMail(msg,function(error,info){  
        if(error) console.log("ERROR IN SENDING MAIL : ", error)
        console.log("SUCCESS IN SENDING MAIL : ", info)
    })
}

sendFeedback = function(content)
{
    const msg = {
        to: 'gourav.hammad.sdbc@gmail.com',
        from: 'CRAFTYGOURAV<gouravhammad477@gmail.com>',
        subject: 'Feedback for Crafty Gourav',
        text: content
    };

    transporter.sendMail(msg,function(error,info){  
        if(error) console.log("ERROR IN SENDING MAIL : ", error)
        console.log("SUCCESS IN SENDING MAIL : ", info)
    })
}

removeUser = function(email,content)
{
    const msg = {
        to: email,
        from: 'CRAFTYGOURAV<gouravhammad477@gmail.com>',
        subject: 'Account Deleted',
        text: content
    };

    transporter.sendMail(msg,function(error,info){  
        if(error) console.log("ERROR IN SENDING MAIL : ", error)
        console.log("SUCCESS IN SENDING MAIL : ", info)
    })
}

sendDelivered = function(email,content)
{
    const msg = {
        to: email,
        from: 'CRAFTYGOURAV<gouravhammad477@gmail.com>',
        subject: 'Order Delivered',
        text: content
    };

    transporter.sendMail(msg,function(error,info){  
        if(error) console.log("ERROR IN SENDING MAIL : ", error)
        console.log("SUCCESS IN SENDING MAIL : ", info)
    })
}

sendCanNotProcess = function(email,content)
{
    const msg = {
        to: email,
        from: 'CRAFTYGOURAV<gouravhammad477@gmail.com>',
        subject: 'Unable To Process Your Order',
        text: content
    };

    transporter.sendMail(msg,function(error,info){  
        if(error) console.log("ERROR IN SENDING MAIL : ", error)
        console.log("SUCCESS IN SENDING MAIL : ", info)
    })
}

module.exports = {sendMail,sendPassword,orderPlaced,cancelOrder,sendFeedback,removeUser,sendDelivered,sendCanNotProcess}




