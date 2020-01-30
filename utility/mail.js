const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SEND_GRID_KEY);

sendMail = function(email,optNumber)
{
    const msg = {
        to: email,
        from: 'CRAFTYGOURAV<gouravhammad477@gmail.com>',
        subject: 'OTP Verification',
        text: "Your OTP code is "+optNumber+" , Don't share it with anyone."
    };

    sgMail.send(msg);
}

sendPassword = function(email,password)
{
    const msg = {
        to: email,
        from: 'CRAFTYGOURAV<gouravhammad477@gmail.com>',
        subject: 'Forgot Password',
        text: "Your Old Password is "+password+" , Don't share it with anyone. Thank you for joining us"
    };

    sgMail.send(msg);
}

orderPlaced = function(email,content)
{
    const msg = {
        to: email,
        from: 'CRAFTYGOURAV<gouravhammad477@gmail.com>',
        subject: 'Order Placed',
        text: content
    };

    sgMail.send(msg);
}

cancelOrder = function(email,content)
{
    const msg = {
        to: email,
        from: 'CRAFTYGOURAV<gouravhammad477@gmail.com>',
        subject: 'Order Canceled',
        text: content
    };

    sgMail.send(msg);
}

sendFeedback = function(content)
{
    const msg = {
        to: 'gourav.hammad.sdbc@gmail.com',
        from: 'CRAFTYGOURAV<gouravhammad477@gmail.com>',
        subject: 'Feedback for Crafty Gourav',
        text: content
    };

    sgMail.send(msg);
}

removeUser = function(email,content)
{
    const msg = {
        to: email,
        from: 'CRAFTYGOURAV<gouravhammad477@gmail.com>',
        subject: 'Account Deleted',
        text: content
    };

    sgMail.send(msg);
}

sendDelivered = function(email,content)
{
    const msg = {
        to: email,
        from: 'CRAFTYGOURAV<gouravhammad477@gmail.com>',
        subject: 'Order Delivered',
        text: content
    };

    sgMail.send(msg);
}

sendCanNotProcess = function(email,content)
{
    const msg = {
        to: email,
        from: 'CRAFTYGOURAV<gouravhammad477@gmail.com>',
        subject: 'Unable To Process Your Order',
        text: content
    };

    sgMail.send(msg);
}

module.exports = {sendMail,sendPassword,orderPlaced,cancelOrder,sendFeedback,removeUser,sendDelivered,sendCanNotProcess}




